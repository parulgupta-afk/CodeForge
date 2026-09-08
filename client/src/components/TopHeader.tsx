import React from "react";

interface Props {
  onDocs?: () => void;
}

export const TopHeader: React.FC<Props> = ({ onDocs }) => {
  return (
    <header className="w-full frosted-bar sticky top-0 z-30">
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 1.25rem",
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="material-symbols-outlined" style={{ color: "#9d3e1a", fontSize: 22 }}>
            local_fire_department
          </span>
          <span style={{ fontFamily: "Newsreader, Georgia, serif", fontWeight: 600, fontSize: 18 }}>
            CodeForge Studio
          </span>
          <span
            style={{
              fontSize: 11,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "#6b7280",
              marginLeft: 8,
            }}
          >
            Autonomous Agent
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={onDocs}
            style={{
              border: "1px solid #e5e7eb",
              background: "white",
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 13,
              color: "#374151",
              cursor: "pointer",
            }}
          >
            Docs
          </button>
        </div>
      </div>
    </header>
  );
};
