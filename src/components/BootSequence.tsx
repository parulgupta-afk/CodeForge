import React, { useEffect, useState } from 'react';
import { PROFILE } from '../data/portfolioData';

interface BootSequenceProps {
  onComplete: () => void;
  onSkip: () => void;
}

export const BootSequence: React.FC<BootSequenceProps> = ({ onComplete, onSkip }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      onComplete();
      return;
    }
    let p = 0;
    const id = setInterval(() => {
      p += 8;
      setProgress(Math.min(p, 100));
      if (p >= 100) {
        clearInterval(id);
        setTimeout(onComplete, 250);
      }
    }, 60);
    return () => clearInterval(id);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[200] bg-[#070b10] flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-3xl sm:text-4xl font-semibold text-white mb-2">{PROFILE.name}</h1>
        <p className="text-[#9aa3b2] text-sm mb-8">{PROFILE.role}</p>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-[#4cd9e0] transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <button type="button" onClick={onSkip} className="mt-8 text-xs text-[#8b95a5] hover:text-white">
          Skip
        </button>
      </div>
    </div>
  );
};
