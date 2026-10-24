import React, { useState, useRef, useEffect } from 'react';
import { Send, ShieldCheck, Check, RefreshCw } from 'lucide-react';
import { TerminalLog } from '../types';
import { PROJECTS_DATA, SYSTEM_METRICS, PROFILE } from '../data/portfolioData';
import { playTerminalChirp, playTransmitSuccess } from '../utils/audioSynth';

export const CommsTerminal: React.FC = () => {
  const [logs, setLogs] = useState<TerminalLog[]>([
    {
      id: '1',
      sender: 'system',
      text: `${PROFILE.name} — Portfolio Shell v2.4.0`,
      timestamp: '00:00:01',
    },
    {
      id: '2',
      sender: 'system',
      text: 'Type "help" for a list of available commands or execute "./init_contact.sh".',
      timestamp: '00:00:02',
    },
  ]);

  const [inputVal, setInputVal] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [transmitting, setTransmitting] = useState(false);
  const [transmitSuccess, setTransmitSuccess] = useState(false);
  const terminalBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    terminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const cmd = inputVal.trim().toLowerCase();
    const time = new Date().toLocaleTimeString();
    playTerminalChirp();

    const userEntry: TerminalLog = {
      id: Date.now().toString(),
      sender: 'user',
      text: `$ ${inputVal}`,
      timestamp: time,
    };

    let responseText = '';
    let responseType: 'system' | 'error' | 'success' = 'system';

    switch (cmd) {
      case 'help':
        responseText = `Available Commands:
  help               - Displays this manual
  ./init_contact.sh  - Initiates direct communication handshake
  status             - Displays real-time kernel telemetry
  projects           - Lists all compiled system modules
  whoami             - Query verified system architect credentials
  cat origin.log     - Prints origin architecture log
  clear              - Clears terminal output`;
        break;
      case './init_contact.sh':
      case 'contact':
        responseText = `[COMMS_HANDSHAKE_READY] Form fields focused. Direct encrypted channel open on port 443.`;
        responseType = 'success';
        document.getElementById('form-name')?.focus();
        break;
      case 'status':
      case 'sys_status':
        responseText = `KERNEL_STATUS: ${SYSTEM_METRICS.status} | UPTIME: ${SYSTEM_METRICS.uptime} | MEMORY: ${SYSTEM_METRICS.memoryAllocated} | ARCH_ID: ${SYSTEM_METRICS.architectId}`;
        responseType = 'success';
        break;
      case 'projects':
      case 'ls':
        responseText = PROJECTS_DATA.map(
          (p) => `[${p.modNumber}] ${p.title} (${p.category}) - ${p.specs.latency}`
        ).join('\n');
        break;
      case 'whoami':
        responseText = `${PROFILE.name} // ${PROFILE.role}. Contact: ${PROFILE.email}`;
        break;
      case 'cat origin.log':
        responseText = `ORIGIN_LOG: B.Tech CE @ Guru Nanak Dev University. 1000+ DSA problems solved. Full-stack intern @ CodeXIntern. Building MERN + Gemini API projects.`;
        break;
      case 'clear':
        setLogs([]);
        setInputVal('');
        return;
      default:
        responseText = `zsh: command not found: "${inputVal}". Type "help" for manual.`;
        responseType = 'error';
    }

    const sysResponse: TerminalLog = {
      id: (Date.now() + 1).toString(),
      sender: responseType,
      text: responseText,
      timestamp: time,
    };

    setLogs((prev) => [...prev, userEntry, sysResponse]);
    setInputVal('');
  };

  const handleTransmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setTransmitting(true);
    playTerminalChirp();

    setTimeout(() => {
      setTransmitting(false);
      setTransmitSuccess(true);
      playTransmitSuccess();

      const time = new Date().toLocaleTimeString();
      setLogs((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'success',
          text: `[COMMS_SENT] Transmission received from <${formData.email}> (${formData.name}). AES-256 key exchange complete.`,
          timestamp: time,
        },
      ]);

      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setTransmitSuccess(false), 5000);
    }, 1200);
  };

  return (
    <section id="comms" className="py-20 sm:py-28 relative">
      <div className="px-4 sm:px-8 md:px-12 lg:px-16 max-w-[1440px] mx-auto">
        {/* Section Header */}
        <div className="mb-16 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-8 gap-4">
          <div>
            <h2 className="font-bodoni text-4xl sm:text-5xl text-[#dce3ed] mb-2 font-bold tracking-tight">
              Comms_Link
            </h2>
            <p className="font-code-md text-xs uppercase tracking-widest text-[#4cd9e0]/80 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#4cd9e0] rounded-full animate-pulse" />
              /bin/sh - CONTACT & TRANSMISSION
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-1 font-code-md text-[10px] text-[#c5c6ca]/60">
            <span>SECURE_ENCRYPTION: AES_256_GCM</span>
            <span className="text-[#4cd9e0]">STATUS: LISTENING // PORT: 443</span>
          </div>
        </div>

        {/* 2-Column Grid: Terminal & Transmission Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Interactive Shell */}
          <div className="lg:col-span-6 glass-panel rounded-xl border-white/10 overflow-hidden flex flex-col glow-hover">
            {/* Terminal Window Chrome */}
            <div className="bg-[#11161d] px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#ffb4ab]/40 border border-[#ffb4ab]/60" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/40 border border-yellow-500/60" />
                <span className="w-3 h-3 rounded-full bg-[#4cd9e0]/40 border border-[#4cd9e0]/60" />
                <span className="ml-2 font-code-md text-[11px] text-[#c5c6ca]/60">
                  root@portfolio_os:~ (bash)
                </span>
              </div>
              <span className="font-code-md text-[10px] text-[#4cd9e0]/80">TLS 1.3</span>
            </div>

            {/* Terminal Log Area */}
            <div className="p-4 sm:p-6 font-code-md text-xs sm:text-[13px] text-[#c5c6ca] flex-grow min-h-[300px] max-h-[380px] overflow-y-auto space-y-3 bg-[#05090c]/80">
              {logs.map((log) => (
                <div key={log.id} className="leading-relaxed">
                  {log.sender === 'user' ? (
                    <div className="text-[#4cd9e0] font-semibold">{log.text}</div>
                  ) : log.sender === 'error' ? (
                    <div className="text-[#ffb4ab]">{log.text}</div>
                  ) : log.sender === 'success' ? (
                    <div className="text-[#80d4d8] font-semibold">{log.text}</div>
                  ) : (
                    <div className="text-[#c5c6ca] whitespace-pre-line">{log.text}</div>
                  )}
                </div>
              ))}
              <div ref={terminalBottomRef} />
            </div>

            {/* Terminal Command Input Form */}
            <form
              onSubmit={handleCommand}
              className="p-3 bg-[#11161d] border-t border-white/10 flex items-center gap-2"
            >
              <span className="text-[#4cd9e0] font-code-md font-bold text-sm pl-2">$</span>
              <input
                type="text"
                id="terminal-input"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Type command (e.g. help, status, ./init_contact.sh)"
                className="w-full bg-transparent text-[#dce3ed] font-code-md text-xs sm:text-sm focus:outline-none placeholder-[#c5c6ca]/30"
              />
              <button
                type="submit"
                className="font-code-md text-[11px] text-[#4cd9e0] uppercase px-3 py-1 bg-[#4cd9e0]/10 border border-[#4cd9e0]/30 rounded hover:bg-[#4cd9e0]/20 transition-all"
              >
                Send
              </button>
            </form>
          </div>

          {/* Right Direct Transmission Form */}
          <div className="lg:col-span-6 glass-panel p-6 sm:p-8 rounded-xl border-white/10 flex flex-col justify-between glow-hover">
            <div>
              <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                <h3 className="font-code-md text-[#4cd9e0] uppercase tracking-widest text-xs sm:text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>// DIRECT TRANSMISSION PROTOCOL</span>
                </h3>
                <span className="font-code-md text-[10px] text-[#c5c6ca]/50">P2P_COMMS</span>
              </div>

              <form onSubmit={handleTransmit} className="space-y-4">
                <div>
                  <label className="block font-code-md text-[11px] uppercase tracking-widest text-[#c5c6ca] mb-1.5">
                    Transmitter Identity [ Name / Org ]
                  </label>
                  <input
                    type="text"
                    id="form-name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Dr. Jane Doe // Vertex Systems"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-2.5 font-code-md text-sm text-[#dce3ed] focus:outline-none focus:border-[#4cd9e0] transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-code-md text-[11px] uppercase tracking-widest text-[#c5c6ca] mb-1.5">
                    Return Frequency [ Email Address ]
                  </label>
                  <input
                    type="email"
                    id="form-email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jane@vertex.org"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-2.5 font-code-md text-sm text-[#dce3ed] focus:outline-none focus:border-[#4cd9e0] transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-code-md text-[11px] uppercase tracking-widest text-[#c5c6ca] mb-1.5">
                    Encrypted Payload [ Message / Inquiries ]
                  </label>
                  <textarea
                    rows={4}
                    id="form-message"
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Architectural inquiries, project proposals, or collaboration transmissions..."
                    className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-2.5 font-code-md text-sm text-[#dce3ed] focus:outline-none focus:border-[#4cd9e0] transition-colors resize-none"
                  />
                </div>

                {transmitSuccess && (
                  <div className="p-3 bg-[#4cd9e0]/10 border border-[#4cd9e0]/40 rounded-lg flex items-center gap-2 text-xs font-code-md text-[#4cd9e0]">
                    <Check className="w-4 h-4 text-[#4cd9e0]" />
                    <span>Packet received! Direct handshake established. Response queued.</span>
                  </div>
                )}

                <button
                  type="submit"
                  id="btn-transmit-data"
                  disabled={transmitting}
                  className="w-full bg-[#4cd9e0] text-[#002021] font-code-md text-xs sm:text-sm font-bold uppercase tracking-widest py-3.5 rounded-lg flex items-center justify-center gap-2 hover:bg-[#80d4d8] hover:shadow-[0_0_20px_rgba(76,217,224,0.5)] transition-all duration-300 btn-precision mt-6"
                >
                  {transmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Transmitting Payload...</span>
                    </>
                  ) : (
                    <>
                      <span>Transmit_Data</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
