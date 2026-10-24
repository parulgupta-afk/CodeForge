import React from 'react';
import { ArrowRight, Github, FileText } from 'lucide-react';
import { playCyberClick } from '../utils/audioSynth';
import { PROJECTS_DATA, PROFILE } from '../data/portfolioData';

interface HeroSectionProps {
  onInitSequence: () => void;
  onExploreProjects: () => void;
}

const FLAGSHIP = ['priceloop', 'codeforge', 'pulseops'];

export const HeroSection: React.FC<HeroSectionProps> = ({ onExploreProjects }) => {
  const flagship = PROJECTS_DATA.filter((p) => FLAGSHIP.includes(p.id));
  const projectCount = PROJECTS_DATA.filter((p) => p.tier).length;

  return (
    <header
      id="hero"
      className="relative min-h-[90vh] flex items-center pt-24 pb-16 px-4 sm:px-8 md:px-12 lg:px-16 border-b border-white/[0.06]"
    >
      <div className="relative z-10 w-full max-w-6xl mx-auto grid lg:grid-cols-[1.2fr_0.8fr] gap-10 lg:gap-14 items-center">
        <div>
          <p className="text-xs font-mono-custom tracking-[0.2em] text-[#5eb8c8] mb-4 uppercase">
            Software Engineer
          </p>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold text-white tracking-tight">
            {PROFILE.name}
          </h1>
          <p className="mt-3 text-lg sm:text-xl text-[#a8b3c4]">Full Stack · AI · Systems</p>
          <p className="mt-6 text-base sm:text-lg text-[#8b95a5] max-w-xl leading-relaxed">
            {PROFILE.tagline}
          </p>
          <p className="mt-3 text-sm text-[#6b7380] max-w-xl">
            I don&apos;t only build interfaces. I engineer the systems behind them.
          </p>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs font-mono-custom text-[#8b95a5]">
            <div>
              <span className="text-[10px] tracking-widest text-[#6b7380] block mb-0.5">WHY ME</span>
              <span className="text-[#e8edf4]">3 flagship systems</span>
            </div>
            <div>
              <span className="text-[10px] tracking-widest text-[#6b7380] block mb-0.5">SCOPE</span>
              <span className="text-[#e8edf4]">Full-stack · Backend · AI</span>
            </div>
            <div>
              <span className="text-[10px] tracking-widest text-[#6b7380] block mb-0.5">PROOF</span>
              <span className="text-[#e8edf4]">Architecture → implementation → source</span>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                playCyberClick();
                onExploreProjects();
              }}
              className="inline-flex items-center gap-2 bg-[#5eb8c8] text-[#061218] font-semibold text-sm px-5 py-3 rounded-lg hover:bg-[#7dd3e0] transition-colors"
            >
              Explore systems
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#resume"
              className="inline-flex items-center gap-2 border border-white/15 text-[#e8edf4] text-sm px-5 py-3 rounded-lg hover:border-[#5eb8c8]/40 transition-colors"
            >
              <FileText className="w-4 h-4" />
              View resume
            </a>
            <a
              href={PROFILE.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-white/10 text-[#8b95a5] text-sm px-4 py-3 rounded-lg hover:text-white transition-colors"
            >
              <Github className="w-4 h-4" />
              GitHub
            </a>
          </div>

          <p className="mt-8 text-xs font-mono-custom text-[#6b7380] tracking-wide">
            React · TypeScript · Node · Python · PostgreSQL · Redis · AI · Docker
          </p>
        </div>

        {/* System panel — OS feel, not terminal spam */}
        <div className="panel-os p-5 sm:p-6 font-mono-custom text-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
            <span className="text-[#5eb8c8] tracking-widest">SYSTEM</span>
            <span className="text-[#9fef7a] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#9fef7a]" />
              ONLINE
            </span>
          </div>
          <dl className="space-y-2.5 text-[#8b95a5]">
            <div className="flex justify-between gap-4">
              <dt>MODE</dt>
              <dd className="text-[#e8edf4]">ENGINEERING</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>FOCUS</dt>
              <dd className="text-[#e8edf4] text-right">PRICE INTEL · AI</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>PROJECTS</dt>
              <dd className="text-[#e8edf4]">{String(projectCount).padStart(2, '0')}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>LOCATION</dt>
              <dd className="text-[#e8edf4]">{PROFILE.location}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>STATUS</dt>
              <dd className="text-[#9fef7a] text-right max-w-[60%]">Open to roles</dd>
            </div>
          </dl>
          <div className="mt-5 pt-4 border-t border-white/[0.06]">
            <p className="text-[#6b7380] mb-2 tracking-widest text-[10px]">FLAGSHIP</p>
            <ul className="space-y-1.5">
              {flagship.map((p) => (
                <li key={p.id} className="flex justify-between text-[#a8b3c4]">
                  <span className="text-[#e8edf4]">{p.title.toUpperCase()}</span>
                  <span className="text-[#6b7380] truncate max-w-[45%] text-right">
                    {p.category.split('/')[0]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-5 text-[10px] text-[#6b7380]">
            Press <kbd className="text-[#5eb8c8]">⌘K</kbd> for command center
          </p>
        </div>
      </div>
    </header>
  );
};
