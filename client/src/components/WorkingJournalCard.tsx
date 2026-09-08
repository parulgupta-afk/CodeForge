import React from "react";
import { JournalLog } from "../types/run";

interface Props {
  logs: JournalLog[];
}

export const WorkingJournalCard: React.FC<Props> = ({ logs }) => {
  return (
    <div
      className="craft-card-lift"
      style={{
        background: "white",
        padding: 20,
        borderRadius: 12,
        border: "1px solid rgba(217,218,220,0.7)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="material-symbols-outlined" style={{ color: "#9d3e1a", fontSize: 20 }}>
            psychology
          </span>
          <h3 style={{ fontFamily: "Newsreader, Georgia, serif", fontSize: 18, fontWeight: 600, margin: 0 }}>
            Agent Working Journal
          </h3>
        </div>
        <span style={{ fontSize: 11, color: "#9ca3af", fontFamily: "monospace" }}>Autonomous Log</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {logs.length === 0 && (
          <p style={{ color: "#9ca3af", fontSize: 14 }}>Waiting for the agent to start…</p>
        )}
        {logs.map((log) => {
          const dot =
            log.type === "primary"
              ? "#9d3e1a"
              : log.type === "secondary"
              ? "#376847"
              : log.type === "warning"
              ? "#b45309"
              : "#9ca3af";
          return (
            <div
              key={log.id}
              style={{
                display: "flex",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 8,
                background: "#f9fafb",
                alignItems: "flex-start",
              }}
            >
              <span style={{ fontSize: 11, color: "#9ca3af", fontFamily: "monospace", width: 52, flexShrink: 0 }}>
                {log.time}
              </span>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: dot, marginTop: 5, flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: 14, color: "#1f2937", lineHeight: 1.5 }}>
                {log.highlight ? (
                  <>
                    {log.content.split(log.highlight)[0]}
                    <strong style={{ color: log.type === "primary" ? "#9d3e1a" : "#111" }}>{log.highlight}</strong>
                    {log.content.split(log.highlight)[1]}
                  </>
                ) : (
                  log.content
                )}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
