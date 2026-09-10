import { spawn } from "child_process";
import { promises as fs } from "fs";
import * as os from "os";
import * as path from "path";
import { ExecutionInput, ExecutionResult } from "../types/execution";

const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_OUTPUT_BYTES = 256 * 1024;

/**
 * Local subprocess executor (fallback when Docker is unavailable).
 * NOT a security boundary — use Docker in production.
 * Still applies timeout, temp-dir isolation, and output size limits.
 */
export async function executeLocally(input: ExecutionInput): Promise<ExecutionResult> {
  const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const filename = input.filename || "main.py";
  const start = Date.now();

  if (Buffer.byteLength(input.code, "utf8") > 200_000) {
    return {
      success: false,
      stdout: "",
      stderr: "Generated code exceeds size limit (200KB)",
      exitCode: null,
      durationMs: Date.now() - start,
      timedOut: false,
      error: "Code too large",
    };
  }

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "codeforge-"));
  const filePath = path.join(tempDir, filename);

  try {
    await fs.writeFile(filePath, input.code, "utf8");
    const result = await runPython(filePath, tempDir, timeoutMs);
    return { ...result, durationMs: Date.now() - start };
  } catch (err: any) {
    return {
      success: false,
      stdout: "",
      stderr: err.message || "Unknown execution error",
      exitCode: null,
      durationMs: Date.now() - start,
      timedOut: false,
      error: err.message,
    };
  } finally {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}

function truncate(s: string): string {
  if (Buffer.byteLength(s, "utf8") <= MAX_OUTPUT_BYTES) return s;
  return s.slice(0, MAX_OUTPUT_BYTES) + "\n…[output truncated]";
}

function runPython(
  filePath: string,
  cwd: string,
  timeoutMs: number
): Promise<Omit<ExecutionResult, "durationMs">> {
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let settled = false;

    const pythonCmd = process.platform === "win32" ? "python" : "python3";

    // Do NOT pass full process.env (avoids leaking API keys into the child)
    const child = spawn(pythonCmd, [filePath], {
      cwd,
      env: {
        PATH: process.env.PATH,
        SYSTEMROOT: process.env.SYSTEMROOT, // Windows
        PYTHONUNBUFFERED: "1",
        PYTHONDONTWRITEBYTECODE: "1",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      setTimeout(() => {
        if (!child.killed) child.kill("SIGKILL");
      }, 1000);
    }, timeoutMs);

    child.stdout.on("data", (data: Buffer) => {
      if (stdout.length < MAX_OUTPUT_BYTES) stdout += data.toString();
    });
    child.stderr.on("data", (data: Buffer) => {
      if (stderr.length < MAX_OUTPUT_BYTES) stderr += data.toString();
    });

    child.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({
        success: false,
        stdout: truncate(stdout),
        stderr: err.message,
        exitCode: null,
        timedOut: false,
        error: `Failed to start Python process: ${err.message}`,
      });
    });

    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const exitCode = code ?? (timedOut ? 124 : null);
      resolve({
        success: !timedOut && exitCode === 0,
        stdout: truncate(stdout.trim()),
        stderr: truncate(stderr.trim()),
        exitCode,
        timedOut,
        error: timedOut
          ? `Execution timed out after ${timeoutMs}ms`
          : exitCode !== 0
          ? `Process exited with code ${exitCode}`
          : undefined,
      });
    });
  });
}
