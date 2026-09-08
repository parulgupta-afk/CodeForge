export type RunStatus = "queued" | "running" | "success" | "failed";

export interface Run {
  id: string;
  task: string;
  status: RunStatus;
  createdAt: string;
  updatedAt: string;
  finalOutput?: string;
  attempts: number;
  error?: string;
  // Phase 3 additions
  generatedCode?: string;
  execution?: {
    success: boolean;
    stdout: string;
    stderr: string;
    exitCode: number | null;
    durationMs: number;
    timedOut: boolean;
  };
}

export interface CreateRunRequest {
  task: string;
}
