import { randomUUID } from "crypto";
import { generateCode } from "./codeGenerator";
import { repairCode } from "./repairAgent";
import { executeCode } from "../sandbox";
import { classifyError } from "../classifier/errorClassifier";
import { Attempt, OrchestratorResult } from "../types/attempt";
import { runsStore } from "../store/runsStore";
import { Run } from "../types/run";
import { emitAgentEvent } from "../websocket/io";

const MAX_ATTEMPTS = 3;

function emit(runId: string, type: any, extra: any = {}) {
  emitAgentEvent({
    type,
    runId,
    timestamp: new Date().toISOString(),
    ...extra,
  });
}

export async function runAgent(task: string): Promise<OrchestratorResult> {
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

  for (let attemptNumber = 1; attemptNumber <= MAX_ATTEMPTS; attemptNumber++) {
    emit(runId, "attempt:started", {
      attemptNumber,
      message: `Starting attempt ${attemptNumber}`,
    });

    let generation;

    if (attemptNumber === 1) {
      generation = await generateCode(task);
    } else {
      const previous = attempts[attempts.length - 1];
      const classified = classifyError(previous.execution);
      emit(runId, "error:classified", {
        attemptNumber: previous.attemptNumber,
        message: `${classified.category}: ${classified.detail}`,
        data: classified,
      });
      emit(runId, "repair:started", {
        attemptNumber,
        message: "Repairing code…",
      });
      generation = await repairCode(task, previous.generatedCode, classified);
    }

    lastProvider = (generation as any).provider;
    lastModel = (generation as any).model;

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
      },
    });

    emit(runId, "execution:started", {
      attemptNumber,
      message: "Executing in sandbox…",
    });

    const execution = await executeCode({
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

    const classified = execution.success ? undefined : classifyError(execution);

    // Do not burn remaining attempts on non-retryable failures
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
        data: { finalOutput: execution.stdout },
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

  return {
    success: false,
    runId,
    task,
    attempts,
    finalError: "Unexpected orchestrator exit",
    totalAttempts: attempts.length,
  };
}
