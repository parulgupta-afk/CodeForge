export interface ExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  durationMs: number;
  timedOut: boolean;
  error?: string;
}

export interface ExecutionInput {
  code: string;
  filename?: string;
  timeoutMs?: number;
  cwd?: string;
}
