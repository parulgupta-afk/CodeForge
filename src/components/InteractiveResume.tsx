import React, { useMemo, useState } from 'react';
import { PROFILE, EXPERIENCE_DATA, PROJECTS_DATA, CAPABILITIES_DATA } from '../data/portfolioData';
import { playCyberClick } from '../utils/audioSynth';

type Variant = 'one-page' | 'technical' | 'recruiter' | 'ai';

export const InteractiveResume: React.FC = () => {
  const [variant, setVariant] = useState<Variant>('technical');

  const body = useMemo(() => {
    const header = `${PROFILE.name}\n${PROFILE.role}\n${PROFILE.email}\n${PROFILE.github}\n`;
    if (variant === 'one-page') {
      return (
        header +
        '\nSUMMARY\nFull-stack developer focused on product systems: realtime, queues, RAG, and polished React UIs.\n\n' +
        'TOP MODULES\n' +
        PROJECTS_DATA.slice(0, 4)
          .map((p) => `· ${p.title} — ${p.tagline}`)
          .join('\n') +
        '\n\nEXPERIENCE\n' +
        EXPERIENCE_DATA.map((e) => `· ${e.role} @ ${e.company} (${e.period})`).join('\n')
      );
    }
    if (variant === 'recruiter') {
      return (
        header +
        '\nROLE FIT: Full Stack / Backend / AI Product\n\n' +
        'HIGHLIGHTS\n' +
        '· PulseOps — incident platform (Redis, BullMQ, Socket.io, OTel)\n' +
        '· Pocket-Triage — RAG first-aid triage (pgvector, workers)\n' +
        '· 1000+ DSA · CGPA 8.90\n\n' +
        CAPABILITIES_DATA.map((c) => `· ${c.title}: ${c.capacity}%`).join('\n')
      );
    }
    if (variant === 'ai') {
      return (
        header +
        '\nAI / SYSTEMS EMPHASIS\n' +
        PROJECTS_DATA.filter(
          (p) => p.roleFit?.includes('ai') || p.tags.some((t) => /gemini|rag|pgvector/i.test(t))
        )
          .map((p) => `· ${p.title}\n  ${p.architectureDetails.slice(0, 2).join('\n  ')}`)
          .join('\n\n')
      );
    }
    // technical
    return (
      header +
      '\nTECHNICAL PROJECTS\n\n' +
      PROJECTS_DATA.map(
        (p) =>
          `${p.title} (${p.modNumber})\n${p.fullOverview.slice(0, 280)}…\nStack: ${p.tags.join(', ')}\n` +
          (p.githubUrl ? `Repo: ${p.githubUrl}\n` : '')
      ).join('\n') +
      '\nEXPERIENCE\n' +
      EXPERIENCE_DATA.map(
        (e) => `${e.role} — ${e.company}\n` + e.bullets.map((b) => `  - ${b}`).join('\n')
      ).join('\n\n')
    );
  }, [variant]);

  const copy = async () => {
    playCyberClick();
    try {
      await navigator.clipboard.writeText(body);
    } catch {
      /* ignore */
    }
  };

  return (
    <section
      id="resume"
      className="relative z-10 px-4 sm:px-8 md:px-12 lg:px-16 py-16 max-w-[1440px] mx-auto"
    >
      <p className="text-[10px] font-mono-custom tracking-[0.25em] text-[#4cd9e0]">INTERACTIVE_RESUME</p>
      <h2 className="text-3xl font-bodoni text-white mt-1 mb-4">Export-oriented variants</h2>
      <div className="flex flex-wrap gap-2 mb-4">
        {(
          [
            ['one-page', '1 PAGE'],
            ['technical', 'TECHNICAL'],
            ['recruiter', 'RECRUITER'],
            ['ai', 'AI ENGINEER'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              playCyberClick();
              setVariant(id);
            }}
            className={`text-xs px-3 py-1.5 rounded-full border ${
              variant === id
                ? 'border-[#4cd9e0] text-[#4cd9e0] bg-[#4cd9e0]/10'
                : 'border-white/10 text-[#c5c6ca]'
            }`}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={copy}
          className="text-xs px-3 py-1.5 rounded-full border border-white/15 text-[#80d4d8]"
        >
          COPY TEXT
        </button>
      </div>
      <pre className="glass-panel rounded-2xl p-5 text-[11px] font-mono-custom text-[#c5c6ca] whitespace-pre-wrap leading-relaxed max-h-[480px] overflow-y-auto">
        {body}
      </pre>
      <p className="text-[10px] text-[#45474a] mt-2 font-mono-custom">
        Generated only from portfolioData — no invented metrics
      </p>
    </section>
  );
};
