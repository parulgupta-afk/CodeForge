import React, { useState } from 'react';
import { answerPortfolioQuery } from '../lib/portfolioKnowledge';
import { askPortfolioAgent } from '../services/geminiAgent';
import { PROJECTS_DATA } from '../data/portfolioData';
import type { ProjectItem } from '../types';
import { playCyberClick, playTerminalChirp } from '../utils/audioSynth';

interface AIAgentProps {
  open: boolean;
  onClose: () => void;
  onSelectProject: (p: ProjectItem) => void;
  onNavigate: (id: string) => void;
}

const SUGGESTIONS = [
  'What project best demonstrates distributed systems?',
  'Which projects use Redis?',
  'Show AI / RAG projects',
  'How do I contact Parul?',
  'Explain PulseOps architecture',
];

export const AIAgent: React.FC<AIAgentProps> = ({ open, onClose, onSelectProject, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState(() => answerPortfolioQuery(''));
  const [source, setSource] = useState<'api' | 'local' | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const run = async (q: string) => {
    playTerminalChirp();
    setQuery(q);
    setBusy(true);
    try {
      const a = await askPortfolioAgent(q);
      setAnswer(a);
      setSource(a.source);
    } catch {
      setAnswer(answerPortfolioQuery(q));
      setSource('local');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[92] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto glass-panel rounded-2xl border border-[#4cd9e0]/25">
        <div className="sticky top-0 flex justify-between items-center px-5 py-4 border-b border-white/10 bg-[#0d141b]/95">
          <div>
            <p className="text-[10px] font-mono-custom tracking-[0.2em] text-[#4cd9e0]">AI_PORTFOLIO_AGENT</p>
            <h2 className="text-lg font-semibold">Ask the engineering graph</h2>
          </div>
          <button type="button" onClick={onClose} className="text-[#8f9195] hover:text-white text-sm">
            ✕
          </button>
        </div>
        <div className="p-5 space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run(query);
            }}
            className="flex gap-2"
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. best backend project with queues…"
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#4cd9e0]/50"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#4cd9e0] text-[#002021] text-sm font-semibold"
            >
              Query
            </button>
          </form>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => run(s)}
                className="text-[11px] px-2.5 py-1 rounded-full border border-white/10 text-[#c5c6ca] hover:border-[#4cd9e0]/40"
              >
                {s}
              </button>
            ))}
          </div>
          <div className="rounded-xl border border-white/10 p-4 space-y-3">
            <p className="text-[10px] font-mono-custom text-[#8f9195]">INTENT · {answer.intent}</p>
            <p className="text-sm text-[#dce3ed]">{answer.summary}</p>
            <ul className="space-y-1.5">
              {answer.bullets.map((b, i) => (
                <li key={i} className="text-xs text-[#c5c6ca] flex gap-2">
                  <span className="text-[#4cd9e0]">▸</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            {answer.projects.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {answer.projects.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      playCyberClick();
                      onSelectProject(p);
                      onClose();
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg border border-[#4cd9e0]/30 text-[#4cd9e0] hover:bg-[#4cd9e0]/10"
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              {answer.actions.map((a, i) => (
                <button
                  key={i}
                  type="button"
                  className="text-[11px] px-2 py-1 rounded border border-white/15 text-[#80d4d8]"
                  onClick={() => {
                    playCyberClick();
                    if (a.type === 'OPEN_PROJECT') {
                      const p = PROJECTS_DATA.find((x) => x.id === a.payload);
                      if (p) onSelectProject(p);
                      onClose();
                    } else if (a.type === 'NAVIGATE') {
                      onNavigate(a.payload);
                      onClose();
                    } else {
                      window.open(a.payload, '_blank', 'noopener,noreferrer');
                    }
                  }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
          <p className="text-[10px] text-[#45474a] font-mono-custom">
            {source === 'api' ? 'Grounded via portfolio-api + Gemini' : 'Local portfolioKnowledge retriever'}{' '}
            · no fabricated projects · {busy ? 'thinking…' : 'ready'}
          </p>
        </div>
      </div>
    </div>
  );
};
