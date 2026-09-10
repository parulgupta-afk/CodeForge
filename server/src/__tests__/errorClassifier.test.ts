/**
 * Unit tests for error classification.
 * Run: npx ts-node --transpile-only src/__tests__/errorClassifier.test.ts
 * (or add jest/vitest later — this is a zero-dep runner for now)
 */
import { classifyError } from "../classifier/errorClassifier";
import { ExecutionResult } from "../types/execution";

function base(partial: Partial<ExecutionResult>): ExecutionResult {
  return {
    success: false,
    stdout: "",
    stderr: "",
    exitCode: 1,
    durationMs: 100,
    timedOut: false,
    ...partial,
  };
}

let passed = 0;
let failed = 0;

function assert(name: string, cond: boolean, detail?: string) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}${detail ? " — " + detail : ""}`);
  }
}

console.log("errorClassifier tests\n");

// Timeout
{
  const c = classifyError(base({ timedOut: true, durationMs: 15000 }));
  assert("Timeout category", c.category === "Timeout");
  assert("Timeout retryable", c.retryable === true);
}

// Missing dependency
{
  const c = classifyError(
    base({ stderr: "ModuleNotFoundError: No module named 'pandas'" })
  );
  assert("MissingDependency category", c.category === "MissingDependency");
  assert("MissingDependency detail=pandas", c.detail === "pandas");
  assert("MissingDependency retryable", c.retryable === true);
}

// Syntax
{
  const c = classifyError(base({ stderr: "SyntaxError: invalid syntax" }));
  assert("SyntaxError category", c.category === "SyntaxError");
  assert("SyntaxError retryable", c.retryable === true);
}

// Permission — not retryable
{
  const c = classifyError(base({ stderr: "PermissionError: [Errno 13] Permission denied" }));
  assert("PermissionDenied category", c.category === "PermissionDenied");
  assert("PermissionDenied not retryable", c.retryable === false);
}

// Network — not retryable
{
  const c = classifyError(base({ stderr: "URLError: <urlopen error [Errno 111] Connection refused>" }));
  assert("NetworkBlocked category", c.category === "NetworkBlocked");
  assert("NetworkBlocked not retryable", c.retryable === false);
}

// Runtime
{
  const c = classifyError(
    base({ stderr: "Traceback (most recent call last):\n  File ...\nValueError: bad value" })
  );
  assert("RuntimeException category", c.category === "RuntimeException");
}

// Unknown
{
  const c = classifyError(base({ stderr: "", error: "something odd" }));
  assert("Unknown category", c.category === "Unknown");
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
