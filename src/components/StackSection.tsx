import React, { useMemo } from 'react';
import { PROJECTS_DATA } from '../data/portfolioData';

const GROUPS: { title: string; skills: string[] }[] = [
  { title: 'FRONTEND', skills: ['React', 'TypeScript', 'JavaScript', 'Tailwind', 'Vite'] },
  { title: 'BACKEND', skills: ['Node.js', 'Express', 'FastAPI', 'REST'] },
  { title: 'DATA', skills: ['PostgreSQL', 'MongoDB', 'Redis'] },
  { title: 'AI', skills: ['Gemini', 'Groq', 'RAG', 'pgvector'] },
  { title: 'INFRA', skills: ['Docker', 'BullMQ', 'Celery', 'Socket.io', 'Stripe'] },
];

function usedIn(skill: string): string[] {
  const s = skill.toLowerCase();
  return PROJECTS_DATA.filter((p) =>
    p.tags.some((t) => t.toLowerCase().includes(s) || s.includes(t.toLowerCase().split('.')[0]))
  ).map((p) => p.title);
}

export const StackSection: React.FC = () => {
  const mapped = useMemo(
    () =>
      GROUPS.map((g) => ({
        ...g,
        rows: g.skills
          .map((skill) => ({ skill, projects: usedIn(skill) }))
          .filter((r) => r.projects.length > 0 || ['HTML', 'CSS', 'JavaScript'].includes(r.skill)),
      })),
    []
  );

  return (
    <section id="stack" className="border-b border-white/[0.06] px-4 sm:px-8 md:px-12 lg:px-16 py-16">
      <div className="max-w-5xl mx-auto">
        <p className="text-[10px] font-mono-custom tracking-[0.25em] text-[#5eb8c8] mb-2">STACK</p>
        <h2 className="text-3xl font-semibold text-white mb-2">Evidence-based skills</h2>
        <p className="text-sm text-[#8b95a5] mb-10 max-w-2xl">
          Skills listed only where they appear in project work — not self-scored percentages.
        </p>
        <div className="space-y-8">
          {mapped.map((g) => (
            <div key={g.title}>
              <h3 className="text-xs font-mono-custom tracking-widest text-[#6b7380] mb-3">{g.title}</h3>
              <div className="grid sm:grid-cols-2 gap-2">
                {g.rows.map(({ skill, projects }) => (
                  <div
                    key={skill}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border border-white/[0.06] rounded-lg px-4 py-3 bg-[#0c1016]"
                  >
                    <span className="text-sm text-[#e8edf4] font-medium">{skill}</span>
                    <span className="text-xs text-[#6b7380]">
                      {projects.length
                        ? `Used in: ${projects.slice(0, 3).join(', ')}`
                        : 'Core web foundation'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
