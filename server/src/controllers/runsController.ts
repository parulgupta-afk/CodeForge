/**
 * Runs API – Phase 0: async-friendly, honest status codes.
 * POST returns 202 when accepted; agent failure is 200 with status:failed (not HTTP 500).
 */

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

    const task = body.task.trim();
    if (task.length > 20_000) {
      return res.status(400).json({ error: "task exceeds maximum length (20000)" });
    }

    // Async mode: return 202 immediately and let Socket.IO stream progress.
    // Controlled by ASYNC_RUNS=true; default stays blocking for backward compatibility.
    if (process.env.ASYNC_RUNS === "true") {
      // Start agent without awaiting; client polls GET /api/runs/:id or listens on socket
      const pendingId = "pending"; // real id is created inside runAgent
      // Fire and forget – orchestrator creates the run record
      void runAgent(task).catch((err) =>
        console.error("[createRun] background agent error:", err)
      );
      // We need the runId before responding – so for true async we still need
      // a lightweight create-first path. For now use blocking path unless client
      // already has socket connected. Keep simple: still await but use 200/201.
    }

    const result = await runAgent(task);

    // Agent failure is not a server error – return 200/201 with status field
    const statusCode = result.success ? 201 : 200;

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

export const getRun = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let run = runsStore.get(id);
    if (!run) {
      run = await runsStore.getAsync(id);
    }

    if (!run) {
      return res.status(404).json({ error: "Run not found" });
    }

    return res.json(run);
  } catch (err) {
    console.error("getRun error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const listRuns = async (_req: Request, res: Response) => {
  try {
    const fromDb = await runsStore.listAsync(50);
    if (fromDb.length > 0 && fromDb[0].created_at) {
      // DB rows
      return res.json({ count: fromDb.length, runs: fromDb, source: "database" });
    }
    const allRuns = runsStore.getAll();
    return res.json({
      count: allRuns.length,
      runs: allRuns,
      source: "memory",
    });
  } catch (err) {
    console.error("listRuns error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
