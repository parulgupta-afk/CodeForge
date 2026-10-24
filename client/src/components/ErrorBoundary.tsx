import { Component, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

type Props = { children: ReactNode };
type State = { hasError: boolean; message?: string };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-shell" style={{ placeItems: "center", padding: 40 }}>
          <div className="brutal-card" style={{ maxWidth: 420, padding: 28 }}>
            <div className="panel-title">
              <span>UI ERROR</span>
              <AlertTriangle size={18} />
            </div>
            <p className="muted" style={{ margin: "12px 0 18px" }}>
              {this.state.message || "Something went wrong rendering this view."}
            </p>
            <button
              type="button"
              className="brutal-button button-primary"
              onClick={() => window.location.assign("/")}
            >
              <RotateCcw size={15} /> RELOAD
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
