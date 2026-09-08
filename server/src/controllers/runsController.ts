import { Request, Response } from "express";
import { randomUUID } from "crypto";
import { runsStore } from "../store/runsStore";
import { CreateRunRequest, Run } from "../types/run";
import { generateCode } from "../agents/codeGenerator";
import { executeLocally } from "../sandbox/localExecutor";

export const createRun = async (req: Request, res: Response) => {
  try {
    const body = req.body as CreateRunRequest;

    if (!body.task || typeof body.task !== "string" || body.task.trim().length === 0) {
      return res.status(400).json({
        error: "task is required and must be a non-empty string",
      });
    }

    const now = new Date().toISOString();
    const run: Run = {
      id: randomUUID(),
      task: body.task.trim(),
      status: "queued",
      createdAt: now,
      updatedAt: now,
      attempts: 0,
    };

    runsStore.create(run);

    // ---------- Step 1: Generate code ----------
    const generation = await generateCode(run.task);

    if (!generation.success || !generation.data) {
      runsStore.update(run.id, {
        status: "failed",
        error: generation.error || "Code generation failed",
        attempts: 1,
      });

      return res.status(500).json({
        runId: run.id,
        status: "failed",
        stage: "generation",
        error: generation.error,
        rawResponse: generation.rawResponse,
      });
    }

    // ---------- Step 2: Execute the generated code ----------
    const execution = await executeLocally({
      code: generation.data.code,
      filename: generation.data.filename || "main.py",
      timeoutMs: 15_000,
    });

    const finalStatus = execution.success ? "success" : "failed";

    runsStore.update(run.id, {
      status: finalStatus,
      attempts: 1,
      generatedCode: generation.data.code,
      finalOutput: execution.success ? execution.stdout : undefined,
      error: execution.success ? undefined : execution.error || execution.stderr,
      execution: {
        success: execution.success,
        stdout: execution.stdout,
        stderr: execution.stderr,
        exitCode: execution.exitCode,
        durationMs: execution.durationMs,
        timedOut: execution.timedOut,
      },
    });

    return res.status(201).json({
      runId: run.id,
      status: finalStatus,
      task: run.task,
      provider: (generation as any).provider,
      model: (generation as any).model,
      generatedCode: generation.data,
      execution: {
        success: execution.success,
        stdout: execution.stdout,
        stderr: execution.stderr,
        exitCode: execution.exitCode,
        durationMs: execution.durationMs,
        timedOut: execution.timedOut,
        error: execution.error,
      },
      createdAt: run.createdAt,
    });
  } catch (err) {
    console.error("createRun error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getRun = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const run = runsStore.get(id);

    if (!run) {
      return res.status(404).json({ error: "Run not found" });
    }

    return res.json(run);
  } catch (err) {
    console.error("getRun error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const listRuns = (_req: Request, res: Response) => {
  try {
    const allRuns = runsStore.getAll();
    return res.json({
      count: allRuns.length,
      runs: allRuns,
    });
  } catch (err) {
    console.error("listRuns error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
