import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { EXPERIENCE_DATA } from '../data/portfolioData';
import { playCyberClick } from '../utils/audioSynth';

export const ExperienceSection: React.FC = () => {
  const [expandedId, setExpandedId] = useState<string | null>(EXPERIENCE_DATA[0].id);

  const toggleExpand = (id: string) => {
    playCyberClick(750);
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <section id="experience" className="py-20 sm:py-28 relative border-b border-white/5">
      <div className="px-4 sm:px-8 md:px-12 lg:px-16 max-w-[1440px] mx-auto">
        {/* Section Header */}
        <div className="mb-16 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-8 gap-4">
          <div>
            <h2 className="font-bodoni text-4xl sm:text-5xl text-[#dce3ed] mb-2 font-bold tracking-tight">
              Experience Log
            </h2>
            <p className="font-code-md text-xs uppercase tracking-widest text-[#4cd9e0]/80 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#4cd9e0] rounded-full" />
              CHRONOLOGICAL_DEPLOYMENTS
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-1 font-code-md text-[10px] text-[#c5c6ca]/60">
            <span>LOG_STATUS: SYNCED</span>
            <span className="text-[#80d4d8]">ENTRIES: 0{EXPERIENCE_DATA.length} // VERIFIED</span>
          </div>
        </div>

        {/* Timeline Container */}
        <div className="relative border-l border-white/10 ml-2 sm:ml-4 md:ml-8 space-y-10 sm:space-y-12 pb-4">
          {EXPERIENCE_DATA.map((item) => {
            const isActive = item.status === 'ACTIVE';
            const isExpanded = expandedId === item.id;

            return (
              <div key={item.id} className="relative pl-6 sm:pl-10 md:pl-12">
                {/* Timeline Dot Indicator */}
                <div
                  className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    isActive
                      ? 'bg-[#4cd9e0] shadow-[0_0_10px_rgba(76,217,224,0.9)] ring-4 ring-[#4cd9e0]/20'
                      : 'bg-white/20'
                  }`}
                />

                {/* Experience Card */}
                <div
                  id={`experience-card-${item.id}`}
                  onClick={() => toggleExpand(item.id)}
                  className={`glass-panel p-6 sm:p-8 rounded-xl border-white/10 group hover:border-[#4cd9e0]/40 transition-all duration-300 cursor-pointer glow-hover ${
                    isExpanded ? 'border-[#4cd9e0]/30 shadow-[0_0_20px_rgba(76,217,224,0.1)]' : ''
                  }`}
                >
                  {/* Top Row: Role & Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                    <h3 className="font-bodoni text-xl sm:text-2xl text-[#dce3ed] uppercase tracking-wide font-bold group-hover:text-[#4cd9e0] transition-colors">
                      {item.role}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-code-md text-[10px] border px-3 py-1 rounded w-fit uppercase font-semibold ${
                          isActive
                            ? 'bg-[#4cd9e0]/10 text-[#4cd9e0] border-[#4cd9e0]/30'
                            : 'bg-white/5 text-[#c5c6ca]/70 border-white/10'
                        }`}
                      >
                        [ {item.status} ]
                      </span>
                      {item.impactScore && (
                        <span className="font-code-md text-[10px] text-[#80d4d8] bg-[#80d4d8]/10 border border-[#80d4d8]/20 px-2 py-1 rounded hidden sm:inline-block">
                          {item.impactScore}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Company & Period */}
                  <p className="font-code-md text-[#4cd9e0]/80 text-xs sm:text-sm mb-6">
                    {item.company} // {item.period}
                  </p>

                  {/* Bullet Points */}
                  <ul className="space-y-3 font-code-md text-xs sm:text-[13px] text-[#c5c6ca]">
                    {item.bullets.map((bullet, idx) => (
                      <li key={idx} className="flex gap-3 items-start leading-relaxed">
                        <span className="text-[#4cd9e0] font-bold mt-0.5">&gt;</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Expanded Tech Stack Footer */}
                  <div className="mt-6 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-1.5">
                      {item.techStack.map((tech, idx) => (
                        <span
                          key={idx}
                          className="font-code-md text-[10px] bg-white/5 border border-white/10 text-[#c5c6ca] px-2 py-0.5 rounded"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                    <div className="text-[11px] font-code-md text-[#4cd9e0]/60 flex items-center gap-1">
                      <span>{isExpanded ? 'Collapse' : 'Details'}</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
