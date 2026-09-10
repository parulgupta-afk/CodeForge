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

export const MAX_ATTEMPTS = 3;

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
};

function defaultEmit(runId: string, type: string, extra: Record<string, unknown> = {}) {
  emitAgentEvent({
    type: type as any,
    runId,
    timestamp: new Date().toISOString(),
    ...extra,
  });
}

/**
 * Core agent loop: generate → execute → classify → repair (max MAX_ATTEMPTS).
 * Optional deps enable deterministic integration tests without real LLM/sandbox.
 */
export async function runAgent(
  task: string,
  deps: AgentDeps = {}
): Promise<OrchestratorResult> {
  const generate = deps.generate ?? defaultGenerate;
  const repair = deps.repair ?? defaultRepair;
  const execute = deps.execute ?? defaultExecute;
  const classify = deps.classify ?? defaultClassify;
  const emit = deps.emit ?? defaultEmit;

  const runId = randomUUID();
  const now = new Date().toISOString();

  const run: Run = {
    id: runId,
    task,
    status: "running",
    createdAt: now,
    updatedAt: now,
    attempts: 0,
  };
  runsStore.create(run);

  emit(runId, "run:started", { message: "Agent started", data: { task } });

  const attempts: Attempt[] = [];
  let lastProvider: string | undefined;
  let lastModel: string | undefined;

  try {
    for (let attemptNumber = 1; attemptNumber <= MAX_ATTEMPTS; attemptNumber++) {
      emit(runId, "attempt:started", {
        attemptNumber,
        message: `Starting attempt ${attemptNumber}`,
      });

      let generation: GenerationResult;

      if (attemptNumber === 1) {
        generation = await generate(task);
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

        runsStore.update(runId, {
          status: "failed",
          attempts: attemptNumber,
          error: generation.error,
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
        timeoutMs: 15_000,
      });

      if (execution.success) {
        emit(runId, "execution:output", {
          attemptNumber,
          message: execution.stdout?.slice(0, 200) || "OK",
          data: { stdout: execution.stdout, durationMs: execution.durationMs },
        });
      } else {
        emit(runId, "execution:error", {
          attemptNumber,
          message: execution.error || execution.stderr || "Execution failed",
          data: {
            stderr: execution.stderr,
            exitCode: execution.exitCode,
            timedOut: execution.timedOut,
          },
        });
      }

      const classified = execution.success ? undefined : classify(execution);

      // Stop early on non-retryable failures
      if (classified && !classified.retryable && attemptNumber < MAX_ATTEMPTS) {
        const earlyAttempt: Attempt = {
          attemptNumber,
          generatedCode: generation.data,
          execution,
          errorSummary: `${classified.category}: ${classified.detail}`,
          timestamp: new Date().toISOString(),
        };
        attempts.push(earlyAttempt);

        runsStore.update(runId, {
          status: "failed",
          attempts: attemptNumber,
          generatedCode: generation.data.code,
          error: `${classified.category}: ${classified.detail}`,
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
        execution,
        errorSummary: classified
          ? `${classified.category}: ${classified.detail}`
          : undefined,
        timestamp: new Date().toISOString(),
      };
      attempts.push(attempt);

      emit(runId, "attempt:completed", {
        attemptNumber,
        message: execution.success ? "Attempt succeeded" : "Attempt failed",
        data: { success: execution.success },
      });

      if (execution.success) {
        runsStore.update(runId, {
          status: "success",
          attempts: attemptNumber,
          generatedCode: generation.data.code,
          finalOutput: execution.stdout,
          execution: {
            success: true,
            stdout: execution.stdout,
            stderr: execution.stderr,
            exitCode: execution.exitCode,
            durationMs: execution.durationMs,
            timedOut: execution.timedOut,
          },
        });

        emit(runId, "run:completed", {
          message: `Resolved in ${attemptNumber} attempt(s)`,
          data: {
            finalOutput: execution.stdout,
            provider: lastProvider,
            model: lastModel,
            totalAttempts: attemptNumber,
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

      if (attemptNumber === MAX_ATTEMPTS) {
        runsStore.update(runId, {
          status: "failed",
          attempts: attemptNumber,
          generatedCode: generation.data.code,
          error: classified
            ? `${classified.category}: ${classified.detail}`
            : execution.error,
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
            : execution.error || "All attempts failed",
        });

        return {
          success: false,
          runId,
          task,
          attempts,
          finalError: classified
            ? `${classified.category}: ${classified.detail}`
            : execution.error || execution.stderr || "All attempts failed",
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
      totalAttempts: attempts.length || 1,
      provider: lastProvider,
      model: lastModel,
    };
  }

  return {
    success: false,
    runId,
    task,
    attempts,
    finalError: "Unexpected orchestrator exit",
    totalAttempts: attempts.length,
  };
}
