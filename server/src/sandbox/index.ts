import { ExecutionInput, ExecutionResult } from "../types/execution";
import { executeLocally } from "./localExecutor";

// Docker executor will be used when USE_DOCKER=true (Phase 5)
let executeInDocker: ((input: ExecutionInput) => Promise<ExecutionResult>) | null = null;

try {
  // Dynamic import so the project still works if dockerode is not installed yet
  const dockerModule = require("./dockerExecutor");
  executeInDocker = dockerModule.executeInDocker;
} catch {
  // dockerode not available – stay on local executor
}

export async function executeCode(input: ExecutionInput): Promise<ExecutionResult> {
  const useDocker = process.env.USE_DOCKER === "true" && executeInDocker !== null;

  if (useDocker && executeInDocker) {
    try {
      return await executeInDocker(input);
    } catch (err: any) {
      console.warn("Docker execution failed, falling back to local:", err.message);
      return executeLocally(input);
    }
  }

  return executeLocally(input);
}
