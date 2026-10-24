import { Router } from "express";
import {
  listMissions,
  getMissionById,
  submitMission,
  getMyProgress,
} from "../controllers/missionsController";

const router = Router();
router.get("/", listMissions);
router.get("/progress", getMyProgress);
router.get("/:id", getMissionById);
router.post("/:id/submit", submitMission);

export default router;
