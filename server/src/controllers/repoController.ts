/**
 * Repository agent API – Phase 4
 * POST /api/repo/runs  { task, seedDir? }
 */

import { Request, Response } from "express";
import * as path from "path";
import { runRepoAgent } from "../agents/repoAgent";

export const createRepoRun = async (req: Request, res: Response) => {
  try {
    const { task, seedDir, expectedOutput } = req.body || {};
    if (!task || typeof task !== "string" || !task.trim()) {
      return res.status(400).json({ error: "task is required" });
    }

    let resolvedSeed: string | undefined;
    if (typeof seedDir === "string" && seedDir.trim()) {
      // Only allow seeds under repo fixtures/ for safety
      const root = path.resolve(__dirname, "../../../");
      const candidate = path.resolve(root, seedDir.trim());
      if (!candidate.startsWith(root + path.sep) && candidate !== root) {
        return res.status(400).json({ error: "seedDir must be inside the project" });
      }
      resolvedSeed = candidate;
    } else {
      // Default sample bug fixture
      resolvedSeed = path.resolve(
        __dirname,
        "../../../fixtures/sample-python-bug"
      );
    }

    const result = await runRepoAgent(task.trim(), {
      seedDir: resolvedSeed,
      expectedOutput:
        typeof expectedOutput === "string" ? expectedOutput : undefined,
      allowedWritePaths: ["."],
      requireApproval: false,
      maxToolCalls: 15,
    });

    return res.status(result.success ? 201 : 200).json(result);
  } catch (err: any) {
    console.error("createRepoRun error:", err);
    return res.status(500).json({ error: err?.message || "Internal server error" });
  }
};
