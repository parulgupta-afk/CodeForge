import React from 'react';
import { PROFILE } from '../data/portfolioData';

/** Static visualization + link out — live GraphQL requires a token (Phase 13 production). */
const WEEKS = 16;
const DAYS = 7;

function cellLevel(i: number): number {
  // Deterministic pattern (not claiming real GitHub data)
  return (Math.sin(i * 1.7) * 0.5 + 0.5) * 4;
}

export const GitHubActivity: React.FC = () => {
  const cells: number[] = [];
  for (let w = 0; w < WEEKS; w++) {
    for (let d = 0; d < DAYS; d++) cells.push(Math.floor(cellLevel(w * 7 + d)));
  }

  return (
    <section
      id="github-activity"
      className="relative z-10 px-4 sm:px-8 md:px-12 lg:px-16 py-16 max-w-[1440px] mx-auto"
    >
      <p className="text-[10px] font-mono-custom tracking-[0.25em] text-[#4cd9e0]">GITHUB_ACTIVITY</p>
      <h2 className="text-3xl font-bodoni text-white mt-1 mb-2">Contribution surface</h2>
      <p className="text-xs text-[#8f9195] mb-4 max-w-xl">
        Pattern preview only — not live GitHub data. Open the real profile for authoritative activity.
      </p>
      <div className="glass-panel rounded-2xl p-5 inline-block max-w-full overflow-x-auto">
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${WEEKS}, 12px)`, gridTemplateRows: `repeat(${DAYS}, 12px)` }}
        >
          {cells.map((lvl, i) => (
            <div
              key={i}
              className="rounded-sm"
              style={{
                background: lvl === 0 ? 'rgba(255,255,255,0.06)' : `rgba(76,217,224,${0.15 + lvl * 0.2})`,
              }}
            />
          ))}
        </div>
        <a
          href={PROFILE.github}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-4 text-xs text-[#4cd9e0] hover:underline font-mono-custom"
        >
          Open GitHub profile →
        </a>
      </div>
    </section>
  );
};
