import React from 'react';
import { PROJECTS_DATA, CAPABILITIES_DATA, PROFILE } from '../data/portfolioData';
import type { ProjectItem } from '../types';
import { playCyberClick } from '../utils/audioSynth';

interface OSDashboardProps {
  onSelectProject: (p: ProjectItem) => void;
  onNavigate: (id: string) => void;
  onOpenAI: () => void;
  onOpenRecruiter: () => void;
}

export const OSDashboard: React.FC<OSDashboardProps> = ({ onSelectProject, onOpenAI, onOpenRecruiter }) => {
  const tech = new Set(PROJECTS_DATA.flatMap((p) => p.tags));
  return (
    <section
      id="dashboard"
      className="relative z-10 px-4 sm:px-8 md:px-12 lg:px-16 py-16 max-w-6xl mx-auto border-b border-white/10"
    >
      <h2 className="text-3xl font-semibold text-white mb-2">Overview</h2>
      <p className="text-[#9aa3b2] text-sm mb-8">Quick snapshot for recruiters</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass-panel rounded-xl p-5">
          <p className="text-2xl font-semibold text-[#4cd9e0]">{PROJECTS_DATA.length}</p>
          <p className="text-sm text-[#9aa3b2] mt-1">Projects</p>
        </div>
        <div className="glass-panel rounded-xl p-5">
          <p className="text-2xl font-semibold text-[#4cd9e0]">{tech.size}+</p>
          <p className="text-sm text-[#9aa3b2] mt-1">Technologies</p>
        </div>
        <div className="glass-panel rounded-xl p-5">
          <p className="text-2xl font-semibold text-[#4cd9e0]">{CAPABILITIES_DATA.length}</p>
          <p className="text-sm text-[#9aa3b2] mt-1">Skill areas</p>
        </div>
        <div className="glass-panel rounded-xl p-5">
          <p className="text-2xl font-semibold text-[#4cd9e0]">Open</p>
          <p className="text-sm text-[#9aa3b2] mt-1">Availability</p>
        </div>
      </div>
      <div className="glass-panel rounded-xl p-6">
        <p className="text-white font-medium text-lg">{PROFILE.name}</p>
        <p className="text-[#9aa3b2] text-sm mt-1">{PROFILE.role}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {PROJECTS_DATA.slice(0, 4).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                playCyberClick();
                onSelectProject(p);
              }}
              className="text-sm px-3 py-1.5 rounded-lg border border-white/15 text-[#dce3ed] hover:border-[#4cd9e0]/50"
            >
              {p.title}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              playCyberClick();
              onOpenRecruiter();
            }}
            className="text-sm px-3 py-1.5 rounded-lg bg-[#4cd9e0]/15 text-[#4cd9e0] border border-[#4cd9e0]/30"
          >
            Role-based view
          </button>
          <button
            type="button"
            onClick={() => {
              playCyberClick();
              onOpenAI();
            }}
            className="text-sm px-3 py-1.5 rounded-lg border border-white/15 text-[#a8b3c4]"
          >
            Ask about my work
          </button>
        </div>
      </div>
    </section>
  );
};
