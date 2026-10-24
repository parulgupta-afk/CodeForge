import React from 'react';
import { ProjectItem } from '../types';
import { PROJECTS_DATA, PROFILE } from '../data/portfolioData';
import { ArrowUpRight, Activity, Layers } from 'lucide-react';
import { playCyberClick } from '../utils/audioSynth';

interface BentoOverviewProps {
  onSelectProject: (project: ProjectItem) => void;
  onNavigateSection: (sectionId: string) => void;
}

export const BentoOverview: React.FC<BentoOverviewProps> = ({ onSelectProject, onNavigateSection }) => {
  return (
    <div className="py-24 sm:py-28 px-4 sm:px-8 md:px-12 lg:px-16 max-w-[1440px] mx-auto">
      {/* Bento Header */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-6 gap-4">
        <div>
          <span className="font-code-md text-xs text-[#4cd9e0] uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#4cd9e0] animate-pulse" />
            BENTO_GRID // CONCENTRATED SYSTEM ARCHITECTURE
          </span>
          <h2 className="font-bodoni text-3xl sm:text-5xl text-[#dce3ed] font-bold mt-1">
            System Operations Overview
          </h2>
        </div>
        <div className="font-code-md text-xs text-[#c5c6ca]/60">
          LAYOUT_MODE: MODULAR_BENTO // {PROJECTS_DATA.length + 2} NODES
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[240px]">
        {/* Cell 1: Large Hero Project (Neural Mesh / Spatial) - 2x2 on lg */}
        <div
          onClick={() => {
            playCyberClick(850);
            onSelectProject(PROJECTS_DATA[3]);
          }}
          className="md:col-span-2 lg:col-span-2 md:row-span-2 glass-panel rounded-2xl p-6 sm:p-8 relative overflow-hidden border-white/15 group cursor-pointer glow-hover flex flex-col justify-between"
        >
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-700 mix-blend-screen"
            style={{ backgroundImage: `url('${PROJECTS_DATA[3].imageUrl}')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05090c] via-[#05090c]/40 to-transparent" />
          <div className="scan-line" />

          {/* Top Tag */}
          <div className="relative z-10 flex justify-between items-start">
            <div className="font-code-md text-xs bg-[#05090c]/90 border border-[#4cd9e0]/40 text-[#4cd9e0] px-3 py-1 rounded">
              FEATURED // {PROJECTS_DATA[3].modNumber}
            </div>
            <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-[#dce3ed] group-hover:border-[#4cd9e0] group-hover:text-[#4cd9e0] transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          {/* Bottom Info */}
          <div className="relative z-10">
            <h3 className="font-bodoni text-3xl sm:text-4xl text-white font-bold mb-2 group-hover:text-[#4cd9e0] transition-colors">
              {PROJECTS_DATA[3].title}
            </h3>
            <p className="font-body-sm text-[#c5c6ca] text-sm sm:text-base line-clamp-2 max-w-lg mb-4">
              {PROJECTS_DATA[3].description}
            </p>
            <div className="flex gap-2">
              {PROJECTS_DATA[3].tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="font-code-md text-[10px] bg-[#05090c]/80 border border-white/10 px-2 py-0.5 rounded text-[#80d4d8]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Cell 2: System Architect Ethos Card */}
        <div
          onClick={() => {
            playCyberClick(700);
            onNavigateSection('about');
          }}
          className="md:col-span-1 lg:col-span-2 glass-panel rounded-2xl p-6 relative overflow-hidden border-white/10 group cursor-pointer glow-hover flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <div className="font-code-md text-xs text-[#4cd9e0] uppercase tracking-widest flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span>{PROFILE.handle} // Core Ethos</span>
            </div>
            <span className="font-code-md text-[10px] text-[#80d4d8]">{PROFILE.role.toUpperCase()}</span>
          </div>

          <p className="font-body-sm text-sm text-[#c5c6ca] leading-relaxed my-2">
            &ldquo;Ship the whole thing — frontend, backend, and the AI wired in between.&rdquo;
          </p>

          <div className="flex justify-between items-center text-xs font-code-md text-[#4cd9e0]">
            <span>EXPLORE PHILOSOPHY</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Cell 3: Live System Telemetry Card */}
        <div className="md:col-span-1 lg:col-span-1 glass-panel rounded-2xl p-6 border-white/10 flex flex-col justify-between">
          <div className="flex justify-between items-center text-xs font-code-md text-[#4cd9e0]">
            <span>SYS_METRICS</span>
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div className="my-2">
            <div className="font-bodoni text-3xl text-white font-bold">99.999%</div>
            <div className="font-code-md text-[11px] text-[#c5c6ca]/60 mt-1">GLOBAL UPTIME SLA</div>
          </div>
          <div className="font-code-md text-[10px] text-[#80d4d8] pt-2 border-t border-white/5 flex justify-between">
            <span>PING: 4ms</span>
            <span>MEM: 64%</span>
          </div>
        </div>

        {/* Cell 4: SkyCall Module */}
        <div
          onClick={() => {
            playCyberClick(800);
            onSelectProject(PROJECTS_DATA[0]);
          }}
          className="md:col-span-1 lg:col-span-1 glass-panel rounded-2xl p-6 border-white/10 group cursor-pointer glow-hover flex flex-col justify-between relative overflow-hidden"
        >
          <div className="flex justify-between items-start">
            <span className="font-code-md text-[10px] text-[#4cd9e0] bg-[#4cd9e0]/10 border border-[#4cd9e0]/20 px-2 py-0.5 rounded">
              {PROJECTS_DATA[0].modNumber}
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#c5c6ca] group-hover:text-[#4cd9e0]" />
          </div>
          <div>
            <h4 className="font-bodoni text-xl text-white font-bold group-hover:text-[#4cd9e0] transition-colors">
              {PROJECTS_DATA[0].title}
            </h4>
            <p className="font-body-sm text-xs text-[#c5c6ca] line-clamp-2 mt-1">
              Real-time flight meta-search across 300+ airlines, AI travel concierge.
            </p>
          </div>
          <div className="font-code-md text-[10px] text-[#80d4d8]">
            HEALTH: {PROJECTS_DATA[0].metrics.health}
          </div>
        </div>

        {/* Cell 5: NutriVibe Module */}
        <div
          onClick={() => {
            playCyberClick(800);
            onSelectProject(PROJECTS_DATA[1]);
          }}
          className="md:col-span-1 lg:col-span-2 glass-panel rounded-2xl p-6 border-white/10 group cursor-pointer glow-hover flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <span className="font-code-md text-[10px] text-[#80d4d8] bg-[#80d4d8]/10 border border-[#80d4d8]/20 px-2 py-0.5 rounded">
              {PROJECTS_DATA[1].modNumber} // HEALTH
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#c5c6ca] group-hover:text-[#80d4d8]" />
          </div>
          <div>
            <h4 className="font-bodoni text-2xl text-white font-bold group-hover:text-[#80d4d8] transition-colors">
              {PROJECTS_DATA[1].title}
            </h4>
            <p className="font-body-sm text-xs sm:text-sm text-[#c5c6ca] mt-1">
              Barcode/label scanning with AI-generated safety verdicts for allergies & medications.
            </p>
          </div>
          <div className="flex justify-between font-code-md text-[10px] text-[#c5c6ca]/60">
            <span>MERN // GEMINI API</span>
            <span className="text-[#80d4d8]">EXEC: {PROJECTS_DATA[1].metrics.exec}</span>
          </div>
        </div>

        {/* Cell 6: PulseOps Module */}
        <div
          onClick={() => {
            playCyberClick(800);
            onSelectProject(PROJECTS_DATA[2]);
          }}
          className="md:col-span-2 lg:col-span-2 glass-panel rounded-2xl p-6 border-white/10 group cursor-pointer glow-hover flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <span className="font-code-md text-[10px] text-[#ffb4ab] bg-[#ffb4ab]/10 border border-[#ffb4ab]/20 px-2 py-0.5 rounded">
              {PROJECTS_DATA[2].modNumber} // URGENT
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#c5c6ca] group-hover:text-[#ffb4ab]" />
          </div>
          <div>
            <h4 className="font-bodoni text-2xl text-white font-bold group-hover:text-[#ffb4ab] transition-colors">
              {PROJECTS_DATA[2].title}
            </h4>
            <p className="font-body-sm text-xs sm:text-sm text-[#c5c6ca] mt-1">
              Crowdsourced live hazard/SOS map with community-confirmed corroboration.
            </p>
          </div>
          <div className="flex justify-between font-code-md text-[10px] text-[#c5c6ca]/60">
            <span>SUPABASE // REALTIME</span>
            <span className="text-[#ffb4ab]">STATUS: {PROJECTS_DATA[2].metrics.health}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
