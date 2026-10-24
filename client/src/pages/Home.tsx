import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Circle,
  Clock3,
  Code2,
  Command,
  Download,
  ExternalLink,
  FlaskConical,
  GitBranch,
  Layers3,
  LockKeyhole,
  Menu,
  Play,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Swords,
  Terminal,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "wouter";

type Status = "verified" | "running" | "failed" | "notrun" | "blocked";
type Phase = {
  label: string;
  time: string;
  state: "done" | "active" | "future";
  detail: string;
  icon: string;
};

const phases: Phase[] = [
  { label: "PLAN", time: "09:41:02", state: "done", detail: "Scope the parser failure and set a two-attempt budget.", icon: "01" },
  { label: "INSPECT", time: "09:41:04", state: "done", detail: "Read the repository map and locate parse_csv.py.", icon: "02" },
  { label: "REPRODUCE", time: "09:41:09", state: "done", detail: "Reproduced the empty-row failure in an isolated sandbox.", icon: "03" },
  { label: "RECALL", time: "09:41:13", state: "done", detail: "Recalled 3 verified lessons about delimiter handling.", icon: "04" },
  { label: "PATCH", time: "09:41:19", state: "done", detail: "Proposed a narrow guard for blank records.", icon: "05" },
  { label: "VERIFY", time: "09:41:26", state: "active", detail: "Visible tests pass. Hidden checks are running now.", icon: "06" },
  { label: "LEARN", time: "09:41:34", state: "future", detail: "Promote the lesson only after evaluator verification.", icon: "07" },
];

const navItems = [
  { path: "/", label: "Overview", index: "01", icon: Layers3 },
  { path: "/studio", label: "Agent Studio", index: "02", icon: Terminal },
  { path: "/arena", label: "Arena", index: "03", icon: Swords },
  { path: "/lab", label: "Evaluation Lab", index: "04", icon: FlaskConical },
];

const benchmark = [
  { id: "baseline", label: "BASELINE", score: "58%", interval: "54–62", delta: "—", color: "ink", note: "No lesson context" },
  { id: "raw", label: "RAW MEMORY", score: "61%", interval: "56–66", delta: "+3 pts", color: "yellow", note: "Unverified recall" },
  { id: "verified", label: "VERIFIED MEMORY", score: "67%", interval: "61–73", delta: "+9 pts", color: "green", note: "Evaluator-gated" },
  { id: "random", label: "RANDOM CONTROL", score: "59%", interval: "53–65", delta: "+1 pt", color: "red", note: "Random lesson" },
];

const evidenceRows = [
  { label: "VISIBLE TESTS", value: "12 / 12", status: "verified" as Status },
  { label: "HIDDEN TESTS", value: "4 / 4", status: "verified" as Status },
  { label: "SANDBOX", value: "ISOLATED", status: "verified" as Status },
  { label: "MEMORY", value: "3 RECALLED", status: "verified" as Status },
  { label: "COST", value: "$0.021", status: "notrun" as Status },
];

function StatusBadge({ status, children }: { status: Status; children: ReactNode }) {
  return <span className={`status-badge status-${status}`}>{children}</span>;
}

function Button({
  children,
  variant = "primary",
  onClick,
  className = "",
  type = "button",
  ariaLabel,
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "yellow" | "green" | "danger";
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit";
  ariaLabel?: string;
}) {
  return (
    <button type={type} aria-label={ariaLabel} className={`brutal-button button-${variant} ${className}`} onClick={onClick}>
      {children}
    </button>
  );
}

function LogoMark() {
  return (
    <div className="logo-mark" aria-label="CodeForge">
      <span>[</span>
      <b>/</b>
      <span>]</span>
    </div>
  );
}

function AppShell({
  children,
  location,
  navigate,
  onNewRun,
  navOpen,
  setNavOpen,
  runStarted,
}: {
  children: ReactNode;
  location: string;
  navigate: (path: string) => void;
  onNewRun: () => void;
  navOpen: boolean;
  setNavOpen: (open: boolean) => void;
  runStarted: boolean;
}) {
  return (
    <div className="app-shell">
      <aside className={`side-rail ${navOpen ? "is-open" : ""}`}>
        <div className="rail-brand">
          <LogoMark />
          <div>
            <div className="wordmark">CODE//FORGE</div>
            <div className="brand-sub">PROOF-FIRST ENGINEERING</div>
          </div>
          <button className="mobile-close" aria-label="Close navigation" onClick={() => setNavOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="rail-rule" />
        <div className="rail-kicker">WORKSPACE / LOCAL</div>
        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = location === item.path || (location === "/replay" && item.path === "/studio");
            return (
              <button
                key={item.path}
                className={`nav-item ${active ? "is-active" : ""}`}
                onClick={() => navigate(item.path)}
                aria-current={active ? "page" : undefined}
              >
                <span className="nav-index">{item.index}</span>
                <Icon size={17} strokeWidth={2.4} />
                <span>{item.label}</span>
                {active && <ChevronRight className="nav-arrow" size={16} />}
              </button>
            );
          })}
        </nav>

        <div className="rail-health">
          <div className="rail-kicker">SYSTEM HEALTH</div>
          <div className="health-line"><span className="health-dot dot-green" /> SANDBOX UP</div>
          <div className="health-line"><span className="health-dot dot-green" /> DATABASE UP</div>
          <div className="health-line"><span className="health-dot dot-yellow" /> BENCHMARK 4 / 5</div>
        </div>

        <div className="rail-footer">
          <div className="footer-mark"><Command size={13} /> v0.1 / LOCAL</div>
          <div className="footer-mark">NO CLAIMS WITHOUT EVIDENCE.</div>
        </div>
      </aside>

      {navOpen && <button className="rail-scrim" aria-label="Close navigation overlay" onClick={() => setNavOpen(false)} />}

      <main className="main-canvas">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu" aria-label="Open navigation" onClick={() => setNavOpen(true)}><Menu size={21} /></button>
            <span className="breadcrumb">CODEFORGE <span>/</span> {location === "/" ? "OVERVIEW" : location.slice(1).toUpperCase()}</span>
          </div>
          <div className="topbar-run">
            <span className={`health-dot ${runStarted ? "dot-yellow" : "dot-green"}`} />
            <span>{runStarted ? "RUN CF-0043 · VERIFYING" : "RUN CF-0042 · VERIFIED"}</span>
          </div>
          <div className="topbar-actions">
            <span className="workspace-chip">PG / WORKSPACE</span>
            <Button variant="primary" onClick={onNewRun}><Plus size={16} /> NEW RUN</Button>
          </div>
        </header>
        <div className="content-wrap">{children}</div>
      </main>
    </div>
  );
}

function SectionHeader({ index, title, eyebrow, action }: { index: string; title: string; eyebrow: string; action?: ReactNode }) {
  return (
    <div className="section-header">
      <div className="section-heading">
        <span className="section-index">{index}</span>
        <div>
          <div className="eyebrow">{eyebrow}</div>
          <h1>{title}</h1>
        </div>
      </div>
      {action}
    </div>
  );
}

function PhaseTrack({ selected, onSelect, compact = false }: { selected: number; onSelect: (index: number) => void; compact?: boolean }) {
  return (
    <div className={`phase-track ${compact ? "is-compact" : ""}`} aria-label="Agent run phases">
      {phases.map((phase, index) => {
        const isDone = index < selected;
        const isActive = index === selected;
        return (
          <button key={phase.label} className={`phase-step ${isDone ? "is-done" : ""} ${isActive ? "is-active" : ""}`} onClick={() => onSelect(index)} aria-label={`${phase.label} phase`}>
            <span className="phase-node">{isDone ? <Check size={13} /> : isActive ? <span className="node-pulse" /> : phase.icon}</span>
            <span className="phase-name">{phase.label}</span>
            {!compact && <span className="phase-time">{phase.time}</span>}
          </button>
        );
      })}
    </div>
  );
}

function RunDemo({ selected, setSelected, running, setRunning, onStudio }: { selected: number; setSelected: (index: number) => void; running: boolean; setRunning: (running: boolean) => void; onStudio: () => void }) {
  const phase = phases[selected];
  return (
    <div className="run-demo brutal-card shadow-offset">
      <div className="card-kicker"><span>LIVE PROOF / DEMO RUN</span><StatusBadge status={selected === 6 ? "verified" : running ? "running" : "notrun"}>{selected === 6 ? "VERIFIED" : running ? "RUNNING" : "REPLAYABLE"}</StatusBadge></div>
      <div className="run-demo-top">
        <div>
          <div className="mono muted">CF-0042 / PARSE_CSV.PY</div>
          <h3>Fix blank-record handling</h3>
        </div>
        <div className="run-score"><strong>{selected === 6 ? "16" : selected + 10}</strong><span>checks seen</span></div>
      </div>
      <PhaseTrack selected={selected} onSelect={setSelected} />
      <div className="demo-evidence">
        <div className="terminal-line"><span className="prompt">$</span> {phase.detail}</div>
        <div className="terminal-line terminal-muted"><span className="prompt">→</span> {selected >= 5 ? "evaluator / hidden_tests.py" : "sandbox / isolated process"}</div>
      </div>
      <div className="run-demo-footer">
        <div className="run-footer-status"><span className={`health-dot ${selected === 6 ? "dot-green" : "dot-yellow"}`} /> {selected === 6 ? "LESSON PROMOTED AFTER VERIFICATION" : phase.label === "VERIFY" ? "VISIBLE PASS / HIDDEN CHECK IN PROGRESS" : "CASSETTE AVAILABLE OFFLINE"}</div>
        <div className="button-row">
          <Button variant="secondary" onClick={() => setRunning(!running)}>{running ? "PAUSE" : <><Play size={14} /> PLAY RUN</>}</Button>
          <Button variant="primary" onClick={onStudio}>OPEN STUDIO <ArrowRight size={15} /></Button>
        </div>
      </div>
    </div>
  );
}

function OverviewScreen({ selected, setSelected, running, setRunning, navigate }: { selected: number; setSelected: (index: number) => void; running: boolean; setRunning: (running: boolean) => void; navigate: (path: string) => void }) {
  return (
    <div className="overview-screen">
      <section className="hero-grid">
        <div className="hero-copy">
          <div className="eyebrow hero-eyebrow"><span className="accent-slash">//</span> EVIDENCE-FIRST AI ENGINEERING / 2026</div>
          <h1>AI THAT<br /><span className="hero-highlight">SHOWS ITS WORK.</span></h1>
          <p className="hero-lede">CodeForge repairs code in an isolated sandbox, verifies the result, and records only the lessons that survive evaluation.</p>
          <div className="button-row hero-actions">
            <Button variant="primary" onClick={() => setRunning(true)}><Play size={16} /> WATCH VERIFIED RUN</Button>
            <Button variant="secondary" onClick={() => navigate("/lab")}>READ THE METHOD <ArrowRight size={16} /></Button>
          </div>
          <div className="hero-note"><LockKeyhole size={14} /> UNTRUSTED CODE NEVER RUNS ON THE HOST.</div>
        </div>
        <div className="hero-proof">
          <RunDemo selected={selected} setSelected={setSelected} running={running} setRunning={setRunning} onStudio={() => navigate("/studio")} />
          <div className="proof-stamp"><ShieldCheck size={22} /><span>VERIFIED<br /><b>BY EVALUATOR</b></span></div>
        </div>
      </section>

      <section className="metric-strip" aria-label="CodeForge proof metrics">
        <div className="metric-block"><span className="metric-value">100%</span><span className="metric-label">RUNS WITH<br />VERDICTS</span></div>
        <div className="metric-block metric-yellow"><span className="metric-value">4</span><span className="metric-label">EVALUATION<br />CONDITIONS</span></div>
        <div className="metric-block metric-green"><span className="metric-value">30+</span><span className="metric-label">HELD-OUT<br />TASKS</span></div>
        <div className="metric-block metric-red"><span className="metric-value">0</span><span className="metric-label">CLAIMS WITHOUT<br />EVIDENCE</span></div>
      </section>

      <section className="proof-section">
        <div className="section-lead"><div className="eyebrow">THE DIFFERENCE / 03 RULES</div><h2>NO CLAIMS.<br />WITHOUT RECEIPTS.</h2><p>Every success state is attached to a sandbox, a test result, and a verdict you can replay.</p></div>
        <div className="proof-blocks">
          <article className="proof-block"><span className="block-num">01</span><div className="proof-icon"><ShieldCheck size={24} /></div><h3>FAIL CLOSED</h3><p>Sandbox unavailable? The run fails. There is no “probably fine” path.</p><button onClick={() => navigate("/studio")} className="text-link">VIEW EVIDENCE <ArrowRight size={14} /></button></article>
          <article className="proof-block proof-block-yellow"><span className="block-num">02</span><div className="proof-icon"><Sparkles size={24} /></div><h3>VERIFY FIRST</h3><p>Memory is earned only after visible and hidden checks pass.</p><button onClick={() => navigate("/lab")} className="text-link">OPEN THE LAB <ArrowRight size={14} /></button></article>
          <article className="proof-block proof-block-red"><span className="block-num">03</span><div className="proof-icon"><Activity size={24} /></div><h3>PUBLISH THE NULL</h3><p>When intervals overlap, CodeForge says “inconclusive.” Loudly.</p><button onClick={() => navigate("/lab")} className="text-link">READ THE METHOD <ArrowRight size={14} /></button></article>
        </div>
      </section>

      <section className="bottom-cta brutal-card shadow-offset">
        <div><div className="eyebrow">BUILT TO BE INSPECTED.</div><h2>NOT JUST DEMOED.</h2></div>
        <div className="cta-copy"><p>Trace an agent run. Compare memory conditions. Replay the call cassette without an API key.</p><Button variant="green" onClick={() => navigate("/lab")}>OPEN EVALUATION LAB <ExternalLink size={15} /></Button></div>
      </section>
    </div>
  );
}

function StudioScreen({ selected, setSelected, onReplay }: { selected: number; setSelected: (index: number) => void; onReplay: () => void }) {
  const phase = phases[selected];
  return (
    <div className="product-screen">
      <SectionHeader index="02" eyebrow="RUN CONTROL / EVIDENCE" title="AGENT STUDIO" action={<Button variant="secondary" onClick={onReplay}><RotateCcw size={15} /> OPEN REPLAY</Button>} />
      <div className="studio-layout">
        <section className="run-queue brutal-card">
          <div className="panel-title"><span>RUN QUEUE</span><span className="mono muted">03 ACTIVE</span></div>
          <div className="queue-list">
            <button className="queue-item is-selected"><div><b>CF-0042</b><span>parse_csv.py</span></div><StatusBadge status="running">VERIFYING</StatusBadge><ChevronRight size={15} /></button>
            <button className="queue-item"><div><b>CF-0041</b><span>normalize_path.ts</span></div><StatusBadge status="verified">VERIFIED</StatusBadge><ChevronRight size={15} /></button>
            <button className="queue-item"><div><b>CF-0040</b><span>auth_header.go</span></div><StatusBadge status="failed">FAILED</StatusBadge><ChevronRight size={15} /></button>
          </div>
          <div className="queue-divider" />
          <div className="panel-title"><span>MISSION</span><span className="mono muted">PYTHON / 02 ATTEMPTS</span></div>
          <div className="mission-mini"><div className="mission-file"><Code2 size={17} /><span>parse_csv.py</span><GitBranch size={14} /></div><p>Blank rows should be skipped without shifting the record index.</p><div className="mini-tags"><span>VISIBLE TESTS</span><span>HIDDEN TESTS</span><span>REPLAYABLE</span></div></div>
        </section>

        <section className="studio-main">
          <div className="brutal-card run-header-card">
            <div className="run-header-meta"><div><div className="eyebrow">ACTIVE RUN / CF-0042</div><h2>Fix blank-record handling</h2></div><StatusBadge status="running">VERIFYING</StatusBadge></div>
            <PhaseTrack selected={selected} onSelect={setSelected} />
            <div className="phase-detail"><div><span className="detail-index">{phase.icon}</span><div><b>{phase.label}</b><p>{phase.detail}</p></div></div><span className="mono muted">{phase.time} UTC</span></div>
          </div>
          <div className="studio-code-grid">
            <div className="brutal-card code-card"><div className="panel-title"><span>PATCH / PROPOSED DIFF</span><span className="mono muted">+4 −1</span></div><div className="code-lines"><div><span className="line-num">18</span><span className="code-muted">for row in reader:</span></div><div className="code-add"><span className="line-num">19</span><span>+  if not row: <span className="code-key">continue</span></span></div><div><span className="line-num">20</span><span>   records.append(row)</span></div><div><span className="line-num">21</span><span className="code-muted">return records</span></div></div><div className="code-footer"><span><span className="health-dot dot-green" /> NARROW PATCH</span><span className="mono">DIFF HASH 8F2A</span></div></div>
            <div className="brutal-card log-card"><div className="panel-title"><span>LIVE LOG</span><span className="recording-dot"><span /> RECORDING</span></div><div className="log-lines"><div><span>09:41:09</span> sandbox created <StatusBadge status="verified">ISOLATED</StatusBadge></div><div><span>09:41:13</span> recalled 3 lessons</div><div><span>09:41:19</span> patch applied</div><div><span>09:41:26</span> pytest visible <StatusBadge status="verified">12 / 12</StatusBadge></div><div className="log-active"><span>09:41:34</span> hidden evaluator running<span className="cursor-block" /></div></div><button className="text-link">VIEW FULL LOG <ArrowRight size={14} /></button></div>
          </div>
        </section>

        <aside className="evidence-panel brutal-card">
          <div className="panel-title"><span>EVIDENCE</span><StatusBadge status="running">IN REVIEW</StatusBadge></div>
          <div className="evidence-verdict"><span className="eyebrow">CURRENT VERDICT</span><strong>NOT FINAL</strong><p>Evaluator checks must pass before this run can learn.</p></div>
          <div className="evidence-list">{evidenceRows.map(row => <div className="evidence-row" key={row.label}><span>{row.label}</span><span className="evidence-value">{row.value}</span><StatusBadge status={row.status}>{row.status === "notrun" ? "NOT RUN" : row.status === "verified" ? "PASS" : ""}</StatusBadge></div>)}</div>
          <div className="evidence-rule" />
          <div className="evidence-note"><span className="eyebrow">MEMORY GATE</span><p><span className="health-dot dot-yellow" /> Lesson stays a candidate until verification.</p></div>
          <Button variant="primary" className="full-width" onClick={onReplay}>OPEN EVIDENCE DETAIL <ArrowRight size={15} /></Button>
        </aside>
      </div>
    </div>
  );
}

function ArenaScreen({ mode, setMode, navigate }: { mode: string; setMode: (mode: string) => void; navigate: (path: string) => void }) {
  return (
    <div className="product-screen">
      <SectionHeader index="03" eyebrow="PRACTICE / REVIEW / XP" title="ENGINEERING ARENA" action={<div className="arena-xp"><span>XP</span><b>1,240</b><small>LEVEL 07</small></div>} />
      <section className="arena-hero brutal-card shadow-offset"><div><div className="eyebrow">CHOOSE YOUR MODE</div><h2>DEBUG IT.<br /><span>PROVE IT.</span></h2></div><p>Practice the same evidence-first loop in a mission workspace. Hints are explicit. Tests are visible. Ambiguity is not a reward.</p></section>
      <section className="mode-grid">
        {[{ id: "SOLO", label: "SOLO", icon: Terminal, desc: "You debug it.", meta: "NO HINTS" }, { id: "AI PARTNER", label: "AI PARTNER", icon: Sparkles, desc: "Get hints.", meta: "HINTS GATED" }, { id: "AGENT ARENA", label: "AGENT ARENA", icon: Swords, desc: "Review the agent patch.", meta: "PATCH REVIEW" }].map(item => { const Icon = item.icon; return <button key={item.id} className={`mode-card ${mode === item.id ? "is-selected" : ""}`} onClick={() => setMode(item.id)}><span className="mode-icon"><Icon size={22} /></span><div><span className="eyebrow">{item.meta}</span><h3>{item.label}</h3><p>{item.desc}</p></div><ArrowUpRight size={18} /></button>; })}
      </section>
      <section className="arena-content-grid">
        <div className="mission-list brutal-card"><div className="panel-title"><span>MISSIONS</span><span className="mono muted">07 / 10 COMPLETE</span></div><div className="mission-progress"><span /><span /><span /><span /><span /><span /><span /><i /><i /><i /></div>{[{n:"01", title:"The empty iterator", tag:"EASY", status:"VERIFIED", color:"green"},{n:"02", title:"Path normalization", tag:"MEDIUM", status:"VERIFIED", color:"green"},{n:"03", title:"Header injection", tag:"HARD", status:"IN PROGRESS", color:"yellow"},{n:"04", title:"The silent fallback", tag:"BOSS", status:"LOCKED", color:"red"}].map(m => <div className="mission-row" key={m.n}><span className="mission-number">{m.n}</span><div><b>{m.title}</b><span>{m.tag}</span></div><StatusBadge status={m.color === "green" ? "verified" : m.color === "yellow" ? "running" : "blocked"}>{m.status}</StatusBadge><ChevronRight size={15} /></div>)}</div>
        <div className="arena-workspace brutal-card"><div className="panel-title"><span>MISSION WORKSPACE</span><StatusBadge status="running">{mode}</StatusBadge></div><div className="workspace-task"><span className="eyebrow">MISSION 03 / HEADER INJECTION</span><h3>Reject a malformed header before it reaches the parser.</h3><p>Reproduce the failing test, isolate the boundary, and submit the smallest safe patch.</p></div><div className="workspace-split"><div className="workspace-code"><div className="mono muted">test_headers.py</div><div><span>01</span> <span className="code-key">def</span> validate(header):</div><div><span>02</span> &nbsp; <span className="code-key">return</span> header.strip()</div><div className="code-alert"><span>03</span> &nbsp; <span className="code-muted"># hidden edge case here</span></div></div><div className="workspace-feedback"><span className="eyebrow">NEXT BEST ACTION</span><strong>REPRODUCE THE BUG</strong><p>One hint available. It will not spend XP.</p><Button variant="yellow" onClick={() => navigate("/studio")}>OPEN MISSION <ArrowRight size={15} /></Button></div></div></div>
      </section>
    </div>
  );
}

function LabScreen({ selectedBench, setSelectedBench, navigate }: { selectedBench: string; setSelectedBench: (value: string) => void; navigate: (path: string) => void }) {
  const selected = benchmark.find(item => item.id === selectedBench) ?? benchmark[2];
  return (
    <div className="product-screen">
      <SectionHeader index="04" eyebrow="BENCHMARK / METHOD / NULLS" title="EVALUATION LAB" action={<div className="button-row"><Button variant="secondary"><Download size={15} /> EXPORT REPORT</Button><Button variant="primary" onClick={() => navigate("/replay")}><RotateCcw size={15} /> REPLAY</Button></div>} />
      <section className="lab-result-banner"><div><span className="eyebrow">HELD-OUT RESULT / TASKS 30–60</span><h2>VERIFIED MEMORY<span className="mobile-break"><br /></span> IS HIGHER.<br /><span>BUT INTERVALS OVERLAP.</span></h2></div><div className="lab-result-status"><StatusBadge status="running">INCONCLUSIVE</StatusBadge><p>Do not claim a gain yet.</p></div></section>
      <div className="lab-meta-strip"><div><span>TRAIN SET</span><b>20 TASKS</b></div><div><span>HELD-OUT</span><b>30 TASKS</b></div><div><span>TRIALS / TASK</span><b>5</b></div><div><span>INTERVAL</span><b>95% WILSON</b></div><button className="method-button"><Search size={15} /> METHOD</button></div>
      <section className="condition-grid">{benchmark.map(item => <button key={item.id} className={`condition-card condition-${item.color} ${selectedBench === item.id ? "is-selected" : ""}`} onClick={() => setSelectedBench(item.id)}><span className="eyebrow">{item.label}</span><strong>{item.score}</strong><div className="condition-interval"><span className="interval-track"><i style={{ left: `${parseInt(item.interval.split("–")[0]) - 45}%`, width: `${parseInt(item.interval.split("–")[1]) - parseInt(item.interval.split("–")[0]) + 3}%` }} /></span><span className="mono">95% CI {item.interval}</span></div><div className="condition-footer"><span>{item.note}</span><b>{item.delta}</b></div></button>)}</section>
      <section className="lab-detail-grid"><div className="lab-chart brutal-card"><div className="panel-title"><span>COMPARISON / POINT ESTIMATE + INTERVAL</span><span className="mono muted">SELECTED: {selected.label}</span></div><div className="chart-area"><div className="chart-axis"><span>40%</span><span>50%</span><span>60%</span><span>70%</span><span>80%</span></div>{benchmark.map(item => { const low = parseInt(item.interval.split("–")[0]); const high = parseInt(item.interval.split("–")[1]); const score = parseInt(item.score); return <button key={item.id} className={`chart-row ${selectedBench === item.id ? "is-selected" : ""}`} onClick={() => setSelectedBench(item.id)}><span className="chart-label">{item.label}</span><div className="chart-bar"><i style={{ left: `${(low - 40) * 2.5}%`, width: `${(high - low) * 2.5}%` }} /><b style={{ left: `${(score - 40) * 2.5}%` }} /></div><span className="chart-value">{item.score}</span></button>; })}</div><div className="chart-legend"><span><i className="legend-point" /> point estimate</span><span><i className="legend-interval" /> confidence interval</span></div></div><div className="lab-method brutal-card"><div className="panel-title"><span>METHOD / V1.0</span><StatusBadge status="verified">TRANSPARENT</StatusBadge></div><div className="method-list"><div><b>01</b><span>Train/held-out split is fixed before runs.</span></div><div><b>02</b><span>Each task gets 5 trials per condition.</span></div><div><b>03</b><span>Wilson intervals show uncertainty per condition.</span></div><div><b>04</b><span>Paired bootstrap is used for condition deltas.</span></div></div><button className="text-link">OPEN FULL METHODOLOGY <ArrowRight size={14} /></button></div></section>
      <section className="trial-table brutal-card"><div className="panel-title"><span>TRIAL COMPARISON</span><div className="table-filter"><button className="is-active">ALL</button><button>PASS</button><button>FAIL</button></div></div><div className="table-scroll"><table><thead><tr><th>TASK ID</th><th>CONDITION</th><th>TRIAL</th><th>VERDICT</th><th>ATTEMPTS</th><th>HIDDEN TESTS</th><th>REPLAY</th></tr></thead><tbody>{["T-031", "T-032", "T-033", "T-034"].map((task, i) => <tr key={task}><td className="mono">{task}</td><td>{i % 2 === 0 ? "VERIFIED MEMORY" : "BASELINE"}</td><td className="mono">0{i + 1} / 05</td><td><StatusBadge status={i === 3 ? "failed" : "verified"}>{i === 3 ? "FAILED" : "VERIFIED"}</StatusBadge></td><td className="mono">{i + 1}</td><td>{i === 3 ? <StatusBadge status="notrun">NOT RUN</StatusBadge> : `${i + 3} / ${i + 3}`}</td><td><button className="icon-button" onClick={() => navigate("/replay")} aria-label={`Replay ${task}`}><RotateCcw size={15} /></button></td></tr>)}</tbody></table></div></section>
    </div>
  );
}

function ReplayScreen({ selected, setSelected, navigate }: { selected: number; setSelected: (index: number) => void; navigate: (path: string) => void }) {
  const phase = phases[selected];
  return (
    <div className="product-screen">
      <SectionHeader index="R" eyebrow="OFFLINE CASSETTE / CF-0042" title="REPLAY EVIDENCE" action={<div className="button-row"><Button variant="secondary"><Download size={15} /> DOWNLOAD JSON</Button><Button variant="primary" onClick={() => navigate("/studio")}>BACK TO STUDIO</Button></div>} />
      <div className="replay-layout"><aside className="replay-timeline brutal-card"><div className="panel-title"><span>RUN TIMELINE</span><StatusBadge status="verified">OFFLINE</StatusBadge></div>{phases.map((item, index) => <button key={item.label} onClick={() => setSelected(index)} className={`replay-step ${selected === index ? "is-selected" : ""}`}><span className="replay-number">{item.icon}</span><span><b>{item.label}</b><small>{item.time} UTC</small></span><ChevronRight size={15} /></button>)}</aside><section className="replay-detail"><div className="replay-call brutal-card"><div className="panel-title"><span>MODEL CALL #{selected + 2} / {phase.label}</span><span className="mono muted">CASSETTE / NO NETWORK</span></div><div className="call-grid"><div><span className="eyebrow">INPUT</span><p>“Inspect the parser path and produce a minimal fix for blank records.”</p></div><div><span className="eyebrow">RECORDED OUTPUT</span><p>{phase.detail}</p></div></div><div className="cassette-bar"><LockKeyhole size={14} /> REPLAYING FROM RECORDED MODEL CALLS. API KEY NOT REQUIRED.</div></div><div className="replay-evidence-grid"><div className="brutal-card code-card"><div className="panel-title"><span>ARTIFACT / PATCH DIFF</span><span className="mono muted">HASH 8F2A</span></div><div className="code-lines"><div><span className="line-num">18</span><span className="code-muted">for row in reader:</span></div><div className="code-add"><span className="line-num">19</span><span>+  if not row: continue</span></div><div><span className="line-num">20</span><span>   records.append(row)</span></div></div></div><div className="brutal-card replay-verdict"><div className="panel-title"><span>VERDICT RECEIPT</span><StatusBadge status={selected === 6 ? "verified" : "notrun"}>{selected === 6 ? "VERIFIED" : "NOT FINAL"}</StatusBadge></div><div className="receipt-number">{selected === 6 ? "16 / 16" : `${selected + 10} / 16`}</div><p>{selected === 6 ? "All evaluator checks passed. Lesson promoted." : "This cassette ends before a final evaluator verdict."}</p><div className="receipt-row"><span>VISIBLE</span><b>12 / 12</b></div><div className="receipt-row"><span>HIDDEN</span><b>{selected === 6 ? "4 / 4" : "NOT RUN"}</b></div></div></div></section></div>
    </div>
  );
}

function NewRunPanel({ open, onClose, onStart }: { open: boolean; onClose: () => void; onStart: () => void }) {
  if (!open) return null;
  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Start a new run"><div className="new-run-panel brutal-card shadow-offset"><div className="panel-title"><span>NEW RUN / CONFIGURE</span><button className="icon-button" onClick={onClose} aria-label="Close new run"><X size={18} /></button></div><div className="new-run-heading"><span className="eyebrow">SANDBOXED ENGINEERING TASK</span><h2>WHAT SHOULD CODEFORGE FIX?</h2></div><label className="field-label">TASK DESCRIPTION<textarea defaultValue="Skip blank CSV records without changing the record index." /></label><div className="field-grid"><label className="field-label">REPOSITORY<select defaultValue="csv-parser"><option value="csv-parser">csv-parser / main</option><option>path-utils / main</option></select></label><label className="field-label">MEMORY MODE<select defaultValue="verified"><option value="verified">VERIFIED ONLY</option><option value="raw">RAW MEMORY</option><option value="off">DISABLED</option></select></label></div><div className="budget-row"><div><span className="eyebrow">RUN BUDGET</span><b>02 ATTEMPTS / 05 MIN / $0.10</b></div><StatusBadge status="verified">SANDBOX REQUIRED</StatusBadge></div><p className="safety-note"><LockKeyhole size={15} /> If isolation is unavailable, this run will fail closed. No untrusted code touches the host.</p><div className="button-row modal-actions"><Button variant="secondary" onClick={onClose}>CANCEL</Button><Button variant="yellow" onClick={onStart}>START RUN <ArrowRight size={15} /></Button></div></div></div>;
}

export default function Home() {
  const [location, setLocation] = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const [newRunOpen, setNewRunOpen] = useState(false);
  const [runStarted, setRunStarted] = useState(false);
  const [demoRunning, setDemoRunning] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState(5);
  const [mode, setMode] = useState("AI PARTNER");
  const [selectedBench, setSelectedBench] = useState("verified");

  useEffect(() => {
    if (!demoRunning) return;
    const timer = window.setInterval(() => {
      setSelectedPhase(current => {
        if (current >= phases.length - 1) {
          setDemoRunning(false);
          return current;
        }
        return current + 1;
      });
    }, 900);
    return () => window.clearInterval(timer);
  }, [demoRunning]);

  const navigate = (path: string) => {
    setLocation(path);
    setNavOpen(false);
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const screen = useMemo(() => {
    if (location === "/studio") return <StudioScreen selected={selectedPhase} setSelected={setSelectedPhase} onReplay={() => navigate("/replay")} />;
    if (location === "/arena") return <ArenaScreen mode={mode} setMode={setMode} navigate={navigate} />;
    if (location === "/lab") return <LabScreen selectedBench={selectedBench} setSelectedBench={setSelectedBench} navigate={navigate} />;
    if (location === "/replay") return <ReplayScreen selected={selectedPhase} setSelected={setSelectedPhase} navigate={navigate} />;
    return <OverviewScreen selected={selectedPhase} setSelected={setSelectedPhase} running={demoRunning} setRunning={setDemoRunning} navigate={navigate} />;
  }, [demoRunning, location, mode, navigate, selectedBench, selectedPhase]);

  const startRun = () => {
    setRunStarted(true);
    setNewRunOpen(false);
    setSelectedPhase(0);
    setDemoRunning(true);
    navigate("/studio");
  };

  return (
    <>
      <AppShell location={location} navigate={navigate} onNewRun={() => setNewRunOpen(true)} navOpen={navOpen} setNavOpen={setNavOpen} runStarted={runStarted}>{screen}</AppShell>
      <NewRunPanel open={newRunOpen} onClose={() => setNewRunOpen(false)} onStart={startRun} />
    </>
  );
}
