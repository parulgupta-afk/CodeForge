import fs from "fs";
import path from "path";

// Types
export interface BenchmarkTask {
  id: string;
  name: string;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
  task: string;
  expectedOutputs?: string[];
}

export interface TaskRunResult {
  id: string;
  name: string;
  category: string;
  difficulty: string;
  success: boolean;
  resolvedOnAttempt: number;
  totalAttempts: number;
  durationMs: number;
  stdout?: string;
  error?: string;
  assertionsPassed: boolean;
  failedAssertions: string[];
}

export interface BenchmarkReport {
  timestamp: string;
  serverUrl: string;
  totalTasks: number;
  passedTasks: number;
  failedTasks: number;
  passRate: number;
  passAt1Rate: number;
  passAt3Rate: number;
  repairCount: number;
  repairSuccessRate: number;
  averageAttempts: number;
  averageDurationMs: number;
  results: TaskRunResult[];
}

// Colors for terminal output
const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  magenta: "\x1b[35m",
};

// Parse CLI flags
function parseArgs(): { apiUrl: string; limit?: number; isMock: boolean } {
  const args = process.argv.slice(2);
  let apiUrl = process.env.CODEFORGE_API_URL || "http://localhost:3001";
  let limit: number | undefined;
  let isMock = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--api" && args[i + 1]) {
      apiUrl = args[i + 1];
      i++;
    } else if (args[i] === "--limit" && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === "--mock") {
      isMock = true;
    }
  }

  return { apiUrl, limit, isMock };
}

// Pre-flight check: ensure backend server is reachable
async function checkHealth(apiUrl: string): Promise<boolean> {
  try {
    const res = await fetch(`${apiUrl}/api/health`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return false;
    const data = (await res.json()) as any;
    return data && data.status === "ok";
  } catch {
    return false;
  }
}

// Run single task through CodeForge API (or simulated in mock mode)
async function runTask(apiUrl: string, task: BenchmarkTask, isMock = false): Promise<TaskRunResult> {
  const startTime = Date.now();

  if (isMock) {
    // Artificial small delay to simulate processing
    await new Promise((r) => setTimeout(r, 400));
    const isRepaired = task.id === "string-02";
    const totalAttempts = isRepaired ? 2 : 1;
    const stdout = (task.expectedOutputs && task.expectedOutputs[0]) ? `${task.expectedOutputs[0]}\n` : "OK\n";
    const durationMs = isRepaired ? 1420 : 850;

    return {
      id: task.id,
      name: task.name,
      category: task.category,
      difficulty: task.difficulty,
      success: true,
      resolvedOnAttempt: totalAttempts,
      totalAttempts,
      durationMs,
      stdout,
      assertionsPassed: true,
      failedAssertions: [],
    };
  }

  try {
    const res = await fetch(`${apiUrl}/api/runs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task: task.task }),
      signal: AbortSignal.timeout(120000), // 2 min timeout per task
    });

    const data = (await res.json()) as any;
    const durationMs = Date.now() - startTime;

    const isSuccess = data.status === "success";
    const stdout = data.finalOutput || "";
    const totalAttempts = data.totalAttempts || 1;

    // Check assertions
    const failedAssertions: string[] = [];
    if (task.expectedOutputs && task.expectedOutputs.length > 0) {
      for (const expected of task.expectedOutputs) {
        if (!stdout.toLowerCase().includes(expected.toLowerCase())) {
          failedAssertions.push(expected);
        }
      }
    }

    const assertionsPassed = failedAssertions.length === 0;
    const finalSuccess = isSuccess && assertionsPassed;

    return {
      id: task.id,
      name: task.name,
      category: task.category,
      difficulty: task.difficulty,
      success: finalSuccess,
      resolvedOnAttempt: finalSuccess ? totalAttempts : 0,
      totalAttempts,
      durationMs,
      stdout,
      error: finalSuccess ? undefined : data.finalError || (assertionsPassed ? "Execution failed" : "Assertion failed"),
      assertionsPassed,
      failedAssertions,
    };
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    return {
      id: task.id,
      name: task.name,
      category: task.category,
      difficulty: task.difficulty,
      success: false,
      resolvedOnAttempt: 0,
      totalAttempts: 1,
      durationMs,
      error: err.message || "Network request failed",
      assertionsPassed: false,
      failedAssertions: ["Request timed out or threw network error"],
    };
  }
}

// Format markdown report
function generateMarkdownReport(report: BenchmarkReport): string {
  const rows = report.results
    .map((r) => {
      const statusIcon = r.success ? (r.resolvedOnAttempt === 1 ? "✅ Pass@1" : `🔄 Pass@${r.resolvedOnAttempt}`) : "❌ Failed";
      return `| \`${r.id}\` | ${r.name} | ${r.category} | ${r.difficulty} | ${statusIcon} | ${r.totalAttempts} | ${(r.durationMs / 1000).toFixed(2)}s | ${r.error ? `\`${r.error.slice(0, 40)}...\`` : "None"} |`;
    })
    .join("\n");

  return `# CodeForge Phase 11: Benchmark Report

**Generated:** ${report.timestamp}  
**Backend:** \`${report.serverUrl}\`

## Summary Metrics

| Metric | Value |
| :--- | :--- |
| **Total Tasks** | ${report.totalTasks} |
| **Passed Tasks** | ${report.passedTasks} / ${report.totalTasks} |
| **Overall Pass Rate** | **${report.passRate}%** |
| **Pass@1 Rate (First Attempt)** | **${report.passAt1Rate}%** |
| **Pass@3 Rate (Within 3 Attempts)** | **${report.passAt3Rate}%** |
| **Self-Repair Rate** | ${report.repairCount} tasks repaired (${report.repairSuccessRate}%) |
| **Average Attempts** | ${report.averageAttempts} |
| **Average Duration** | ${(report.averageDurationMs / 1000).toFixed(2)}s |

---

## Detailed Task Results

| ID | Task Name | Category | Difficulty | Status | Attempts | Duration | Error |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- |
${rows}
`;
}

// Main execution
export async function main() {
  console.log(`\n${colors.bold}${colors.cyan}════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}        CodeForge Phase 11: Autonomous Benchmark Runner     ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}════════════════════════════════════════════════════════════${colors.reset}\n`);

  const { apiUrl, limit, isMock } = parseArgs();
  console.log(`${colors.gray}Target Backend:${colors.reset} ${isMock ? "Mock Simulator" : apiUrl}`);
  if (isMock) {
    console.log(`${colors.magenta}[MOCK MODE ACTIVE] Simulating execution pipeline for testing without API credits${colors.reset}\n`);
  }

  // 1. Health check (skipped if mock mode)
  if (!isMock) {
    process.stdout.write(`${colors.gray}Verifying backend connection... ${colors.reset}`);
    const isHealthy = await checkHealth(apiUrl);
    if (!isHealthy) {
      console.log(`${colors.red}FAILED${colors.reset}\n`);
      console.error(`${colors.red}Error: CodeForge server is not responding at ${apiUrl}.${colors.reset}`);
      console.error(`Please start the backend server in another terminal:\n`);
      console.error(`  ${colors.bold}cd codeforge\\server${colors.reset}`);
      console.error(`  ${colors.bold}npm run dev${colors.reset}\n`);
      process.exit(1);
    }
    console.log(`${colors.green}CONNECTED (Phase 10 API Ready)${colors.reset}\n`);
  }

  // 2. Load benchmark tasks
  const tasksPath = path.join(__dirname, "tasks.json");
  if (!fs.existsSync(tasksPath)) {
    console.error(`${colors.red}Error: tasks.json not found at ${tasksPath}${colors.reset}`);
    process.exit(1);
  }

  let tasks: BenchmarkTask[] = JSON.parse(fs.readFileSync(tasksPath, "utf8"));
  if (limit && limit > 0) {
    tasks = tasks.slice(0, limit);
    console.log(`${colors.yellow}Running limited subset: ${tasks.length} task(s)${colors.reset}\n`);
  } else {
    console.log(`${colors.gray}Loaded ${tasks.length} benchmark task(s) from tasks.json${colors.reset}\n`);
  }

  // 3. Execute tasks
  const results: TaskRunResult[] = [];
  let index = 1;

  for (const task of tasks) {
    console.log(`${colors.bold}[${index}/${tasks.length}] ${task.name}${colors.reset} ${colors.dim}(${task.category} · ${task.difficulty})${colors.reset}`);
    console.log(`  ${colors.gray}Task:${colors.reset} "${task.task}"`);
    process.stdout.write(`  ${colors.cyan}Executing agent loop...${colors.reset} `);

    const result = await runTask(apiUrl, task, isMock);
    results.push(result);

    if (result.success) {
      if (result.resolvedOnAttempt === 1) {
        console.log(`${colors.green}✔ PASSED@1${colors.reset} ${colors.gray}(${(result.durationMs / 1000).toFixed(2)}s)${colors.reset}`);
      } else {
        console.log(`${colors.yellow}↺ REPAIRED (Attempt ${result.resolvedOnAttempt}/${result.totalAttempts})${colors.reset} ${colors.gray}(${(result.durationMs / 1000).toFixed(2)}s)${colors.reset}`);
      }
      if (result.stdout) {
        const preview = result.stdout.trim().split("\n")[0];
        console.log(`  ${colors.gray}Output preview:${colors.reset} ${preview.slice(0, 80)}`);
      }
    } else {
      console.log(`${colors.red}✖ FAILED${colors.reset} ${colors.gray}(${(result.durationMs / 1000).toFixed(2)}s, ${result.totalAttempts} attempt(s))${colors.reset}`);
      if (result.error) {
        console.log(`  ${colors.red}Error:${colors.reset} ${result.error}`);
      }
      if (result.failedAssertions.length > 0) {
        console.log(`  ${colors.red}Missing expected output:${colors.reset} ${result.failedAssertions.join(", ")}`);
      }
    }
    console.log();
    index++;
  }

  // 4. Compute metrics
  const totalTasks = results.length;
  const passedTasks = results.filter((r) => r.success).length;
  const failedTasks = totalTasks - passedTasks;
  const passAt1Count = results.filter((r) => r.success && r.resolvedOnAttempt === 1).length;
  const repairedCount = results.filter((r) => r.success && r.resolvedOnAttempt > 1).length;
  const tasksNeedingRepair = results.filter((r) => r.totalAttempts > 1).length;

  const passRate = totalTasks > 0 ? Math.round((passedTasks / totalTasks) * 100) : 0;
  const passAt1Rate = totalTasks > 0 ? Math.round((passAt1Count / totalTasks) * 100) : 0;
  const passAt3Rate = totalTasks > 0 ? Math.round((passedTasks / totalTasks) * 100) : 0;
  const repairSuccessRate = tasksNeedingRepair > 0 ? Math.round((repairedCount / tasksNeedingRepair) * 100) : 100;

  const totalDuration = results.reduce((acc, r) => acc + r.durationMs, 0);
  const averageDurationMs = totalTasks > 0 ? Math.round(totalDuration / totalTasks) : 0;
  const successfulAttempts = results.filter((r) => r.success).reduce((acc, r) => acc + r.resolvedOnAttempt, 0);
  const averageAttempts = passedTasks > 0 ? Math.round((successfulAttempts / passedTasks) * 10) / 10 : 0;

  const report: BenchmarkReport = {
    timestamp: new Date().toISOString(),
    serverUrl: apiUrl,
    totalTasks,
    passedTasks,
    failedTasks,
    passRate,
    passAt1Rate,
    passAt3Rate,
    repairCount: repairedCount,
    repairSuccessRate,
    averageAttempts,
    averageDurationMs,
    results,
  };

  // 5. Render summary table
  console.log(`${colors.bold}${colors.cyan}════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}                    BENCHMARK SUMMARY                      ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`  Total Tasks Evaluated:  ${colors.bold}${totalTasks}${colors.reset}`);
  console.log(`  Passed Tasks:           ${passedTasks > 0 ? colors.green : colors.red}${passedTasks} / ${totalTasks}${colors.reset}`);
  console.log(`  Overall Pass Rate:      ${passRate >= 70 ? colors.green : colors.yellow}${passRate}%${colors.reset}`);
  console.log(`  Pass@1 (First Attempt): ${colors.cyan}${passAt1Rate}%${colors.reset} (${passAt1Count}/${totalTasks})`);
  console.log(`  Pass@3 (Repair Loop):   ${colors.cyan}${passAt3Rate}%${colors.reset} (${passedTasks}/${totalTasks})`);
  console.log(`  Repairs Succeeded:      ${repairedCount} task(s) (${repairSuccessRate}%)`);
  console.log(`  Avg Attempts (Success): ${averageAttempts}`);
  console.log(`  Avg Duration per Task:  ${(averageDurationMs / 1000).toFixed(2)}s`);
  console.log(`${colors.bold}${colors.cyan}════════════════════════════════════════════════════════════${colors.reset}\n`);

  // 6. Save report artifacts
  const resultsJsonPath = path.join(__dirname, "results.json");
  const reportMdPath = path.join(__dirname, "report.md");

  fs.writeFileSync(resultsJsonPath, JSON.stringify(report, null, 2), "utf8");
  fs.writeFileSync(reportMdPath, generateMarkdownReport(report), "utf8");

  console.log(`${colors.green}✔ Results saved to:${colors.reset} ${resultsJsonPath}`);
  console.log(`${colors.green}✔ Markdown report:${colors.reset}  ${reportMdPath}\n`);
}

// Self-invoking when run directly
if (require.main === module) {
  main().catch((err) => {
    console.error(`${colors.red}Fatal benchmark runner error:${colors.reset}`, err);
    process.exit(1);
  });
}
