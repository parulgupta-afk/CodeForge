import React, { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

type MissionSummary = {
  id: string;
  title: string;
  story: string;
  modeDefault: string;
  skillTags: string[];
  language: string;
};

type MissionDetail = MissionSummary & {
  starter: Record<string, string>;
  hints: string[];
  defectFile: string;
};

type SubmitResult = {
  visiblePassed: boolean;
  hiddenPassed: boolean;
  hiddenDetail: string;
  score: {
    total: number;
    max: number;
    xp: number;
    skills: Array<{ skill: string; points: number; max: number; reason: string }>;
  };
  progress: { xp: number; missionsCleared: string[] };
  suggestedNext: string | null;
};

function profileHeaders(): HeadersInit {
  let id = localStorage.getItem("codeforge_profile_id");
  if (!id) {
    id = "p_" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem("codeforge_profile_id", id);
  }
  return { "Content-Type": "application/json", "X-Profile-Id": id };
}

export function ArenaPage(props: { onBack: () => void }) {
  const [missions, setMissions] = useState<MissionSummary[]>([]);
  const [active, setActive] = useState<MissionDetail | null>(null);
  const [mode, setMode] = useState<"solo" | "ai_partner" | "agent_arena">("solo");
  const [files, setFiles] = useState<Record<string, string>>({});
  const [activeFile, setActiveFile] = useState<string>("");
  const [guessFile, setGuessFile] = useState("");
  const [guessLines, setGuessLines] = useState("");
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/api/missions`)
      .then((r) => r.json())
      .then((d) => setMissions(d.missions || []))
      .catch((e) => setError(e.message));
  }, []);

  async function openMission(id: string) {
    setResult(null);
    setError(null);
    const r = await fetch(`${API}/api/missions/${id}`);
    const d: MissionDetail = await r.json();
    setActive(d);
    setMode((d.modeDefault as any) || "solo");
    setFiles({ ...d.starter });
    const first = Object.keys(d.starter)[0] || "";
    setActiveFile(first);
    setGuessFile(d.defectFile || first);
    setGuessLines("");
  }

  async function submit() {
    if (!active) return;
    setLoading(true);
    setError(null);
    try {
      const lines = guessLines
        .split(/[,\s]+/)
        .map((x) => parseInt(x, 10))
        .filter((n) => !Number.isNaN(n));
      const res = await fetch(`${API}/api/missions/${active.id}/submit`, {
        method: "POST",
        headers: profileHeaders(),
        body: JSON.stringify({
          mode,
          files,
          rootCause: { file: guessFile, lines },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submit failed");
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (!active) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28 }}>Engineering Arena</h1>
          <button type="button" onClick={props.onBack} style={btnSecondary}>
            ← Studio
          </button>
        </div>
        <p style={{ color: "var(--color-muted)", marginBottom: 24 }}>
          Missions with visible and hidden tests. Score root cause, fix the code, earn XP.
        </p>
        {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
        <div style={{ display: "grid", gap: 14 }}>
          {missions.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => openMission(m.id)}
              style={cardBtn}
            >
              <div style={{ fontWeight: 600, marginBottom: 6 }}>{m.title}</div>
              <div style={{ fontSize: 14, color: "var(--color-muted)", marginBottom: 8 }}>
                {m.story}
              </div>
              <div style={{ fontSize: 12, color: "var(--color-tertiary)" }}>
                {m.skillTags.join(" · ")} · {m.modeDefault}
              </div>
            </button>
          ))}
          {missions.length === 0 && !error && (
            <p style={{ color: "var(--color-muted)" }}>Loading missions…</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 20px 60px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
        <button type="button" onClick={() => setActive(null)} style={btnSecondary}>
          ← Missions
        </button>
        <button type="button" onClick={props.onBack} style={btnSecondary}>
          Studio
        </button>
      </div>

      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, marginBottom: 8 }}>
        {active.title}
      </h1>
      <p style={{ color: "var(--color-muted)", marginBottom: 16, whiteSpace: "pre-wrap" }}>
        {active.story}
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {(["solo", "ai_partner", "agent_arena"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            style={{
              ...btnSecondary,
              background: mode === m ? "var(--color-primary)" : "#fff",
              color: mode === m ? "#fff" : "inherit",
            }}
          >
            {m === "solo" ? "Solo" : m === "ai_partner" ? "AI Partner" : "Agent Arena"}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
        {Object.keys(files).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setActiveFile(f)}
            style={{
              ...btnSecondary,
              fontSize: 13,
              background: activeFile === f ? "#eee" : "#fff",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <textarea
        value={files[activeFile] || ""}
        onChange={(e) =>
          setFiles((prev) => ({ ...prev, [activeFile]: e.target.value }))
        }
        spellCheck={false}
        style={{
          width: "100%",
          minHeight: 220,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 13,
          padding: 12,
          borderRadius: 8,
          border: "1px solid #e5e7eb",
          marginBottom: 16,
        }}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <label style={{ fontSize: 13 }}>
          Suspect file
          <input
            value={guessFile}
            onChange={(e) => setGuessFile(e.target.value)}
            style={inputStyle}
          />
        </label>
        <label style={{ fontSize: 13 }}>
          Suspect lines (e.g. 4,5)
          <input
            value={guessLines}
            onChange={(e) => setGuessLines(e.target.value)}
            style={inputStyle}
          />
        </label>
      </div>

      {active.hints?.length > 0 && (
        <details style={{ marginBottom: 16 }}>
          <summary style={{ cursor: "pointer", color: "var(--color-muted)" }}>Hints</summary>
          <ul style={{ marginTop: 8, paddingLeft: 18, color: "var(--color-muted)" }}>
            {active.hints.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </details>
      )}

      <button type="button" onClick={submit} disabled={loading} style={btnPrimary}>
        {loading ? "Running tests…" : "Submit fix"}
      </button>

      {error && <p style={{ color: "#b91c1c", marginTop: 12 }}>{error}</p>}

      {result && (
        <div style={{ ...cardBtn, marginTop: 20, textAlign: "left", cursor: "default" }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>
            Score {result.score.total}/{result.score.max} · XP +{result.score.xp}
          </div>
          <div style={{ fontSize: 14, marginBottom: 8 }}>
            Visible: {result.visiblePassed ? "passed" : "failed"} · Hidden:{" "}
            {result.hiddenPassed ? "passed" : "failed"}
          </div>
          {!result.hiddenPassed && (
            <pre
              style={{
                fontSize: 12,
                background: "#fef2f2",
                padding: 10,
                borderRadius: 8,
                overflow: "auto",
              }}
            >
              {result.hiddenDetail}
            </pre>
          )}
          <ul style={{ marginTop: 10, paddingLeft: 18, fontSize: 13 }}>
            {result.score.skills.map((s) => (
              <li key={s.skill}>
                {s.skill}: {s.points}/{s.max} — {s.reason}
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 10, fontSize: 13, color: "var(--color-muted)" }}>
            Profile XP: {result.progress.xp} · Cleared:{" "}
            {result.progress.missionsCleared.join(", ") || "none"}
            {result.suggestedNext ? ` · Suggested next: ${result.suggestedNext}` : ""}
          </div>
        </div>
      )}
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  background: "var(--color-primary)",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "10px 18px",
  fontWeight: 600,
};

const btnSecondary: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: "8px 14px",
};

const cardBtn: React.CSSProperties = {
  textAlign: "left",
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 16,
  boxShadow: "var(--shadow)",
  cursor: "pointer",
};

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 4,
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #e5e7eb",
};
