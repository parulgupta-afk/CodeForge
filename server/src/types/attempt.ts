import { ExecutionResult } from "./execution";
import { GeneratedCode } from "./generation";

export interface Attempt {
  attemptNumber: number;
  generatedCode: GeneratedCode;
  execution: ExecutionResult;
  errorSummary?: string;
  timestamp: string;
}

export interface OrchestratorResult {
  success: boolean;
  runId: string;
  task: string;
  attempts: Attempt[];
  finalOutput?: string;
  finalError?: string;
  totalAttempts: number;
  provider?: string;
  model?: string;
}
