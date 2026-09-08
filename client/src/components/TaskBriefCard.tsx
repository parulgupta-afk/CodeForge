import React, { useState } from "react";

interface Props {
  onRun: (task: string) => void;
  loading: boolean;
}

export const TaskBriefCard: React.FC<Props> = ({ onRun, loading }) => {
  const [task, setTask] = useState(
    "Calculate the average of numbers from 1 to 100 and print the result"
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!task.trim() || loading) return;
    onRun(task.trim());
  }

  return (
    <div
      className="craft-card-lift"
      style={{
        background: "white",
        padding: 24,
        borderRadius: 12,
        border: "1px solid rgba(217,218,220,0.7)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <span className="material-symbols-outlined" style={{ color: "#9d3e1a", fontSize: 22 }}>
          edit_note
        </span>
        <h2 style={{ fontFamily: "Newsreader, Georgia, serif", fontSize: 20, fontWeight: 600, margin: 0 }}>
          Task Brief
        </h2>
      </div>

      <form onSubmit={handleSubmit}>
        <label style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 6, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          Natural language intent
        </label>
        <textarea
          value={task}
          onChange={(e) => setTask(e.target.value)}
          rows={4}
          disabled={loading}
          style={{
            width: "100%",
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            padding: 12,
            fontSize: 15,
            fontFamily: "Source Sans 3, sans-serif",
            resize: "vertical",
            background: "#fafafa",
            color: "#111827",
            outline: "none",
          }}
          placeholder="Describe what you want the agent to build…"
        />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>
            Max 3 self-repair attempts · Docker sandbox
          </span>
          <button
            type="submit"
            disabled={loading || !task.trim()}
            className="btn-shimmer"
            style={{
              background: loading ? "#9ca3af" : "#9d3e1a",
              color: "white",
              border: "none",
              borderRadius: 10,
              padding: "10px 20px",
              fontWeight: 600,
              fontSize: 14,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              {loading ? "hourglass_top" : "play_arrow"}
            </span>
            {loading ? "Agent Running…" : "Forge Run"}
          </button>
        </div>
      </form>
    </div>
  );
};
