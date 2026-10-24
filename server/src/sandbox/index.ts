import { ExecutionInput, ExecutionResult } from "../types/execution";
import { executeLocally } from "./localExecutor";

/**
 * Execution entry point – fail-closed when SANDBOX_MODE=strict.
 *
 * SANDBOX_MODE=strict  → Docker only; never touch host
 * SANDBOX_MODE=dev     → Docker preferred, local fallback (legacy behaviour)
 * USE_DOCKER=true      → try Docker (legacy flag, still respected)
 */

let executeInDocker: ((input: ExecutionInput) => Promise<ExecutionResult>) | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const dockerModule = require("./dockerExecutor");
  executeInDocker = dockerModule.executeInDocker;
} catch {
  executeInDocker = null;
}

function sandboxMode(): "strict" | "dev" {
  const m = (process.env.SANDBOX_MODE || "dev").toLowerCase();
  return m === "strict" ? "strict" : "dev";
}

export async function executeCode(input: ExecutionInput): Promise<ExecutionResult> {
  const mode = sandboxMode();
  const wantDocker =
    process.env.USE_DOCKER === "true" || mode === "strict";

  if (wantDocker && executeInDocker) {
    try {
      return await executeInDocker(input);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (mode === "strict") {
        console.error("[CodeForge] Docker failed in strict mode – refusing host fallback");
        return {
          success: false,
          stdout: "",
          stderr: `sandbox_unavailable: ${message}`,
          exitCode: null,
          durationMs: 0,
          timedOut: false,
          error: `sandbox_unavailable: ${message}`,
        };
      }
      console.warn("[CodeForge] Docker execution failed, falling back to local:", message);
      return executeLocally(input);
    }
  }

  if (mode === "strict") {
    return {
      success: false,
      stdout: "",
      stderr: "sandbox_unavailable: SANDBOX_MODE=strict requires Docker",
      exitCode: null,
      durationMs: 0,
      timedOut: false,
      error: "sandbox_unavailable: SANDBOX_MODE=strict requires Docker",
    };
  }

  return executeLocally(input);
}
