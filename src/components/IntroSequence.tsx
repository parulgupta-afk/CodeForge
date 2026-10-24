import React, { useEffect } from 'react';
import { playTransmitSuccess } from '../utils/audioSynth';
import { PROFILE } from '../data/portfolioData';

interface IntroSequenceProps {
  onComplete: () => void;
  onSkip: () => void;
}

/** Short name reveal — no jargon. */
export const IntroSequence: React.FC<IntroSequenceProps> = ({ onComplete, onSkip }) => {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t = setTimeout(
      () => {
        playTransmitSuccess();
        onComplete();
      },
      reduced ? 200 : 1600
    );
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] bg-[#070b10] flex items-center justify-center flex-col px-6">
      <p className="text-[#4cd9e0] text-sm tracking-wide mb-3">Portfolio</p>
      <h1 className="text-4xl sm:text-6xl md:text-7xl font-semibold text-white text-center tracking-tight">
        {PROFILE.name}
      </h1>
      <p className="mt-4 text-[#9aa3b2] text-base sm:text-lg">{PROFILE.role}</p>
      <button
        type="button"
        onClick={() => {
          playTransmitSuccess();
          onSkip();
        }}
        className="absolute bottom-8 right-8 text-xs text-[#8b95a5] hover:text-white uppercase tracking-wider"
      >
        Skip
      </button>
    </div>
  );
};
