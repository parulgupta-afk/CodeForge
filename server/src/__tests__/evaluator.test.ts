/**
 * Evaluator unit tests – Phase 1
 * Run: npx ts-node --transpile-only src/__tests__/evaluator.test.ts
 */
import { evaluate, isVerifiedSuccess } from "../evaluation/evaluator";

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

console.log("evaluator tests\n");

{
  const v = evaluate({
    exitCode: 0,
    timedOut: false,
    stdout: "hello",
    stderr: "",
  });
  assert("exit 0 alone is verified", v.verdict === "verified");
  assert("isVerifiedSuccess true", isVerifiedSuccess(v) === true);
}

{
  const v = evaluate({
    exitCode: 1,
    timedOut: false,
    stdout: "",
    stderr: "boom",
  });
  assert("non-zero exit failed", v.verdict === "failed");
  assert("isVerifiedSuccess false", isVerifiedSuccess(v) === false);
}

{
  const v = evaluate({
    exitCode: 0,
    timedOut: false,
    stdout: "wrong",
    stderr: "",
    expectedOutput: "42",
    expectedOutputMode: "contains",
  });
  assert("missing expected output fails", v.verdict === "failed");
  const eo = v.checks.find((c) => c.name === "expected_output");
  assert("expected_output check failed", eo?.status === "failed");
}

{
  const v = evaluate({
    exitCode: 0,
    timedOut: false,
    stdout: "answer is 42\n",
    stderr: "",
    expectedOutput: "42",
  });
  assert("matching expected output verified", v.verdict === "verified");
}

{
  const v = evaluate({
    exitCode: null,
    timedOut: true,
    stdout: "",
    stderr: "",
  });
  assert("timeout fails", v.verdict === "failed");
}

{
  const bad = evaluate({
    exitCode: 0,
    timedOut: false,
    stdout: "ok",
    stderr: "",
    failBeforePassAfter: { failedOnOriginal: false, passedOnFix: true },
  });
  assert("vacuous regression test fails", bad.verdict === "failed");

  const good = evaluate({
    exitCode: 0,
    timedOut: false,
    stdout: "ok",
    stderr: "",
    failBeforePassAfter: { failedOnOriginal: true, passedOnFix: true },
  });
  assert("real regression test passes", good.verdict === "verified");
}

{
  const v = evaluate({
    exitCode: 0,
    timedOut: false,
    stdout: "ok",
    stderr: "",
    hiddenTestsPassed: false,
    hiddenTestsDetail: "case 3 failed",
  });
  assert("hidden test failure fails verdict", v.verdict === "failed");
  assert("hiddenPassed false", v.hiddenPassed === false);
}

console.log(`\nevaluator: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
