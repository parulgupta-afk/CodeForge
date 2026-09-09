/**
 * CodeForge Benchmark Runner (Phase 11)
 *
 * Runs the fixed task suite against the live server API.
 * Usage (Windows CMD):
 *   1. Start server:  cd server && npm run dev
 *   2. Run bench:     cd benchmark && npx ts-node runner.ts
 *
 * Or with mock: set USE_MOCK_LLM=true in server .env for offline runs.
 */

import * as fs from "fs";
import * as path from "path";

const API = process.env.CODEFORGE_API || "http://localhost:3001";
const TASKS_DIR = path.join(__dirname, "tasks");
const RESULTS_FILE = path.join(__dirname, "results.json");
const DELAY_MS = Number(process.env.BENCH_DELAY_MS || 3500); // pause between tasks to avoid API rate limits

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

interface Task {
  id: string;
  category: string;
  title: string;
  task: string;
}

interface TaskResult {
  taskId: string;
  category: string;
  title: string;
  success: boolean;
  attempts: number;
  errorCategory?: string;
  durationMs: number;
  finalOutput?: string;
  finalError?: string;
}

async function loadTasks(): Promise<Task[]> {
  const files = fs.readdirSync(TASKS_DIR).filter((f) => f.endsWith(".json")).sort();
  return files.map((f) => JSON.parse(fs.readFileSync(path.join(TASKS_DIR, f), "utf8")));
}

async function runOne(task: Task): Promise<TaskResult> {
  const start = Date.now();
  try {
    const res = await fetch(`${API}/api/runs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task: task.task }),
    });
    const data: any = await res.json();
    const success = data.status === "success";
    const attempts = data.totalAttempts || data.attempts?.length || 1;
    let errorCategory: string | undefined;
    if (!success && data.finalError) {
      errorCategory = String(data.finalError).split(":")[0].trim();
    }
    return {
      taskId: task.id,
      category: task.category,
      title: task.title,
      success,
      attempts,
      errorCategory,
      durationMs: Date.now() - start,
      finalOutput: data.finalOutput,
      finalError: data.finalError,
    };
  } catch (err: any) {
    return {
      taskId: task.id,
      category: task.category,
      title: task.title,
      success: false,
      attempts: 0,
      errorCategory: "NetworkOrServer",
      durationMs: Date.now() - start,
      finalError: err.message,
    };
  }
}

function summarize(results: TaskResult[]) {
  const total = results.length;
  const successes = results.filter((r) => r.success);
  const firstAttempt = successes.filter((r) => r.attempts <= 1);
  const within3 = successes.filter((r) => r.attempts <= 3);
  const avgAttempts =
    successes.length > 0
      ? Math.round((successes.reduce((s, r) => s + r.attempts, 0) / successes.length) * 10) / 10
      : 0;

  const failureCategories: Record<string, number> = {};
  for (const r of results.filter((x) => !x.success)) {
    const cat = r.errorCategory || "Unknown";
    failureCategories[cat] = (failureCategories[cat] || 0) + 1;
  }

  return {
    total,
    successCount: successes.length,
    successRate: total ? Math.round((successes.length / total) * 100) : 0,
    firstAttemptSuccessRate: total ? Math.round((firstAttempt.length / total) * 100) : 0,
    withinThreeAttemptsRate: total ? Math.round((within3.length / total) * 100) : 0,
    averageAttempts: avgAttempts,
    failureCategories,
    results,
    generatedAt: new Date().toISOString(),
  };
}

async function main() {
  console.log("CodeForge Benchmark Runner");
  console.log(`API: ${API}`);
  console.log("Loading tasks...");
  const tasks = await loadTasks();
  console.log(`Found ${tasks.length} tasks\n`);

  const results: TaskResult[] = [];
  for (const task of tasks) {
    process.stdout.write(`[${task.id}] ${task.title} ... `);
    const r = await runOne(task);
    results.push(r);
    console.log(r.success ? `OK (${r.attempts} attempt(s), ${r.durationMs}ms)` : `FAIL (${r.errorCategory || r.finalError})`);
    if (DELAY_MS > 0) await sleep(DELAY_MS);
  }

  const summary = summarize(results);
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(summary, null, 2));

  console.log("\n========== SUMMARY ==========");
  console.log(`Total tasks:           ${summary.total}`);
  console.log(`Success rate:          ${summary.successRate}%`);
  console.log(`First-attempt success: ${summary.firstAttemptSuccessRate}%`);
  console.log(`Within 3 attempts:     ${summary.withinThreeAttemptsRate}%`);
  console.log(`Average attempts:      ${summary.averageAttempts}`);
  console.log("Failure categories:", summary.failureCategories);
  console.log(`\nResults written to ${RESULTS_FILE}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
