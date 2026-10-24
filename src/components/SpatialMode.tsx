import React, { useState } from 'react';
import { PROJECTS_DATA } from '../data/portfolioData';
import type { ProjectItem } from '../types';
import { playCyberClick } from '../utils/audioSynth';

interface SpatialModeProps {
  onSelectProject: (p: ProjectItem) => void;
}

const POS = [
  { x: 50, y: 42 },
  { x: 22, y: 28 },
  { x: 78, y: 30 },
  { x: 30, y: 68 },
  { x: 70, y: 72 },
  { x: 50, y: 18 },
];

export const SpatialMode: React.FC<SpatialModeProps> = ({ onSelectProject }) => {
  const [hover, setHover] = useState<string | null>(null);

  return (
    <section
      id="spatial"
      className="relative z-10 px-4 sm:px-8 md:px-12 lg:px-16 py-16 max-w-[1440px] mx-auto"
    >
      <p className="text-[10px] font-mono-custom tracking-[0.25em] text-[#4cd9e0]">SPATIAL_MODE</p>
      <h2 className="text-3xl font-bodoni text-white mt-1 mb-2">Project constellation</h2>
      <p className="text-sm text-[#c5c6ca] mb-6">Lightweight spatial map (CSS) — full R3F optional later.</p>
      <div className="glass-panel rounded-2xl relative h-[360px] sm:h-[420px] overflow-hidden tech-grid">
        <svg className="absolute inset-0 w-full h-full opacity-40" aria-hidden>
          {POS.slice(0, PROJECTS_DATA.length).map((a, i) =>
            POS.slice(i + 1, PROJECTS_DATA.length).map((b, j) => (
              <line
                key={`${i}-${j}`}
                x1={`${a.x}%`}
                y1={`${a.y}%`}
                x2={`${b.x}%`}
                y2={`${b.y}%`}
                stroke="rgba(76,217,224,0.25)"
                strokeWidth="1"
              />
            ))
          )}
        </svg>
        {PROJECTS_DATA.map((p, i) => {
          const pos = POS[i % POS.length];
          return (
            <button
              key={p.id}
              type="button"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 px-3 py-2 rounded-full border text-xs transition-all ${
                hover === p.id
                  ? 'border-[#4cd9e0] bg-[#4cd9e0]/20 text-[#4cd9e0] scale-110 z-10'
                  : 'border-white/20 bg-[#0d141b]/90 text-[#dce3ed]'
              }`}
              onMouseEnter={() => setHover(p.id)}
              onMouseLeave={() => setHover(null)}
              onClick={() => {
                playCyberClick();
                onSelectProject(p);
              }}
            >
              {p.title}
            </button>
          );
        })}
      </div>
    </section>
  );
};
