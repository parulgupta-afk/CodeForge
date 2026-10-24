/**
 * Experience memory store – candidate → verified → invalidated lifecycle.
 * Phase 2 of CodeForge Evolution.
 *
 * Only evaluator-verified runs write verified experiences.
 * MEMORY_MODE=off|raw|verified|random maps to experiment conditions A–D.
 */

import { query, isDbReady } from "../database/db";
import { randomUUID } from "crypto";

export type ExperienceStatus = "candidate" | "verified" | "rejected" | "invalidated";
export type ExperienceType = "strategy" | "anti-pattern";

export interface Experience {
  id: string;
  taskCategory?: string;
  failureCategory?: string;
  language: string;
  framework?: string;
  hypothesis?: string;
  strategy: string;
  evidence?: string;
  verificationJson?: string;
  type: ExperienceType;
  status: ExperienceStatus;
  provenanceRunId?: string;
  model?: string;
  promptVersion?: string;
  successCount: number;
  failureCount: number;
  embeddingModel?: string;
  createdAt: string;
  expiresAt?: string;
  invalidationReason?: string;
}

export type MemoryMode = "off" | "raw" | "verified" | "random";

export function getMemoryMode(): MemoryMode {
  const m = (process.env.MEMORY_MODE || "off").toLowerCase();
  if (m === "raw" || m === "verified" || m === "random") return m;
  return "off";
}

export async function ensureExperienceSchema(): Promise<void> {
  if (!(await isDbReady())) return;

  await query(`
    CREATE TABLE IF NOT EXISTS experiences (
      id                UUID PRIMARY KEY,
      task_category     TEXT,
      failure_category  TEXT,
      language          TEXT NOT NULL DEFAULT 'python',
      framework         TEXT,
      hypothesis        TEXT,
      strategy          TEXT NOT NULL,
      evidence          TEXT,
      verification_json JSONB,
      type              TEXT NOT NULL DEFAULT 'strategy',
      status            TEXT NOT NULL DEFAULT 'candidate',
      provenance_run_id UUID,
      model             TEXT,
      prompt_version    TEXT,
      success_count     INTEGER DEFAULT 0,
      failure_count     INTEGER DEFAULT 0,
      embedding_model   TEXT,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at        TIMESTAMPTZ,
      invalidation_reason TEXT
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS experience_uses (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      experience_id   UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
      run_id          UUID NOT NULL,
      rank            INTEGER,
      similarity      REAL,
      plan_cited      BOOLEAN DEFAULT FALSE,
      outcome         TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_experiences_status ON experiences(status);
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_experiences_failure ON experiences(failure_category);
  `);
}

export async function createCandidateExperience(input: {
  taskCategory?: string;
  failureCategory?: string;
  language?: string;
  strategy: string;
  hypothesis?: string;
  evidence?: string;
  type?: ExperienceType;
  provenanceRunId?: string;
  model?: string;
  verificationJson?: object;
}): Promise<Experience | null> {
  if (!(await isDbReady())) return null;

  const id = randomUUID();
  const now = new Date().toISOString();
  await query(
    `INSERT INTO experiences (
      id, task_category, failure_category, language, hypothesis, strategy,
      evidence, verification_json, type, status, provenance_run_id, model, created_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'candidate',$10,$11,$12)`,
    [
      id,
      input.taskCategory || null,
      input.failureCategory || null,
      input.language || "python",
      input.hypothesis || null,
      input.strategy,
      input.evidence || null,
      input.verificationJson ? JSON.stringify(input.verificationJson) : null,
      input.type || "strategy",
      input.provenanceRunId || null,
      input.model || null,
      now,
    ]
  );

  return {
    id,
    taskCategory: input.taskCategory,
    failureCategory: input.failureCategory,
    language: input.language || "python",
    hypothesis: input.hypothesis,
    strategy: input.strategy,
    evidence: input.evidence,
    type: input.type || "strategy",
    status: "candidate",
    provenanceRunId: input.provenanceRunId,
    model: input.model,
    successCount: 0,
    failureCount: 0,
    createdAt: now,
  };
}

/**
 * Promote candidate → verified only when evaluator said verified.
 * A model claiming "it worked" never promotes anything.
 */
export async function promoteToVerified(
  id: string,
  verificationJson: object
): Promise<boolean> {
  if (!(await isDbReady())) return false;
  const res = await query(
    `UPDATE experiences SET status = 'verified', verification_json = $2
     WHERE id = $1 AND status = 'candidate'`,
    [id, JSON.stringify(verificationJson)]
  );
  return (res.rowCount ?? 0) > 0;
}

export async function invalidateExperience(
  id: string,
  reason: string
): Promise<void> {
  if (!(await isDbReady())) return;
  await query(
    `UPDATE experiences SET status = 'invalidated', invalidation_reason = $2
     WHERE id = $1`,
    [id, reason]
  );
}

export async function recordExperienceUse(input: {
  experienceId: string;
  runId: string;
  rank: number;
  similarity?: number;
  planCited?: boolean;
  outcome?: string;
}): Promise<void> {
  if (!(await isDbReady())) return;
  await query(
    `INSERT INTO experience_uses (experience_id, run_id, rank, similarity, plan_cited, outcome)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [
      input.experienceId,
      input.runId,
      input.rank,
      input.similarity ?? null,
      input.planCited ?? false,
      input.outcome || null,
    ]
  );
}

/**
 * Retrieve experiences according to MEMORY_MODE.
 * verified: only status=verified, ranked by failure-category match then recency
 * random: verified but shuffled (control condition D)
 * raw: any successful-looking strategy text (no gate) – condition B
 * off: empty
 */
export async function retrieveExperiences(opts: {
  failureCategory?: string;
  language?: string;
  limit?: number;
}): Promise<Experience[]> {
  const mode = getMemoryMode();
  if (mode === "off") return [];
  if (!(await isDbReady())) return [];

  const limit = opts.limit ?? 3;

  if (mode === "random") {
    const res = await query(
      `SELECT * FROM experiences WHERE status = 'verified'
       ORDER BY RANDOM() LIMIT $1`,
      [limit]
    );
    return res.rows.map(rowToExperience);
  }

  if (mode === "raw") {
    const res = await query(
      `SELECT * FROM experiences WHERE status IN ('verified','candidate')
       ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    return res.rows.map(rowToExperience);
  }

  // verified mode – prefer matching failure category
  if (opts.failureCategory) {
    const res = await query(
      `SELECT * FROM experiences
       WHERE status = 'verified'
         AND (failure_category = $1 OR failure_category IS NULL)
         AND (expires_at IS NULL OR expires_at > NOW())
       ORDER BY
         CASE WHEN failure_category = $1 THEN 0 ELSE 1 END,
         success_count DESC,
         created_at DESC
       LIMIT $2`,
      [opts.failureCategory, limit]
    );
    return res.rows.map(rowToExperience);
  }

  const res = await query(
    `SELECT * FROM experiences
     WHERE status = 'verified'
       AND (expires_at IS NULL OR expires_at > NOW())
     ORDER BY success_count DESC, created_at DESC
     LIMIT $1`,
    [limit]
  );
  return res.rows.map(rowToExperience);
}

function rowToExperience(row: any): Experience {
  return {
    id: row.id,
    taskCategory: row.task_category,
    failureCategory: row.failure_category,
    language: row.language || "python",
    framework: row.framework,
    hypothesis: row.hypothesis,
    strategy: row.strategy,
    evidence: row.evidence,
    verificationJson: row.verification_json
      ? JSON.stringify(row.verification_json)
      : undefined,
    type: row.type || "strategy",
    status: row.status,
    provenanceRunId: row.provenance_run_id,
    model: row.model,
    promptVersion: row.prompt_version,
    successCount: row.success_count ?? 0,
    failureCount: row.failure_count ?? 0,
    embeddingModel: row.embedding_model,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    invalidationReason: row.invalidation_reason,
  };
}

export function formatExperiencesForPrompt(exps: Experience[]): string {
  if (exps.length === 0) return "";
  const lines = exps.map((e, i) => {
    return `[Experience ${i + 1}] (id=${e.id}, failure=${e.failureCategory || "n/a"}, type=${e.type})
Strategy: ${e.strategy}
${e.hypothesis ? `Hypothesis: ${e.hypothesis}` : ""}
${e.evidence ? `Evidence: ${e.evidence}` : ""}
Treat as hypothesis to test, not an answer to copy.`;
  });
  return (
    "\n\n--- Verified past experiences (use only if relevant) ---\n" +
    lines.join("\n\n") +
    "\n--- End experiences ---\n"
  );
}
