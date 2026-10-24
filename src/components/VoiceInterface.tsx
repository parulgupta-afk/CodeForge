import React, { useEffect, useRef, useState } from 'react';
import { answerPortfolioQuery } from '../lib/portfolioKnowledge';
import type { ProjectItem } from '../types';
import { playCyberClick, playTerminalChirp } from '../utils/audioSynth';

interface VoiceInterfaceProps {
  open: boolean;
  onClose: () => void;
  onSelectProject: (p: ProjectItem) => void;
  onNavigate: (id: string) => void;
}

type SR = {
  start: () => void;
  stop: () => void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((ev: any) => void) | null;
  onerror: ((ev: any) => void) | null;
  onend: (() => void) | null;
};

function getRecognition(): SR | null {
  const w = window as any;
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!Ctor) return null;
  return new Ctor() as SR;
}

export const VoiceInterface: React.FC<VoiceInterfaceProps> = ({
  open,
  onClose,
  onSelectProject,
  onNavigate,
}) => {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState('Idle');
  const [supported, setSupported] = useState(true);
  const recRef = useRef<SR | null>(null);

  useEffect(() => {
    if (!open) {
      recRef.current?.stop?.();
      setListening(false);
    }
  }, [open]);

  const runQuery = (text: string) => {
    const a = answerPortfolioQuery(text);
    setStatus(`${a.intent}: ${a.summary}`);
    if (a.projects[0]) {
      // soft highlight path — user can open
    }
    playTerminalChirp();
    return a;
  };

  const start = () => {
    const rec = getRecognition();
    if (!rec) {
      setSupported(false);
      setStatus('Speech recognition not supported in this browser. Use Chrome/Edge.');
      return;
    }
    recRef.current = rec;
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.onresult = (ev: any) => {
      let final = '';
      let interim = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i];
        if (r.isFinal) final += r[0].transcript;
        else interim += r[0].transcript;
      }
      const text = (final || interim).trim();
      setTranscript(text);
      if (final) {
        const a = runQuery(final);
        if (/project|pulse|triage|sky|nutri/i.test(final) && a.projects[0]) {
          // keep status; user confirms via buttons below
        }
        if (/contact|email/i.test(final)) onNavigate('connect');
        if (/skill/i.test(final)) onNavigate('capabilities');
      }
    };
    rec.onerror = () => {
      setListening(false);
      setStatus('Recognition error — try again or type in AI Agent');
    };
    rec.onend = () => setListening(false);
    try {
      rec.start();
      setListening(true);
      setStatus('Listening…');
      playCyberClick();
    } catch {
      setStatus('Could not start microphone');
    }
  };

  const stop = () => {
    recRef.current?.stop?.();
    setListening(false);
    setStatus('Stopped');
  };

  if (!open) return null;

  const answer = transcript ? answerPortfolioQuery(transcript) : null;

  return (
    <div
      className="fixed inset-0 z-[93] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg glass-panel rounded-2xl border border-[#4cd9e0]/25 p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-[10px] font-mono-custom tracking-[0.2em] text-[#4cd9e0]">VOICE_INTERFACE</p>
            <h2 className="text-lg font-semibold">Talk to PARUL_OS</h2>
          </div>
          <button type="button" onClick={onClose} className="text-[#8f9195]">
            ✕
          </button>
        </div>
        {!supported && (
          <p className="text-xs text-[#ffb4ab] mb-3">
            Web Speech API unavailable — open AI Agent and type instead.
          </p>
        )}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={listening ? stop : start}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold border ${
              listening
                ? 'border-[#ffb4ab] text-[#ffb4ab] bg-[#ffb4ab]/10'
                : 'border-[#4cd9e0] text-[#002021] bg-[#4cd9e0]'
            }`}
          >
            {listening ? '● STOP' : '🎙 START LISTENING'}
          </button>
        </div>
        <p className="text-[10px] font-mono-custom text-[#8f9195] mb-1">STATUS</p>
        <p className="text-sm text-[#dce3ed] mb-3">{status}</p>
        <p className="text-[10px] font-mono-custom text-[#8f9195] mb-1">TRANSCRIPT</p>
        <p className="text-sm text-[#80d4d8] min-h-[2rem] mb-4">{transcript || '—'}</p>
        {answer && answer.projects.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {answer.projects.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  playCyberClick();
                  onSelectProject(p);
                  onClose();
                }}
                className="text-xs px-3 py-1.5 rounded-lg border border-[#4cd9e0]/30 text-[#4cd9e0]"
              >
                Open {p.title}
              </button>
            ))}
          </div>
        )}
        <p className="text-[10px] text-[#45474a] mt-4 font-mono-custom">
          Browser SpeechRecognition → portfolioKnowledge retriever · same truth source as AI Agent
        </p>
      </div>
    </div>
  );
};
