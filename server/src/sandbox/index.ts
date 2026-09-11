import { ExecutionInput, ExecutionResult } from "../types/execution";
import { executeLocally } from "./localExecutor";

/**
 * Execution entry point.
 *
 * USE_DOCKER=true  → try Docker sandbox; on failure, fall back to local
 * USE_DOCKER=false → local subprocess only (NOT a security boundary)
 */
let executeInDocker: ((input: ExecutionInput) => Promise<ExecutionResult>) | null = null;

try {
  // Optional: project still works if dockerode fails to load
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const dockerModule = require("./dockerExecutor");
  executeInDocker = dockerModule.executeInDocker;
} catch {
  executeInDocker = null;
}

export async function executeCode(input: ExecutionInput): Promise<ExecutionResult> {
  const useDocker = process.env.USE_DOCKER === "true" && executeInDocker !== null;

  if (useDocker && executeInDocker) {
    try {
      return await executeInDocker(input);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn("[CodeForge] Docker execution failed, falling back to local:", message);
      return executeLocally(input);
    }
  }

  return executeLocally(input);
}
