/**
 * Disposable workspace manager – Phase 4.
 * Every tool operates only inside the workspace root.
 * Path escape, symlink refusal, size limits enforced.
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { execSync } from "child_process";
import { randomUUID } from "crypto";

const MAX_FILE_BYTES = Number(process.env.WORKSPACE_MAX_FILE_BYTES) || 512_000;
const MAX_TREE_FILES = Number(process.env.WORKSPACE_MAX_TREE_FILES) || 500;

export interface Workspace {
  id: string;
  root: string;
  createdAt: string;
}

export class PathEscapeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PathEscapeError";
  }
}

/**
 * Resolve a user-supplied relative path and ensure it stays under root.
 * Rejects absolute paths, `..` escape, and symlinks that leave the tree.
 */
export function resolveSafe(root: string, relativePath: string): string {
  if (!relativePath || relativePath.trim() === "") {
    throw new PathEscapeError("empty path");
  }
  if (path.isAbsolute(relativePath)) {
    throw new PathEscapeError(`absolute paths not allowed: ${relativePath}`);
  }
  const normalized = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, "");
  const full = path.resolve(root, normalized);
  const rootResolved = path.resolve(root);
  if (full !== rootResolved && !full.startsWith(rootResolved + path.sep)) {
    throw new PathEscapeError(`path escapes workspace: ${relativePath}`);
  }
  // Symlink check: if the path exists, realpath must stay under root
  if (fs.existsSync(full)) {
    let real: string;
    try {
      real = fs.realpathSync(full);
    } catch {
      throw new PathEscapeError(`cannot resolve real path: ${relativePath}`);
    }
    if (real !== rootResolved && !real.startsWith(rootResolved + path.sep)) {
      throw new PathEscapeError(`symlink escapes workspace: ${relativePath}`);
    }
  }
  return full;
}

export function createWorkspace(opts?: {
  seedDir?: string;
  prefix?: string;
}): Workspace {
  const id = randomUUID();
  const root = fs.mkdtempSync(
    path.join(os.tmpdir(), opts?.prefix || "codeforge-ws-")
  );

  if (opts?.seedDir && fs.existsSync(opts.seedDir)) {
    copyTree(opts.seedDir, root);
  }

  // Initialise git so apply_patch / read_git_diff work
  try {
    execSync("git init", { cwd: root, stdio: "ignore" });
    execSync('git config user.email "agent@codeforge.local"', {
      cwd: root,
      stdio: "ignore",
    });
    execSync('git config user.name "CodeForge Agent"', {
      cwd: root,
      stdio: "ignore",
    });
    execSync("git add -A", { cwd: root, stdio: "ignore" });
    execSync('git commit -m "workspace snapshot" --allow-empty', {
      cwd: root,
      stdio: "ignore",
    });
  } catch (err: any) {
    console.warn("[workspace] git init skipped:", err?.message);
  }

  return { id, root, createdAt: new Date().toISOString() };
}

export function destroyWorkspace(ws: Workspace): void {
  try {
    fs.rmSync(ws.root, { recursive: true, force: true });
  } catch (err: any) {
    console.warn("[workspace] destroy failed:", err?.message);
  }
}

function copyTree(src: string, dest: string, depth = 0): void {
  if (depth > 20) return;
  const entries = fs.readdirSync(src, { withFileTypes: true });
  let count = 0;
  for (const e of entries) {
    if (e.name === ".git" || e.name === "node_modules" || e.name === "__pycache__") {
      continue;
    }
    count++;
    if (count > MAX_TREE_FILES) break;
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) {
      fs.mkdirSync(d, { recursive: true });
      copyTree(s, d, depth + 1);
    } else if (e.isFile()) {
      const st = fs.statSync(s);
      if (st.size > MAX_FILE_BYTES) continue;
      fs.copyFileSync(s, d);
    }
  }
}

export function listFiles(
  ws: Workspace,
  relativeDir = ".",
  max = 200
): string[] {
  const dir = resolveSafe(ws.root, relativeDir);
  const out: string[] = [];
  function walk(current: string, rel: string) {
    if (out.length >= max) return;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (out.length >= max) return;
      if (e.name === ".git" || e.name === "node_modules" || e.name === "__pycache__") {
        continue;
      }
      const childRel = rel === "." ? e.name : `${rel}/${e.name}`;
      if (e.isDirectory()) {
        walk(path.join(current, e.name), childRel);
      } else {
        out.push(childRel);
      }
    }
  }
  walk(dir, relativeDir === "." ? "." : relativeDir);
  return out.filter((p) => p !== ".");
}

export function readFile(
  ws: Workspace,
  relativePath: string,
  maxBytes = MAX_FILE_BYTES
): string {
  const full = resolveSafe(ws.root, relativePath);
  if (!fs.existsSync(full) || !fs.statSync(full).isFile()) {
    throw new Error(`file not found: ${relativePath}`);
  }
  const st = fs.statSync(full);
  if (st.size > maxBytes) {
    throw new Error(`file too large (${st.size} > ${maxBytes}): ${relativePath}`);
  }
  return fs.readFileSync(full, "utf8");
}

export function writeFile(
  ws: Workspace,
  relativePath: string,
  content: string
): void {
  const full = resolveSafe(ws.root, relativePath);
  const dir = path.dirname(full);
  fs.mkdirSync(dir, { recursive: true });
  if (Buffer.byteLength(content, "utf8") > MAX_FILE_BYTES) {
    throw new Error(`content exceeds max file size`);
  }
  fs.writeFileSync(full, content, "utf8");
}

/**
 * Apply a unified diff. Returns { applied, rejected }.
 * Paths in the diff are resolved safely; escape attempts throw.
 */
export function applyUnifiedDiff(
  ws: Workspace,
  diff: string
): { applied: string[]; errors: string[] } {
  const applied: string[] = [];
  const errors: string[] = [];
  // Minimal unified-diff applier for single-file hunks (sufficient for agent patches)
  const lines = diff.split(/\r?\n/);
  let currentFile: string | null = null;
  let oldLines: string[] = [];
  let newLines: string[] = [];
  let inHunk = false;

  const flush = () => {
    if (!currentFile) return;
    try {
      const full = resolveSafe(ws.root, currentFile);
      if (newLines.length === 0 && oldLines.length > 0) {
        // deletion
        if (fs.existsSync(full)) fs.unlinkSync(full);
      } else {
        const dir = path.dirname(full);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(full, newLines.join("\n") + (newLines.length ? "\n" : ""), "utf8");
      }
      applied.push(currentFile);
    } catch (err: any) {
      errors.push(`${currentFile}: ${err.message}`);
    }
    currentFile = null;
    oldLines = [];
    newLines = [];
    inHunk = false;
  };

  for (const line of lines) {
    if (line.startsWith("+++ ")) {
      // finish previous
      if (currentFile && inHunk) flush();
      const raw = line.slice(4).trim().replace(/^b\//, "");
      currentFile = raw === "/dev/null" ? null : raw;
      oldLines = [];
      newLines = [];
      inHunk = false;
      continue;
    }
    if (line.startsWith("--- ")) continue;
    if (line.startsWith("@@")) {
      inHunk = true;
      continue;
    }
    if (!inHunk || !currentFile) continue;
    if (line.startsWith("+")) {
      newLines.push(line.slice(1));
    } else if (line.startsWith("-")) {
      oldLines.push(line.slice(1));
    } else if (line.startsWith(" ") || line === "") {
      const content = line.startsWith(" ") ? line.slice(1) : line;
      oldLines.push(content);
      newLines.push(content);
    }
  }
  if (currentFile) flush();

  // Prefer git apply when available for correctness
  if (applied.length === 0 && diff.trim()) {
    try {
      const tmp = path.join(ws.root, `.patch-${randomUUID()}.diff`);
      fs.writeFileSync(tmp, diff);
      execSync(`git apply --whitespace=nowarn ${JSON.stringify(tmp)}`, {
        cwd: ws.root,
        stdio: "pipe",
      });
      fs.unlinkSync(tmp);
      applied.push("(git-apply)");
    } catch (err: any) {
      errors.push(`git apply failed: ${err?.message || String(err)}`);
    }
  }

  return { applied, errors };
}

export function readGitDiff(ws: Workspace): string {
  try {
    return execSync("git diff HEAD", {
      cwd: ws.root,
      encoding: "utf8",
      maxBuffer: 2_000_000,
    });
  } catch {
    return "";
  }
}

export function searchCode(
  ws: Workspace,
  query: string,
  maxHits = 30
): Array<{ path: string; line: number; text: string }> {
  const hits: Array<{ path: string; line: number; text: string }> = [];
  const files = listFiles(ws, ".", 300);
  const q = query.toLowerCase();
  for (const f of files) {
    if (hits.length >= maxHits) break;
    let content: string;
    try {
      content = readFile(ws, f);
    } catch {
      continue;
    }
    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      if (hits.length >= maxHits) break;
      if (lines[i].toLowerCase().includes(q)) {
        hits.push({ path: f, line: i + 1, text: lines[i].slice(0, 200) });
      }
    }
  }
  return hits;
}
