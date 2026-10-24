import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'Unknown runtime error' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[PARUL_ENGINE] boundary caught', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#05090c] text-[#dce3ed] flex items-center justify-center p-8 font-mono-custom">
          <div className="glass-panel max-w-lg w-full p-8 rounded-2xl border border-[#ffb4ab]/40">
            <p className="text-[#4cd9e0] text-xs tracking-[0.2em] uppercase mb-3">SYSTEM_FAULT</p>
            <h1 className="text-xl font-semibold mb-2">Runtime exception</h1>
            <p className="text-sm text-[#c5c6ca] mb-6 break-words">{this.state.message}</p>
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-[#4cd9e0] text-[#002021] text-sm font-semibold"
              onClick={() => window.location.reload()}
            >
              REBOOT SYSTEM
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
