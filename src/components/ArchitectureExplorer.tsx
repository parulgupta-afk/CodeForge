import React, { useMemo, useState } from 'react';
import { PROJECTS_DATA } from '../data/portfolioData';
import { playCyberClick } from '../utils/audioSynth';

/** Simplified architecture nodes derived from project tags + decisions */
const NODE_META: Record<string, { purpose: string; why: string; tradeoff: string }> = {
  Redis: {
    purpose: 'Pub/sub, rate limits, job broker companion',
    why: 'Fan-out across processes without polling every client',
    tradeoff: 'Extra infra; need fallback when Redis is down',
  },
  BullMQ: {
    purpose: 'Reliable background jobs with retry/DLQ',
    why: 'Keep HTTP path fast; isolate notification/triage work',
    tradeoff: 'Worker process operational complexity',
  },
  PostgreSQL: {
    purpose: 'Source of truth for entities + vectors (pgvector)',
    why: 'Strong consistency for incidents/orgs + embedding search',
    tradeoff: 'Ops vs pure document stores for unstructured blobs',
  },
  Gemini: {
    purpose: 'Generation + embeddings for RAG / concierge',
    why: 'Product AI grounded in retrieved context',
    tradeoff: 'Cost, latency, need mock/fallback without keys',
  },
  'Socket.io': {
    purpose: 'Bidirectional realtime to browsers',
    why: 'Instant incident state without client polling',
    tradeoff: 'Sticky sessions / Redis adapter at scale',
  },
  Express: {
    purpose: 'HTTP API surface',
    why: 'Familiar Node stack, middleware ecosystem',
    tradeoff: 'Manual structure vs heavier frameworks',
  },
  React: {
    purpose: 'Interactive client UI',
    why: 'Component model for dashboards and portfolio OS',
    tradeoff: 'Client complexity; needs careful perf mode',
  },
  Supabase: {
    purpose: 'Auth, Postgres, Realtime for product speed',
    why: 'Ship staff dashboards with less custom infra',
    tradeoff: 'Vendor coupling for auth/realtime paths',
  },
};

interface ArchitectureExplorerProps {
  embedded?: boolean;
}

export const ArchitectureExplorer: React.FC<ArchitectureExplorerProps> = () => {
  const [projectId, setProjectId] = useState(PROJECTS_DATA[0]?.id ?? 'pulseops');
  const project = PROJECTS_DATA.find((p) => p.id === projectId) ?? PROJECTS_DATA[0];
  const [node, setNode] = useState<string | null>(null);

  const nodes = useMemo(() => {
    const tags = project.tags.filter((t) => NODE_META[t] || t.length < 16);
    return tags.slice(0, 10);
  }, [project]);

  const meta = node ? NODE_META[node] : null;

  return (
    <section
      id="architecture"
      className="relative z-10 px-4 sm:px-8 md:px-12 lg:px-16 py-16 max-w-[1440px] mx-auto"
    >
      <p className="text-[10px] font-mono-custom tracking-[0.25em] text-[#4cd9e0]">ARCHITECTURE_MODE</p>
      <h2 className="text-3xl font-bodoni text-white mt-1 mb-6">Interactive stack map</h2>
      <div className="flex flex-wrap gap-2 mb-6">
        {PROJECTS_DATA.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              playCyberClick();
              setProjectId(p.id);
              setNode(null);
            }}
            className={`text-xs px-3 py-1.5 rounded-full border ${
              projectId === p.id
                ? 'border-[#4cd9e0] text-[#4cd9e0] bg-[#4cd9e0]/10'
                : 'border-white/10 text-[#c5c6ca]'
            }`}
          >
            {p.title}
          </button>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-panel rounded-2xl p-6 min-h-[280px]">
          <p className="text-[10px] font-mono-custom text-[#8f9195] mb-4">
            {project.modNumber} · {project.title}
          </p>
          <div className="flex flex-wrap gap-3 justify-center items-center py-6">
            {nodes.map((n, i) => (
              <React.Fragment key={n}>
                <button
                  type="button"
                  onClick={() => {
                    playCyberClick();
                    setNode(n);
                  }}
                  className={`px-4 py-2 rounded-xl border text-sm transition-all ${
                    node === n
                      ? 'border-[#4cd9e0] bg-[#4cd9e0]/15 text-[#4cd9e0] scale-105'
                      : 'border-white/15 text-[#dce3ed] hover:border-[#4cd9e0]/40'
                  }`}
                >
                  {n}
                </button>
                {i < nodes.length - 1 && <span className="text-[#45474a] hidden sm:inline">→</span>}
              </React.Fragment>
            ))}
          </div>
          <ul className="mt-4 space-y-2">
            {project.architectureDetails.slice(0, 4).map((d, i) => (
              <li key={i} className="text-xs text-[#c5c6ca] flex gap-2">
                <span className="text-[#4cd9e0]">▸</span>
                {d}
              </li>
            ))}
          </ul>
        </div>
        <div className="glass-panel rounded-2xl p-6">
          <p className="text-[10px] font-mono-custom text-[#8f9195] mb-3">NODE INSPECTOR</p>
          {node && meta ? (
            <div className="space-y-4">
              <h3 className="text-xl text-[#4cd9e0] font-mono-custom">{node}</h3>
              <div>
                <p className="text-[10px] text-[#8f9195] tracking-widest">PURPOSE</p>
                <p className="text-sm text-[#dce3ed]">{meta.purpose}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#8f9195] tracking-widest">WHY</p>
                <p className="text-sm text-[#dce3ed]">{meta.why}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#8f9195] tracking-widest">TRADE-OFF</p>
                <p className="text-sm text-[#dce3ed]">{meta.tradeoff}</p>
              </div>
            </div>
          ) : node ? (
            <p className="text-sm text-[#c5c6ca]">
              <span className="text-[#4cd9e0] font-mono-custom">{node}</span> — used in {project.title}. See
              architecture pillars for project-specific context.
            </p>
          ) : (
            <p className="text-sm text-[#8f9195]">
              Click a technology node to inspect purpose, rationale, and trade-offs.
            </p>
          )}
          {project.decisions && project.decisions[0] && (
            <div className="mt-6 pt-4 border-t border-white/10">
              <p className="text-[10px] font-mono-custom text-[#9ecafd] mb-2">LINKED DECISION</p>
              <p className="text-xs text-[#4cd9e0]">{project.decisions[0].question}</p>
              <p className="text-xs text-[#c5c6ca] mt-1">{project.decisions[0].reason}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
