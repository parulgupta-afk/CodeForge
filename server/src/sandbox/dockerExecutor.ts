import Docker from "dockerode";
import { promises as fs } from "fs";
import * as os from "os";
import * as path from "path";
import { ExecutionInput, ExecutionResult } from "../types/execution";

const docker = new Docker();
const DEFAULT_TIMEOUT_MS = 20_000;
const IMAGE = process.env.SANDBOX_IMAGE || "python:3.12-slim";
const MAX_OUTPUT_BYTES = 256 * 1024; // 256 KB cap on captured output

/**
 * Executes Python code inside a fresh, isolated Docker container.
 *
 * Security controls applied:
 * - NetworkMode: none
 * - Memory: 512 MB
 * - NanoCpus: 1 CPU
 * - PidsLimit: 64 (limits fork bombs)
 * - CapDrop: ALL
 * - SecurityOpt: no-new-privileges
 * - User: 65534:65534 (nobody)
 * - Code mount: read-only
 * - Tmpfs for /tmp only
 * - Always force-remove container + temp dir
 *
 * Limitations (honest):
 * - Not a full gVisor/Firecracker isolation model
 * - Relies on Docker daemon availability and host kernel namespaces
 * - ReadonlyRootfs is false because Python may need /tmp; /tmp is tmpfs-capped
 * - stdout/stderr demux is best-effort for dockerode multiplexed streams
 */
export async function executeInDocker(input: ExecutionInput): Promise<ExecutionResult> {
  const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const filename = input.filename || "main.py";
  const start = Date.now();

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "codeforge-docker-"));
  const hostCodePath = path.join(tempDir, filename);

  let container: Docker.Container | null = null;

  try {
    // Reject oversized payloads early
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

    await fs.writeFile(hostCodePath, input.code, "utf8");

    container = await docker.createContainer({
      Image: IMAGE,
      Cmd: ["python", "-u", `/code/${filename}`],
      WorkingDir: "/code",
      User: "65534:65534", // nobody
      HostConfig: {
        NetworkMode: "none",
        Memory: 512 * 1024 * 1024,
        NanoCpus: 1e9,
        PidsLimit: 64,
        ReadonlyRootfs: false,
        AutoRemove: false,
        Binds: [`${tempDir}:/code:ro`],
        CapDrop: ["ALL"],
        SecurityOpt: ["no-new-privileges:true"],
        Tmpfs: {
          "/tmp": "rw,noexec,nosuid,size=16m",
        },
      },
      Env: ["PYTHONUNBUFFERED=1", "PYTHONDONTWRITEBYTECODE=1"],
      Tty: false,
      AttachStdout: true,
      AttachStderr: true,
      OpenStdin: false,
    });

    await container.start();
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
    if (container) {
      try {
        await container.stop({ t: 1 }).catch(() => {});
        await container.remove({ force: true }).catch(() => {});
      } catch {
        // ignore
      }
    }
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
      const stream = await container.logs({
        follow: true,
        stdout: true,
        stderr: true,
        timestamps: false,
      });

      let stdout = "";
      let stderr = "";

      stream.on("data", (chunk: Buffer) => {
        // dockerode multiplex header: 8 bytes; stream type at byte 0 (1=stdout, 2=stderr)
        if (chunk.length >= 8) {
          const streamType = chunk[0];
          const payload = chunk.slice(8).toString("utf8");
          if (streamType === 2) stderr += payload;
          else stdout += payload;
        } else {
          stdout += chunk.toString("utf8");
        }
        // soft cap while streaming
        if (stdout.length > MAX_OUTPUT_BYTES) stdout = stdout.slice(0, MAX_OUTPUT_BYTES);
        if (stderr.length > MAX_OUTPUT_BYTES) stderr = stderr.slice(0, MAX_OUTPUT_BYTES);
      });

      const waitResult = await container.wait();
      clearTimeout(timer);
      if (settled) return;
      settled = true;

      const exitCode = waitResult.StatusCode ?? (timedOut ? 124 : null);

      resolve({
        success: !timedOut && exitCode === 0,
        stdout: truncate(stdout.trim()),
        stderr: truncate(stderr.trim()),
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
