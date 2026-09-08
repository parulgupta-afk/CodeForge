import { ExecutionResult } from "../types/execution";
import { ClassifiedError, ErrorCategory } from "../types/error";

/**
 * Classifies a failed execution into a structured error category.
 * This is the Phase 6 differentiator — repair prompts become much more precise.
 */
export function classifyError(execution: ExecutionResult): ClassifiedError {
  // Timeout has highest priority
  if (execution.timedOut) {
    return {
      category: "Timeout",
      detail: `Execution exceeded the time limit (${execution.durationMs}ms)`,
      retryable: true,
      rawStderr: execution.stderr,
    };
  }

  const stderr = (execution.stderr || "").toLowerCase();
  const stdout = (execution.stdout || "").toLowerCase();
  const combined = `${stderr}\n${stdout}`;

  // Missing dependency / ModuleNotFoundError
  if (
    combined.includes("modulenotfounderror") ||
    combined.includes("no module named") ||
    combined.includes("importerror")
  ) {
    const match =
      execution.stderr.match(/No module named ['"]([^'"]+)['"]/i) ||
      execution.stderr.match(/ModuleNotFoundError: No module named ['"]([^'"]+)['"]/i);

    const packageName = match ? match[1] : "unknown package";

    return {
      category: "MissingDependency",
      detail: packageName,
      retryable: true,
      rawStderr: execution.stderr,
    };
  }

  // Syntax errors
  if (
    combined.includes("syntaxerror") ||
    combined.includes("indentationerror") ||
    combined.includes("taberror")
  ) {
    return {
      category: "SyntaxError",
      detail: extractFirstLine(execution.stderr) || "Invalid Python syntax",
      retryable: true,
      rawStderr: execution.stderr,
    };
  }

  // Permission / access errors
  if (
    combined.includes("permissionerror") ||
    combined.includes("permission denied") ||
    combined.includes("operation not permitted")
  ) {
    return {
      category: "PermissionDenied",
      detail: extractFirstLine(execution.stderr) || "Permission denied",
      retryable: false,
      rawStderr: execution.stderr,
    };
  }

  // Network related (even though we block network, the code might try)
  if (
    combined.includes("connection refused") ||
    combined.includes("network is unreachable") ||
    combined.includes("nameresolutionerror") ||
    combined.includes("urlopen error") ||
    combined.includes("failed to establish a new connection")
  ) {
    return {
      category: "NetworkBlocked",
      detail: "Network access is disabled in the sandbox",
      retryable: false,
      rawStderr: execution.stderr,
    };
  }

  // Generic runtime exceptions
  if (
    combined.includes("traceback") ||
    combined.includes("error:") ||
    combined.includes("exception")
  ) {
    return {
      category: "RuntimeException",
      detail: extractFirstLine(execution.stderr) || "Runtime error",
      retryable: true,
      rawStderr: execution.stderr,
    };
  }

  // Fallback
  return {
    category: "Unknown",
    detail: execution.error || extractFirstLine(execution.stderr) || "Unknown failure",
    retryable: true,
    rawStderr: execution.stderr,
  };
}

function extractFirstLine(text: string): string {
  if (!text) return "";
  const line = text.split("\n").find((l) => l.trim().length > 0);
  return line ? line.trim().slice(0, 200) : "";
}
