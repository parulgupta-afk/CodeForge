/**
 * Write-through cache over PostgreSQL.
 * Phase 0: history survives restart when DATABASE_URL is set.
 */

import { Run } from "../types/run";
import { Attempt } from "../types/attempt";
import {
  saveRun,
  saveAttempt,
  getRunFromDb,
  listRunsFromDb,
} from "../database/runsRepository";

const runs = new Map<string, Run>();

export const runsStore = {
  create(run: Run): Run {
    runs.set(run.id, run);
    // Fire-and-forget persistence
    void saveRun({
      id: run.id,
      task: run.task,
      status: run.status,
      finalOutput: run.finalOutput,
      error: run.error,
      totalAttempts: run.attempts,
      provider: (run as any).provider,
      model: (run as any).model,
    }).catch((err) => console.warn("[runsStore] saveRun failed:", err?.message));
    return run;
  },

  get(id: string): Run | undefined {
    return runs.get(id);
  },

  async getAsync(id: string): Promise<Run | undefined> {
    const mem = runs.get(id);
    if (mem) return mem;
    const fromDb = await getRunFromDb(id);
    if (!fromDb) return undefined;
    // Map DB row shape back to Run (best-effort)
    const mapped: Run = {
      id: fromDb.id,
      task: fromDb.task,
      status: fromDb.status,
      createdAt: fromDb.created_at,
      updatedAt: fromDb.updated_at,
      finalOutput: fromDb.final_output,
      attempts: fromDb.total_attempts ?? 0,
      error: fromDb.error,
      generatedCode: undefined,
    };
    runs.set(id, mapped);
    return mapped;
  },

  getAll(): Run[] {
    return Array.from(runs.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async listAsync(limit = 50): Promise<any[]> {
    const fromDb = await listRunsFromDb(limit);
    if (fromDb.length > 0) return fromDb;
    return this.getAll().slice(0, limit);
  },

  update(id: string, updates: Partial<Run> & { provider?: string; model?: string }): Run | undefined {
    const existing = runs.get(id);
    if (!existing) return undefined;

    const updated: Run = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    runs.set(id, updated);

    void saveRun({
      id: updated.id,
      task: updated.task,
      status: updated.status,
      finalOutput: updated.finalOutput,
      error: updated.error,
      totalAttempts: updated.attempts,
      provider: updates.provider ?? (existing as any).provider,
      model: updates.model ?? (existing as any).model,
    }).catch((err) => console.warn("[runsStore] saveRun update failed:", err?.message));

    return updated;
  },

  /** Persist a single attempt row */
  saveAttempt(runId: string, attempt: Attempt): void {
    void saveAttempt(runId, attempt).catch((err) =>
      console.warn("[runsStore] saveAttempt failed:", err?.message)
    );
  },
};
