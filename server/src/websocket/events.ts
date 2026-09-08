export type AgentEventType =
  | "run:started"
  | "attempt:started"
  | "code:generated"
  | "execution:started"
  | "execution:output"
  | "execution:error"
  | "error:classified"
  | "repair:started"
  | "attempt:completed"
  | "run:completed"
  | "run:failed";

export interface AgentEvent {
  type: AgentEventType;
  runId: string;
  attemptNumber?: number;
  message?: string;
  data?: any;
  timestamp: string;
}
