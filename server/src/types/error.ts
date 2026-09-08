export type ErrorCategory =
  | "SyntaxError"
  | "MissingDependency"
  | "RuntimeException"
  | "Timeout"
  | "PermissionDenied"
  | "NetworkBlocked"
  | "Unknown";

export interface ClassifiedError {
  category: ErrorCategory;
  detail: string;
  retryable: boolean;
  rawStderr?: string;
}
