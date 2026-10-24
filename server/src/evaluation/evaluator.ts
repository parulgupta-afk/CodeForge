/**
 * Evaluator – structured verdict with visible/hidden checks.
 * Phase 1 of CodeForge Evolution.
 *
 * Success means verified (all required checks pass), never just exit code 0.
 */

export type CheckStatus = "passed" | "failed" | "not_run" | "skipped";

export interface CheckResult {
  name: string;
  status: CheckStatus;
  reason?: string;
  detail?: string;
}

export type VerdictKind = "verified" | "partial" | "failed";

export interface EvaluatorVerdict {
  verdict: VerdictKind;
  checks: CheckResult[];
  visiblePassed: boolean;
  hiddenPassed: boolean;
  summary: string;
}

export interface EvaluateInput {
  /** Exit code from execution */
  exitCode: number | null;
  timedOut: boolean;
  stdout: string;
  stderr: string;
  /** Expected stdout substring or exact match (legacy tasks) */
  expectedOutput?: string;
  expectedOutputMode?: "contains" | "exact" | "regex";
  /** Visible test results if run separately */
  visibleTestsPassed?: boolean;
  visibleTestsDetail?: string;
  /** Hidden test results */
  hiddenTestsPassed?: boolean;
  hiddenTestsDetail?: string;
  /** Agent-written regression test: must fail on original, pass on fix */
  failBeforePassAfter?: {
    failedOnOriginal: boolean;
    passedOnFix: boolean;
  };
  /** Optional acceptance criteria strings that must appear in stdout */
  acceptanceCriteria?: string[];
}

/**
 * Produce a structured verdict. A run is only "verified" when every
 * required check that was configured passes.
 */
export function evaluate(input: EvaluateInput): EvaluatorVerdict {
  const checks: CheckResult[] = [];

  // 1. Exit / timeout
  if (input.timedOut) {
    checks.push({
      name: "timeout",
      status: "failed",
      reason: "Execution timed out",
    });
  } else if (input.exitCode === 0) {
    checks.push({
      name: "exit_code",
      status: "passed",
      reason: "Exit code 0",
    });
  } else {
    checks.push({
      name: "exit_code",
      status: "failed",
      reason: `Exit code ${input.exitCode}`,
      detail: input.stderr?.slice(0, 300),
    });
  }

  // 2. Expected output (legacy / simple cases)
  if (input.expectedOutput !== undefined && input.expectedOutput !== "") {
    const mode = input.expectedOutputMode || "contains";
    const out = input.stdout || "";
    let ok = false;
    if (mode === "exact") ok = out.trim() === input.expectedOutput.trim();
    else if (mode === "regex") {
      try {
        ok = new RegExp(input.expectedOutput).test(out);
      } catch {
        ok = false;
      }
    } else {
      ok = out.includes(input.expectedOutput);
    }
    checks.push({
      name: "expected_output",
      status: ok ? "passed" : "failed",
      reason: ok
        ? `Output matched (${mode})`
        : `Output did not match expected (${mode})`,
      detail: ok ? undefined : out.slice(0, 200),
    });
  }

  // 3. Visible tests
  if (input.visibleTestsPassed !== undefined) {
    checks.push({
      name: "visible_tests",
      status: input.visibleTestsPassed ? "passed" : "failed",
      reason: input.visibleTestsDetail || (input.visibleTestsPassed ? "All visible tests passed" : "Visible tests failed"),
    });
  } else {
    checks.push({ name: "visible_tests", status: "not_run" });
  }

  // 4. Hidden tests
  if (input.hiddenTestsPassed !== undefined) {
    checks.push({
      name: "hidden_tests",
      status: input.hiddenTestsPassed ? "passed" : "failed",
      reason: input.hiddenTestsDetail || (input.hiddenTestsPassed ? "All hidden tests passed" : "Hidden tests failed"),
    });
  } else {
    checks.push({ name: "hidden_tests", status: "not_run" });
  }

  // 5. Fail-before / pass-after for agent-written regression tests
  if (input.failBeforePassAfter) {
    const { failedOnOriginal, passedOnFix } = input.failBeforePassAfter;
    const ok = failedOnOriginal && passedOnFix;
    checks.push({
      name: "fail_before_pass_after",
      status: ok ? "passed" : "failed",
      reason: ok
        ? "Regression test failed on original and passed on fix"
        : `fail-before=${failedOnOriginal}, pass-after=${passedOnFix}`,
    });
  }

  // 6. Acceptance criteria
  if (input.acceptanceCriteria && input.acceptanceCriteria.length > 0) {
    const missing = input.acceptanceCriteria.filter(
      (c) => !(input.stdout || "").includes(c)
    );
    checks.push({
      name: "acceptance_criteria",
      status: missing.length === 0 ? "passed" : "failed",
      reason:
        missing.length === 0
          ? "All acceptance criteria present in output"
          : `Missing: ${missing.join("; ")}`,
    });
  }

  const required = checks.filter((c) => c.status !== "not_run" && c.status !== "skipped");
  const failed = required.filter((c) => c.status === "failed");
  const passed = required.filter((c) => c.status === "passed");

  const visiblePassed =
    checks.find((c) => c.name === "visible_tests")?.status === "passed" ||
    (checks.find((c) => c.name === "visible_tests")?.status === "not_run" &&
      checks.find((c) => c.name === "exit_code")?.status === "passed");

  const hiddenCheck = checks.find((c) => c.name === "hidden_tests");
  const hiddenPassed =
    hiddenCheck?.status === "passed" ||
    (hiddenCheck?.status === "not_run" && failed.length === 0);

  let verdict: VerdictKind;
  if (failed.length === 0 && required.length > 0) {
    verdict = "verified";
  } else {
    verdict = "failed";
  }

  // If only exit_code was checked and it failed → failed
  // If expected_output was required and failed → not verified
  const summary =
    verdict === "verified"
      ? `Verified: ${passed.length}/${required.length} checks passed`
      : `Failed: ${failed.map((f) => f.name).join(", ") || "no checks passed"}`;

  return {
    verdict,
    checks,
    visiblePassed: !!visiblePassed,
    hiddenPassed: !!hiddenPassed,
    summary,
  };
}

/**
 * Convenience: treat exit-code-only success as verified only when no
 * stronger checks were configured. Used by orchestrator during migration.
 */
export function isVerifiedSuccess(verdict: EvaluatorVerdict): boolean {
  return verdict.verdict === "verified";
}
