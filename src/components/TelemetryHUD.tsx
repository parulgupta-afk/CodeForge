import React, { useState } from 'react';
import { useTelemetry } from '../hooks/useTelemetry';

interface TelemetryHUDProps {
  compact?: boolean;
}

export const TelemetryHUD: React.FC<TelemetryHUDProps> = ({ compact }) => {
  const t = useTelemetry(true);
  const [open, setOpen] = useState(!compact);

  if (compact && !open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 glass-panel px-3 py-2 rounded-full text-[10px] font-mono-custom tracking-widest text-[#4cd9e0] border border-[#4cd9e0]/30 hover:bg-[#4cd9e0]/10"
        aria-label="Open system telemetry"
      >
        SYS ● {t.online ? 'ONLINE' : 'OFFLINE'}
      </button>
    );
  }

  const rows: [string, string][] = [
    ['FPS', t.fps != null ? String(t.fps) : '—'],
    ['VIEWPORT', t.viewport],
    ['MEMORY', t.deviceMemory],
    ['NETWORK', t.connection],
    ['LINK', t.online ? 'ONLINE' : 'OFFLINE'],
    ['GPU', t.webgl],
    ['MOTION', t.reducedMotion ? 'REDUCED' : 'FULL'],
    ['LANG', t.language],
  ];

  return (
    <div
      className={`fixed z-40 glass-panel rounded-xl border border-white/10 font-mono-custom text-[10px] ${
        compact ? 'bottom-4 right-4 w-56' : 'bottom-4 right-4 w-56'
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <span className="text-[#4cd9e0] tracking-[0.15em]">TELEMETRY</span>
        {compact && (
          <button
            type="button"
            className="text-[#8f9195] hover:text-[#dce3ed]"
            onClick={() => setOpen(false)}
            aria-label="Collapse telemetry"
          >
            ✕
          </button>
        )}
      </div>
      <dl className="px-3 py-2 space-y-1">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-2">
            <dt className="text-[#8f9195]">{k}</dt>
            <dd className="text-[#dce3ed] text-right truncate">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="px-3 pb-2 text-[9px] text-[#45474a]">Browser-measured only · not server metrics</p>
    </div>
  );
};
