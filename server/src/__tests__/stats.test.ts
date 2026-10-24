/**
 * Stats unit tests – Phase 3
 * Run: npx ts-node --transpile-only src/__tests__/stats.test.ts
 */
import { wilsonInterval, pairedBootstrap, formatRate } from "../evaluation/stats";

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

console.log("stats tests\n");

{
  const w = wilsonInterval(10, 10);
  assert("perfect rate is 1", w.rate === 1);
  assert("perfect low > 0.6", w.low > 0.6);
  assert("perfect high is 1", w.high === 1);
}

{
  const w = wilsonInterval(0, 10);
  assert("zero rate is 0", w.rate === 0);
  assert("zero low is 0", w.low === 0);
}

{
  const diffs = [0.1, 0.2, -0.05, 0.15];
  const b = pairedBootstrap(diffs, 500, 1);
  const mean = diffs.reduce((a, c) => a + c, 0) / diffs.length;
  assert("bootstrap mean matches sample", Math.abs(b.mean - mean) < 1e-9);
}

{
  const s = formatRate(8, 10);
  assert("formatRate has percent", s.includes("%"));
  assert("formatRate has n", s.includes("n=10"));
}

console.log(`\nstats: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
