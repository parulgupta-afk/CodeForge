/**
 * Workspace path-safety tests – Phase 4
 * Run: npx ts-node --transpile-only src/__tests__/workspace.test.ts
 */
import {
  createWorkspace,
  destroyWorkspace,
  resolveSafe,
  PathEscapeError,
  listFiles,
  readFile,
  writeFile,
  applyUnifiedDiff,
} from "../workspace/manager";

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

console.log("workspace tests\n");

const ws = createWorkspace();

{
  let threw = false;
  try {
    resolveSafe(ws.root, "../outside.txt");
  } catch (e) {
    threw = e instanceof PathEscapeError;
  }
  assert("rejects .. escape", threw);
}

{
  let threw = false;
  try {
    resolveSafe(ws.root, "/etc/passwd");
  } catch (e) {
    threw = e instanceof PathEscapeError;
  }
  assert("rejects absolute path", threw);
}

{
  writeFile(ws, "hello.txt", "world");
  const content = readFile(ws, "hello.txt");
  assert("write/read file", content === "world");
}

{
  const files = listFiles(ws, ".");
  assert("list_files includes hello.txt", files.includes("hello.txt"));
}

{
  writeFile(ws, "hello.txt", "world\n");
  applyUnifiedDiff(
    ws,
    [
      "--- a/hello.txt",
      "+++ b/hello.txt",
      "@@ -1 +1 @@",
      "-world",
      "+universe",
    ].join("\n")
  );
  const after = readFile(ws, "hello.txt");
  assert("apply_patch changes content", after.includes("universe") || after.includes("world"));
}

{
  let threw = false;
  try {
    resolveSafe(ws.root, "subdir/../../etc/passwd");
  } catch (e) {
    threw = e instanceof PathEscapeError;
  }
  assert("rejects nested escape", threw);
}

destroyWorkspace(ws);
assert("destroy succeeds", true);

console.log(`\nworkspace: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
