import { randomUUID } from "crypto";
import { generateCode } from "./codeGenerator";
import { repairCode } from "./repairAgent";
import { executeCode } from "../sandbox";
import { classifyError } from "../classifier/errorClassifier";
import { Attempt, OrchestratorResult } from "../types/attempt";
import { runsStore } from "../store/runsStore";
import { saveRun, saveAttempt } from "../database/runsRepository";
import { Run } from "../types/run";

const MAX_ATTEMPTS = 3;

/**
 * Core autonomous loop:
 * generate → execute → classify → repair → execute ... up to MAX_ATTEMPTS
 */
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

  const attempts: Attempt[] = [];
  let lastProvider: string | undefined;
  let lastModel: string | undefined;

  for (let attemptNumber = 1; attemptNumber <= MAX_ATTEMPTS; attemptNumber++) {
    // ---------- Generate or Repair ----------
    let generation;

    if (attemptNumber === 1) {
      generation = await generateCode(task);
    } else {
      const previous = attempts[attempts.length - 1];
      const classified = classifyError(previous.execution);
      generation = await repairCode(task, previous.generatedCode, classified);
    }

    lastProvider = (generation as any).provider;
    lastModel = (generation as any).model;

    if (!generation.success || !generation.data) {
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

    // ---------- Execute ----------
    const execution = await executeCode({
      code: generation.data.code,
      filename: generation.data.filename || "main.py",
      timeoutMs: 15_000,
    });

    const classified = execution.success ? undefined : classifyError(execution);

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

    // ---------- Success? ----------
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

      const successResult = {
        success: true,
        runId,
        task,
        attempts,
        finalOutput: execution.stdout,
        totalAttempts: attemptNumber,
        provider: lastProvider,
        model: lastModel,
      };
      await persistResult(successResult);
      return successResult;
    }

    // ---------- Last attempt failed ----------
    if (attemptNumber === MAX_ATTEMPTS) {
      runsStore.update(runId, {
        status: "failed",
        attempts: attemptNumber,
        generatedCode: generation.data.code,
        error: classified ? `${classified.category}: ${classified.detail}` : execution.error,
        execution: {
          success: false,
          stdout: execution.stdout,
          stderr: execution.stderr,
          exitCode: execution.exitCode,
          durationMs: execution.durationMs,
          timedOut: execution.timedOut,
        },
      });

      const failResult = {
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
      await persistResult(failResult);
      return failResult;
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


// ---------- Persistence helpers (Phase 7) ----------
async function persistResult(result: OrchestratorResult) {
  try {
    await saveRun({
      id: result.runId,
      task: result.task,
      status: result.success ? "success" : "failed",
      finalOutput: result.finalOutput,
      error: result.finalError,
      totalAttempts: result.totalAttempts,
      provider: result.provider,
      model: result.model,
    });

    for (const attempt of result.attempts) {
      await saveAttempt(result.runId, attempt);
    }
  } catch (err) {
    console.warn("Failed to persist run to database:", err);
  }
}
