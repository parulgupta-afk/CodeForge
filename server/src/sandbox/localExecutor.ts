import { spawn } from "child_process";
import { promises as fs } from "fs";
import * as os from "os";
import * as path from "path";
import { ExecutionInput, ExecutionResult } from "../types/execution";

const DEFAULT_TIMEOUT_MS = 15_000; // 15 seconds

/**
 * Executes Python code in a temporary directory with timeout protection.
 * This is the Phase 3 local executor. It will be replaced by Docker in Phase 5.
 */
export async function executeLocally(input: ExecutionInput): Promise<ExecutionResult> {
  const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const filename = input.filename || "main.py";
  const start = Date.now();

  // Create a unique temporary directory
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "codeforge-"));
  const filePath = path.join(tempDir, filename);

  try {
    // Write the generated code to disk
    await fs.writeFile(filePath, input.code, "utf8");

    // Run python with timeout
    const result = await runPython(filePath, tempDir, timeoutMs);

    return {
      ...result,
      durationMs: Date.now() - start,
    };
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
    // Always clean up the temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
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

    // Use "python" on Windows, "python3" is also fine on most systems
    const pythonCmd = process.platform === "win32" ? "python" : "python3";

    const child = spawn(pythonCmd, [filePath], {
      cwd,
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    });

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");

      // Force kill after a short grace period
      setTimeout(() => {
        if (!child.killed) {
          child.kill("SIGKILL");
        }
      }, 1000);
    }, timeoutMs);

    child.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    child.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({
        success: false,
        stdout,
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
        stdout: stdout.trim(),
        stderr: stderr.trim(),
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
