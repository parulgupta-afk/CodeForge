/**
 * Transparent skill scoring – Phase 5.
 * No model judge: root-cause score uses known defect lines from the mission.
 */

import { Mission } from "./loader";

export interface RootCauseGuess {
  file: string;
  lines: number[];
}

export interface ScoreInput {
  mission: Mission;
  /** User or agent identified the defect location */
  rootCause?: RootCauseGuess;
  /** Visible tests passed after the fix */
  visiblePassed: boolean;
  /** Hidden tests passed */
  hiddenPassed: boolean;
  /** Optional: regression test written by player that failed on original + passed on fix */
  regressionOk?: boolean;
}

export interface SkillScore {
  skill: string;
  points: number;
  max: number;
  reason: string;
}

export interface MissionScore {
  total: number;
  max: number;
  skills: SkillScore[];
  xp: number;
}

function lineOverlap(a: number[], b: number[]): number {
  const setB = new Set(b);
  return a.filter((x) => setB.has(x)).length;
}

export function scoreMission(input: ScoreInput): MissionScore {
  const skills: SkillScore[] = [];
  const tags = input.mission.skillTags.length
    ? input.mission.skillTags
    : ["debugging"];

  // Root cause identification (40 pts)
  let rootPts = 0;
  let rootReason = "No root-cause selection";
  if (input.rootCause) {
    const fileMatch =
      input.rootCause.file === input.mission.defect.file ||
      input.rootCause.file.endsWith("/" + input.mission.defect.file) ||
      input.mission.defect.file.endsWith(input.rootCause.file);
    const overlap = lineOverlap(
      input.rootCause.lines || [],
      input.mission.defect.lines || []
    );
    if (fileMatch && overlap > 0) {
      rootPts = 40;
      rootReason = `Matched defect file and ${overlap} line(s)`;
    } else if (fileMatch) {
      rootPts = 20;
      rootReason = "Matched defect file, lines off";
    } else {
      rootPts = 0;
      rootReason = "Wrong file";
    }
  }
  skills.push({
    skill: tags[0] || "debugging",
    points: rootPts,
    max: 40,
    reason: rootReason,
  });

  // Visible tests (25)
  skills.push({
    skill: "correctness",
    points: input.visiblePassed ? 25 : 0,
    max: 25,
    reason: input.visiblePassed ? "Visible tests passed" : "Visible tests failed",
  });

  // Hidden tests (25) – only verifier for full clear
  skills.push({
    skill: "edge-cases",
    points: input.hiddenPassed ? 25 : 0,
    max: 25,
    reason: input.hiddenPassed ? "Hidden tests passed" : "Hidden tests failed",
  });

  // Optional regression bonus (10)
  skills.push({
    skill: "regression",
    points: input.regressionOk ? 10 : 0,
    max: 10,
    reason: input.regressionOk
      ? "Fail-before / pass-after regression credited"
      : "No verified regression test",
  });

  const total = skills.reduce((s, x) => s + x.points, 0);
  const max = skills.reduce((s, x) => s + x.max, 0);
  // XP = total (transparent, no speed bonus)
  return { total, max, skills, xp: total };
}

/** In-memory progress keyed by anonymous profile id */
const progress = new Map<
  string,
  { xp: number; missionsCleared: string[]; skillXp: Record<string, number> }
>();

export function getProgress(profileId: string) {
  return (
    progress.get(profileId) || {
      xp: 0,
      missionsCleared: [],
      skillXp: {},
    }
  );
}

export function applyProgress(
  profileId: string,
  missionId: string,
  score: MissionScore
) {
  const cur = getProgress(profileId);
  if (!cur.missionsCleared.includes(missionId) && score.total >= 50) {
    cur.missionsCleared.push(missionId);
  }
  cur.xp += score.xp;
  for (const s of score.skills) {
    cur.skillXp[s.skill] = (cur.skillXp[s.skill] || 0) + s.points;
  }
  progress.set(profileId, cur);
  return cur;
}

/** Next mission targets weakest skill tag among remaining missions */
export function suggestNext(
  profileId: string,
  all: { id: string; skillTags: string[] }[]
): string | null {
  const cur = getProgress(profileId);
  const remaining = all.filter((m) => !cur.missionsCleared.includes(m.id));
  if (remaining.length === 0) return null;
  const weakest = Object.entries(cur.skillXp).sort((a, b) => a[1] - b[1])[0]?.[0];
  if (weakest) {
    const match = remaining.find((m) => m.skillTags.includes(weakest));
    if (match) return match.id;
  }
  return remaining[0].id;
}
