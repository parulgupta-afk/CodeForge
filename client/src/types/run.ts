export interface AttemptView {
  attemptNumber: number;
  code: string;
  explanation: string;
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  durationMs: number;
  timedOut: boolean;
  errorSummary?: string;
}

export interface RunResponse {
  runId: string;
  status: "success" | "failed";
  task: string;
  totalAttempts: number;
  provider?: string;
  model?: string;
  finalOutput?: string;
  finalError?: string;
  attempts: AttemptView[];
}

export interface JournalLog {
  id: string;
  time: string;
  type: "neutral" | "primary" | "secondary" | "warning";
  content: string;
  highlight?: string;
}

export interface StepperStage {
  step: number;
  title: string;
  subtitle: string;
  status: "completed" | "active" | "upcoming";
}
