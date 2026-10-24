import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PROJECTS_DATA, PROFILE } from '../data/portfolioData';
import type { CommandItem, ProjectItem } from '../types';
import { playCyberClick } from '../utils/audioSynth';

interface CommandCenterProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (sectionId: string) => void;
  onSelectProject: (project: ProjectItem) => void;
  onOpenRecruiter: () => void;
  onToggleBento: () => void;
  onTrace?: (projectId: string) => void;
}

function buildCommands(): CommandItem[] {
  const nav: CommandItem[] = [
    {
      id: 'nav-hero',
      label: 'Open Hero / Home',
      keywords: ['home', 'hero', 'start'],
      section: 'hero',
      action: 'navigate',
      payload: 'hero',
      group: 'nav',
    },
    {
      id: 'nav-about',
      label: 'Open About / Philosophy',
      keywords: ['about', 'philosophy'],
      section: 'about',
      action: 'navigate',
      payload: 'about',
      group: 'nav',
    },
    {
      id: 'nav-projects',
      label: 'Open Projects',
      keywords: ['projects', 'modules', 'work'],
      section: 'projects',
      action: 'navigate',
      payload: 'projects',
      group: 'nav',
    },
    {
      id: 'nav-skills',
      label: 'Open Skills / Capabilities',
      keywords: ['skills', 'capabilities', 'stack'],
      section: 'capabilities',
      action: 'navigate',
      payload: 'capabilities',
      group: 'nav',
    },
    {
      id: 'nav-exp',
      label: 'Open Experience',
      keywords: ['experience', 'timeline', 'resume'],
      section: 'experience',
      action: 'navigate',
      payload: 'experience',
      group: 'nav',
    },
    {
      id: 'nav-connect',
      label: 'Open Contact / Comms',
      keywords: ['contact', 'comms', 'email', 'connect'],
      section: 'connect',
      action: 'navigate',
      payload: 'connect',
      group: 'nav',
    },
  ];

  const projects: CommandItem[] = PROJECTS_DATA.map((p) => ({
    id: `proj-${p.id}`,
    label: `Inspect ${p.title}`,
    keywords: [p.title.toLowerCase(), p.id, p.category.toLowerCase(), ...p.tags.map((t) => t.toLowerCase())],
    action: 'project',
    payload: p.id,
    group: 'projects',
  }));

  const modes: CommandItem[] = [
    {
      id: 'mode-recruiter',
      label: 'Recruiter Mode',
      keywords: ['recruiter', 'hire', 'role', 'backend', 'frontend'],
      action: 'recruiter',
      group: 'modes',
    },
    {
      id: 'mode-bento',
      label: 'Toggle Bento Overview',
      keywords: ['bento', 'grid', 'overview'],
      action: 'mode',
      payload: 'bento',
      group: 'modes',
    },
    {
      id: 'nav-dash',
      label: 'Open OS Dashboard',
      keywords: ['dashboard', 'os'],
      section: 'dashboard',
      action: 'navigate',
      payload: 'dashboard',
      group: 'nav',
    },
    {
      id: 'nav-arch',
      label: 'Architecture Explorer',
      keywords: ['architecture', 'stack', 'map'],
      section: 'architecture',
      action: 'navigate',
      payload: 'architecture',
      group: 'nav',
    },
    {
      id: 'nav-skills-g',
      label: 'Skill Graph',
      keywords: ['skill graph', 'tags'],
      section: 'skill-graph',
      action: 'navigate',
      payload: 'skill-graph',
      group: 'nav',
    },
    {
      id: 'nav-lab',
      label: 'Engineering Lab',
      keywords: ['lab', 'queue', 'rate limit'],
      section: 'lab',
      action: 'navigate',
      payload: 'lab',
      group: 'nav',
    },
    {
      id: 'nav-sec',
      label: 'Security Center',
      keywords: ['security', 'threat'],
      section: 'security',
      action: 'navigate',
      payload: 'security',
      group: 'nav',
    },
    {
      id: 'nav-dna',
      label: 'Portfolio DNA',
      keywords: ['dna', 'fingerprint'],
      section: 'dna',
      action: 'navigate',
      payload: 'dna',
      group: 'nav',
    },
    {
      id: 'nav-perf',
      label: 'Performance Lab',
      keywords: ['performance', 'fps', 'perf'],
      section: 'perf-lab',
      action: 'navigate',
      payload: 'perf-lab',
      group: 'nav',
    },
    {
      id: 'nav-resume',
      label: 'Interactive Resume',
      keywords: ['resume', 'cv'],
      section: 'resume',
      action: 'navigate',
      payload: 'resume',
      group: 'nav',
    },
    {
      id: 'nav-spatial',
      label: 'Spatial Mode',
      keywords: ['spatial', 'constellation', '3d'],
      section: 'spatial',
      action: 'navigate',
      payload: 'spatial',
      group: 'nav',
    },
    {
      id: 'nav-gh',
      label: 'GitHub Activity',
      keywords: ['github', 'commits', 'activity'],
      section: 'github-activity',
      action: 'navigate',
      payload: 'github-activity',
      group: 'nav',
    },
  ];

  const external: CommandItem[] = [
    {
      id: 'ext-github',
      label: 'Open GitHub',
      keywords: ['github'],
      action: 'external',
      payload: PROFILE.github,
      group: 'external',
    },
    {
      id: 'ext-linkedin',
      label: 'Open LinkedIn',
      keywords: ['linkedin'],
      action: 'external',
      payload: PROFILE.linkedin,
      group: 'external',
    },
    {
      id: 'ext-email',
      label: 'Email Parul',
      keywords: ['email', 'mail'],
      action: 'external',
      payload: `mailto:${PROFILE.email}`,
      group: 'external',
    },
    {
      id: 'egg-whoami',
      label: '> whoami',
      keywords: ['whoami', 'identity'],
      action: 'navigate',
      payload: 'about',
      group: 'modes',
    },
    {
      id: 'egg-sudo',
      label: '> sudo inspect parul',
      keywords: ['sudo', 'inspect', 'hire'],
      action: 'recruiter',
      group: 'modes',
    },
    {
      id: 'egg-trace',
      label: '> trace codeforge',
      keywords: ['trace', 'codeforge'],
      action: 'trace',
      payload: 'codeforge',
      group: 'modes',
    },
    {
      id: 'egg-price',
      label: '> inspect priceloop',
      keywords: ['priceloop', 'inspect'],
      action: 'project',
      payload: 'priceloop',
      group: 'modes',
    },
    {
      id: 'egg-trace-p',
      label: '> trace priceloop',
      keywords: ['trace', 'priceloop'],
      action: 'trace',
      payload: 'priceloop',
      group: 'modes',
    },
    {
      id: 'egg-trace-pu',
      label: '> trace pulseops',
      keywords: ['trace', 'pulseops'],
      action: 'trace',
      payload: 'pulseops',
      group: 'modes',
    },
    {
      id: 'egg-help',
      label: '> help',
      keywords: ['help', 'commands'],
      action: 'navigate',
      payload: 'summary',
      group: 'modes',
    },
    {
      id: 'egg-status',
      label: '> status',
      keywords: ['status', 'online'],
      action: 'navigate',
      payload: 'hero',
      group: 'modes',
    },
    {
      id: 'egg-resume',
      label: '> open resume',
      keywords: ['resume', 'cv'],
      action: 'navigate',
      payload: 'resume',
      group: 'nav',
    },
    {
      id: 'mode-eng',
      label: '> engineering mode',
      keywords: ['engineering', 'lab'],
      action: 'navigate',
      payload: 'lab',
      group: 'modes',
    },
  ];

  return [...nav, ...projects, ...modes, ...external];
}

function scoreQuery(cmd: CommandItem, q: string): number {
  if (!q) return 1;
  const hay = `${cmd.label} ${cmd.keywords.join(' ')}`.toLowerCase();
  if (hay.includes(q)) return 10;
  const tokens = q.split(/\s+/).filter(Boolean);
  return tokens.reduce((s, t) => (hay.includes(t) ? s + 3 : s), 0);
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  open,
  onClose,
  onNavigate,
  onSelectProject,
  onOpenRecruiter,
  onToggleBento,
  onTrace,
}) => {
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const all = useMemo(() => buildCommands(), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all
      .map((c) => ({ c, score: scoreQuery(c, q) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.c)
      .slice(0, 12);
  }, [all, query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  const run = (cmd: CommandItem) => {
    playCyberClick();
    if (cmd.action === 'navigate' && cmd.payload) onNavigate(cmd.payload);
    if (cmd.action === 'project' && cmd.payload) {
      const p = PROJECTS_DATA.find((x) => x.id === cmd.payload);
      if (p) onSelectProject(p);
    }
    if (cmd.action === 'recruiter') onOpenRecruiter();
    if (cmd.action === 'mode' && cmd.payload === 'bento') onToggleBento();
    if (cmd.action === 'trace' && cmd.payload) onTrace?.(cmd.payload);
    if (cmd.action === 'external' && cmd.payload) window.open(cmd.payload, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[activeIdx]) {
      e.preventDefault();
      run(filtered[activeIdx]);
    }
  };

  if (!open) return null;

  const groupLabel = (g: CommandItem['group']) =>
    ({ nav: 'NAVIGATION', projects: 'PROJECTS', modes: 'MODES', external: 'EXTERNAL' })[g];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Command Center"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl glass-panel rounded-2xl border border-[#4cd9e0]/25 shadow-[0_0_60px_rgba(76,217,224,0.12)] overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <span className="text-[#4cd9e0] text-xs font-mono-custom tracking-widest">⌘K</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search portfolio… projects, skills, contact"
            className="flex-1 bg-transparent outline-none text-sm text-[#dce3ed] placeholder:text-[#8f9195] font-body-lg"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded border border-white/15 text-[#8f9195] font-mono-custom">
            ESC
          </kbd>
        </div>
        <ul className="max-h-[50vh] overflow-y-auto py-2">
          {filtered.length === 0 && (
            <li className="px-4 py-6 text-sm text-[#8f9195] text-center">No matches in knowledge graph</li>
          )}
          {filtered.map((cmd, i) => (
            <li key={cmd.id}>
              <button
                type="button"
                onClick={() => run(cmd)}
                onMouseEnter={() => setActiveIdx(i)}
                className={`w-full text-left px-4 py-2.5 flex items-center justify-between gap-3 transition-colors ${
                  i === activeIdx ? 'bg-[#4cd9e0]/12 text-[#4cd9e0]' : 'text-[#dce3ed] hover:bg-white/5'
                }`}
              >
                <span className="text-sm">{cmd.label}</span>
                <span className="text-[10px] font-mono-custom tracking-wider text-[#8f9195]">
                  {groupLabel(cmd.group)}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="px-4 py-2 border-t border-white/10 flex gap-4 text-[10px] font-mono-custom text-[#8f9195]">
          <span>↑↓ navigate</span>
          <span>↵ run</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
};
