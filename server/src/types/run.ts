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
}

export interface CreateRunRequest {
  task: string;
}
