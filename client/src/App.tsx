import React, { useEffect, useState } from "react";
import { TopHeader } from "./components/TopHeader";
import { TaskBriefCard } from "./components/TaskBriefCard";
import { StepperBar } from "./components/StepperBar";
import { WorkingJournalCard } from "./components/WorkingJournalCard";
import { AttemptCard } from "./components/AttemptCard";
import { MetricsCard } from "./components/MetricsCard";
import { createRun } from "./services/api";
import { getSocket } from "./services/socket";
import { JournalLog, RunResponse, StepperStage } from "./types/run";

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function buildStepper(result: RunResponse | null, loading: boolean, liveAttempt: number): StepperStage[] {
  if (loading) {
    return [
      { step: 1, title: "Generate", subtitle: liveAttempt >= 1 ? "Done" : "Writing…", status: liveAttempt >= 1 ? "completed" : "active" },
      { step: 2, title: "Execute", subtitle: liveAttempt >= 1 ? "Sandbox" : "Waiting", status: liveAttempt >= 1 ? "active" : "upcoming" },
      { step: 3, title: "Repair", subtitle: liveAttempt > 1 ? "Fixing…" : "If needed", status: liveAttempt > 1 ? "active" : "upcoming" },
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
    { step: 1, title: "Generate", subtitle: "Done", status: "completed" },
    { step: 2, title: "Execute", subtitle: result.status === "success" ? "Passed" : "Failed", status: "completed" },
    { step: 3, title: "Repair", subtitle: total > 1 ? `${total - 1} fix(es)` : "Not needed", status: "completed" },
  ];
}

export default function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RunResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<JournalLog[]>([]);
  const [liveAttempt, setLiveAttempt] = useState(0);

  useEffect(() => {
    const socket = getSocket();

    const onEvent = (event: any) => {
      const msg = event.message || event.type;
      let type: JournalLog["type"] = "neutral";
      if (event.type.includes("completed") || event.type.includes("output")) type = "secondary";
      if (event.type.includes("error") || event.type.includes("failed")) type = "warning";
      if (event.type.includes("started") || event.type.includes("generated") || event.type.includes("repair")) type = "primary";

      setLogs((prev) => [
        ...prev,
        {
          id: `${event.type}-${Date.now()}`,
          time: nowTime(),
          type,
          content: msg,
          highlight: event.data?.category || undefined,
        },
      ]);

      if (event.attemptNumber) setLiveAttempt(event.attemptNumber);
    };

    socket.on("agent:event", onEvent);
    return () => {
      socket.off("agent:event", onEvent);
    };
  }, []);

  async function handleRun(task: string) {
    setLoading(true);
    setError(null);
    setResult(null);
    setLiveAttempt(0);
    setLogs([
      {
        id: "start",
        time: nowTime(),
        type: "primary",
        content: "Dispatching task to autonomous agent…",
        highlight: "autonomous agent",
      },
    ]);

    try {
      const data = await createRun(task);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setLogs((prev) => [
        ...prev,
        { id: "err", time: nowTime(), type: "warning", content: err.message || "Request failed" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const stages = buildStepper(result, loading, liveAttempt);

  return (
    <div className="ambient-workspace-bg" style={{ minHeight: "100vh" }}>
      <TopHeader />

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px 60px" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: "Newsreader, Georgia, serif", fontSize: 32, fontWeight: 600, margin: "0 0 6px", color: "#111827" }}>
            Forge your next script
          </h1>
          <p style={{ color: "#6b7280", margin: 0, fontSize: 15 }}>
            Live agent logs · Generate → Execute → Classify → Repair
          </p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <StepperBar stages={stages} />
        </div>

        <div className="cf-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <TaskBriefCard onRun={handleRun} loading={loading} />

            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "12px 16px", borderRadius: 10, fontSize: 14 }}>
                <strong>Error:</strong> {error}
              </div>
            )}

            {result && (
              <div className="craft-card-lift" style={{ background: "white", borderRadius: 12, border: "1px solid rgba(217,218,220,0.7)", padding: 20 }}>
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
                  <pre style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: 12, borderRadius: 8, fontSize: 13, whiteSpace: "pre-wrap" }}>
                    {result.finalOutput}
                  </pre>
                )}
                {result.finalError && (
                  <pre style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: 12, borderRadius: 8, fontSize: 13, whiteSpace: "pre-wrap" }}>
                    {result.finalError}
                  </pre>
                )}
              </div>
            )}

            {result?.attempts.map((a) => (
              <AttemptCard key={a.attemptNumber} attempt={a} />
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <WorkingJournalCard logs={logs} />
            <MetricsCard />
          </div>
        </div>
      </main>

      <footer style={{ textAlign: "center", padding: "24px", fontSize: 12, color: "#9ca3af", borderTop: "1px solid #eee" }}>
        CodeForge Studio · Live WebSocket agent logs
      </footer>
    </div>
  );
}
