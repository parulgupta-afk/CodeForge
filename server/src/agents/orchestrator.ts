/**
 * Core agent loop – Phase 0/1 Evolution:
 *  - RunBudget instead of hard-coded constants
 *  - Evaluator decides success (not bare exit code 0)
 *  - Write-through persistence of attempts
 *  - Optional experience retrieval (Phase 2)
 */

import { randomUUID } from "crypto";
import { generateCode as defaultGenerate } from "./codeGenerator";
import { repairCode as defaultRepair } from "./repairAgent";
import { executeCode as defaultExecute } from "../sandbox";
import { classifyError as defaultClassify } from "../classifier/errorClassifier";
import { Attempt, OrchestratorResult } from "../types/attempt";
import { runsStore } from "../store/runsStore";
import { Run } from "../types/run";
import { emitAgentEvent } from "../websocket/io";
import { GeneratedCode, GenerationResult } from "../types/generation";
import { ExecutionInput, ExecutionResult } from "../types/execution";
import { ClassifiedError } from "../types/error";
import { createBudget, RunBudget } from "../config/budget";
import { evaluate, isVerifiedSuccess, EvaluatorVerdict } from "../evaluation/evaluator";
import {
  getMemoryMode,
  retrieveExperiences,
  formatExperiencesForPrompt,
  createCandidateExperience,
  promoteToVerified,
  recordExperienceUse,
} from "../memory/experienceStore";

export const MAX_ATTEMPTS = 3; // kept for test compatibility; prefer budget.maxAttempts

export type AgentDeps = {
  generate?: (task: string) => Promise<GenerationResult>;
  repair?: (
    task: string,
    previous: GeneratedCode,
    classified: ClassifiedError
  ) => Promise<GenerationResult>;
  execute?: (input: ExecutionInput) => Promise<ExecutionResult>;
  classify?: (execution: ExecutionResult) => ClassifiedError;
  emit?: (runId: string, type: string, extra?: Record<string, unknown>) => void;
  budget?: Partial<RunBudget>;
  /** Optional expected output for evaluator (benchmark cases) */
  expectedOutput?: string;
  expectedOutputMode?: "contains" | "exact" | "regex";
};

function defaultEmit(runId: string, type: string, extra: Record<string, unknown> = {}) {
  emitAgentEvent({
    type: type as any,
    runId,
    timestamp: new Date().toISOString(),
    ...extra,
  });
}

export async function runAgent(
  task: string,
  deps: AgentDeps = {}
): Promise<OrchestratorResult> {
  const generate = deps.generate ?? defaultGenerate;
  const repair = deps.repair ?? defaultRepair;
  const execute = deps.execute ?? defaultExecute;
  const classify = deps.classify ?? defaultClassify;
  const emit = deps.emit ?? defaultEmit;
  const budget = createBudget(deps.budget);

  const runId = randomUUID();
  const now = new Date().toISOString();
  const wallDeadline = Date.now() + budget.wallTimeMs;

  const run: Run = {
    id: runId,
    task,
    status: "running",
    createdAt: now,
    updatedAt: now,
    attempts: 0,
  };
  runsStore.create(run);

  emit(runId, "run:started", { message: "Agent started", data: { task, budget } });

  // Phase 2: retrieve experiences when memory is on
  let experienceBlock = "";
  const memoryMode = getMemoryMode();
  if (memoryMode !== "off") {
    try {
      const exps = await retrieveExperiences({ language: "python", limit: 3 });
      experienceBlock = formatExperiencesForPrompt(exps);
      for (let i = 0; i < exps.length; i++) {
        await recordExperienceUse({
          experienceId: exps[i].id,
          runId,
          rank: i + 1,
        });
      }
      if (exps.length > 0) {
        emit(runId, "memory:retrieved", {
          message: `Retrieved ${exps.length} experience(s) (mode=${memoryMode})`,
          data: { ids: exps.map((e) => e.id), mode: memoryMode },
        });
      }
    } catch (err: any) {
      console.warn("[orchestrator] experience retrieve failed:", err?.message);
    }
  }

  const taskWithMemory = experienceBlock ? task + experienceBlock : task;

  const attempts: Attempt[] = [];
  let lastProvider: string | undefined;
  let lastModel: string | undefined;
  let lastVerdict: EvaluatorVerdict | undefined;

  try {
    for (let attemptNumber = 1; attemptNumber <= budget.maxAttempts; attemptNumber++) {
      if (Date.now() > wallDeadline) {
        emit(runId, "run:failed", { message: "Wall-time budget exceeded" });
        runsStore.update(runId, {
          status: "failed",
          attempts: attemptNumber - 1,
          error: "budget_exceeded: wall time",
        });
        return {
          success: false,
          runId,
          task,
          attempts,
          finalError: "budget_exceeded: wall time",
          totalAttempts: attemptNumber - 1,
          provider: lastProvider,
          model: lastModel,
        };
      }

      emit(runId, "attempt:started", {
        attemptNumber,
        message: `Starting attempt ${attemptNumber}`,
      });

      let generation: GenerationResult;

      if (attemptNumber === 1) {
        generation = await generate(taskWithMemory);
      } else {
        const previous = attempts[attempts.length - 1];
        const classified = classify(previous.execution);
        emit(runId, "error:classified", {
          attemptNumber: previous.attemptNumber,
          message: `${classified.category}: ${classified.detail}`,
          data: classified,
        });
        emit(runId, "repair:started", {
          attemptNumber,
          message: "Repairing code…",
        });
        generation = await repair(task, previous.generatedCode, classified);
      }

      lastProvider = generation.provider;
      lastModel = generation.model;

      if (!generation.success || !generation.data) {
        emit(runId, "run:failed", {
          message: generation.error || "Code generation failed",
        });

        const failedAttempt: Attempt = {
          attemptNumber,
          generatedCode: {
            language: "python",
            filename: "main.py",
            code: "",
            dependencies: [],
            explanation: "Generation failed",
          },
          execution: {
            success: false,
            stdout: "",
            stderr: generation.error || "Generation failed",
            exitCode: null,
            durationMs: 0,
            timedOut: false,
            error: generation.error,
          },
          errorSummary: generation.error || "Code generation failed",
          timestamp: new Date().toISOString(),
        };
        attempts.push(failedAttempt);
        runsStore.saveAttempt(runId, failedAttempt);

        runsStore.update(runId, {
          status: "failed",
          attempts: attemptNumber,
          error: generation.error,
          provider: lastProvider,
          model: lastModel,
        });

        return {
          success: false,
          runId,
          task,
          attempts,
          finalError: generation.error || "Code generation failed",
          totalAttempts: attemptNumber,
          provider: lastProvider,
          model: lastModel,
        };
      }

      emit(runId, "code:generated", {
        attemptNumber,
        message: "Code generated",
        data: {
          filename: generation.data.filename,
          lines: generation.data.code.split("\n").length,
          explanation: generation.data.explanation,
          provider: lastProvider,
          model: lastModel,
        },
      });

      emit(runId, "execution:started", {
        attemptNumber,
        message: "Executing in sandbox…",
      });

      const execution = await execute({
        code: generation.data.code,
        filename: generation.data.filename || "main.py",
        timeoutMs: budget.executionTimeoutMs,
      });

      // Phase 1: evaluator decides success
      const verdict = evaluate({
        exitCode: execution.exitCode,
        timedOut: execution.timedOut,
        stdout: execution.stdout || "",
        stderr: execution.stderr || "",
        expectedOutput: deps.expectedOutput,
        expectedOutputMode: deps.expectedOutputMode,
      });
      lastVerdict = verdict;

      // Align execution.success with evaluator for downstream
      const verified = isVerifiedSuccess(verdict);
      const executionForAttempt: ExecutionResult = {
        ...execution,
        success: verified,
      };

      if (verified) {
        emit(runId, "execution:output", {
          attemptNumber,
          message: execution.stdout?.slice(0, 200) || "OK",
          data: {
            stdout: execution.stdout,
            durationMs: execution.durationMs,
            verdict: verdict.summary,
          },
        });
      } else {
        emit(runId, "execution:error", {
          attemptNumber,
          message: verdict.summary || execution.error || execution.stderr || "Execution failed",
          data: {
            stderr: execution.stderr,
            exitCode: execution.exitCode,
            timedOut: execution.timedOut,
            verdict: verdict.summary,
            checks: verdict.checks,
          },
        });
      }

      const classified = verified ? undefined : classify(execution);

      if (classified && !classified.retryable && attemptNumber < budget.maxAttempts) {
        const earlyAttempt: Attempt = {
          attemptNumber,
          generatedCode: generation.data,
          execution: executionForAttempt,
          errorSummary: `${classified.category}: ${classified.detail}`,
          timestamp: new Date().toISOString(),
        };
        attempts.push(earlyAttempt);
        runsStore.saveAttempt(runId, earlyAttempt);

        runsStore.update(runId, {
          status: "failed",
          attempts: attemptNumber,
          generatedCode: generation.data.code,
          error: `${classified.category}: ${classified.detail}`,
          provider: lastProvider,
          model: lastModel,
        });

        emit(runId, "run:failed", {
          message: `Non-retryable: ${classified.category}: ${classified.detail}`,
          data: classified,
        });

        return {
          success: false,
          runId,
          task,
          attempts,
          finalError: `${classified.category}: ${classified.detail}`,
          totalAttempts: attemptNumber,
          provider: lastProvider,
          model: lastModel,
        };
      }

      const attempt: Attempt = {
        attemptNumber,
        generatedCode: generation.data,
        execution: executionForAttempt,
        errorSummary: classified
          ? `${classified.category}: ${classified.detail}`
          : verdict.verdict !== "verified"
            ? verdict.summary
            : undefined,
        timestamp: new Date().toISOString(),
      };
      attempts.push(attempt);
      runsStore.saveAttempt(runId, attempt);

      emit(runId, "attempt:completed", {
        attemptNumber,
        message: verified ? "Attempt verified" : "Attempt failed evaluation",
        data: { success: verified, verdict: verdict.summary },
      });

      if (verified) {
        runsStore.update(runId, {
          status: "success",
          attempts: attemptNumber,
          generatedCode: generation.data.code,
          finalOutput: execution.stdout,
          provider: lastProvider,
          model: lastModel,
          execution: {
            success: true,
            stdout: execution.stdout,
            stderr: execution.stderr,
            exitCode: execution.exitCode,
            durationMs: execution.durationMs,
            timedOut: execution.timedOut,
          },
        });

        // Phase 2: write candidate experience and promote on verified
        if (memoryMode === "verified" || memoryMode === "raw") {
          try {
            const exp = await createCandidateExperience({
              strategy: generation.data.explanation || generation.data.code.slice(0, 200),
              hypothesis: `Solved: ${task.slice(0, 120)}`,
              evidence: verdict.summary,
              provenanceRunId: runId,
              model: lastModel,
              verificationJson: verdict,
              language: "python",
            });
            if (exp) {
              await promoteToVerified(exp.id, verdict);
            }
          } catch (err: any) {
            console.warn("[orchestrator] experience write failed:", err?.message);
          }
        }

        emit(runId, "run:completed", {
          message: `Verified in ${attemptNumber} attempt(s)`,
          data: {
            finalOutput: execution.stdout,
            provider: lastProvider,
            model: lastModel,
            totalAttempts: attemptNumber,
            verdict: verdict.summary,
          },
        });

        return {
          success: true,
          runId,
          task,
          attempts,
          finalOutput: execution.stdout,
          totalAttempts: attemptNumber,
          provider: lastProvider,
          model: lastModel,
        };
      }

      if (attemptNumber === budget.maxAttempts) {
        runsStore.update(runId, {
          status: "failed",
          attempts: attemptNumber,
          generatedCode: generation.data.code,
          error: classified
            ? `${classified.category}: ${classified.detail}`
            : verdict.summary || execution.error,
          provider: lastProvider,
          model: lastModel,
          execution: {
            success: false,
            stdout: execution.stdout,
            stderr: execution.stderr,
            exitCode: execution.exitCode,
            durationMs: execution.durationMs,
            timedOut: execution.timedOut,
          },
        });

        emit(runId, "run:failed", {
          message: classified
            ? `${classified.category}: ${classified.detail}`
            : verdict.summary || execution.error || "All attempts failed",
        });

        return {
          success: false,
          runId,
          task,
          attempts,
          finalError: classified
            ? `${classified.category}: ${classified.detail}`
            : verdict.summary || execution.error || execution.stderr || "All attempts failed",
          totalAttempts: attemptNumber,
          provider: lastProvider,
          model: lastModel,
        };
      }
    }
  } catch (err: any) {
    const message = err?.message || "Unexpected orchestrator error";
    emit(runId, "run:failed", { message });
    runsStore.update(runId, { status: "failed", error: message });
    return {
      success: false,
      runId,
      task,
      attempts,
      finalError: message,
      totalAttempts: attempts.length,
      provider: lastProvider,
      model: lastModel,
    };
  }

  // Should not reach here
  return {
    success: false,
    runId,
    task,
    attempts,
    finalError: "Exhausted attempts",
    totalAttempts: attempts.length,
    provider: lastProvider,
    model: lastModel,
  };
}
