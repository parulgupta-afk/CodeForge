import React, { useEffect, useState } from 'react';
import { useTelemetry } from '../hooks/useTelemetry';
import { playCyberClick } from '../utils/audioSynth';

interface PerformanceLabProps {
  performanceMode: boolean;
  onTogglePerf: () => void;
}

export const PerformanceLab: React.FC<PerformanceLabProps> = ({ performanceMode, onTogglePerf }) => {
  const t = useTelemetry(true);
  const [loadMs, setLoadMs] = useState<number | null>(null);

  useEffect(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (nav) setLoadMs(Math.round(nav.loadEventEnd - nav.startTime));
  }, []);

  return (
    <section
      id="perf-lab"
      className="relative z-10 px-4 sm:px-8 md:px-12 lg:px-16 py-16 max-w-[1440px] mx-auto"
    >
      <p className="text-[10px] font-mono-custom tracking-[0.25em] text-[#4cd9e0]">PERFORMANCE_LAB</p>
      <h2 className="text-3xl font-bodoni text-white mt-1 mb-6">Measured in this browser</h2>
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        {[
          ['LOAD', loadMs != null ? `${loadMs} ms` : '—'],
          ['FPS', t.fps != null ? String(t.fps) : '—'],
          ['VIEWPORT', t.viewport],
        ].map(([k, v]) => (
          <div key={k} className="glass-panel rounded-xl p-4">
            <p className="text-[10px] font-mono-custom text-[#8f9195]">{k}</p>
            <p className="text-xl text-[#4cd9e0] font-mono-custom mt-1">{v}</p>
          </div>
        ))}
      </div>
      <div className="glass-panel rounded-2xl p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <p className="text-sm text-[#dce3ed] font-semibold">Performance mode</p>
          <p className="text-xs text-[#c5c6ca] mt-1 max-w-md">
            Reduces shader/particle cost via <code className="text-[#4cd9e0]">data-perf-mode</code> on{' '}
            <code>&lt;html&gt;</code>. Prefer this on low-end devices.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            playCyberClick();
            onTogglePerf();
          }}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold border ${
            performanceMode
              ? 'bg-[#4cd9e0] text-[#002021] border-[#4cd9e0]'
              : 'border-[#4cd9e0]/40 text-[#4cd9e0]'
          }`}
        >
          {performanceMode ? 'PERFORMANCE ON' : 'ENABLE PERFORMANCE MODE'}
        </button>
      </div>
    </section>
  );
};
