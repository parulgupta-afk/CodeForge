import React from 'react';
import { PROFILE } from '../data/portfolioData';

export const ContactCTA: React.FC = () => (
  <section id="connect" className="px-4 sm:px-8 md:px-12 lg:px-16 py-20 border-b border-white/[0.06]">
    <div className="max-w-3xl mx-auto text-center">
      <p className="text-[10px] font-mono-custom tracking-[0.25em] text-[#5eb8c8] mb-3">CONTACT</p>
      <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-3">Build something?</h2>
      <p className="text-[#8b95a5] text-base mb-8 max-w-lg mx-auto">
        Open to software engineering, full stack, backend, and AI systems roles.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <a
          href={`mailto:${PROFILE.email}`}
          className="px-5 py-3 rounded-lg bg-[#5eb8c8] text-[#061218] text-sm font-semibold hover:bg-[#7dd3e0]"
        >
          Email
        </a>
        <a
          href={PROFILE.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-3 rounded-lg border border-white/15 text-sm text-[#e8edf4] hover:border-[#5eb8c8]/40"
        >
          LinkedIn
        </a>
        <a
          href={PROFILE.github}
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-3 rounded-lg border border-white/15 text-sm text-[#e8edf4] hover:border-[#5eb8c8]/40"
        >
          GitHub
        </a>
        <a
          href="#resume"
          className="px-5 py-3 rounded-lg border border-white/15 text-sm text-[#e8edf4] hover:border-[#5eb8c8]/40"
        >
          Resume
        </a>
      </div>
    </div>
  </section>
);
