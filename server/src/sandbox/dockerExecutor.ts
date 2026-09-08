import Docker from "dockerode";
import { promises as fs } from "fs";
import * as os from "os";
import * as path from "path";
import { ExecutionInput, ExecutionResult } from "../types/execution";

const docker = new Docker(); // talks to the local Docker daemon
const DEFAULT_TIMEOUT_MS = 20_000;
const IMAGE = process.env.SANDBOX_IMAGE || "python:3.12-slim";

/**
 * Executes Python code inside a fresh, isolated Docker container.
 * - Network disabled
 * - CPU + memory limited
 * - Container is always removed afterwards
 */
export async function executeInDocker(input: ExecutionInput): Promise<ExecutionResult> {
  const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const filename = input.filename || "main.py";
  const start = Date.now();

  // Create a temporary directory that will be mounted into the container
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "codeforge-docker-"));
  const hostCodePath = path.join(tempDir, filename);

  let container: Docker.Container | null = null;

  try {
    // Write the generated code
    await fs.writeFile(hostCodePath, input.code, "utf8");

    // Create the container
    container = await docker.createContainer({
      Image: IMAGE,
      Cmd: ["python", `-u`, `/code/${filename}`],
      WorkingDir: "/code",
      HostConfig: {
        // Security & resource limits
        NetworkMode: "none",                    // no network
        Memory: 512 * 1024 * 1024,              // 512 MB
        NanoCpus: 1 * 1e9,                      // 1 CPU
        ReadonlyRootfs: false,                  // we need to write? keep false for simplicity
        AutoRemove: false,                      // we remove manually for better control
        Binds: [`${tempDir}:/code:ro`],         // mount code as read-only
      },
      // Drop capabilities for extra security (optional but good)
      // CapDrop: ["ALL"],
      Tty: false,
      AttachStdout: true,
      AttachStderr: true,
      OpenStdin: false,
    });

    // Start the container
    await container.start();

    // Wait with timeout
    const result = await waitWithTimeout(container, timeoutMs);

    return {
      ...result,
      durationMs: Date.now() - start,
    };
  } catch (err: any) {
    return {
      success: false,
      stdout: "",
      stderr: err.message || "Docker execution error",
      exitCode: null,
      durationMs: Date.now() - start,
      timedOut: false,
      error: err.message,
    };
  } finally {
    // Always try to clean up
    if (container) {
      try {
        await container.stop({ t: 1 }).catch(() => {});
        await container.remove({ force: true }).catch(() => {});
      } catch {
        // ignore cleanup errors
      }
    }

    // Remove temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}

function waitWithTimeout(
  container: Docker.Container,
  timeoutMs: number
): Promise<Omit<ExecutionResult, "durationMs">> {
  return new Promise(async (resolve) => {
    let settled = false;
    let timedOut = false;

    const timer = setTimeout(async () => {
      timedOut = true;
      try {
        await container.kill({ signal: "SIGKILL" });
      } catch {
        // ignore
      }
    }, timeoutMs);

    try {
      // Attach to get logs
      const stream = await container.logs({
        follow: true,
        stdout: true,
        stderr: true,
        timestamps: false,
      });

      let stdout = "";
      let stderr = "";

      // dockerode multiplexes stdout/stderr. For simplicity we collect everything.
      // A more precise version can demux the stream.
      stream.on("data", (chunk: Buffer) => {
        // Basic demux: first 8 bytes are header
        if (chunk.length > 8) {
          const payload = chunk.slice(8).toString("utf8");
          // Heuristic: most output goes to stdout for our use case
          stdout += payload;
        } else {
          stdout += chunk.toString("utf8");
        }
      });

      // Wait for the container to finish
      const waitResult = await container.wait();
      clearTimeout(timer);

      if (settled) return;
      settled = true;

      const exitCode = waitResult.StatusCode ?? (timedOut ? 124 : null);

      resolve({
        success: !timedOut && exitCode === 0,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode,
        timedOut,
        error: timedOut
          ? `Execution timed out after ${timeoutMs}ms`
          : exitCode !== 0
          ? `Container exited with code ${exitCode}`
          : undefined,
      });
    } catch (err: any) {
      clearTimeout(timer);
      if (settled) return;
      settled = true;

      resolve({
        success: false,
        stdout: "",
        stderr: err.message || "Error waiting for container",
        exitCode: null,
        timedOut,
        error: err.message,
      });
    }
  });
}
