import React, { useMemo } from 'react';
import { PROJECTS_DATA } from '../data/portfolioData';

function countTag(re: RegExp): number {
  return PROJECTS_DATA.filter((p) => p.tags.some((t) => re.test(t)) || re.test(p.fullOverview)).length;
}

export const PortfolioDNA: React.FC = () => {
  const dims = useMemo(
    () => [
      { label: 'Frontend', n: countTag(/React|TypeScript|Tailwind|Vite/i) },
      { label: 'Backend', n: countTag(/Express|FastAPI|Node|API/i) },
      { label: 'Data', n: countTag(/PostgreSQL|MongoDB|Redis|pgvector/i) },
      { label: 'AI', n: countTag(/Gemini|Groq|RAG|Agent|LLM/i) },
      { label: 'Realtime', n: countTag(/Socket|realtime|BullMQ|Celery/i) },
      { label: 'Infra', n: countTag(/Docker|CI|Stripe|OTel/i) },
    ],
    []
  );

  return (
    <section
      id="dna"
      className="relative z-10 px-4 sm:px-8 md:px-12 lg:px-16 py-16 max-w-5xl mx-auto border-b border-white/[0.06]"
    >
      <p className="text-[10px] font-mono-custom tracking-[0.25em] text-[#5eb8c8]">PORTFOLIO DNA</p>
      <h2 className="text-3xl font-semibold text-white mt-1 mb-2">Derived from projects</h2>
      <p className="text-sm text-[#8b95a5] mb-8 max-w-xl">
        Counts of systems that reference each area in portfolio data — not self-scored percentages.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {dims.map((d) => (
          <div key={d.label} className="panel-os p-4">
            <p className="text-sm text-white font-medium">{d.label}</p>
            <p className="text-2xl font-semibold text-[#5eb8c8] mt-1">{d.n}</p>
            <p className="text-xs text-[#6b7380]">projects with signal</p>
          </div>
        ))}
      </div>
    </section>
  );
};
