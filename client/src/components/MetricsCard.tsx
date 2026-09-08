import React, { useEffect, useState } from "react";

interface Metrics {
  totalRuns: number;
  successCount: number;
  successRate: number;
  firstAttemptSuccessRate: number;
  withinThreeAttemptsRate: number;
  averageAttempts: number;
  failureCategories: Record<string, number>;
}

export const MetricsCard: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/metrics");
      if (!res.ok) throw new Error("Failed to load metrics");
      const data = await res.json();
      setMetrics(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 8000);
    return () => clearInterval(id);
  }, []);

  if (error) {
    return (
      <div className="craft-card-lift" style={cardStyle}>
        <h3 style={titleStyle}>Metrics</h3>
        <p style={{ color: "#9ca3af", fontSize: 13 }}>Run a few tasks to populate metrics.</p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="craft-card-lift" style={cardStyle}>
        <h3 style={titleStyle}>Metrics</h3>
        <p style={{ color: "#9ca3af", fontSize: 13 }}>Loading…</p>
      </div>
    );
  }

  const cats = Object.entries(metrics.failureCategories || {});

  return (
    <div className="craft-card-lift" style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="material-symbols-outlined" style={{ color: "#9d3e1a", fontSize: 20 }}>
            monitoring
          </span>
          <h3 style={titleStyle}>Agent Metrics</h3>
        </div>
        <button
          onClick={load}
          style={{
            border: "1px solid #e5e7eb",
            background: "white",
            borderRadius: 6,
            padding: "4px 10px",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          Refresh
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <Stat label="Total Runs" value={String(metrics.totalRuns)} />
        <Stat label="Success Rate" value={`${metrics.successRate}%`} accent />
        <Stat label="First Attempt" value={`${metrics.firstAttemptSuccessRate}%`} />
        <Stat label="Within 3 Attempts" value={`${metrics.withinThreeAttemptsRate}%`} />
        <Stat label="Avg Attempts" value={String(metrics.averageAttempts)} />
        <Stat label="Successes" value={String(metrics.successCount)} />
      </div>

      {cats.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Failure Categories
          </div>
          {cats.map(([cat, count]) => {
            const pct = metrics.totalRuns ? Math.round((count / metrics.totalRuns) * 100) : 0;
            return (
              <div key={cat} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
                  <span>{cat}</span>
                  <span style={{ color: "#6b7280" }}>{count}</span>
                </div>
                <div style={{ height: 6, background: "#f3f4f6", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: "#9d3e1a", borderRadius: 4 }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ background: "#f9fafb", borderRadius: 8, padding: "10px 12px" }}>
      <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 600, color: accent ? "#376847" : "#111827" }}>{value}</div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "white",
  padding: 20,
  borderRadius: 12,
  border: "1px solid rgba(217,218,220,0.7)",
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
};

const titleStyle: React.CSSProperties = {
  fontFamily: "Newsreader, Georgia, serif",
  fontSize: 18,
  fontWeight: 600,
  margin: 0,
};
