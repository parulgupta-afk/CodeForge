import { Router } from "express";
import { createRun, getRun, listRuns } from "../controllers/runsController";

const router = Router();

router.post("/", createRun);
router.get("/", listRuns);
router.get("/:id", getRun);

export default router;
