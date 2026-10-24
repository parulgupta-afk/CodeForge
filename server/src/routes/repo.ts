import { Router } from "express";
import { createRepoRun } from "../controllers/repoController";

const router = Router();
router.post("/runs", createRepoRun);

export default router;
