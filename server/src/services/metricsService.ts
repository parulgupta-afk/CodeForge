import { runsStore } from "../store/runsStore";

export interface MetricsSummary {
  totalRuns: number;
  successCount: number;
  successRate: number;
  firstAttemptSuccessRate: number;
  withinThreeAttemptsRate: number;
  averageAttempts: number;
  failureCategories: Record<string, number>;
  source: "memory" | "database";
}

export async function computeMetrics(): Promise<MetricsSummary> {
  const memoryRuns = runsStore.getAll();

  let totalRuns = memoryRuns.length;
  let successCount = 0;
  let firstAttemptSuccess = 0;
  let withinThree = 0;
  let attemptsSum = 0;
  const failureCategories: Record<string, number> = {};

  for (const run of memoryRuns) {
    const attempts = run.attempts || 1;
    attemptsSum += attempts;

    if (run.status === "success") {
      successCount++;
      withinThree++;
      if (attempts <= 1) firstAttemptSuccess++;
    } else if (run.error) {
      const cat = run.error.split(":")[0].trim() || "Unknown";
      failureCategories[cat] = (failureCategories[cat] || 0) + 1;
    }
  }

  // Optional: pull from PostgreSQL if memory is empty
  if (totalRuns === 0) {
    try {
      const { isDbReady } = await import("../database/db");
      if (await isDbReady()) {
        const { listRunsFromDb } = await import("../database/runsRepository");
        const dbRuns = await listRunsFromDb(500);
        totalRuns = dbRuns.length;
        for (const r of dbRuns) {
          const attempts = r.total_attempts || 1;
          attemptsSum += attempts;
          if (r.status === "success") {
            successCount++;
            withinThree++;
            if (attempts <= 1) firstAttemptSuccess++;
          }
        }
        return build(totalRuns, successCount, firstAttemptSuccess, withinThree, attemptsSum, failureCategories, "database");
      }
    } catch {
      // ignore
    }
  }

  return build(totalRuns, successCount, firstAttemptSuccess, withinThree, attemptsSum, failureCategories, "memory");
}

function build(
  totalRuns: number,
  successCount: number,
  firstAttemptSuccess: number,
  withinThree: number,
  attemptsSum: number,
  failureCategories: Record<string, number>,
  source: "memory" | "database"
): MetricsSummary {
  return {
    totalRuns,
    successCount,
    successRate: totalRuns ? Math.round((successCount / totalRuns) * 100) : 0,
    firstAttemptSuccessRate: totalRuns ? Math.round((firstAttemptSuccess / totalRuns) * 100) : 0,
    withinThreeAttemptsRate: totalRuns ? Math.round((withinThree / totalRuns) * 100) : 0,
    averageAttempts: successCount > 0 ? Math.round((attemptsSum / successCount) * 10) / 10 : 0,
    failureCategories,
    source,
  };
}
