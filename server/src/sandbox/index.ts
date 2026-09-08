import { ExecutionInput, ExecutionResult } from "../types/execution";
import { executeLocally } from "./localExecutor";
import { executeInDocker } from "./dockerExecutor";

/**
 * Main execution entry point.
 * Set USE_DOCKER=true in .env to use the Docker sandbox.
 * Otherwise falls back to the local executor (Phase 3).
 */
export async function executeCode(input: ExecutionInput): Promise<ExecutionResult> {
  const useDocker = process.env.USE_DOCKER === "true";

  if (useDocker) {
    try {
      return await executeInDocker(input);
    } catch (err: any) {
      console.warn("Docker execution failed, falling back to local:", err.message);
      return executeLocally(input);
    }
  }

  return executeLocally(input);
}
