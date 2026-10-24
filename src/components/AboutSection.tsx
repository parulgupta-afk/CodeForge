import React from 'react';
import { PROFILE } from '../data/portfolioData';

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="py-16 sm:py-20 border-b border-white/[0.06]">
      <div className="px-4 sm:px-8 md:px-12 lg:px-16 max-w-5xl mx-auto">
        <p className="text-[10px] font-mono-custom tracking-[0.25em] text-[#5eb8c8] mb-2">ABOUT</p>
        <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-3">Engineering approach</h2>
        <p className="text-[#5eb8c8] text-sm mb-8">{PROFILE.education}</p>

        <div className="space-y-5 text-base text-[#a8b3c4] leading-relaxed max-w-3xl">
          <p>
            I take products from idea through interface, API, data, and deployment. That includes
            authentication, payments where needed, background jobs, realtime updates, and AI features when
            generation or retrieval improves the product — not as decoration.
          </p>
          <p>
            Recent systems work: <span className="text-white">Priceloop</span> (tracking + Stripe + Postgres),{' '}
            <span className="text-white">CodeForge</span> (agent orchestration + sandbox execution),{' '}
            <span className="text-white">PulseOps</span> (queues and incident workflows), and{' '}
            <span className="text-white">Pocket-Triage</span> (retrieval-grounded assistance).
          </p>
          <p>
            I prefer honest scope, typed boundaries, tests where they protect critical paths, and architecture
            you can explain under interview pressure. {PROFILE.dsa}.
          </p>
        </div>
      </div>
    </section>
  );
};
