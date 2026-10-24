import React, { useMemo, useState } from 'react';
import { PROJECTS_DATA, CAPABILITIES_DATA } from '../data/portfolioData';
import { playCyberClick } from '../utils/audioSynth';

export const SkillGraph: React.FC = () => {
  const allTags = useMemo(() => {
    const m = new Map<string, string[]>();
    PROJECTS_DATA.forEach((p) => {
      p.tags.forEach((t) => {
        const arr = m.get(t) ?? [];
        arr.push(p.title);
        m.set(t, arr);
      });
    });
    return [...m.entries()].sort((a, b) => b[1].length - a[1].length);
  }, []);

  const [selected, setSelected] = useState<string | null>(allTags[0]?.[0] ?? null);
  const usedIn = selected ? (allTags.find(([t]) => t === selected)?.[1] ?? []) : [];

  return (
    <section
      id="skill-graph"
      className="relative z-10 px-4 sm:px-8 md:px-12 lg:px-16 py-16 max-w-[1440px] mx-auto"
    >
      <p className="text-[10px] font-mono-custom tracking-[0.25em] text-[#4cd9e0]">SKILL_GRAPH</p>
      <h2 className="text-3xl font-bodoni text-white mt-1 mb-2">Interactive technology map</h2>
      <p className="text-sm text-[#c5c6ca] mb-8 max-w-2xl">Click a node to see which modules use it.</p>
      <div className="grid lg:grid-cols-[1fr_280px] gap-6">
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex flex-wrap gap-2 justify-center content-center min-h-[200px]">
            {allTags.slice(0, 24).map(([tag, projects]) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  playCyberClick();
                  setSelected(tag);
                }}
                className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                  selected === tag
                    ? 'border-[#4cd9e0] bg-[#4cd9e0]/15 text-[#4cd9e0] scale-110'
                    : 'border-white/10 text-[#dce3ed] hover:border-[#4cd9e0]/35'
                }`}
                style={{ fontSize: `${Math.min(14, 10 + projects.length)}px` }}
              >
                {tag}
              </button>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-4 text-[10px] font-mono-custom text-[#8f9195]">
            {CAPABILITIES_DATA.map((c) => (
              <span key={c.id} className="border border-white/10 px-2 py-1 rounded">
                {c.title} {c.capacity}%
              </span>
            ))}
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-5 h-fit">
          <p className="text-[10px] font-mono-custom text-[#8f9195]">USED IN</p>
          <h3 className="text-lg text-[#4cd9e0] font-mono-custom mt-1">{selected ?? '—'}</h3>
          <ul className="mt-4 space-y-2">
            {usedIn.map((title) => (
              <li key={title} className="text-sm text-[#dce3ed] border-b border-white/5 pb-2">
                {title}
              </li>
            ))}
            {!usedIn.length && <li className="text-xs text-[#8f9195]">Select a technology</li>}
          </ul>
        </div>
      </div>
    </section>
  );
};
