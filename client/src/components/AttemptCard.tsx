import React from "react";
import { AttemptView } from "../types/run";

interface Props {
  attempt: AttemptView;
}

export const AttemptCard: React.FC<Props> = ({ attempt }) => {
  return (
    <div
      className="craft-card-lift"
      style={{
        background: "white",
        borderRadius: 12,
        border: "1px solid rgba(217,218,220,0.7)",
        padding: 16,
        marginBottom: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <strong style={{ fontSize: 14 }}>Attempt {attempt.attemptNumber}</strong>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: attempt.success ? "#376847" : "#b91c1c",
            background: attempt.success ? "rgba(55,104,71,0.1)" : "rgba(185,28,28,0.08)",
            padding: "2px 10px",
            borderRadius: 999,
          }}
        >
          {attempt.success ? "Success" : "Failed"}
        </span>
      </div>

      {attempt.explanation && (
        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 10 }}>{attempt.explanation}</p>
      )}

      <pre
        style={{
          background: "#0f172a",
          color: "#e2e8f0",
          padding: 12,
          borderRadius: 8,
          fontSize: 12,
          overflowX: "auto",
          marginBottom: 10,
        }}
      >
        {attempt.code}
      </pre>

      {attempt.stdout && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>stdout</div>
          <pre style={{ background: "#f3f4f6", padding: 10, borderRadius: 6, fontSize: 12, whiteSpace: "pre-wrap" }}>
            {attempt.stdout}
          </pre>
        </div>
      )}

      {(attempt.stderr || attempt.errorSummary) && (
        <div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>Error</div>
          <pre style={{ background: "#fef2f2", color: "#991b1b", padding: 10, borderRadius: 6, fontSize: 12, whiteSpace: "pre-wrap" }}>
            {attempt.errorSummary || attempt.stderr}
          </pre>
        </div>
      )}

      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 8 }}>
        {attempt.durationMs}ms
        {attempt.timedOut && " · Timed out"}
        {attempt.exitCode !== null && ` · Exit ${attempt.exitCode}`}
      </div>
    </div>
  );
};
