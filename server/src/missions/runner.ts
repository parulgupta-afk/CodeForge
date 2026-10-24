/**
 * Mission execution helper – runs visible/hidden tests against player or agent code.
 */

import { Mission } from "./loader";
import { executeCode } from "../sandbox";
import { evaluate } from "../evaluation/evaluator";

export interface MissionRunResult {
  visiblePassed: boolean;
  hiddenPassed: boolean;
  visibleStdout: string;
  hiddenStdout: string;
  visibleStderr: string;
  hiddenStderr: string;
  verdictSummary: string;
}

/**
 * Combine starter files overridden by `files`, then run visible and hidden tests
 * by concatenating module sources + test script into one sandbox execution.
 */
export async function runMissionTests(
  mission: Mission,
  files: Record<string, string>
): Promise<MissionRunResult> {
  const merged = { ...mission.starter, ...files };

  // Build a single Python program: write modules as strings executed into sys.modules style via exec
  const moduleSetup = Object.entries(merged)
    .map(([filename, code]) => {
      const mod = filename.replace(/\.py$/, "").replace(/\//g, ".");
      return `
# --- module: ${filename} ---
_code_${mod.replace(/\./g, "_")} = ${JSON.stringify(code)}
exec(_code_${mod.replace(/\./g, "_")}, globals())
`;
    })
    .join("\n");

  async function runBlock(tests: string, label: string) {
    const code = `
${moduleSetup}
# --- ${label} ---
${tests}
`;
    return executeCode({
      code,
      filename: `${label}.py`,
      timeoutMs: 15_000,
    });
  }

  const visible = await runBlock(mission.visibleTests, "visible");
  const hidden = await runBlock(mission.hiddenTests, "hidden");

  const verdict = evaluate({
    exitCode: hidden.success && visible.success ? 0 : 1,
    timedOut: visible.timedOut || hidden.timedOut,
    stdout: (visible.stdout || "") + "\n" + (hidden.stdout || ""),
    stderr: (visible.stderr || "") + "\n" + (hidden.stderr || ""),
    visibleTestsPassed: visible.success,
    hiddenTestsPassed: hidden.success,
  });

  return {
    visiblePassed: !!visible.success,
    hiddenPassed: !!hidden.success,
    visibleStdout: visible.stdout || "",
    hiddenStdout: hidden.stdout || "",
    visibleStderr: visible.stderr || "",
    hiddenStderr: hidden.stderr || "",
    verdictSummary: verdict.summary,
  };
}
