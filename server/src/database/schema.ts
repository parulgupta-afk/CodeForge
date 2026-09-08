import { query, isDbReady } from "./db";

/**
 * Creates the required tables if they do not already exist.
 * Safe to call on every server start.
 */
export async function ensureSchema(): Promise<void> {
  const ready = await isDbReady();
  if (!ready) {
    console.warn("Skipping schema creation – database not available");
    return;
  }

  await query(`
    CREATE TABLE IF NOT EXISTS runs (
      id            UUID PRIMARY KEY,
      task          TEXT NOT NULL,
      status        TEXT NOT NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      final_output  TEXT,
      error         TEXT,
      total_attempts INTEGER DEFAULT 0,
      provider      TEXT,
      model         TEXT
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS attempts (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      run_id          UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
      attempt_number  INTEGER NOT NULL,
      generated_code  TEXT,
      explanation     TEXT,
      success         BOOLEAN NOT NULL,
      stdout          TEXT,
      stderr          TEXT,
      exit_code       INTEGER,
      duration_ms     INTEGER,
      timed_out       BOOLEAN DEFAULT FALSE,
      error_category  TEXT,
      error_detail    TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_attempts_run_id ON attempts(run_id);
  `);

  console.log("✅ Database schema ready");
}
