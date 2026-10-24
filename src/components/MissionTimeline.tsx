import React, { useState } from 'react';
import { EXPERIENCE_DATA } from '../data/portfolioData';
import { playCyberClick } from '../utils/audioSynth';

export const MissionTimeline: React.FC = () => {
  const [open, setOpen] = useState<string | null>(EXPERIENCE_DATA[0]?.id ?? null);
  return (
    <section
      id="mission-log"
      className="relative z-10 px-4 sm:px-8 md:px-12 lg:px-16 py-12 max-w-[1440px] mx-auto"
    >
      <p className="text-[10px] font-mono-custom tracking-[0.25em] text-[#4cd9e0] mb-2">MISSION_LOG</p>
      <h2 className="text-2xl font-bodoni text-white mb-6">Experience as operations timeline</h2>
      <div className="border-l border-[#4cd9e0]/30 ml-3 space-y-6">
        {EXPERIENCE_DATA.map((e) => (
          <div key={e.id} className="pl-6 relative">
            <span className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-[#4cd9e0] shadow-[0_0_10px_#4cd9e0]" />
            <button
              type="button"
              onClick={() => {
                playCyberClick();
                setOpen((id) => (id === e.id ? null : e.id));
              }}
              className="text-left w-full"
            >
              <p className="text-[10px] font-mono-custom text-[#8f9195]">
                {e.period} · {e.status}
              </p>
              <h3 className="text-lg text-[#dce3ed]">{e.role}</h3>
              <p className="text-sm text-[#80d4d8]">{e.company}</p>
            </button>
            {open === e.id && (
              <div className="mt-3 glass-panel-subtle rounded-xl p-4 space-y-2">
                {e.bullets.map((b, i) => (
                  <p key={i} className="text-xs text-[#c5c6ca] flex gap-2">
                    <span className="text-[#4cd9e0]">▸</span>
                    {b}
                  </p>
                ))}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {e.techStack.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] border border-white/10 px-2 py-0.5 rounded text-[#8f9195]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
