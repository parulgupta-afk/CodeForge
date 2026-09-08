import React from "react";
import { StepperStage } from "../types/run";

interface Props {
  stages: StepperStage[];
}

export const StepperBar: React.FC<Props> = ({ stages }) => {
  return (
    <div
      style={{
        display: "flex",
        gap: 0,
        background: "white",
        borderRadius: 12,
        border: "1px solid rgba(217,218,220,0.7)",
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      {stages.map((stage, idx) => {
        const isActive = stage.status === "active";
        const isDone = stage.status === "completed";
        return (
          <div
            key={stage.step}
            style={{
              flex: 1,
              padding: "14px 16px",
              borderRight: idx < stages.length - 1 ? "1px solid #eee" : "none",
              background: isActive ? "rgba(157,62,26,0.04)" : "transparent",
              position: "relative",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 600,
                  background: isDone ? "#376847" : isActive ? "#9d3e1a" : "#e5e7eb",
                  color: isDone || isActive ? "white" : "#6b7280",
                }}
              >
                {isDone ? "✓" : stage.step}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{stage.title}</span>
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", paddingLeft: 30 }}>{stage.subtitle}</div>
            {isActive && <div className="stepper-active-line" style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "#9d3e1a" }} />}
          </div>
        );
      })}
    </div>
  );
};
