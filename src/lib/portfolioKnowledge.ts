import { PROJECTS_DATA, CAPABILITIES_DATA, EXPERIENCE_DATA, PROFILE } from '../data/portfolioData';
import type { ProjectItem } from '../types';

export interface AgentAnswer {
  intent: string;
  summary: string;
  projects: ProjectItem[];
  bullets: string[];
  actions: { type: 'OPEN_PROJECT' | 'NAVIGATE' | 'EXTERNAL'; payload: string; label: string }[];
}

function score(text: string, q: string): number {
  const hay = text.toLowerCase();
  const tokens = q
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2);
  if (!tokens.length) return hay.includes(q.toLowerCase()) ? 5 : 0;
  return tokens.reduce((s, t) => s + (hay.includes(t) ? 2 : 0), 0);
}

/** Client-side portfolio retriever (Sprint AI without vector DB). */
export function answerPortfolioQuery(raw: string): AgentAnswer {
  const q = raw.trim().toLowerCase();
  if (!q) {
    return {
      intent: 'EMPTY',
      summary: 'Ask about projects, skills, stack, or contact.',
      projects: [],
      bullets: [
        'Try: “best distributed systems project”',
        'Try: “projects using Redis”',
        'Try: “how to contact Parul”',
      ],
      actions: [],
    };
  }

  if (/(contact|email|reach|hire|linkedin)/.test(q)) {
    return {
      intent: 'CONTACT',
      summary: `Reach ${PROFILE.name} at ${PROFILE.email} or via LinkedIn/GitHub.`,
      projects: [],
      bullets: [PROFILE.email, PROFILE.linkedin, PROFILE.github],
      actions: [
        { type: 'NAVIGATE', payload: 'connect', label: 'Open Comms' },
        { type: 'EXTERNAL', payload: PROFILE.linkedin, label: 'LinkedIn' },
        { type: 'EXTERNAL', payload: PROFILE.github, label: 'GitHub' },
      ],
    };
  }

  if (/(resume|cv|experience|education|intern)/.test(q)) {
    return {
      intent: 'EXPERIENCE',
      summary: 'Experience and education from the mission log.',
      projects: [],
      bullets: EXPERIENCE_DATA.flatMap((e) => [
        `${e.role} @ ${e.company} (${e.period})`,
        ...e.bullets.slice(0, 2),
      ]),
      actions: [{ type: 'NAVIGATE', payload: 'experience', label: 'Open Experience' }],
    };
  }

  if (/(skill|stack|technolog|capable|know)/.test(q) && !/(project|built|redis|postgres)/.test(q)) {
    return {
      intent: 'SKILLS',
      summary: 'Core capabilities from the performance matrix.',
      projects: [],
      bullets: CAPABILITIES_DATA.map((c) => `${c.title} — ${c.capacity}% · ${c.description}`),
      actions: [{ type: 'NAVIGATE', payload: 'capabilities', label: 'Open Capabilities' }],
    };
  }

  // Project retrieval by tags / text
  const ranked = PROJECTS_DATA.map((p) => {
    const blob = [
      p.title,
      p.tagline,
      p.description,
      p.fullOverview,
      p.category,
      ...p.tags,
      ...(p.architectureDetails || []),
    ].join(' ');
    let s = score(blob, q);
    if (/(distribut|realtime|real-time|on-call|incident|queue|redis|bullmq)/.test(q) && p.id === 'pulseops')
      s += 8;
    if (/(triage|emergency|first.?aid|rag|protocol)/.test(q) && p.id === 'pocket-triage') s += 8;
    if (/(flight|travel|duffel|airline)/.test(q) && p.id === 'skycall') s += 8;
    if (/(food|allerg|barcode|nutri)/.test(q) && p.id === 'nutrivibe') s += 8;
    if (/(mesh|ble|offline|disaster)/.test(q) && (p.id === 'disaster-mesh' || p.id === 'beacon')) s += 6;
    if (/(ai|gemini|rag|embedding)/.test(q) && p.tags.some((t) => /gemini|ai|rag|pgvector/i.test(t))) s += 4;
    if (/(backend|postgres|redis|express)/.test(q) && p.roleFit?.includes('backend')) s += 3;
    return { p, s };
  })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);

  if (ranked.length) {
    const top = ranked.slice(0, 3).map((x) => x.p);
    const best = top[0];
    return {
      intent: 'PROJECT_SEARCH',
      summary: `${best.title} best matches this query.`,
      projects: top,
      bullets: [best.tagline, ...best.architectureDetails.slice(0, 4), `Stack: ${best.tags.join(', ')}`],
      actions: top.map((p) => ({
        type: 'OPEN_PROJECT' as const,
        payload: p.id,
        label: `Open ${p.title}`,
      })),
    };
  }

  return {
    intent: 'FALLBACK',
    summary: `I am the portfolio knowledge agent for ${PROFILE.name}. Rephrase with a technology or project name.`,
    projects: PROJECTS_DATA.slice(0, 3),
    bullets: PROJECTS_DATA.map((p) => `${p.title}: ${p.tagline}`),
    actions: [{ type: 'NAVIGATE', payload: 'projects', label: 'Browse projects' }],
  };
}
