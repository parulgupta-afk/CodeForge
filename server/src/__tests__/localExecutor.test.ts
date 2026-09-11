/**
 * Local sandbox safety tests (CI-safe, no Docker required).
 * Run: npx ts-node --transpile-only src/__tests__/localExecutor.test.ts
 */
import { executeLocally } from "../sandbox/localExecutor";

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

async function run() {
  console.log("localExecutor safety tests\n");

  {
    const r = await executeLocally({
      code: "print(2 + 2)",
      filename: "main.py",
      timeoutMs: 5000,
    });
    assert("success run", r.success === true && r.stdout.trim() === "4");
    assert("exit 0", r.exitCode === 0);
    assert("not timed out", r.timedOut === false);
  }

  {
    const r = await executeLocally({
      code: "print(",
      filename: "main.py",
      timeoutMs: 5000,
    });
    assert("syntax fails", r.success === false);
    assert("has stderr or error", !!(r.stderr || r.error));
  }

  {
    const r = await executeLocally({
      code: "import time\nwhile True:\n    time.sleep(0.05)",
      filename: "main.py",
      timeoutMs: 1500,
    });
    assert("timeout flagged", r.timedOut === true);
    assert("timeout not success", r.success === false);
    assert("timeout error message", typeof r.error === "string" && r.error.includes("timed out"));
  }

  {
    const huge = "x = 1\n" + ("#" + "a".repeat(1000) + "\n").repeat(250);
    const r = await executeLocally({
      code: huge,
      filename: "main.py",
      timeoutMs: 5000,
    });
    assert(
      "rejects huge code",
      r.success === false && (r.error || "").toLowerCase().includes("large")
    );
  }

  {
    const r = await executeLocally({
      code: "print('x' * 300000)",
      filename: "main.py",
      timeoutMs: 10000,
    });
    assert("huge stdout handled", typeof r.stdout === "string");
    if (r.success) {
      assert("stdout capped", r.stdout.length <= 256 * 1024 + 80);
    }
  }

  {
    const r = await executeLocally({
      code: "",
      filename: "main.py",
      timeoutMs: 3000,
    });
    assert("empty code handled", typeof r.success === "boolean");
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
