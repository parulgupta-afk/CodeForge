import { Request, Response } from "express";
import { randomUUID } from "crypto";
import { runsStore } from "../store/runsStore";
import { CreateRunRequest, Run } from "../types/run";

export const createRun = (req: Request, res: Response) => {
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

    return res.status(201).json({
      runId: run.id,
      status: run.status,
      task: run.task,
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
