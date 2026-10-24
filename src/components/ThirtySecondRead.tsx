import React from 'react';
import { PROFILE, PROJECTS_DATA } from '../data/portfolioData';

const FLAGSHIP = ['priceloop', 'codeforge', 'pulseops'];

export const ThirtySecondRead: React.FC = () => {
  const flagship = PROJECTS_DATA.filter((p) => FLAGSHIP.includes(p.id));
  return (
    <section id="summary" className="border-b border-white/[0.06] px-4 sm:px-8 md:px-12 lg:px-16 py-14">
      <div className="max-w-5xl mx-auto">
        <p className="text-[10px] font-mono-custom tracking-[0.25em] text-[#5eb8c8] mb-3">30 SECOND READ</p>
        <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-4">Software Engineer</h2>
        <p className="text-[#a8b3c4] text-base sm:text-lg max-w-3xl leading-relaxed mb-8">
          Full-stack engineer building product systems across frontend, backend, AI, data, realtime systems,
          and infrastructure. Strongest evidence is in end-to-end builds — not isolated demos.
        </p>
        <div className="grid sm:grid-cols-3 gap-6 text-sm">
          <div>
            <p className="text-[10px] font-mono-custom tracking-widest text-[#6b7380] mb-2">CORE</p>
            <p className="text-[#e8edf4] leading-relaxed">
              React · TypeScript · Node · Python · PostgreSQL · Redis · Docker · AI
            </p>
          </div>
          <div>
            <p className="text-[10px] font-mono-custom tracking-widest text-[#6b7380] mb-2">FLAGSHIP</p>
            <p className="text-[#e8edf4] leading-relaxed">{flagship.map((p) => p.title).join(' · ')}</p>
          </div>
          <div>
            <p className="text-[10px] font-mono-custom tracking-widest text-[#6b7380] mb-2">ROLE FIT</p>
            <p className="text-[#e8edf4] leading-relaxed">
              Software Engineer · Full Stack · Backend · AI Engineer
            </p>
          </div>
        </div>
        <p className="mt-6 text-xs text-[#6b7380]">{PROFILE.availability}</p>
      </div>
    </section>
  );
};
