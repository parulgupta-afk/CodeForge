import React, { useEffect, useState } from 'react';
import { PROJECTS_DATA } from '../data/portfolioData';
import { playCyberClick } from '../utils/audioSynth';

/** Architecture flow per flagship — from real project stacks, not invented metrics */
const FLOWS: Record<string, { name: string; purpose: string }[]> = {
  codeforge: [
    { name: 'React Studio', purpose: 'Task UI and live agent session' },
    { name: 'Socket.IO', purpose: 'Realtime transport to orchestrator' },
    { name: 'Express', purpose: 'API + orchestration host' },
    { name: 'Agent Orchestrator', purpose: 'Drive generate → run → repair loop' },
    { name: 'Gemini / Groq / Mock', purpose: 'Code generation providers' },
    { name: 'Error Classifier', purpose: 'Structure failures for repair' },
    { name: 'Repair Loop', purpose: 'Bounded autonomous fix attempts' },
    { name: 'Sandbox', purpose: 'Local subprocess or Docker isolation' },
  ],
  priceloop: [
    { name: 'React + TypeScript', purpose: 'Dashboard and product UI' },
    { name: 'FastAPI', purpose: 'JWT API, products, billing hooks' },
    { name: 'PostgreSQL', purpose: 'Users, products, listings, subscriptions' },
    { name: 'Redis + Celery', purpose: 'Broker for scheduled work (scaffold)' },
    { name: 'Stripe', purpose: 'Checkout sessions + verified webhooks' },
    { name: 'Scraper package', purpose: 'Adapters + price normalization' },
  ],
  pulseops: [
    { name: 'React client', purpose: 'Incident and on-call UI' },
    { name: 'Express API', purpose: 'Auth, incidents, scheduling' },
    { name: 'PostgreSQL', purpose: 'Source of truth + vectors where used' },
    { name: 'Redis / BullMQ', purpose: 'Jobs, pub/sub, retries' },
    { name: 'Workers', purpose: 'Notifications and async side effects' },
    { name: 'Socket.io', purpose: 'Realtime incident updates' },
  ],
};

interface SystemTraceProps {
  projectId: string | null;
  onClose: () => void;
  onOpenProject: (id: string) => void;
}

export const SystemTrace: React.FC<SystemTraceProps> = ({ projectId, onClose, onOpenProject }) => {
  const [step, setStep] = useState(0);
  const flow = projectId ? FLOWS[projectId] : null;
  const project = PROJECTS_DATA.find((p) => p.id === projectId);

  useEffect(() => {
    setStep(0);
    if (!flow) return;
    const id = setInterval(() => {
      setStep((s) => (s < flow.length - 1 ? s + 1 : s));
    }, 450);
    return () => clearInterval(id);
  }, [projectId, flow]);

  if (!projectId || !flow || !project) return null;

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0c1016] p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-[10px] font-mono-custom tracking-[0.2em] text-[#5eb8c8]">SYSTEM TRACE</p>
            <h2 className="text-xl font-semibold text-white">{project.title}</h2>
            <p className="text-xs text-[#6b7380] mt-1">
              Architecture flow from portfolio data · not live telemetry
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-[#8b95a5] text-sm" aria-label="Close">
            Close
          </button>
        </div>
        <ol className="space-y-0">
          {flow.map((node, i) => (
            <li key={node.name} className="relative pl-6 pb-4">
              {i < flow.length - 1 && (
                <span className="absolute left-[7px] top-5 bottom-0 w-px bg-white/10" />
              )}
              <span
                className={`absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border ${
                  i <= step ? 'border-[#5eb8c8] bg-[#5eb8c8]/30' : 'border-white/20 bg-transparent'
                }`}
              />
              <p className={`text-sm font-medium ${i <= step ? 'text-white' : 'text-[#6b7380]'}`}>
                {node.name}
              </p>
              <p className={`text-xs mt-0.5 ${i <= step ? 'text-[#8b95a5]' : 'text-[#45474a]'}`}>
                {node.purpose}
              </p>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            type="button"
            onClick={() => {
              playCyberClick();
              onOpenProject(projectId);
              onClose();
            }}
            className="px-4 py-2 rounded-lg bg-[#5eb8c8] text-[#061218] text-sm font-semibold"
          >
            Open project
          </button>
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg border border-white/15 text-sm text-[#e8edf4]"
            >
              Repository
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
