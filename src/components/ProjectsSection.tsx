import React, { useMemo } from 'react';
import { PROJECTS_DATA } from '../data/portfolioData';
import type { ProjectItem } from '../types';
import { playCyberClick } from '../utils/audioSynth';

interface ProjectsSectionProps {
  onSelectProject: (project: ProjectItem) => void;
}

const FLAGSHIP_IDS = ['priceloop', 'codeforge', 'pulseops'];
const APPLIED_IDS = ['pocket-triage', 'skycall'];

function statusLabel(p: ProjectItem): string {
  if (p.metrics.health === 'IN_DEV' || /development/i.test(p.specs.availability || ''))
    return 'IN DEVELOPMENT';
  if (p.id === 'beacon') return 'EXPERIMENTAL';
  if (FLAGSHIP_IDS.includes(p.id) || APPLIED_IDS.includes(p.id)) return 'BUILT';
  return 'BUILT';
}

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({ onSelectProject }) => {
  const groups = useMemo(() => {
    const flagship = PROJECTS_DATA.filter((p) => FLAGSHIP_IDS.includes(p.id));
    const applied = PROJECTS_DATA.filter((p) => APPLIED_IDS.includes(p.id));
    const experiments = PROJECTS_DATA.filter(
      (p) => !FLAGSHIP_IDS.includes(p.id) && !APPLIED_IDS.includes(p.id)
    );
    return [
      { title: 'FLAGSHIP SYSTEMS', items: flagship },
      { title: 'APPLIED SYSTEMS', items: applied },
      { title: 'EXPERIMENTS', items: experiments },
    ];
  }, []);

  return (
    <section id="projects" className="py-16 sm:py-20 border-b border-white/[0.06]">
      <div className="px-4 sm:px-8 md:px-12 lg:px-16 max-w-6xl mx-auto">
        <p className="text-[10px] font-mono-custom tracking-[0.25em] text-[#5eb8c8] mb-2">PROJECTS</p>
        <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-2">Engineering systems</h2>
        <p className="text-sm text-[#8b95a5] mb-12 max-w-2xl">
          Flagship work first. Experiments are labeled honestly — not every build is production-ready.
        </p>

        {groups.map(
          (g) =>
            g.items.length > 0 && (
              <div key={g.title} className="mb-14">
                <h3 className="text-xs font-mono-custom tracking-[0.2em] text-[#6b7380] mb-5">{g.title}</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {g.items.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        playCyberClick();
                        onSelectProject(p);
                      }}
                      className="text-left panel-os p-5 hover:border-[#5eb8c8]/35 transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[10px] font-mono-custom text-[#5eb8c8]">{p.modNumber}</span>
                        <span className="text-[10px] font-mono-custom text-[#6b7380]">{statusLabel(p)}</span>
                      </div>
                      <h4 className="text-lg font-semibold text-white group-hover:text-[#7dd3e0] transition-colors">
                        {p.title}
                      </h4>
                      <p className="text-sm text-[#8b95a5] mt-2 line-clamp-2 leading-relaxed">{p.tagline}</p>
                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {p.tags.slice(0, 4).map((t) => (
                          <span
                            key={t}
                            className="text-[10px] px-2 py-0.5 rounded border border-white/10 text-[#6b7380]"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <p className="mt-4 text-xs text-[#5eb8c8] font-mono-custom">Explore →</p>
                    </button>
                  ))}
                </div>
              </div>
            )
        )}
      </div>
    </section>
  );
};
