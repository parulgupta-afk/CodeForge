import React, { useState, useEffect } from 'react';
import { X, Zap, ArrowUpRight, Play, RefreshCw } from 'lucide-react';
import { ProjectItem } from '../types';
import { playCyberClick, playTerminalChirp } from '../utils/audioSynth';

interface ProjectModalProps {
  project: ProjectItem | null;
  onClose: () => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ project, onClose }) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'telemetry' | 'sandbox'>('architecture');
  const [simulatedPing, setSimulatedPing] = useState(12);
  const [simulatedLog, setSimulatedLog] = useState<string[]>([]);
  const [isRunningTest, setIsRunningTest] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (project) {
      setSimulatedPing(parseInt(project.metrics.exec) || 12);
      setSimulatedLog([
        `[00:00:01] Initializing module runtime for ${project.title}...`,
        `[00:00:02] Binding ${project.tags.join(', ')} protocols...`,
        `[00:00:03] Health check returned ${project.metrics.health} status.`,
      ]);
    }
  }, [project]);

  if (!project) return null;

  const runDiagnostics = () => {
    setIsRunningTest(true);
    playTerminalChirp();
    setTimeout(() => {
      const ping = Math.floor(Math.random() * 8) + 6;
      setSimulatedPing(ping);
      setSimulatedLog((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Demo latency sample: ${ping}ms execution response. Demo diagnostic complete.`,
      ]);
      setIsRunningTest(false);
    }, 600);
  };

  return (
    <div
      id="project-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          playCyberClick(600);
          onClose();
        }
      }}
      className="fixed inset-0 z-[80] bg-[#05090c]/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      <div
        id="project-modal-panel"
        className="glass-panel w-full max-w-4xl rounded-2xl border border-white/15 overflow-hidden shadow-[0_0_50px_rgba(76,217,224,0.15)] flex flex-col my-auto max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="bg-[#11161d] px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#4cd9e0] animate-pulse" />
            <span className="font-code-md text-xs uppercase tracking-widest text-[#4cd9e0]">
              {project.modNumber} // {project.category}
            </span>
            <span className="text-white/20">|</span>
            <h3 className="font-bodoni text-xl font-bold text-[#dce3ed]">{project.title}</h3>
          </div>
          <button
            id="btn-close-project-modal"
            onClick={() => {
              playCyberClick(500);
              onClose();
            }}
            className="p-1.5 rounded-lg border border-white/10 hover:border-[#4cd9e0]/40 text-[#c5c6ca] hover:text-[#4cd9e0] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Banner Image Preview */}
          <div className="relative h-64 sm:h-72 w-full rounded-xl overflow-hidden border border-white/10 bg-[#0d141b] group">
            <img
              src={project.imageUrl}
              alt={project.title}
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#05090c] via-transparent to-transparent opacity-80" />
            <div className="scan-line" />

            {/* Float Overlay Badges */}
            <div className="absolute top-4 right-4 flex gap-2">
              <span className="font-code-md text-[11px] bg-[#05090c]/90 border border-[#4cd9e0]/40 text-[#4cd9e0] px-3 py-1 rounded">
                HEALTH: {project.metrics.health}
              </span>
              <span className="font-code-md text-[11px] bg-[#05090c]/90 border border-white/10 text-[#c5c6ca] px-3 py-1 rounded">
                EXEC: {project.metrics.exec}
              </span>
            </div>

            <div className="absolute bottom-4 left-4 right-4">
              <h2 className="font-bodoni text-2xl sm:text-3xl text-white font-bold mb-1">{project.title}</h2>
              <p className="font-body-sm text-[#80d4d8] text-sm">{project.tagline}</p>
            </div>
          </div>

          {/* Navigation Tabs inside Modal */}
          <div className="flex border-b border-white/10 gap-6 font-code-md text-xs uppercase tracking-wider">
            <button
              onClick={() => {
                playCyberClick(700);
                setActiveTab('architecture');
              }}
              className={`pb-3 font-semibold transition-all ${
                activeTab === 'architecture'
                  ? 'text-[#4cd9e0] border-b-2 border-[#4cd9e0] text-glow'
                  : 'text-[#c5c6ca]/60 hover:text-[#dce3ed]'
              }`}
            >
              [ Architecture & Design ]
            </button>
            <button
              onClick={() => {
                playCyberClick(750);
                setActiveTab('telemetry');
              }}
              className={`pb-3 font-semibold transition-all ${
                activeTab === 'telemetry'
                  ? 'text-[#4cd9e0] border-b-2 border-[#4cd9e0] text-glow'
                  : 'text-[#c5c6ca]/60 hover:text-[#dce3ed]'
              }`}
            >
              [ Metrics ]
            </button>
            <button
              onClick={() => {
                playCyberClick(800);
                setActiveTab('sandbox');
              }}
              className={`pb-3 font-semibold transition-all ${
                activeTab === 'sandbox'
                  ? 'text-[#4cd9e0] border-b-2 border-[#4cd9e0] text-glow'
                  : 'text-[#c5c6ca]/60 hover:text-[#dce3ed]'
              }`}
            >
              [ Interactive Diagnostics ]
            </button>
          </div>

          {/* Tab 1: Architecture */}
          {activeTab === 'architecture' && (
            <div className="space-y-6">
              <p className="font-body-lg text-[#c5c6ca] text-base leading-relaxed">{project.fullOverview}</p>

              <div>
                <h4 className="font-code-md text-xs uppercase tracking-widest text-[#4cd9e0] mb-3 font-bold">
                  // KEY ARCHITECTURAL PILLARS
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {project.architectureDetails.map((detail, idx) => (
                    <div
                      key={idx}
                      className="glass-panel p-4 rounded-lg border-white/5 flex items-start gap-3"
                    >
                      <span className="text-[#4cd9e0] font-code-md text-sm mt-0.5">&gt;</span>
                      <span className="font-body-sm text-[#dce3ed] text-sm leading-snug">{detail}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-code-md text-xs uppercase tracking-widest text-[#80d4d8] mb-3">
                  // DEPLOYED TECH STACK
                </h4>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="font-code-md text-xs px-3 py-1 rounded bg-white/5 border border-white/10 text-[#dce3ed] hover:border-[#4cd9e0]/40 transition-colors"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {project.decisions && project.decisions.length > 0 && (
                <div>
                  <h4 className="font-code-md text-xs uppercase tracking-widest text-[#9ecafd] mb-3 font-bold">
                    // ENGINEERING DECISIONS
                  </h4>
                  <div className="space-y-3">
                    {project.decisions.map((d, idx) => (
                      <div key={idx} className="glass-panel p-4 rounded-lg border border-white/5">
                        <p className="font-code-md text-xs text-[#4cd9e0] mb-1">{d.question}</p>
                        <p className="text-xs text-[#8f9195] mb-2">Problem: {d.problem}</p>
                        <p className="text-sm text-[#dce3ed]">
                          <span className="text-[#80d4d8]">Chosen:</span> {d.chosen}
                        </p>
                        <p className="text-xs text-[#c5c6ca] mt-1 leading-relaxed">{d.reason}</p>
                      </div>
                    ))}
                  </div>
                  {project.id === 'codeforge' && (
                    <div className="mt-4 p-4 rounded-lg border border-[#5eb8c8]/20 bg-[#5eb8c8]/5">
                      <p className="font-code-md text-[10px] uppercase tracking-widest text-[#5eb8c8] mb-2">
                        Engineering lesson
                      </p>
                      <p className="text-xs text-[#c5c6ca] leading-relaxed">
                        Local subprocess execution is useful for development but is not equivalent to
                        container isolation. CodeForge explicitly distinguishes execution convenience from a
                        security boundary.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Telemetry */}
          {activeTab === 'telemetry' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="glass-panel p-4 rounded-xl border-white/5">
                  <span className="font-code-md text-[10px] text-[#4cd9e0] uppercase">Latency</span>
                  <div className="font-bodoni text-xl text-white font-bold mt-1">{project.specs.latency}</div>
                </div>
                <div className="glass-panel p-4 rounded-xl border-white/5">
                  <span className="font-code-md text-[10px] text-[#80d4d8] uppercase">Concurrency</span>
                  <div className="font-bodoni text-xl text-white font-bold mt-1">
                    {project.specs.concurrency}
                  </div>
                </div>
                <div className="glass-panel p-4 rounded-xl border-white/5">
                  <span className="font-code-md text-[10px] text-[#9ecafd] uppercase">Availability</span>
                  <div className="font-bodoni text-xl text-white font-bold mt-1">
                    {project.specs.availability}
                  </div>
                </div>
                <div className="glass-panel p-4 rounded-xl border-white/5">
                  <span className="font-code-md text-[10px] text-[#ffb4ab] uppercase">Security</span>
                  <div className="font-bodoni text-xl text-white font-bold mt-1">
                    {project.specs.encryption}
                  </div>
                </div>
              </div>

              <div className="glass-panel p-4 rounded-xl border-white/5">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-code-md text-xs uppercase tracking-widest text-[#4cd9e0]">
                    Diagnostics log (demo)
                  </span>
                  <button
                    onClick={runDiagnostics}
                    disabled={isRunningTest}
                    className="flex items-center gap-1.5 font-code-md text-xs text-[#80d4d8] hover:text-[#4cd9e0] border border-white/10 px-2.5 py-1 rounded"
                  >
                    <RefreshCw className={`w-3 h-3 ${isRunningTest ? 'animate-spin' : ''}`} />
                    <span>Trigger Ping</span>
                  </button>
                </div>
                <div className="bg-[#05090c] p-3 rounded font-code-md text-xs text-[#c5c6ca] space-y-1.5 max-h-44 overflow-y-auto">
                  {simulatedLog.map((line, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="text-[#4cd9e0]">&gt;</span>
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Interactive Diagnostics */}
          {activeTab === 'sandbox' && (
            <div className="space-y-6">
              <div className="glass-panel p-6 rounded-xl border-white/5 text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-[#4cd9e0]/10 border border-[#4cd9e0]/30 flex items-center justify-center text-[#4cd9e0]">
                  <Zap className="w-6 h-6 animate-pulse" />
                </div>
                <h4 className="font-bodoni text-xl text-white font-bold">
                  {project.title} Virtual Runtime Sandbox
                </h4>
                <p className="font-body-sm text-[#c5c6ca] text-sm max-w-md mx-auto">
                  Verify endpoint health, inspect cryptographic certificates, and test live socket handshakes
                  directly against the mock kernel.
                </p>

                <div className="flex justify-center gap-4 pt-2">
                  <button
                    onClick={runDiagnostics}
                    disabled={isRunningTest}
                    className="inline-flex items-center gap-2 bg-[#4cd9e0] text-[#002021] font-code-md text-xs uppercase px-5 py-2.5 rounded font-bold hover:shadow-[0_0_15px_rgba(76,217,224,0.6)] transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isRunningTest ? 'Benchmarking...' : 'Execute Test Suite'}</span>
                  </button>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-3 gap-2 text-left font-code-md text-xs">
                  <div>
                    <span className="text-[#c5c6ca]/50 text-[10px]">CURRENT PING</span>
                    <p className="text-[#4cd9e0] font-bold">{simulatedPing} ms</p>
                  </div>
                  <div>
                    <span className="text-[#c5c6ca]/50 text-[10px]">PACKET LOSS</span>
                    <p className="text-[#80d4d8] font-bold">0.00%</p>
                  </div>
                  <div>
                    <span className="text-[#c5c6ca]/50 text-[10px]">TLS HANDSHAKE</span>
                    <p className="text-[#4cd9e0] font-bold">VERIFIED</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-[#11161d] px-6 py-4 border-t border-white/10 flex flex-wrap justify-between items-center gap-3">
          <div className="font-code-md text-[11px] text-[#c5c6ca]/60">
            SYSTEM_ID: {project.id.toUpperCase()}_v2
          </div>
          <div className="flex items-center gap-3">
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => playCyberClick(650)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded bg-white/5 hover:bg-white/10 text-[#dce3ed] font-code-md text-xs uppercase tracking-wider transition-colors border border-white/10"
              >
                <span>Source Code</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            )}
            {project.liveDemoUrl && (
              <a
                href={project.liveDemoUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => playCyberClick(650)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded bg-[#4cd9e0]/10 hover:bg-[#4cd9e0]/20 text-[#4cd9e0] font-code-md text-xs uppercase tracking-wider transition-colors border border-[#4cd9e0]/30"
              >
                <span>Live Demo</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              onClick={() => {
                playCyberClick(500);
                onClose();
              }}
              className="px-5 py-2 rounded bg-white/5 hover:bg-white/10 text-white font-code-md text-xs uppercase tracking-wider transition-colors border border-white/10"
            >
              Close Inspector
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
