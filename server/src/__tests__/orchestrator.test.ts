/**
 * Orchestrator integration tests (mocked LLM + sandbox).
 * Run: npx ts-node --transpile-only src/__tests__/orchestrator.test.ts
 */
import { runAgent, MAX_ATTEMPTS, AgentDeps } from "../agents/orchestrator";
import { GenerationResult } from "../types/generation";
import { ExecutionResult } from "../types/execution";
import { ClassifiedError } from "../types/error";

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

function okGen(code = "print(42)"): GenerationResult {
  return {
    success: true,
    data: {
      language: "python",
      filename: "main.py",
      code,
      dependencies: [],
      explanation: "test",
    },
    provider: "mock",
    model: "test",
  };
}

function failGen(error = "LLM failed"): GenerationResult {
  return { success: false, error, provider: "mock", model: "test" };
}

function okExec(stdout = "42"): ExecutionResult {
  return {
    success: true,
    stdout,
    stderr: "",
    exitCode: 0,
    durationMs: 10,
    timedOut: false,
  };
}

function failExec(stderr: string, timedOut = false): ExecutionResult {
  return {
    success: false,
    stdout: "",
    stderr,
    exitCode: 1,
    durationMs: 10,
    timedOut,
    error: stderr,
  };
}

function classifyStub(execution: ExecutionResult): ClassifiedError {
  if (execution.timedOut) {
    return { category: "Timeout", detail: "timed out", retryable: true, rawStderr: execution.stderr };
  }
  if (execution.stderr.toLowerCase().includes("permission")) {
    return { category: "PermissionDenied", detail: "denied", retryable: false, rawStderr: execution.stderr };
  }
  if (execution.stderr.toLowerCase().includes("network") || execution.stderr.toLowerCase().includes("connection refused")) {
    return { category: "NetworkBlocked", detail: "blocked", retryable: false, rawStderr: execution.stderr };
  }
  if (execution.stderr.toLowerCase().includes("syntax")) {
    return { category: "SyntaxError", detail: "syntax", retryable: true, rawStderr: execution.stderr };
  }
  return { category: "RuntimeException", detail: execution.stderr || "runtime", retryable: true, rawStderr: execution.stderr };
}

async function run() {
  console.log("orchestrator integration tests\n");

  // TEST 1 — first attempt success
  {
    const events: string[] = [];
    let repairCalls = 0;
    const result = await runAgent("print 42", {
      generate: async () => okGen("print(42)"),
      execute: async () => okExec("42"),
      repair: async () => {
        repairCalls++;
        return okGen();
      },
      classify: classifyStub,
      emit: (_id, type) => events.push(type),
    });
    assert("T1 success", result.success === true);
    assert("T1 attempts=1", result.totalAttempts === 1);
    assert("T1 no repair", repairCalls === 0);
    assert("T1 run:completed", events.includes("run:completed"));
  }

  // TEST 2 — syntax fail → repair → success
  {
    let genCalls = 0;
    let repairCalls = 0;
    const events: string[] = [];
    const result = await runAgent("broken then fixed", {
      generate: async () => {
        genCalls++;
        return okGen("print("); // broken
      },
      repair: async () => {
        repairCalls++;
        return okGen("print(1)");
      },
      execute: async ({ code }) => {
        if (code.includes("print(1)")) return okExec("1");
        return failExec("SyntaxError: invalid syntax");
      },
      classify: classifyStub,
      emit: (_id, type) => events.push(type),
    });
    assert("T2 success", result.success === true);
    assert("T2 attempts=2", result.totalAttempts === 2);
    assert("T2 repair once", repairCalls === 1);
    assert("T2 classified event", events.includes("error:classified"));
    assert("T2 repair event", events.includes("repair:started"));
  }

  // TEST 3 — max exhaustion
  {
    let attempts = 0;
    const result = await runAgent("always fail", {
      generate: async () => okGen("x"),
      repair: async () => okGen("x"),
      execute: async () => {
        attempts++;
        return failExec("RuntimeError: boom");
      },
      classify: classifyStub,
      emit: () => {},
    });
    assert("T3 failed", result.success === false);
    assert("T3 exactly 3", result.totalAttempts === MAX_ATTEMPTS);
    assert("T3 no 4th", attempts === 3);
  }

  // TEST 4 — non-retryable PermissionDenied
  {
    let repairCalls = 0;
    const result = await runAgent("permission", {
      generate: async () => okGen("open('/etc/shadow')"),
      repair: async () => {
        repairCalls++;
        return okGen();
      },
      execute: async () => failExec("PermissionError: Permission denied"),
      classify: classifyStub,
      emit: () => {},
    });
    assert("T4 failed", result.success === false);
    assert("T4 single attempt", result.totalAttempts === 1);
    assert("T4 no repair", repairCalls === 0);
    assert("T4 PermissionDenied", (result.finalError || "").includes("PermissionDenied"));
  }

  // TEST 5 — generation failure
  {
    const result = await runAgent("gen fail", {
      generate: async () => failGen("all providers down"),
      execute: async () => okExec(),
      emit: () => {},
    });
    assert("T5 failed", result.success === false);
    assert("T5 gen error", (result.finalError || "").includes("all providers down"));
  }

  // TEST 6 — timeout path still retries (retryable)
  {
    let repairCalls = 0;
    const result = await runAgent("timeout", {
      generate: async () => okGen("while True: pass"),
      repair: async () => {
        repairCalls++;
        return okGen("print(0)");
      },
      execute: async ({ code }) => {
        if (code.includes("print(0)")) return okExec("0");
        return failExec("killed", true);
      },
      classify: classifyStub,
      emit: () => {},
    });
    assert("T6 timeout recovered", result.success === true);
    assert("T6 repair used", repairCalls === 1);
  }

  // TEST 7 — unexpected internal error
  {
    const result = await runAgent("crash", {
      generate: async () => {
        throw new Error("unexpected boom");
      },
      emit: () => {},
    });
    assert("T7 failed cleanly", result.success === false);
    assert("T7 message", (result.finalError || "").includes("unexpected boom"));
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
