import { randomUUID } from "crypto";
import { generateCode } from "./codeGenerator";
import { repairCode } from "./repairAgent";
import { executeLocally } from "../sandbox/localExecutor";
import { Attempt, OrchestratorResult } from "../types/attempt";
import { runsStore } from "../store/runsStore";
import { Run } from "../types/run";

const MAX_ATTEMPTS = 3;

/**
 * Core autonomous loop:
 * generate → execute → (if failed) repair → execute → ... up to MAX_ATTEMPTS
 */
export async function runAgent(task: string): Promise<OrchestratorResult> {
  const runId = randomUUID();
  const now = new Date().toISOString();

  // Create the run record
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
      generation = await repairCode(task, previous.generatedCode, previous.execution);
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
    const execution = await executeLocally({
      code: generation.data.code,
      filename: generation.data.filename || "main.py",
      timeoutMs: 15_000,
    });

    const attempt: Attempt = {
      attemptNumber,
      generatedCode: generation.data,
      execution,
      errorSummary: execution.success
        ? undefined
        : execution.error || execution.stderr || "Execution failed",
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

    // ---------- Last attempt failed ----------
    if (attemptNumber === MAX_ATTEMPTS) {
      runsStore.update(runId, {
        status: "failed",
        attempts: attemptNumber,
        generatedCode: generation.data.code,
        error: execution.error || execution.stderr,
        execution: {
          success: false,
          stdout: execution.stdout,
          stderr: execution.stderr,
          exitCode: execution.exitCode,
          durationMs: execution.durationMs,
          timedOut: execution.timedOut,
        },
      });

      return {
        success: false,
        runId,
        task,
        attempts,
        finalError: execution.error || execution.stderr || "All attempts failed",
        totalAttempts: attemptNumber,
        provider: lastProvider,
        model: lastModel,
      };
    }

    // Otherwise continue to next repair attempt
  }

  // Should never reach here
  return {
    success: false,
    runId,
    task,
    attempts,
    finalError: "Unexpected orchestrator exit",
    totalAttempts: attempts.length,
  };
}
