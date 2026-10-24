import { Request, Response } from "express";
import { runsStore } from "../store/runsStore";
import { buildEvidenceHtml } from "../evaluation/evidenceBundle";
import { listAudit } from "../audit/auditLog";

export const getRunEvidence = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let run = runsStore.get(id);
    if (!run) run = await runsStore.getAsync(id);
    if (!run) return res.status(404).json({ error: "Run not found" });

    const html = buildEvidenceHtml({
      runId: run.id,
      task: run.task,
      status: run.status,
      finalOutput: run.finalOutput,
      finalError: run.error,
      totalAttempts: run.attempts,
      attempts: [],
    });

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(html);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "error" });
  }
};

export const getAuditLog = (_req: Request, res: Response) => {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_AUDIT_API !== "true") {
    return res.status(404).json({ error: "Not found" });
  }
  return res.json({ events: listAudit(100) });
};
