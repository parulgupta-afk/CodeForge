import React, { useMemo, useState } from 'react';
import { PROJECTS_DATA, PROFILE } from '../data/portfolioData';
import type { ProjectItem, RecruiterRole } from '../types';
import { playCyberClick } from '../utils/audioSynth';

interface RecruiterModeProps {
  open: boolean;
  onClose: () => void;
  onSelectProject: (project: ProjectItem) => void;
}

const ROLES: { id: RecruiterRole; label: string; focus: string[]; why: string }[] = [
  {
    id: 'backend',
    label: 'Backend Engineer',
    focus: ['Node.js', 'FastAPI', 'PostgreSQL', 'Redis', 'REST', 'Queues', 'Auth'],
    why: 'Strongest evidence in APIs, data, jobs, and system boundaries.',
  },
  {
    id: 'fullstack',
    label: 'Full Stack Engineer',
    focus: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'APIs', 'Product UI'],
    why: 'End-to-end ownership from interface through persistence and deployment.',
  },
  {
    id: 'ai',
    label: 'AI Engineer',
    focus: ['Gemini', 'Groq', 'RAG', 'Agents', 'Sandboxing', 'Orchestration'],
    why: 'Agent loops, model providers, retrieval patterns, and safe execution.',
  },
  {
    id: 'frontend',
    label: 'Frontend Engineer',
    focus: ['React', 'TypeScript', 'Tailwind', 'UX', 'Vite'],
    why: 'Product UI, design systems, and interaction design across shipped apps.',
  },
  {
    id: 'software',
    label: 'Software Engineer',
    focus: ['Systems', 'TypeScript', 'Testing', 'Docker', 'CI'],
    why: 'Broad systems thinking with concrete shipped repositories.',
  },
  {
    id: 'product',
    label: 'Product Engineer',
    focus: ['Full product loops', 'Payments', 'Auth', 'UX'],
    why: 'Billing, isolation, and user-facing workflows — not only demos.',
  },
];

function rankProjects(role: RecruiterRole): ProjectItem[] {
  return [...PROJECTS_DATA].sort((a, b) => {
    const aFit = a.roleFit?.includes(role) ? 3 : 0;
    const bFit = b.roleFit?.includes(role) ? 3 : 0;
    return bFit + b.tags.length * 0.01 - (aFit + a.tags.length * 0.01);
  });
}

export const RecruiterMode: React.FC<RecruiterModeProps> = ({ open, onClose, onSelectProject }) => {
  const [role, setRole] = useState<RecruiterRole>('fullstack');
  const ranked = useMemo(() => rankProjects(role), [role]);
  const meta = ROLES.find((r) => r.id === role)!;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0c1016] shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#0c1016]/95">
          <div>
            <p className="text-[10px] font-mono-custom tracking-[0.2em] text-[#5eb8c8]">RECRUITER MODE</p>
            <h2 className="text-lg font-semibold text-white">{PROFILE.name}</h2>
            <p className="text-sm text-[#8b95a5]">{PROFILE.role}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8b95a5] hover:text-white text-sm"
            aria-label="Close"
          >
            Close
          </button>
        </div>

        <div className="p-5 space-y-6">
          <p className="text-sm text-[#a8b3c4] leading-relaxed">{PROFILE.tagline}</p>

          <div>
            <p className="text-[10px] font-mono-custom tracking-widest text-[#6b7380] mb-2">
              SELECT ROLE LENS
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    playCyberClick();
                    setRole(r.id);
                  }}
                  className={`text-left px-3 py-2.5 rounded-lg border text-sm ${
                    role === r.id
                      ? 'border-[#5eb8c8] bg-[#5eb8c8]/10 text-[#7dd3e0]'
                      : 'border-white/10 text-[#a8b3c4] hover:border-white/20'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 p-4 bg-[#05070a]">
            <p className="text-[10px] font-mono-custom tracking-widest text-[#5eb8c8] mb-1">
              WHY THIS PROFILE FITS
            </p>
            <p className="text-sm text-[#e8edf4] mb-3">{meta.why}</p>
            <div className="flex flex-wrap gap-2">
              {meta.focus.map((f) => (
                <span key={f} className="text-xs px-2 py-1 rounded border border-[#5eb8c8]/25 text-[#7dd3e0]">
                  {f}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-mono-custom tracking-widest text-[#6b7380] mb-3">TOP EVIDENCE</p>
            <ol className="space-y-2">
              {ranked.slice(0, 3).map((p, i) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      playCyberClick();
                      onSelectProject(p);
                      onClose();
                    }}
                    className="w-full text-left rounded-xl border border-white/10 px-4 py-3 hover:border-[#5eb8c8]/35"
                  >
                    <span className="text-[#5eb8c8] font-mono-custom text-xs mr-2">{i + 1}.</span>
                    <span className="text-white font-medium">{p.title}</span>
                    <p className="text-xs text-[#8b95a5] mt-1 pl-5">{p.tagline}</p>
                  </button>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <a
              href="#resume"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg bg-[#5eb8c8] text-[#061218] text-sm font-semibold"
            >
              View resume
            </a>
            <a
              href={PROFILE.github}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-lg border border-white/15 text-sm text-[#e8edf4]"
            >
              GitHub
            </a>
            <a
              href={`mailto:${PROFILE.email}`}
              className="px-4 py-2.5 rounded-lg border border-white/15 text-sm text-[#e8edf4]"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
