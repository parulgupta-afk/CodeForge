/**
 * Docker Sandbox Security & Integration Tests
 *
 * Requirements:
 * - Running Docker daemon on the host machine
 * - python:3.12-slim image available or pullable
 *
 * Run manually or locally:
 *   npm run test:docker
 *
 * If Docker is not available on the current host, this test reports that
 * Docker is offline and cleanly exits so non-Docker CI environments are not broken.
 */
import Docker from "dockerode";
import { executeInDocker } from "../sandbox/dockerExecutor";

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

async function isDockerRunning(): Promise<boolean> {
  const docker = new Docker();
  try {
    await docker.ping();
    return true;
  } catch {
    return false;
  }
}

async function run() {
  console.log("dockerExecutor security tests\n");

  const available = await isDockerRunning();
  if (!available) {
    console.log("  [SKIP] Docker daemon is not available/running on this host.");
    console.log("  [SKIP] Docker integration tests require a running Docker daemon.");
    console.log("  [SKIP] Local tests and standard CI use localExecutor without Docker.\n");
    console.log("0 passed, 0 failed, 1 skipped");
    return;
  }

  // 1. Valid code executes inside container
  {
    const r = await executeInDocker({
      code: "print(21 * 2)",
      filename: "main.py",
      timeoutMs: 15_000,
    });
    assert("valid code executes in container", r.success === true && r.stdout.trim() === "42");
    assert("container exit code 0", r.exitCode === 0);
    assert("not timed out", r.timedOut === false);
  }

  // 2. Wall-clock timeout is enforced
  {
    const r = await executeInDocker({
      code: "import time\nwhile True:\n    time.sleep(0.05)",
      filename: "main.py",
      timeoutMs: 1500,
    });
    assert("timeout enforced in container", r.timedOut === true);
    assert("timeout marked unsuccessful", r.success === false);
  }

  // 3. Network access is blocked (NetworkMode: none)
  {
    const r = await executeInDocker({
      code: "import urllib.request\ntry:\n    urllib.request.urlopen('http://1.1.1.1', timeout=2)\n    print('ONLINE')\nexcept Exception:\n    print('BLOCKED')",
      filename: "main.py",
      timeoutMs: 10_000,
    });
    assert("network access blocked by NetworkMode: none", r.stdout.trim() === "BLOCKED");
  }

  // 4. Excessive output is capped / truncated
  {
    const r = await executeInDocker({
      code: "print('A' * 300000)",
      filename: "main.py",
      timeoutMs: 15_000,
    });
    assert("excessive output handled", typeof r.stdout === "string");
    if (r.success) {
      assert("output capped to max limit", r.stdout.length <= 256 * 1024 + 80);
    }
  }

  // 5. Oversized code payload is rejected early
  {
    const huge = "x = 1\n" + ("#" + "a".repeat(1000) + "\n").repeat(250);
    const r = await executeInDocker({
      code: huge,
      filename: "main.py",
      timeoutMs: 15_000,
    });
    assert(
      "oversized code rejected early",
      r.success === false && (r.error || "").toLowerCase().includes("large")
    );
  }

  // 6. Non-root user verified (nobody: 65534)
  {
    const r = await executeInDocker({
      code: "import os\nprint(os.getuid())",
      filename: "main.py",
      timeoutMs: 10_000,
    });
    assert("executes as non-root user (nobody/65534)", r.stdout.trim() === "65534");
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
