import { query, isDbReady } from "./db";
import { Run } from "../types/run";
import { Attempt } from "../types/attempt";

export async function saveRun(run: {
  id: string;
  task: string;
  status: string;
  finalOutput?: string;
  error?: string;
  totalAttempts: number;
  provider?: string;
  model?: string;
}): Promise<void> {
  if (!(await isDbReady())) return;

  await query(
    `INSERT INTO runs (id, task, status, final_output, error, total_attempts, provider, model)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (id) DO UPDATE SET
       status = EXCLUDED.status,
       final_output = EXCLUDED.final_output,
       error = EXCLUDED.error,
       total_attempts = EXCLUDED.total_attempts,
       provider = EXCLUDED.provider,
       model = EXCLUDED.model,
       updated_at = NOW()`,
    [
      run.id,
      run.task,
      run.status,
      run.finalOutput || null,
      run.error || null,
      run.totalAttempts,
      run.provider || null,
      run.model || null,
    ]
  );
}

export async function saveAttempt(runId: string, attempt: Attempt): Promise<void> {
  if (!(await isDbReady())) return;

  const category = attempt.errorSummary?.split(":")[0]?.trim() || null;
  const detail = attempt.errorSummary?.includes(":")
    ? attempt.errorSummary.split(":").slice(1).join(":").trim()
    : attempt.errorSummary || null;

  await query(
    `INSERT INTO attempts (
      run_id, attempt_number, generated_code, explanation,
      success, stdout, stderr, exit_code, duration_ms, timed_out,
      error_category, error_detail
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [
      runId,
      attempt.attemptNumber,
      attempt.generatedCode.code,
      attempt.generatedCode.explanation,
      attempt.execution.success,
      attempt.execution.stdout,
      attempt.execution.stderr,
      attempt.execution.exitCode,
      attempt.execution.durationMs,
      attempt.execution.timedOut,
      category,
      detail,
    ]
  );
}

export async function getRunFromDb(id: string): Promise<any | null> {
  if (!(await isDbReady())) return null;

  const runRes = await query(`SELECT * FROM runs WHERE id = $1`, [id]);
  if (runRes.rows.length === 0) return null;

  const attemptsRes = await query(
    `SELECT * FROM attempts WHERE run_id = $1 ORDER BY attempt_number ASC`,
    [id]
  );

  return {
    ...runRes.rows[0],
    attempts: attemptsRes.rows,
  };
}

export async function listRunsFromDb(limit = 50): Promise<any[]> {
  if (!(await isDbReady())) return [];

  const res = await query(
    `SELECT id, task, status, created_at, total_attempts, provider, model
     FROM runs
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );
  return res.rows;
}
