import { Request, Response } from "express";
import { runsStore } from "../store/runsStore";
import { CreateRunRequest } from "../types/run";
import { runAgent } from "../agents/orchestrator";

export const createRun = async (req: Request, res: Response) => {
  try {
    const body = req.body as CreateRunRequest;

    if (!body.task || typeof body.task !== "string" || body.task.trim().length === 0) {
      return res.status(400).json({
        error: "task is required and must be a non-empty string",
      });
    }

    // Hand off to the autonomous agent
    const result = await runAgent(body.task.trim());

    const statusCode = result.success ? 201 : 500;

    return res.status(statusCode).json({
      runId: result.runId,
      status: result.success ? "success" : "failed",
      task: result.task,
      totalAttempts: result.totalAttempts,
      provider: result.provider,
      model: result.model,
      finalOutput: result.finalOutput,
      finalError: result.finalError,
      attempts: result.attempts.map((a) => ({
        attemptNumber: a.attemptNumber,
        code: a.generatedCode.code,
        explanation: a.generatedCode.explanation,
        success: a.execution.success,
        stdout: a.execution.stdout,
        stderr: a.execution.stderr,
        exitCode: a.execution.exitCode,
        durationMs: a.execution.durationMs,
        timedOut: a.execution.timedOut,
        errorSummary: a.errorSummary,
      })),
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
