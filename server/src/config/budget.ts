/**
 * RunBudget – replaces hard-coded MAX_ATTEMPTS and 15s timeout.
 * Phase 0 of CodeForge Evolution.
 */

export interface RunBudget {
  maxAttempts: number;
  wallTimeMs: number;
  executionTimeoutMs: number;
  maxTokens?: number;
  costCapUsd?: number;
}

export const DEFAULT_BUDGET: RunBudget = {
  maxAttempts: Number(process.env.MAX_ATTEMPTS) || 3,
  wallTimeMs: Number(process.env.WALL_TIME_MS) || 120_000,
  executionTimeoutMs: Number(process.env.EXECUTION_TIMEOUT_MS) || 15_000,
  maxTokens: process.env.MAX_TOKENS ? Number(process.env.MAX_TOKENS) : undefined,
  costCapUsd: process.env.COST_CAP_USD ? Number(process.env.COST_CAP_USD) : undefined,
};

export function createBudget(overrides: Partial<RunBudget> = {}): RunBudget {
  return { ...DEFAULT_BUDGET, ...overrides };
}
