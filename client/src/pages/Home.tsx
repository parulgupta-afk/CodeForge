import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Circle,
  Clock3,
  Code2,
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
  { label: "PLAN", time: "09:41:02", state: "done", detail: "The AI decides what to fix and sets a limit of two tries.", icon: "01" },
  { label: "READ", time: "09:41:04", state: "done", detail: "It reads the project and finds the file with the bug.", icon: "02" },
  { label: "TEST", time: "09:41:09", state: "done", detail: "It makes the bug happen on purpose, inside a safe box.", icon: "03" },
  { label: "RECALL", time: "09:41:13", state: "done", detail: "It remembers 3 older fixes that passed their tests.", icon: "04" },
  { label: "FIX", time: "09:41:19", state: "done", detail: "It makes a small change so blank rows are skipped.", icon: "05" },
  { label: "CHECK", time: "09:41:26", state: "active", detail: "The open tests pass. The secret tests are running now.", icon: "06" },
  { label: "SAVE", time: "09:41:34", state: "future", detail: "The fix is saved as a lesson only if every test passes.", icon: "07" },
];

const navItems = [
  { path: "/", label: "Home", index: "01", icon: Layers3 },
  { path: "/studio", label: "Try it", index: "02", icon: Terminal },
  { path: "/arena", label: "Practice", index: "03", icon: Swords },
  { path: "/lab", label: "Proof", index: "04", icon: FlaskConical },
];

const benchmark = [
  { id: "baseline", label: "NO MEMORY", score: "58%", interval: "54–62", delta: "—", color: "ink", note: "Starts fresh every time" },
  { id: "raw", label: "SAVES EVERYTHING", score: "61%", interval: "56–66", delta: "+3 pts", color: "yellow", note: "Even fixes that failed" },
  { id: "verified", label: "SAVES PASSED FIXES", score: "67%", interval: "61–73", delta: "+9 pts", color: "green", note: "Our system" },
  { id: "random", label: "RANDOM LESSONS", score: "59%", interval: "53–65", delta: "+1 pt", color: "red", note: "A fair check" },
];

const evidenceRows = [
  { label: "OPEN TESTS", value: "12 / 12", status: "verified" as Status },
  { label: "SECRET TESTS", value: "4 / 4", status: "verified" as Status },
  { label: "SAFE BOX", value: "ON", status: "verified" as Status },
  { label: "LESSONS USED", value: "3", status: "verified" as Status },
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
            <div className="brand-sub">AI THAT SHOWS PROOF</div>
          </div>
          <button className="mobile-close" aria-label="Close navigation" onClick={() => setNavOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="rail-rule" />
        <div className="rail-kicker">MENU</div>
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
                <Icon size={17} strokeWidth={2.4} />
                <span>{item.label}</span>
                {active && <ChevronRight className="nav-arrow" size={16} />}
              </button>
            );
          })}
        </nav>

        <div className="rail-footer">
          <div className="footer-mark">NO CLAIMS WITHOUT PROOF.</div>
        </div>
      </aside>

      {navOpen && <button className="rail-scrim" aria-label="Close navigation overlay" onClick={() => setNavOpen(false)} />}

      <main className="main-canvas">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu" aria-label="Open navigation" onClick={() => setNavOpen(true)}><Menu size={21} /></button>
            <span className="breadcrumb">{({ "/": "HOME", "/studio": "TRY IT", "/arena": "PRACTICE", "/lab": "PROOF", "/replay": "REPLAY" } as Record<string, string>)[location] ?? "HOME"}</span>
          </div>
          <div className="topbar-actions">
            <Button variant="primary" onClick={onNewRun}><Plus size={16} /> TRY A TASK</Button>
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
      <div className="card-kicker"><span>LIVE EXAMPLE</span><StatusBadge status={selected === 6 ? "verified" : running ? "running" : "notrun"}>{selected === 6 ? "PASSED" : running ? "WORKING" : "READY"}</StatusBadge></div>
      <div className="run-demo-top">
        <div>
          <div className="mono muted">EXAMPLE TASK</div>
          <h3>Fix blank rows in a CSV file</h3>
        </div>
        <div className="run-score"><strong>{selected === 6 ? "16" : selected + 10}</strong><span>tests passed</span></div>
      </div>
      <PhaseTrack selected={selected} onSelect={setSelected} />
      <div className="demo-evidence">
        <div className="terminal-line"><span className="prompt">$</span> {phase.detail}</div>
        <div className="terminal-line terminal-muted"><span className="prompt">→</span> {selected >= 5 ? "running the secret tests" : "working inside a safe box"}</div>
      </div>
      <div className="run-demo-footer">
        <div className="run-footer-status"><span className={`health-dot ${selected === 6 ? "dot-green" : "dot-yellow"}`} /> {selected === 6 ? "ALL TESTS PASSED. LESSON SAVED." : phase.label === "CHECK" ? "OPEN TESTS PASSED. SECRET TESTS RUNNING." : "STEP BY STEP, YOU CAN WATCH EACH ONE."}</div>
        <div className="button-row">
          <Button variant="secondary" onClick={() => setRunning(!running)}>{running ? "PAUSE" : <><Play size={14} /> PLAY</>}</Button>
          <Button variant="primary" onClick={onStudio}>TRY IT YOURSELF <ArrowRight size={15} /></Button>
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
          <div className="eyebrow hero-eyebrow"><span className="accent-slash">//</span> AN AI THAT FIXES CODE</div>
          <h1>AI THAT<br /><span className="hero-highlight">SHOWS ITS WORK.</span></h1>
          <p className="hero-lede">CodeForge fixes broken code, tests the fix, and shows you the result. It only learns from fixes that passed.</p>
          <div className="button-row hero-actions">
            <Button variant="primary" onClick={() => setRunning(true)}><Play size={16} /> WATCH IT WORK</Button>
            <Button variant="secondary" onClick={() => navigate("/lab")}>HOW WE TEST IT <ArrowRight size={16} /></Button>
          </div>
          <div className="hero-note"><LockKeyhole size={14} /> YOUR CODE IS TESTED IN A SAFE, LOCKED BOX.</div>
        </div>
        <div className="hero-proof">
          <RunDemo selected={selected} setSelected={setSelected} running={running} setRunning={setRunning} onStudio={() => navigate("/studio")} />
          <div className="proof-stamp"><ShieldCheck size={22} /><span>TESTED<br /><b>AND PROVEN</b></span></div>
        </div>
      </section>

      <section className="metric-strip" aria-label="CodeForge proof metrics">
        <div className="metric-block"><span className="metric-value">100%</span><span className="metric-label">RUNS WITH A<br />CLEAR RESULT</span></div>
        <div className="metric-block metric-yellow"><span className="metric-value">4</span><span className="metric-label">WAYS WE<br />COMPARE</span></div>
        <div className="metric-block metric-green"><span className="metric-value">30+</span><span className="metric-label">TEST<br />TASKS</span></div>
        <div className="metric-block metric-red"><span className="metric-value">0</span><span className="metric-label">CLAIMS WITHOUT<br />PROOF</span></div>
      </section>

      <section className="proof-section">
        <div className="section-lead"><div className="eyebrow">3 SIMPLE RULES</div><h2>NO PROOF?<br />NO CLAIM.</h2><p>Every success comes with the test results behind it.</p></div>
        <div className="proof-blocks">
          <article className="proof-block"><span className="block-num">01</span><div className="proof-icon"><ShieldCheck size={24} /></div><h3>STAYS SAFE</h3><p>If the safe box is not working, the run stops. No guessing.</p><button onClick={() => navigate("/studio")} className="text-link">SEE A RUN <ArrowRight size={14} /></button></article>
          <article className="proof-block proof-block-yellow"><span className="block-num">02</span><div className="proof-icon"><Sparkles size={24} /></div><h3>TEST FIRST</h3><p>It remembers a fix only after every test passes.</p><button onClick={() => navigate("/lab")} className="text-link">SEE THE PROOF <ArrowRight size={14} /></button></article>
          <article className="proof-block proof-block-red"><span className="block-num">03</span><div className="proof-icon"><Activity size={24} /></div><h3>TELLS THE TRUTH</h3><p>If the results are too close to call, it says so.</p><button onClick={() => navigate("/lab")} className="text-link">SEE HOW WE TEST <ArrowRight size={14} /></button></article>
        </div>
      </section>

      <section className="bottom-cta brutal-card shadow-offset">
        <div><div className="eyebrow">SEE FOR YOURSELF.</div><h2>DON’T TAKE OUR WORD.</h2></div>
        <div className="cta-copy"><p>Watch a run step by step. Compare the results. Replay it any time, no account needed.</p><Button variant="green" onClick={() => navigate("/lab")}>OPEN THE PROOF PAGE <ExternalLink size={15} /></Button></div>
      </section>
    </div>
  );
}

function StudioScreen({ selected, setSelected, onReplay }: { selected: number; setSelected: (index: number) => void; onReplay: () => void }) {
  const phase = phases[selected];
  return (
    <div className="product-screen">
      <SectionHeader index="02" eyebrow="WATCH THE AI WORK" title="TRY IT" action={<Button variant="secondary" onClick={onReplay}><RotateCcw size={15} /> REPLAY</Button>} />
      <div className="studio-layout">
        <section className="run-queue brutal-card">
          <div className="panel-title"><span>TASKS</span><span className="mono muted">3 TOTAL</span></div>
          <div className="queue-list">
            <button className="queue-item is-selected"><div><b>CF-0042</b><span>parse_csv.py</span></div><StatusBadge status="running">CHECKING</StatusBadge><ChevronRight size={15} /></button>
            <button className="queue-item"><div><b>CF-0041</b><span>normalize_path.ts</span></div><StatusBadge status="verified">PASSED</StatusBadge><ChevronRight size={15} /></button>
            <button className="queue-item"><div><b>CF-0040</b><span>auth_header.go</span></div><StatusBadge status="failed">FAILED</StatusBadge><ChevronRight size={15} /></button>
          </div>
          <div className="queue-divider" />
          <div className="panel-title"><span>THE TASK</span><span className="mono muted">PYTHON</span></div>
          <div className="mission-mini"><div className="mission-file"><Code2 size={17} /><span>parse_csv.py</span><GitBranch size={14} /></div><p>Blank rows should be skipped, and the other rows should stay in order.</p><div className="mini-tags"><span>OPEN TESTS</span><span>SECRET TESTS</span></div></div>
        </section>

        <section className="studio-main">
          <div className="brutal-card run-header-card">
            <div className="run-header-meta"><div><div className="eyebrow">NOW RUNNING</div><h2>Fix blank rows in a CSV file</h2></div><StatusBadge status="running">CHECKING</StatusBadge></div>
            <PhaseTrack selected={selected} onSelect={setSelected} />
            <div className="phase-detail"><div><span className="detail-index">{phase.icon}</span><div><b>{phase.label}</b><p>{phase.detail}</p></div></div></div>
          </div>
          <div className="studio-code-grid">
            <div className="brutal-card code-card"><div className="panel-title"><span>THE FIX</span><span className="mono muted">+4 −1</span></div><div className="code-lines"><div><span className="line-num">18</span><span className="code-muted">for row in reader:</span></div><div className="code-add"><span className="line-num">19</span><span>+  if not row: <span className="code-key">continue</span></span></div><div><span className="line-num">20</span><span>   records.append(row)</span></div><div><span className="line-num">21</span><span className="code-muted">return records</span></div></div><div className="code-footer"><span><span className="health-dot dot-green" /> SMALL, SAFE CHANGE</span></div></div>
            <div className="brutal-card log-card"><div className="panel-title"><span>WHAT HAPPENED</span><span className="recording-dot"><span /> LIVE</span></div><div className="log-lines"><div><span>09:41:09</span> safe box ready <StatusBadge status="verified">SAFE</StatusBadge></div><div><span>09:41:13</span> remembered 3 older fixes</div><div><span>09:41:19</span> fix applied</div><div><span>09:41:26</span> open tests <StatusBadge status="verified">12 / 12</StatusBadge></div><div className="log-active"><span>09:41:34</span> secret tests running<span className="cursor-block" /></div></div><button className="text-link">SEE FULL LIST <ArrowRight size={14} /></button></div>
          </div>
        </section>

        <aside className="evidence-panel brutal-card">
          <div className="panel-title"><span>PROOF</span><StatusBadge status="running">CHECKING</StatusBadge></div>
          <div className="evidence-verdict"><span className="eyebrow">RESULT</span><strong>NOT DONE YET</strong><p>Every test must pass before the AI saves this fix.</p></div>
          <div className="evidence-list">{evidenceRows.map(row => <div className="evidence-row" key={row.label}><span>{row.label}</span><span className="evidence-value">{row.value}</span><StatusBadge status={row.status}>{row.status === "notrun" ? "NOT RUN" : row.status === "verified" ? "PASS" : ""}</StatusBadge></div>)}</div>
          <div className="evidence-rule" />
          <div className="evidence-note"><span className="eyebrow">MEMORY</span><p><span className="health-dot dot-yellow" /> Not saved yet. It waits for the tests.</p></div>
          <Button variant="primary" className="full-width" onClick={onReplay}>SEE THE DETAILS <ArrowRight size={15} /></Button>
        </aside>
      </div>
    </div>
  );
}

function ArenaScreen({ mode, setMode, navigate }: { mode: string; setMode: (mode: string) => void; navigate: (path: string) => void }) {
  return (
    <div className="product-screen">
      <SectionHeader index="03" eyebrow="FIX BUGS, EARN POINTS" title="PRACTICE" action={<div className="arena-xp"><span>POINTS</span><b>1,240</b><small>LEVEL 7</small></div>} />
      <section className="arena-hero brutal-card shadow-offset"><div><div className="eyebrow">PICK HOW TO PLAY</div><h2>FIX IT.<br /><span>PROVE IT.</span></h2></div><p>Each mission is a small broken program. Fix it and the tests will score you. Stuck? Ask for a hint.</p></section>
      <section className="mode-grid">
        {[{ id: "SOLO", label: "SOLO", icon: Terminal, desc: "You fix it alone.", meta: "NO HINTS" }, { id: "AI PARTNER", label: "AI PARTNER", icon: Sparkles, desc: "Get hints when stuck.", meta: "HINTS ALLOWED" }, { id: "AGENT ARENA", label: "AGENT ARENA", icon: Swords, desc: "Check the AI’s fix.", meta: "REVIEW" }].map(item => { const Icon = item.icon; return <button key={item.id} className={`mode-card ${mode === item.id ? "is-selected" : ""}`} onClick={() => setMode(item.id)}><span className="mode-icon"><Icon size={22} /></span><div><span className="eyebrow">{item.meta}</span><h3>{item.label}</h3><p>{item.desc}</p></div><ArrowUpRight size={18} /></button>; })}
      </section>
      <section className="arena-content-grid">
        <div className="mission-list brutal-card"><div className="panel-title"><span>MISSIONS</span><span className="mono muted">7 OF 10 DONE</span></div><div className="mission-progress"><span /><span /><span /><span /><span /><span /><span /><i /><i /><i /></div>{[{n:"01", title:"The empty iterator", tag:"EASY", status:"DONE", color:"green"},{n:"02", title:"Path normalization", tag:"MEDIUM", status:"DONE", color:"green"},{n:"03", title:"Header injection", tag:"HARD", status:"IN PROGRESS", color:"yellow"},{n:"04", title:"The silent fallback", tag:"BOSS", status:"LOCKED", color:"red"}].map(m => <div className="mission-row" key={m.n}><span className="mission-number">{m.n}</span><div><b>{m.title}</b><span>{m.tag}</span></div><StatusBadge status={m.color === "green" ? "verified" : m.color === "yellow" ? "running" : "blocked"}>{m.status}</StatusBadge><ChevronRight size={15} /></div>)}</div>
        <div className="arena-workspace brutal-card"><div className="panel-title"><span>YOUR MISSION</span><StatusBadge status="running">{mode}</StatusBadge></div><div className="workspace-task"><span className="eyebrow">MISSION 3</span><h3>Block a bad header before it causes harm.</h3><p>Make the failing test fail on purpose, find the cause, then make the smallest safe fix.</p></div><div className="workspace-split"><div className="workspace-code"><div className="mono muted">test_headers.py</div><div><span>01</span> <span className="code-key">def</span> validate(header):</div><div><span>02</span> &nbsp; <span className="code-key">return</span> header.strip()</div><div className="code-alert"><span>03</span> &nbsp; <span className="code-muted"># hidden edge case here</span></div></div><div className="workspace-feedback"><span className="eyebrow">NEXT STEP</span><strong>MAKE THE BUG HAPPEN</strong><p>You have one free hint.</p><Button variant="yellow" onClick={() => navigate("/studio")}>START MISSION <ArrowRight size={15} /></Button></div></div></div>
      </section>
    </div>
  );
}

function LabScreen({ selectedBench, setSelectedBench, navigate }: { selectedBench: string; setSelectedBench: (value: string) => void; navigate: (path: string) => void }) {
  const selected = benchmark.find(item => item.id === selectedBench) ?? benchmark[2];
  return (
    <div className="product-screen">
      <SectionHeader index="04" eyebrow="HOW WE KNOW IT WORKS" title="PROOF" action={<div className="button-row"><Button variant="secondary"><Download size={15} /> SAVE REPORT</Button><Button variant="primary" onClick={() => navigate("/replay")}><RotateCcw size={15} /> REPLAY</Button></div>} />
      <section className="lab-result-banner"><div><span className="eyebrow">THE RESULT</span><h2>IT SCORES HIGHER,<br /><span>BUT WE’RE NOT SURE YET.</span></h2></div><div className="lab-result-status"><StatusBadge status="running">NOT SURE YET</StatusBadge><p>We can’t say it works better yet.</p></div></section>
      <div className="lab-meta-strip"><div><span>PRACTICE SET</span><b>20 TASKS</b></div><div><span>REAL TEST</span><b>30 TASKS</b></div><div><span>TRIES PER TASK</span><b>5</b></div><div><span>CERTAINTY</span><b>95%</b></div><button className="method-button"><Search size={15} /> METHOD</button></div>
      <section className="condition-grid">{benchmark.map(item => <button key={item.id} className={`condition-card condition-${item.color} ${selectedBench === item.id ? "is-selected" : ""}`} onClick={() => setSelectedBench(item.id)}><span className="eyebrow">{item.label}</span><strong>{item.score}</strong><div className="condition-interval"><span className="interval-track"><i style={{ left: `${parseInt(item.interval.split("–")[0]) - 45}%`, width: `${parseInt(item.interval.split("–")[1]) - parseInt(item.interval.split("–")[0]) + 3}%` }} /></span><span className="mono">range {item.interval}%</span></div><div className="condition-footer"><span>{item.note}</span><b>{item.delta}</b></div></button>)}</section>
      <section className="lab-detail-grid"><div className="lab-chart brutal-card"><div className="panel-title"><span>SCORES SIDE BY SIDE</span><span className="mono muted">PICKED: {selected.label}</span></div><div className="chart-area"><div className="chart-axis"><span>40%</span><span>50%</span><span>60%</span><span>70%</span><span>80%</span></div>{benchmark.map(item => { const low = parseInt(item.interval.split("–")[0]); const high = parseInt(item.interval.split("–")[1]); const score = parseInt(item.score); return <button key={item.id} className={`chart-row ${selectedBench === item.id ? "is-selected" : ""}`} onClick={() => setSelectedBench(item.id)}><span className="chart-label">{item.label}</span><div className="chart-bar"><i style={{ left: `${(low - 40) * 2.5}%`, width: `${(high - low) * 2.5}%` }} /><b style={{ left: `${(score - 40) * 2.5}%` }} /></div><span className="chart-value">{item.score}</span></button>; })}</div><div className="chart-legend"><span><i className="legend-point" /> best guess</span><span><i className="legend-interval" /> likely range</span></div></div><div className="lab-method brutal-card"><div className="panel-title"><span>HOW WE TEST</span><StatusBadge status="verified">OPEN</StatusBadge></div><div className="method-list"><div><b>01</b><span>We split the tasks into practice and real test before starting.</span></div><div><b>02</b><span>Every task is tried 5 times in each of the 4 ways.</span></div><div><b>03</b><span>We show how sure we are about each score.</span></div><div><b>04</b><span>We compare ways fairly, task by task.</span></div></div><button className="text-link">READ MORE <ArrowRight size={14} /></button></div></section>
      <section className="trial-table brutal-card"><div className="panel-title"><span>EXAMPLE TRIES</span><div className="table-filter"><button className="is-active">ALL</button><button>PASS</button><button>FAIL</button></div></div><div className="table-scroll"><table><thead><tr><th>TASK</th><th>WAY</th><th>TRY</th><th>RESULT</th><th>TRIES USED</th><th>SECRET TESTS</th><th>REPLAY</th></tr></thead><tbody>{["T-031", "T-032", "T-033", "T-034"].map((task, i) => <tr key={task}><td className="mono">{task}</td><td>{i % 2 === 0 ? "SAVES PASSED FIXES" : "NO MEMORY"}</td><td className="mono">0{i + 1} / 05</td><td><StatusBadge status={i === 3 ? "failed" : "verified"}>{i === 3 ? "FAILED" : "PASSED"}</StatusBadge></td><td className="mono">{i + 1}</td><td>{i === 3 ? <StatusBadge status="notrun">NOT RUN</StatusBadge> : `${i + 3} / ${i + 3}`}</td><td><button className="icon-button" onClick={() => navigate("/replay")} aria-label={`Replay ${task}`}><RotateCcw size={15} /></button></td></tr>)}</tbody></table></div></section>
    </div>
  );
}

function ReplayScreen({ selected, setSelected, navigate }: { selected: number; setSelected: (index: number) => void; navigate: (path: string) => void }) {
  const phase = phases[selected];
  return (
    <div className="product-screen">
      <SectionHeader index="R" eyebrow="WATCH IT AGAIN, STEP BY STEP" title="REPLAY" action={<div className="button-row"><Button variant="secondary"><Download size={15} /> SAVE</Button><Button variant="primary" onClick={() => navigate("/studio")}>BACK</Button></div>} />
      <div className="replay-layout"><aside className="replay-timeline brutal-card"><div className="panel-title"><span>STEPS</span><StatusBadge status="verified">NO INTERNET NEEDED</StatusBadge></div>{phases.map((item, index) => <button key={item.label} onClick={() => setSelected(index)} className={`replay-step ${selected === index ? "is-selected" : ""}`}><span className="replay-number">{item.icon}</span><span><b>{item.label}</b><small>{item.detail.split(".")[0]}</small></span><ChevronRight size={15} /></button>)}</aside><section className="replay-detail"><div className="replay-call brutal-card"><div className="panel-title"><span>STEP: {phase.label}</span><span className="mono muted">RECORDED</span></div><div className="call-grid"><div><span className="eyebrow">WHAT WE ASKED</span><p>“Find the cause and make a small fix for blank rows.”</p></div><div><span className="eyebrow">WHAT THE AI SAID</span><p>{phase.detail}</p></div></div><div className="cassette-bar"><LockKeyhole size={14} /> THIS IS A RECORDING. NO KEY OR ACCOUNT NEEDED.</div></div><div className="replay-evidence-grid"><div className="brutal-card code-card"><div className="panel-title"><span>THE FIX</span></div><div className="code-lines"><div><span className="line-num">18</span><span className="code-muted">for row in reader:</span></div><div className="code-add"><span className="line-num">19</span><span>+  if not row: continue</span></div><div><span className="line-num">20</span><span>   records.append(row)</span></div></div></div><div className="brutal-card replay-verdict"><div className="panel-title"><span>RESULT</span><StatusBadge status={selected === 6 ? "verified" : "notrun"}>{selected === 6 ? "PASSED" : "NOT DONE"}</StatusBadge></div><div className="receipt-number">{selected === 6 ? "16 / 16" : `${selected + 10} / 16`}</div><p>{selected === 6 ? "Every test passed. The lesson was saved." : "This recording stops before the final result."}</p><div className="receipt-row"><span>OPEN TESTS</span><b>12 / 12</b></div><div className="receipt-row"><span>SECRET TESTS</span><b>{selected === 6 ? "4 / 4" : "NOT RUN"}</b></div></div></div></section></div>
    </div>
  );
}

function NewRunPanel({ open, onClose, onStart }: { open: boolean; onClose: () => void; onStart: () => void }) {
  if (!open) return null;
  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Start a new run"><div className="new-run-panel brutal-card shadow-offset"><div className="panel-title"><span>TRY A TASK</span><button className="icon-button" onClick={onClose} aria-label="Close new run"><X size={18} /></button></div><div className="new-run-heading"><span className="eyebrow">A SAFE, SMALL TASK</span><h2>WHAT SHOULD IT FIX?</h2></div><label className="field-label">DESCRIBE THE PROBLEM<textarea defaultValue="Skip blank CSV records without changing the record index." /></label><div className="field-grid"><label className="field-label">PROJECT<select defaultValue="csv-parser"><option value="csv-parser">csv-parser / main</option><option>path-utils / main</option></select></label><label className="field-label">MEMORY<select defaultValue="verified"><option value="verified">ONLY PASSED FIXES</option><option value="raw">EVERYTHING</option><option value="off">OFF</option></select></label></div><div className="budget-row"><div><span className="eyebrow">LIMITS</span><b>2 TRIES / 5 MINUTES / $0.10</b></div><StatusBadge status="verified">SAFE BOX ON</StatusBadge></div><p className="safety-note"><LockKeyhole size={15} /> If the safe box is not working, the task stops. Your computer is never touched.</p><div className="button-row modal-actions"><Button variant="secondary" onClick={onClose}>CANCEL</Button><Button variant="yellow" onClick={onStart}>START <ArrowRight size={15} /></Button></div></div></div>;
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
