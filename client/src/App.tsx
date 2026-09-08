import { useState } from "react";
import { TopHeader } from "./components/TopHeader";
import { TaskBriefCard } from "./components/TaskBriefCard";
import { StepperBar } from "./components/StepperBar";
import { WorkingJournalCard } from "./components/WorkingJournalCard";
import { AttemptCard } from "./components/AttemptCard";
import { createRun } from "./services/api";
import { JournalLog, RunResponse, StepperStage } from "./types/run";

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function buildStepper(result: RunResponse | null, loading: boolean): StepperStage[] {
  if (loading) {
    return [
      { step: 1, title: "Generate", subtitle: "Writing code…", status: "active" },
      { step: 2, title: "Execute", subtitle: "Sandbox", status: "upcoming" },
      { step: 3, title: "Repair", subtitle: "If needed", status: "upcoming" },
    ];
  }
  if (!result) {
    return [
      { step: 1, title: "Generate", subtitle: "Ready", status: "upcoming" },
      { step: 2, title: "Execute", subtitle: "Sandbox", status: "upcoming" },
      { step: 3, title: "Repair", subtitle: "Max 3", status: "upcoming" },
    ];
  }

  const total = result.totalAttempts;
  return [
    {
      step: 1,
      title: "Generate",
      subtitle: total >= 1 ? "Done" : "—",
      status: total >= 1 ? "completed" : "upcoming",
    },
    {
      step: 2,
      title: "Execute",
      subtitle: result.status === "success" ? "Passed" : "Failed",
      status: result.status === "success" ? "completed" : total >= 1 ? "completed" : "upcoming",
    },
    {
      step: 3,
      title: "Repair",
      subtitle: total > 1 ? `${total - 1} fix(es)` : "Not needed",
      status: total > 1 ? "completed" : result.status === "success" ? "completed" : "upcoming",
    },
  ];
}

export default function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RunResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<JournalLog[]>([]);

  async function handleRun(task: string) {
    setLoading(true);
    setError(null);
    setResult(null);
    setLogs([
      {
        id: "1",
        time: nowTime(),
        type: "primary",
        content: "Received task brief. Dispatching to code generator…",
        highlight: "code generator",
      },
    ]);

    try {
      const data = await createRun(task);
      setResult(data);

      const newLogs: JournalLog[] = [
        {
          id: "1",
          time: nowTime(),
          type: "primary",
          content: "Received task brief. Dispatching to code generator…",
          highlight: "code generator",
        },
      ];

      data.attempts.forEach((a, idx) => {
        newLogs.push({
          id: `gen-${idx}`,
          time: nowTime(),
          type: "neutral",
          content: `Attempt ${a.attemptNumber}: generated ${a.code.split("\n").length} lines of Python.`,
        });

        if (a.success) {
          newLogs.push({
            id: `ok-${idx}`,
            time: nowTime(),
            type: "secondary",
            content: `Attempt ${a.attemptNumber} succeeded in ${a.durationMs}ms.`,
            highlight: "succeeded",
          });
        } else {
          newLogs.push({
            id: `fail-${idx}`,
            time: nowTime(),
            type: "warning",
            content: `Attempt ${a.attemptNumber} failed: ${a.errorSummary || a.stderr || "unknown error"}`,
            highlight: a.errorSummary?.split(":")[0],
          });
        }
      });

      if (data.status === "success") {
        newLogs.push({
          id: "final",
          time: nowTime(),
          type: "secondary",
          content: `Run complete. Resolved in ${data.totalAttempts} attempt(s).`,
          highlight: "Run complete",
        });
      } else {
        newLogs.push({
          id: "final",
          time: nowTime(),
          type: "warning",
          content: `All ${data.totalAttempts} attempts exhausted. ${data.finalError || ""}`,
        });
      }

      setLogs(newLogs);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setLogs((prev) => [
        ...prev,
        {
          id: "err",
          time: nowTime(),
          type: "warning",
          content: err.message || "Request failed",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const stages = buildStepper(result, loading);

  return (
    <div className="ambient-workspace-bg" style={{ minHeight: "100vh" }}>
      <TopHeader />

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px 60px" }}>
        {/* Hero */}
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{
              fontFamily: "Newsreader, Georgia, serif",
              fontSize: 32,
              fontWeight: 600,
              margin: "0 0 6px",
              color: "#111827",
            }}
          >
            Forge your next script
          </h1>
          <p style={{ color: "#6b7280", margin: 0, fontSize: 15 }}>
            Describe a task. The agent generates, executes, classifies errors, and self-repairs — up to 3 attempts.
          </p>
        </div>

        {/* Stepper */}
        <div style={{ marginBottom: 20 }}>
          <StepperBar stages={stages} />
        </div>

        {/* Two column layout */}
        <div
          className="cf-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            alignItems: "start",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <TaskBriefCard onRun={handleRun} loading={loading} />

            {error && (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#991b1b",
                  padding: "12px 16px",
                  borderRadius: 10,
                  fontSize: 14,
                }}
              >
                <strong>Error:</strong> {error}
              </div>
            )}

            {result && (
              <div
                className="craft-card-lift"
                style={{
                  background: "white",
                  borderRadius: 12,
                  border: "1px solid rgba(217,218,220,0.7)",
                  padding: 20,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <h3 style={{ fontFamily: "Newsreader, Georgia, serif", fontSize: 18, margin: 0 }}>
                    {result.status === "success" ? "Run Succeeded" : "Run Failed"}
                  </h3>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>
                    {result.totalAttempts} attempt{result.totalAttempts > 1 ? "s" : ""}
                    {result.provider ? ` · ${result.provider}` : ""}
                  </span>
                </div>

                {result.finalOutput && (
                  <pre
                    style={{
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      padding: 12,
                      borderRadius: 8,
                      fontSize: 13,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {result.finalOutput}
                  </pre>
                )}
                {result.finalError && (
                  <pre
                    style={{
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      color: "#991b1b",
                      padding: 12,
                      borderRadius: 8,
                      fontSize: 13,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {result.finalError}
                  </pre>
                )}
              </div>
            )}

            {result?.attempts.map((a) => (
              <AttemptCard key={a.attemptNumber} attempt={a} />
            ))}
          </div>

          <div>
            <WorkingJournalCard logs={logs} />
          </div>
        </div>
      </main>

      <footer
        style={{
          textAlign: "center",
          padding: "24px",
          fontSize: 12,
          color: "#9ca3af",
          borderTop: "1px solid #eee",
        }}
      >
        CodeForge Studio · Autonomous coding agent with sandboxed execution
      </footer>
    </div>
  );
}
