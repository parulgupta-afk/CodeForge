import React from 'react';
import { X, RotateCcw, LayoutGrid, ArrowRight } from 'lucide-react';
import { playCyberClick } from '../utils/audioSynth';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: string;
  onNavigate: (sectionId: string) => void;
  onReplayIntro: () => void;
  currentView: 'desktop' | 'bento';
  onToggleView: (view: 'desktop' | 'bento') => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  activeSection,
  onNavigate,
  onReplayIntro,
  currentView,
  onToggleView,
}) => {
  if (!isOpen) return null;

  const links = [
    { id: 'hero', label: '[ System Home ]' },
    { id: 'about', label: '[ System Architect ]' },
    { id: 'projects', label: '[ System Modules ]' },
    { id: 'capabilities', label: '[ Performance Matrix ]' },
    { id: 'experience', label: '[ Experience Log ]' },
    { id: 'connect', label: '[ Comms_Link ]' },
  ];

  return (
    <div
      id="mobile-drawer-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          playCyberClick(500);
          onClose();
        }
      }}
      className="fixed inset-0 z-[90] bg-[#05090c]/85 backdrop-blur-xl flex justify-end"
    >
      <div className="w-[85vw] max-w-sm bg-[#0d141b] h-full border-l border-white/10 p-6 flex flex-col justify-between shadow-[0_0_50px_rgba(76,217,224,0.15)]">
        <div>
          {/* Header */}
          <div className="flex justify-between items-center pb-6 border-b border-white/10 mb-6">
            <div className="font-code-md text-xs text-[#4cd9e0] font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#4cd9e0] animate-pulse" />
              <span>PORTFOLIO_OS // MOBILE</span>
            </div>
            <button
              onClick={() => {
                playCyberClick(500);
                onClose();
              }}
              className="p-1.5 rounded text-[#c5c6ca] hover:text-[#4cd9e0] border border-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Links */}
          <div className="space-y-4">
            {links.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => {
                    playCyberClick(800);
                    onNavigate(link.id);
                    onClose();
                  }}
                  className={`w-full text-left font-code-md text-sm uppercase py-2 px-3 rounded flex items-center justify-between transition-colors ${
                    isActive
                      ? 'bg-[#4cd9e0]/10 text-[#4cd9e0] font-bold border border-[#4cd9e0]/30'
                      : 'text-[#c5c6ca] hover:text-[#4cd9e0] hover:bg-white/[0.02]'
                  }`}
                >
                  <span>{link.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="pt-6 border-t border-white/10 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                playCyberClick(900);
                onToggleView(currentView === 'desktop' ? 'bento' : 'desktop');
                onClose();
              }}
              className="flex items-center justify-center gap-2 font-code-md text-xs py-2.5 px-3 rounded border border-white/10 text-[#c5c6ca] hover:text-[#4cd9e0]"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-[#4cd9e0]" />
              <span>{currentView === 'desktop' ? 'Bento View' : 'Full OS'}</span>
            </button>

            <button
              onClick={() => {
                playCyberClick(1000);
                onReplayIntro();
                onClose();
              }}
              className="flex items-center justify-center gap-2 font-code-md text-xs py-2.5 px-3 rounded border border-white/10 text-[#c5c6ca] hover:text-[#4cd9e0]"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#80d4d8]" />
              <span>Reboot Intro</span>
            </button>
          </div>

          <div className="font-code-md text-[10px] text-[#c5c6ca]/50 text-center pt-2">
            SYS_STATUS: OPTIMAL // UPTIME: 99.999%
          </div>
        </div>
      </div>
    </div>
  );
};
