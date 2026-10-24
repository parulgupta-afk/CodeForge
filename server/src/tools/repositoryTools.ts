/**
 * Repository tools – Phase 4.
 * Bound to a Workspace via ToolContext.workspaceRoot.
 */

import * as path from "path";
import {
  registerTool,
  reqString,
  optString,
  optNumber,
  ToolContext,
  ToolResult,
} from "./registry";
import {
  Workspace,
  listFiles,
  readFile,
  writeFile,
  searchCode,
  applyUnifiedDiff,
  readGitDiff,
  resolveSafe,
  PathEscapeError,
} from "../workspace/manager";
import { executeCode } from "../sandbox";

function wsFromCtx(ctx: ToolContext): Workspace {
  return {
    id: ctx.runId,
    root: ctx.workspaceRoot,
    createdAt: "",
  };
}

function isWriteAllowed(ctx: ToolContext, relPath: string): boolean {
  if (!ctx.requireApproval) return true;
  if (!ctx.allowedWritePaths || ctx.allowedWritePaths.length === 0) return false;
  const norm = relPath.replace(/\\/g, "/");
  return ctx.allowedWritePaths.some(
    (p) => norm === p || norm.startsWith(p.replace(/\/$/, "") + "/")
  );
}

export function registerRepositoryTools(): void {
  registerTool({
    name: "list_files",
    description: "List files under a directory in the workspace (relative paths).",
    permission: "read",
    timeoutMs: 5_000,
    validate: (args) => ({
      dir: optString(args, "dir") || ".",
      max: optNumber(args, "max", 200) ?? 200,
    }),
    async run(args, ctx): Promise<ToolResult> {
      try {
        const files = listFiles(wsFromCtx(ctx), args.dir as string, args.max as number);
        return { ok: true, data: { files } };
      } catch (err: any) {
        return { ok: false, error: err.message };
      }
    },
  });

  registerTool({
    name: "read_file",
    description: "Read a text file from the workspace.",
    permission: "read",
    timeoutMs: 5_000,
    validate: (args) => ({
      path: reqString(args, "path"),
    }),
    async run(args, ctx): Promise<ToolResult> {
      try {
        const content = readFile(wsFromCtx(ctx), args.path as string);
        return { ok: true, data: { path: args.path, content } };
      } catch (err: any) {
        return { ok: false, error: err.message };
      }
    },
  });

  registerTool({
    name: "search_code",
    description: "Search for a string across workspace source files.",
    permission: "read",
    timeoutMs: 10_000,
    validate: (args) => ({
      query: reqString(args, "query"),
      max: optNumber(args, "max", 30) ?? 30,
    }),
    async run(args, ctx): Promise<ToolResult> {
      try {
        const hits = searchCode(
          wsFromCtx(ctx),
          args.query as string,
          args.max as number
        );
        return { ok: true, data: { hits } };
      } catch (err: any) {
        return { ok: false, error: err.message };
      }
    },
  });

  registerTool({
    name: "apply_patch",
    description:
      "Apply a unified diff to the workspace. May require approval for sensitive paths.",
    permission: "write",
    timeoutMs: 10_000,
    validate: (args) => ({
      diff: reqString(args, "diff"),
    }),
    async run(args, ctx): Promise<ToolResult> {
      const diff = args.diff as string;
      // Extract target paths from diff headers for approval check
      const pathMatches = [...diff.matchAll(/^\+\+\+\s+(?:b\/)?(.+)$/gm)].map(
        (m) => m[1].trim()
      );
      for (const p of pathMatches) {
        if (p === "/dev/null") continue;
        try {
          resolveSafe(ctx.workspaceRoot, p);
        } catch (err: any) {
          return { ok: false, error: err.message };
        }
        if (!isWriteAllowed(ctx, p)) {
          return {
            ok: false,
            needsApproval: true,
            error: `approval_required: write to ${p} is outside allowed paths`,
          };
        }
      }
      try {
        const result = applyUnifiedDiff(wsFromCtx(ctx), diff);
        if (result.errors.length && result.applied.length === 0) {
          return { ok: false, error: result.errors.join("; ") };
        }
        return {
          ok: true,
          data: { applied: result.applied, errors: result.errors },
        };
      } catch (err: any) {
        return { ok: false, error: err.message };
      }
    },
  });

  registerTool({
    name: "write_file",
    description: "Write full file contents (prefer apply_patch for minimal diffs).",
    permission: "write",
    timeoutMs: 5_000,
    validate: (args) => ({
      path: reqString(args, "path"),
      content: reqString(args, "content"),
    }),
    async run(args, ctx): Promise<ToolResult> {
      const rel = args.path as string;
      try {
        resolveSafe(ctx.workspaceRoot, rel);
      } catch (err: any) {
        return { ok: false, error: err.message };
      }
      if (!isWriteAllowed(ctx, rel)) {
        return {
          ok: false,
          needsApproval: true,
          error: `approval_required: write to ${rel}`,
        };
      }
      try {
        writeFile(wsFromCtx(ctx), rel, args.content as string);
        return { ok: true, data: { path: rel } };
      } catch (err: any) {
        return { ok: false, error: err.message };
      }
    },
  });

  registerTool({
    name: "read_git_diff",
    description: "Show the current git diff against the workspace snapshot.",
    permission: "read",
    timeoutMs: 5_000,
    validate: () => ({}),
    async run(_args, ctx): Promise<ToolResult> {
      try {
        const diff = readGitDiff(wsFromCtx(ctx));
        return { ok: true, data: { diff } };
      } catch (err: any) {
        return { ok: false, error: err.message };
      }
    },
  });

  registerTool({
    name: "run_tests",
    description:
      "Run a Python test file or module inside the sandbox (workspace files must already contain the tests).",
    permission: "execute",
    timeoutMs: 30_000,
    validate: (args) => ({
      target: optString(args, "target") || "tests",
      code: optString(args, "code"),
    }),
    async run(args, ctx): Promise<ToolResult> {
      try {
        let code = args.code as string | undefined;
        if (!code) {
          const target = args.target as string;
          // If target is a file, read it; else try pytest-style discovery via a runner script
          try {
            code = readFile(wsFromCtx(ctx), target);
          } catch {
            code = `
import os, sys, traceback
sys.path.insert(0, ".")
failed = 0
for root, dirs, files in os.walk("."):
    dirs[:] = [d for d in dirs if d not in (".git", "__pycache__")]
    for f in files:
        if f.startswith("test_") and f.endswith(".py"):
            path = os.path.join(root, f)
            print("RUN", path)
            ns = {}
            try:
                exec(open(path).read(), ns)
                print("PASS", path)
            except Exception as e:
                failed += 1
                traceback.print_exc()
                print("FAIL", path, e)
sys.exit(1 if failed else 0)
`;
          }
        }
        const execution = await executeCode({
          code: code!,
          filename: "run_tests.py",
          timeoutMs: 20_000,
        });
        return {
          ok: execution.success,
          data: {
            success: execution.success,
            stdout: execution.stdout,
            stderr: execution.stderr,
            exitCode: execution.exitCode,
            timedOut: execution.timedOut,
          },
          error: execution.success
            ? undefined
            : execution.error || execution.stderr || "tests failed",
        };
      } catch (err: any) {
        return { ok: false, error: err.message };
      }
    },
  });
}

/** Call once at boot or before first repo agent run */
let registered = false;
export function ensureRepoToolsRegistered(): void {
  if (registered) return;
  registerRepositoryTools();
  registered = true;
}
