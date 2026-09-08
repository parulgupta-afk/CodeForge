import { Run } from "../types/run";

// In-memory store (will be replaced by PostgreSQL in Phase 7)
const runs = new Map<string, Run>();

export const runsStore = {
  create(run: Run): Run {
    runs.set(run.id, run);
    return run;
  },

  get(id: string): Run | undefined {
    return runs.get(id);
  },

  getAll(): Run[] {
    return Array.from(runs.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  update(id: string, updates: Partial<Run>): Run | undefined {
    const existing = runs.get(id);
    if (!existing) return undefined;

    const updated: Run = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    runs.set(id, updated);
    return updated;
  },
};
