import { Request, Response } from "express";
import {
  loadAllMissions,
  getMission,
  PlayMode,
} from "../missions/loader";
import { runMissionTests } from "../missions/runner";
import {
  scoreMission,
  applyProgress,
  getProgress,
  suggestNext,
  RootCauseGuess,
} from "../missions/scoring";
import { runRepoAgent } from "../agents/repoAgent";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

function profileId(req: Request): string {
  const h = req.header("x-profile-id");
  if (h && h.trim()) return h.trim().slice(0, 64);
  return "anonymous";
}

export const listMissions = (_req: Request, res: Response) => {
  const missions = loadAllMissions().map((m) => ({
    id: m.id,
    title: m.title,
    story: m.story.slice(0, 280),
    modeDefault: m.modeDefault,
    skillTags: m.skillTags,
    language: m.language,
  }));
  res.json({ count: missions.length, missions });
};

export const getMissionById = (req: Request, res: Response) => {
  const m = getMission(req.params.id);
  if (!m) return res.status(404).json({ error: "mission not found" });
  // Do not leak hidden tests or exact defect lines in the public payload
  res.json({
    id: m.id,
    title: m.title,
    story: m.story,
    modeDefault: m.modeDefault,
    skillTags: m.skillTags,
    language: m.language,
    starter: m.starter,
    hints: m.hints,
    // defect file name only (lines stay server-side for scoring)
    defectFile: m.defect.file,
  });
};

export const submitMission = async (req: Request, res: Response) => {
  try {
    const m = getMission(req.params.id);
    if (!m) return res.status(404).json({ error: "mission not found" });

    const {
      files,
      rootCause,
      mode,
    }: {
      files?: Record<string, string>;
      rootCause?: RootCauseGuess;
      mode?: PlayMode;
    } = req.body || {};

    const playMode: PlayMode = mode || m.modeDefault;
    let usedFiles = { ...(files || {}) };

    // Agent Arena / AI Partner: optionally let the repo agent attempt a fix first
    if (playMode === "agent_arena" && Object.keys(usedFiles).length === 0) {
      // Seed a temp workspace from starter and ask repo agent
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "mission-seed-"));
      for (const [name, code] of Object.entries(m.starter)) {
        fs.writeFileSync(path.join(tmp, name), code);
      }
      try {
        const agentResult = await runRepoAgent(
          `Mission: ${m.title}\n${m.story}\nFix the code so tests pass.`,
          { seedDir: tmp, maxToolCalls: 12, allowedWritePaths: ["."] }
        );
        // Agent may not return files; scoring still runs on starter if no patch
        void agentResult;
      } finally {
        try {
          fs.rmSync(tmp, { recursive: true, force: true });
        } catch {
          /* ignore */
        }
      }
    }

    const testResult = await runMissionTests(m, usedFiles);
    const score = scoreMission({
      mission: m,
      rootCause,
      visiblePassed: testResult.visiblePassed,
      hiddenPassed: testResult.hiddenPassed,
    });

    const pid = profileId(req);
    const progress = applyProgress(pid, m.id, score);
    const next = suggestNext(pid, loadAllMissions());

    return res.json({
      missionId: m.id,
      mode: playMode,
      visiblePassed: testResult.visiblePassed,
      hiddenPassed: testResult.hiddenPassed,
      // Reveal hidden failure detail only after attempt (Arena "find the flaw" moment)
      hiddenDetail: testResult.hiddenPassed
        ? "All hidden tests passed"
        : (testResult.hiddenStderr || testResult.hiddenStdout || "hidden failed").slice(0, 500),
      verdictSummary: testResult.verdictSummary,
      score,
      progress,
      suggestedNext: next,
    });
  } catch (err: any) {
    console.error("submitMission:", err);
    return res.status(500).json({ error: err?.message || "Internal error" });
  }
};

export const getMyProgress = (req: Request, res: Response) => {
  const pid = profileId(req);
  res.json({ profileId: pid, progress: getProgress(pid) });
};
