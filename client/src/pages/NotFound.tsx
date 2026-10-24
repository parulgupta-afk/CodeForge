import { AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, navigate] = useLocation();
  return (
    <div className="app-shell" style={{ placeItems: "center", padding: 40 }}>
      <div className="brutal-card" style={{ maxWidth: 440, padding: 28, textAlign: "center" }}>
        <AlertCircle size={28} style={{ marginBottom: 12 }} />
        <h1 style={{ margin: "0 0 8px" }}>404</h1>
        <p className="muted" style={{ marginBottom: 18 }}>
          This route is not part of the CodeForge product shell.
        </p>
        <button type="button" className="brutal-button button-primary" onClick={() => navigate("/")}>
          BACK TO OVERVIEW
        </button>
      </div>
    </div>
  );
}
