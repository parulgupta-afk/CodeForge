import React, { useState } from 'react';
import { playCyberClick, playTerminalChirp } from '../utils/audioSynth';

export const EngineeringLab: React.FC = () => {
  const [queue, setQueue] = useState<string[]>([]);
  const [done, setDone] = useState<string[]>([]);
  const [reqs, setReqs] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const LIMIT = 8;

  const enqueue = () => {
    playCyberClick();
    const id = `JOB-${Date.now().toString(36).slice(-4).toUpperCase()}`;
    setQueue((q) => [...q, id]);
    setTimeout(() => {
      setQueue((q) => {
        const [head, ...rest] = q;
        if (head) setDone((d) => [head, ...d].slice(0, 6));
        return rest.length ? q.slice(1) : rest;
      });
    }, 900);
  };

  const hitRateLimit = () => {
    playTerminalChirp();
    setReqs((n) => {
      const next = n + 1;
      if (next > LIMIT) setBlocked(true);
      return next;
    });
  };

  const resetLimit = () => {
    setReqs(0);
    setBlocked(false);
  };

  return (
    <section id="lab" className="relative z-10 px-4 sm:px-8 md:px-12 lg:px-16 py-16 max-w-[1440px] mx-auto">
      <p className="text-[10px] font-mono-custom tracking-[0.25em] text-[#4cd9e0]">ENGINEERING_LAB</p>
      <h2 className="text-3xl font-bodoni text-white mt-1 mb-2">Interactive demos</h2>
      <p className="text-sm text-[#c5c6ca] mb-8">
        Toy models of queue workers and rate limits — same ideas as PulseOps / Pocket-Triage.
      </p>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-panel rounded-2xl p-5">
          <h3 className="font-mono-custom text-sm text-[#4cd9e0] mb-3">QUEUE SIMULATOR</h3>
          <p className="text-xs text-[#8f9195] mb-3">REQUEST → QUEUE → WORKER → DONE</p>
          <button
            type="button"
            onClick={enqueue}
            className="mb-4 px-4 py-2 rounded-lg bg-[#4cd9e0]/15 border border-[#4cd9e0]/40 text-[#4cd9e0] text-xs"
          >
            ENQUEUE JOB
          </button>
          <div className="grid grid-cols-2 gap-3 text-xs font-mono-custom">
            <div>
              <p className="text-[#8f9195] mb-1">QUEUE</p>
              <ul className="space-y-1 min-h-[80px]">
                {queue.map((j) => (
                  <li key={j} className="text-[#dce3ed]">
                    {j}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[#8f9195] mb-1">COMPLETED</p>
              <ul className="space-y-1 min-h-[80px]">
                {done.map((j) => (
                  <li key={j} className="text-[#80d4d8]">
                    {j}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-5">
          <h3 className="font-mono-custom text-sm text-[#4cd9e0] mb-3">RATE LIMITER</h3>
          <p className="text-xs text-[#8f9195] mb-3">Burst window · limit {LIMIT} req</p>
          <div className="h-3 rounded-full bg-white/10 overflow-hidden mb-3">
            <div
              className={`h-full transition-all ${blocked ? 'bg-[#ffb4ab]' : 'bg-[#4cd9e0]'}`}
              style={{ width: `${Math.min(100, (reqs / LIMIT) * 100)}%` }}
            />
          </div>
          <p className="text-sm font-mono-custom mb-3">
            {blocked ? (
              <span className="text-[#ffb4ab]">429 TOO MANY REQUESTS</span>
            ) : (
              <span className="text-[#dce3ed]">
                {reqs} / {LIMIT}
              </span>
            )}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={hitRateLimit}
              className="px-4 py-2 rounded-lg border border-white/15 text-xs text-[#dce3ed] hover:border-[#4cd9e0]/40"
            >
              SEND REQUEST
            </button>
            <button
              type="button"
              onClick={resetLimit}
              className="px-4 py-2 rounded-lg border border-white/10 text-xs text-[#8f9195]"
            >
              RESET WINDOW
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
