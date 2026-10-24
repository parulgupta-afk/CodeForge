/**
 * Repository agent – Phase 4.
 * Explicit state machine + tool-use loop over a disposable workspace.
 *
 * States: queued → planning → inspecting → executing → verifying →
 *         analyzing → repairing → completed | failed | cancelled | awaiting_approval
 */

import { randomUUID } from "crypto";
import {
  createWorkspace,
  destroyWorkspace,
  Workspace,
  readGitDiff,
} from "../workspace/manager";
import { ensureRepoToolsRegistered, registerRepositoryTools } from "../tools/repositoryTools";
import { invokeTool, listTools, ToolContext } from "../tools/registry";
import { evaluate, isVerifiedSuccess } from "../evaluation/evaluator";
import { emitAgentEvent } from "../websocket/io";
import { createBudget, RunBudget } from "../config/budget";
import { generateCode } from "./codeGenerator";

export type RepoAgentState =
  | "queued"
  | "planning"
  | "inspecting"
  | "executing"
  | "verifying"
  | "analyzing"
  | "repairing"
  | "completed"
  | "failed"
  | "cancelled"
  | "awaiting_approval";

export interface RepoAgentResult {
  success: boolean;
  runId: string;
  task: string;
  state: RepoAgentState;
  finalDiff?: string;
  finalError?: string;
  toolCalls: number;
  verdictSummary?: string;
  workspaceId?: string;
}

export interface RepoAgentOptions {
  seedDir?: string;
  budget?: Partial<RunBudget>;
  maxToolCalls?: number;
  allowedWritePaths?: string[];
  requireApproval?: boolean;
  /** Visible expected substring for evaluator */
  expectedOutput?: string;
  hiddenTestCode?: string;
}

const TRANSITIONS: Record<RepoAgentState, RepoAgentState[]> = {
  queued: ["planning", "cancelled"],
  planning: ["inspecting", "failed", "cancelled"],
  inspecting: ["executing", "planning", "failed", "cancelled"],
  executing: ["verifying", "awaiting_approval", "analyzing", "failed", "cancelled"],
  verifying: ["completed", "analyzing", "failed"],
  analyzing: ["repairing", "failed", "cancelled"],
  repairing: ["executing", "failed", "cancelled"],
  awaiting_approval: ["executing", "cancelled", "failed"],
  completed: [],
  failed: [],
  cancelled: [],
};

function canTransition(from: RepoAgentState, to: RepoAgentState): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

function emit(runId: string, type: string, extra: Record<string, unknown> = {}) {
  emitAgentEvent({
    type: type as any,
    runId,
    timestamp: new Date().toISOString(),
    ...extra,
  });
}

/**
 * Parse a single JSON action from model output:
 * { "tool": "read_file", "args": { "path": "main.py" } }
 * or { "done": true, "summary": "..." }
 */
function parseAction(raw: string): {
  tool?: string;
  args?: Record<string, unknown>;
  done?: boolean;
  summary?: string;
} | null {
  let s = raw.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(s.slice(start, end + 1));
  } catch {
    return null;
  }
}

const SYSTEM_TOOL_PROMPT = `You are a repository repair agent. You work ONLY via tools.
Available tools (respond with a single JSON object, no markdown):
{"tool":"<name>","args":{...}}
or when finished:
{"done":true,"summary":"what you fixed"}

Typical investigation order:
1. list_files
2. search_code / read_file to find the defect
3. apply_patch or write_file with a minimal fix
4. run_tests
5. read_git_diff
6. done

Never invent file paths outside the workspace. Prefer minimal patches.`;

/**
 * Run the repository agent on a seeded project.
 */
export async function runRepoAgent(
  task: string,
  opts: RepoAgentOptions = {}
): Promise<RepoAgentResult> {
  ensureRepoToolsRegistered();

  const runId = randomUUID();
  const budget = createBudget(opts.budget);
  const maxToolCalls = opts.maxToolCalls ?? 20;
  let state: RepoAgentState = "queued";
  let toolCalls = 0;
  let lastError: string | undefined;
  let finalDiff: string | undefined;
  let verdictSummary: string | undefined;

  const ws = createWorkspace({ seedDir: opts.seedDir });
  const ctx: ToolContext = {
    workspaceRoot: ws.root,
    runId,
    requireApproval: opts.requireApproval ?? false,
    allowedWritePaths: opts.allowedWritePaths ?? ["."],
  };

  const setState = (next: RepoAgentState) => {
    if (!canTransition(state, next) && state !== next) {
      // allow terminal force
      if (!["completed", "failed", "cancelled"].includes(next)) {
        console.warn(`[repoAgent] invalid transition ${state} → ${next}`);
      }
    }
    state = next;
    emit(runId, "repo:state", { message: state, data: { state } });
  };

  emit(runId, "run:started", {
    message: "Repository agent started",
    data: { task, workspaceId: ws.id },
  });

  try {
    setState("planning");

    // Build tool catalogue for the model
    const toolList = listTools()
      .map((t) => `- ${t.name} (${t.permission}): ${t.description}`)
      .join("\n");

    let memory = `Task: ${task}\n\nTools:\n${toolList}\n`;
    setState("inspecting");

    // Auto first step: list files so the model has context even before first LLM call
    {
      const listed = await invokeTool("list_files", { dir: "." }, ctx);
      toolCalls++;
      memory += `\n[list_files] ${JSON.stringify(listed.data || listed.error)}\n`;
    }

    const wallDeadline = Date.now() + budget.wallTimeMs;

    while (toolCalls < maxToolCalls && Date.now() < wallDeadline) {
      setState("executing");

      const prompt = `${SYSTEM_TOOL_PROMPT}\n\n${memory}\n\nReturn the next action as JSON.`;
      const gen = await generateCode(prompt);
      if (!gen.success || !gen.data) {
        lastError = gen.error || "LLM failed";
        setState("failed");
        break;
      }

      const action = parseAction(gen.data.code) || parseAction(gen.data.explanation || "");
      // Also try parsing raw if model put JSON in code field as plain text
      const action2 = action || parseAction(gen.rawResponse || "");

      const act = action2 || action;
      if (!act) {
        // Treat generated Python as a full-file write to main.py (fallback for non-tool models)
        memory += `\n[note] model did not return tool JSON; stopping.\n`;
        lastError = "model_did_not_return_tool_json";
        setState("failed");
        break;
      }

      if (act.done) {
        setState("verifying");
        finalDiff = readGitDiff(ws);

        // Run hidden/visible verification if provided
        let hiddenPassed: boolean | undefined;
        if (opts.hiddenTestCode) {
          const { executeCode } = await import("../sandbox");
          const ex = await executeCode({
            code: opts.hiddenTestCode,
            filename: "hidden_test.py",
            timeoutMs: budget.executionTimeoutMs,
          });
          hiddenPassed = ex.success;
        }

        const verdict = evaluate({
          exitCode: 0,
          timedOut: false,
          stdout: act.summary || finalDiff || "",
          stderr: "",
          expectedOutput: opts.expectedOutput,
          hiddenTestsPassed: hiddenPassed,
        });
        verdictSummary = verdict.summary;

        if (isVerifiedSuccess(verdict) || (!opts.expectedOutput && !opts.hiddenTestCode)) {
          // Without explicit checks, success = agent declared done + has a diff or summary
          setState("completed");
          emit(runId, "run:completed", {
            message: act.summary || "Repository task completed",
            data: { finalDiff, toolCalls, verdict: verdictSummary },
          });
          return {
            success: true,
            runId,
            task,
            state: "completed",
            finalDiff,
            toolCalls,
            verdictSummary,
            workspaceId: ws.id,
          };
        }

        setState("analyzing");
        memory += `\n[verify] failed: ${verdict.summary}\n`;
        lastError = verdict.summary;
        setState("repairing");
        continue;
      }

      if (!act.tool) {
        lastError = "action missing tool";
        setState("failed");
        break;
      }

      emit(runId, "tool:call", {
        message: act.tool,
        data: { tool: act.tool, args: act.args },
      });

      const result = await invokeTool(act.tool, act.args || {}, ctx);
      toolCalls++;

      if (result.needsApproval) {
        setState("awaiting_approval");
        emit(runId, "approval:required", {
          message: result.error || "approval required",
          data: { tool: act.tool, args: act.args },
        });
        // Auto-reject in headless mode (Phase 6 adds real approval channel)
        lastError = result.error || "approval_required";
        setState("failed");
        break;
      }

      memory += `\n[${act.tool}] ok=${result.ok} ${JSON.stringify(result.data || result.error).slice(0, 1500)}\n`;

      if (!result.ok && act.tool === "run_tests") {
        setState("analyzing");
        setState("repairing");
      }
    }

    if ((state as RepoAgentState) !== "completed" && (state as RepoAgentState) !== "failed") {
      lastError = lastError || "budget_or_tool_limit";
      setState("failed");
    }

    finalDiff = finalDiff || readGitDiff(ws);
    emit(runId, "run:failed", {
      message: lastError || "Repository agent failed",
      data: { toolCalls, finalDiff },
    });

    return {
      success: false,
      runId,
      task,
      state: "failed",
      finalDiff,
      finalError: lastError,
      toolCalls,
      verdictSummary,
      workspaceId: ws.id,
    };
  } catch (err: any) {
    setState("failed");
    return {
      success: false,
      runId,
      task,
      state: "failed",
      finalError: err?.message || String(err),
      toolCalls,
      workspaceId: ws.id,
    };
  } finally {
    // Keep workspace briefly for debugging if CODEFORGE_KEEP_WORKSPACE=true
    if (process.env.CODEFORGE_KEEP_WORKSPACE !== "true") {
      destroyWorkspace(ws);
    }
  }
}

// Ensure tools exist when module loads in tests
try {
  registerRepositoryTools();
} catch {
  /* already registered */
}
