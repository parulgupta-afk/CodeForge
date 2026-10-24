import React, { useState } from 'react';
import { Box, Code2, Server, Layout } from 'lucide-react';
import { CAPABILITIES_DATA } from '../data/portfolioData';
import { playCyberClick } from '../utils/audioSynth';

export const CapabilitiesSection: React.FC = () => {
  const [selectedCap, setSelectedCap] = useState<string | null>(null);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'view_in_ar':
        return <Box className="w-6 h-6 text-[#4cd9e0]" />;
      case 'code_blocks':
        return <Code2 className="w-6 h-6 text-[#80d4d8]" />;
      case 'architecture':
        return <Server className="w-6 h-6 text-[#9ecafd]" />;
      case 'design_services':
      default:
        return <Layout className="w-6 h-6 text-[#4cd9e0]" />;
    }
  };

  return (
    <section id="capabilities" className="py-20 sm:py-28 relative border-b border-white/5">
      <div className="px-4 sm:px-8 md:px-12 lg:px-16 max-w-[1440px] mx-auto">
        {/* Section Header */}
        <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-8 gap-4">
          <div>
            <h2 className="font-bodoni text-4xl sm:text-5xl text-[#dce3ed] mb-2 font-bold tracking-tight">
              Performance Matrix
            </h2>
            <p className="font-code-md text-xs uppercase tracking-widest text-[#4cd9e0]/80 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#4cd9e0] rounded-full animate-ping" />
              SYS_METRICS_DASHBOARD
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-1 font-code-md text-[10px] text-[#c5c6ca]/60">
            <span>LOAD_AVG: [0.14, 0.08, 0.05]</span>
            <span className="text-[#4cd9e0]">UPTIME: 99.999% // ACTIVE</span>
          </div>
        </div>

        {/* 4-Column Matrix Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {CAPABILITIES_DATA.map((cap) => {
            const isSelected = selectedCap === cap.id;

            return (
              <div
                key={cap.id}
                id={`capability-${cap.id}`}
                onClick={() => {
                  playCyberClick(820);
                  setSelectedCap(isSelected ? null : cap.id);
                }}
                className={`glass-panel p-6 sm:p-7 rounded-xl border-white/10 hover:bg-white/[0.03] transition-all duration-300 relative group glow-hover cursor-pointer flex flex-col justify-between ${
                  isSelected ? 'border-[#4cd9e0]/50 shadow-[0_0_24px_rgba(76,217,224,0.2)]' : ''
                }`}
              >
                {/* Capability Code */}
                <div className="absolute top-4 right-4 text-[10px] font-code-md text-[#4cd9e0]/70">
                  {cap.code}
                </div>

                <div>
                  {/* Top Bar with Icon & Animated Oscilloscope */}
                  <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                    <div className="p-2 rounded-lg bg-white/[0.03] border border-white/10">
                      {getIcon(cap.icon)}
                    </div>

                    <div className="oscilloscope">
                      <div className="osc-bar" style={{ backgroundColor: cap.accentColor }} />
                      <div className="osc-bar" style={{ backgroundColor: cap.accentColor }} />
                      <div className="osc-bar" style={{ backgroundColor: cap.accentColor }} />
                      <div className="osc-bar" style={{ backgroundColor: cap.accentColor }} />
                      <div className="osc-bar" style={{ backgroundColor: cap.accentColor }} />
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h4 className="font-code-md text-sm sm:text-base uppercase tracking-wider text-[#dce3ed] mb-2 font-bold group-hover:text-[#4cd9e0] transition-colors">
                    {cap.title}
                  </h4>
                  <p className="font-body-sm text-xs sm:text-sm text-[#c5c6ca] mb-6 leading-relaxed">
                    {cap.description}
                  </p>
                </div>

                <div>
                  {/* Progress Gauge */}
                  <div className="w-full bg-white/5 h-[3px] relative overflow-hidden rounded-full">
                    <div
                      className="h-full absolute left-0 top-0 transition-all duration-1000"
                      style={{
                        width: `${cap.capacity}%`,
                        backgroundColor: cap.accentColor,
                        boxShadow: `0 0 8px ${cap.accentColor}`,
                      }}
                    />
                  </div>

                  <div className="mt-3 flex justify-between items-center font-code-md text-[10px]">
                    <span className="text-[#c5c6ca]/50">EFFICIENCY</span>
                    <span style={{ color: cap.accentColor }} className="font-bold">
                      CAPACITY: {cap.capacity}%
                    </span>
                  </div>

                  {/* Expandable Sub-metrics */}
                  {isSelected && (
                    <div className="mt-4 pt-3 border-t border-white/10 space-y-1 text-[11px] font-code-md text-[#c5c6ca]">
                      {cap.subMetrics.map((sm, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span className="text-[#c5c6ca]/60">{sm.label}:</span>
                          <span className="text-[#4cd9e0] font-semibold">{sm.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
