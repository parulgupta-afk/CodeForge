import { Request, Response } from "express";
import { computeMetrics } from "../services/metricsService";

export const getMetrics = async (_req: Request, res: Response) => {
  try {
    const metrics = await computeMetrics();
    return res.json(metrics);
  } catch (err) {
    console.error("getMetrics error:", err);
    return res.status(500).json({ error: "Failed to compute metrics" });
  }
};
