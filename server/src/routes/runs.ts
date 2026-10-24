import { Router } from "express";
import { createRun, getRun, listRuns } from "../controllers/runsController";
import { getRunEvidence } from "../controllers/evidenceController";
import { requireApiToken, enforceRunQuota } from "../auth/tokens";

const router = Router();

router.post("/", requireApiToken, enforceRunQuota, createRun);
router.get("/", listRuns);
router.get("/:id/evidence", getRunEvidence);
router.get("/:id", getRun);

export default router;
