import React from 'react';
import { ArrowUp, Shield, Cpu, Activity, Github, Linkedin, Mail } from 'lucide-react';
import { SYSTEM_METRICS, PROFILE } from '../data/portfolioData';
import { playCyberClick } from '../utils/audioSynth';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    playCyberClick(900);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#05090c] border-t border-white/10 py-12 px-4 sm:px-8 md:px-12 lg:px-16 text-[#c5c6ca] relative z-10">
      <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        {/* Brand & Kernel Status */}
        <div className="flex flex-col items-center md:items-start gap-2 text-center md:text-left">
          <div className="font-code-md text-sm font-bold text-[#dce3ed] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#4cd9e0] shadow-[0_0_8px_rgba(76,217,224,0.8)]" />
            <span>
              {PROFILE.name.toUpperCase()} // {SYSTEM_METRICS.version}
            </span>
          </div>
          <p className="font-body-sm text-xs text-[#c5c6ca]/60 max-w-sm">
            Full stack developer. MERN, TypeScript, and Generative AI integration.
          </p>
          <div className="flex items-center gap-3 mt-1">
            <a
              href={PROFILE.github}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded border border-white/10 hover:border-[#4cd9e0]/40 text-[#c5c6ca] hover:text-[#4cd9e0] transition-colors"
            >
              <Github className="w-3.5 h-3.5" />
            </a>
            <a
              href={PROFILE.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded border border-white/10 hover:border-[#4cd9e0]/40 text-[#c5c6ca] hover:text-[#4cd9e0] transition-colors"
            >
              <Linkedin className="w-3.5 h-3.5" />
            </a>
            <a
              href={`mailto:${PROFILE.email}`}
              className="p-2 rounded border border-white/10 hover:border-[#4cd9e0]/40 text-[#c5c6ca] hover:text-[#4cd9e0] transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Real-time System Status Cluster */}
        <div className="flex flex-wrap justify-center gap-4 text-[11px] font-code-md">
          <div className="flex items-center gap-1.5 bg-[#11161d] border border-white/10 px-3 py-1.5 rounded">
            <Activity className="w-3.5 h-3.5 text-[#4cd9e0]" />
            <span>STATUS: {SYSTEM_METRICS.status}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#11161d] border border-white/10 px-3 py-1.5 rounded">
            <Cpu className="w-3.5 h-3.5 text-[#80d4d8]" />
            <span>MEMORY: {SYSTEM_METRICS.memoryAllocated}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#11161d] border border-white/10 px-3 py-1.5 rounded">
            <Shield className="w-3.5 h-3.5 text-[#4cd9e0]" />
            <span>ARCH: {SYSTEM_METRICS.profileId}</span>
          </div>
        </div>

        {/* Scroll to Top */}
        <button
          onClick={scrollToTop}
          id="btn-scroll-top"
          className="flex items-center gap-2 font-code-md text-xs uppercase text-[#4cd9e0] border border-[#4cd9e0]/30 hover:border-[#4cd9e0] px-4 py-2 rounded bg-[#4cd9e0]/5 transition-all btn-precision"
        >
          <span>Top</span>
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="max-w-[1440px] mx-auto mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center text-[10px] font-code-md text-[#c5c6ca]/40 gap-2">
        <div>
          © {new Date().getFullYear()} {PROFILE.name.toUpperCase()} // FULL STACK DEVELOPMENT
        </div>
        <div>ALL PROTOCOLS ENCRYPTED // TLS 1.3</div>
      </div>
    </footer>
  );
};
