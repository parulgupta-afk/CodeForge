# Portfolio 2.0 — Phase Completion Log

Status key: **DONE** = shipped in this package · **PARTIAL** = baseline exists · **TODO** = next sprint

---

## PHASE 0 — Foundation Audit

**Status:** DONE (baseline preserved + typed extensions)

### What this phase is
A deliberate pass over the existing React + TypeScript + Vite portfolio before adding OS features: understand components, data model, visual language, and failure modes.

### What it is doing
- Kept section architecture: Hero, About, Projects, Capabilities, Experience, Comms Terminal, Bento, Project Modal, Intro, Shader BG
- Extended TypeScript models (`roleFit`, `decisions`, `CommandItem`, `BrowserTelemetry`, `RecruiterRole`)
- Centralized content still in `src/data/portfolioData.ts`
- Added `ErrorBoundary` so runtime errors show a reboot UI instead of a white screen

### How it helps the app
Prevents feature spaghetti. New modules (Command Center, Recruiter, Telemetry) plug into clear types and a single data file. Recruiters and you can change projects without rewriting UI.

### Technologies used
| Tech | Role |
|------|------|
| **React 19** | Component tree, hooks, portals for modals/overlays |
| **TypeScript** | Compile-time contracts for projects, commands, telemetry |
| **Vite 6** | Dev server, ESM bundling, fast HMR |
| **React Error Boundaries** | Catch render errors in subtree |

### Technology detail
- **React**: UI library that renders a virtual DOM and updates the real DOM efficiently. Hooks (`useState`, `useEffect`, `useCallback`, `useMemo`) hold UI state without class components.
- **TypeScript**: JavaScript with static types. Interfaces like `ProjectItem` document shape of data so refactors fail at build time, not in production.
- **Vite**: Tool that serves source modules natively in dev and Rollup-bundles for production. Faster cold start than older CRA/Webpack setups.
- **Error Boundary**: Class component implementing `getDerivedStateFromError` / `componentDidCatch` to isolate crashes.

### Terminal
```bash
cd Portfolio
npm install
npm run lint    # tsc --noEmit
npm run dev
```

### Git
```bash
git add src/types.ts src/components/ErrorBoundary.tsx src/main.tsx src/data/portfolioData.ts
git commit -m "Phase 0: foundation types, error boundary, data model extensions"
```

---

## PHASE 1 — Design System 2.0

**Status:** PARTIAL (tokens + a11y; full holographic system still TODO)

### What this phase is
Evolve the cyber/glass aesthetic with design tokens, reduced-motion support, and focus rings—without a full visual redesign.

### What it is doing
- CSS variables for surface, primary, glow, radius in `index.css`
- `prefers-reduced-motion: reduce` disables heavy animation
- `:focus-visible` outlines for keyboard users
- Existing glass-panel / tech-grid / glow-hover utilities retained

### How it helps the app
Consistent colors and motion policy. Accessibility baseline for recruiters using keyboard or reduced-motion OS settings. Easier future theming.

### Technologies used
| Tech | Role |
|------|------|
| **Tailwind CSS v4** | Utility classes via `@import "tailwindcss"` |
| **CSS custom properties** | Design tokens |
| **Media queries** | `prefers-reduced-motion` |

### Technology detail
- **Tailwind**: Utility-first CSS; compose UI from small classes (`flex`, `rounded-xl`, `border-white/10`) instead of large custom CSS files.
- **Design tokens**: Named values (`--color-primary`) so one change updates the whole OS look.
- **prefers-reduced-motion**: OS-level signal that the user wants less animation; we honor it for inclusion and vestibular comfort.

### Terminal
```bash
npm run dev
# inspect :root tokens in DevTools → Elements → Styles
```

### Git
```bash
git add src/index.css
git commit -m "Phase 1: design tokens, reduced-motion, focus-visible"
```

---

## PHASE 2 — Cinematic Boot Sequence

**Status:** PARTIAL (existing IntroSequence kept; progress-bar boot TODO)

### What this phase is
First-run cinematic handoff into the OS.

### What it is doing today
- `IntroSequence` multi-phase animation with audio chirps
- Skip + complete callbacks into main app
- Replay from nav “reboot” control

### How it helps the app
Sets the “engineering OS” tone before content. Skip respects impatient visitors.

### Technologies used
**React state machines (phase enum)**, **Canvas 2D** (book-open effect), **Web Audio** via `audioSynth.ts`

### Technology detail
- **Canvas 2D**: Immediate-mode drawing API for lightweight custom animation without Three.js.
- **Web Audio API** (in `audioSynth`): Synthesized clicks/chirps without loading large audio files.

### Git
```bash
git add src/components/IntroSequence.tsx src/utils/audioSynth.ts
git commit -m "Phase 2: retain cinematic intro (boot progress upgrade later)"
```

---

## PHASE 3 — Portfolio OS Dashboard

**Status:** TODO (BentoOverview is a related grid overview)

### Planned
Central widget dashboard (system status, projects count, availability). Bento mode is the current stand-in.

---

## PHASE 4 — Command Center

**Status:** DONE

### What this phase is
Keyboard-first command palette (⌘K / Ctrl+K) to navigate the portfolio like an IDE.

### What it is doing
- Global shortcut opens modal overlay
- Fuzzy-ish filter over nav, projects (by title/tags), modes, external links
- Arrow keys + Enter + Escape
- Actions: scroll to section, open project modal, open Recruiter, toggle Bento, open GitHub/LinkedIn/email

### How it helps the app
Power users and interviewers jump without scrolling. Demonstrates product craft (command palette pattern used in Linear, VS Code, Notion).

### Technologies used
| Tech | Role |
|------|------|
| **React controlled input** | Query state |
| **Keyboard events** | Global and local key handling |
| **ARIA dialog** | `role="dialog"` `aria-modal` |
| **Lucide icons** | Terminal icon in nav |

### Technology detail
- **Command palette pattern**: Single text field + ranked list of actions; keyboard-primary UX.
- **Event.preventDefault on Ctrl/Cmd+K**: Stops browser “search focus” so the app owns the shortcut.
- **Scoring function**: Simple substring/token score over labels + keywords (no external search lib required).

### Terminal
```bash
npm run dev
# Press Ctrl+K (Windows) or Cmd+K (Mac)
```

### Git
```bash
git add src/components/CommandCenter.tsx src/App.tsx src/components/TopNavBar.tsx
git commit -m "Phase 4: Command Center (Ctrl/Cmd+K)"
```

---

## PHASE 5–6 — AI Portfolio Agent + Architecture

**Status:** TODO

### Planned
Gemini-backed agent over portfolio JSON; intent → retrieve → structured UI actions. Knowledge already partially exists in `portfolioData.ts` + `decisions`.

---

## PHASE 7 — Recruiter Mode

**Status:** DONE

### What this phase is
Role lens that reorders projects and highlights stack for Backend / Full Stack / AI / Frontend / Software / Product.

### What it is doing
- Modal with role selector
- `roleFit` on each project drives ranking
- Shows focus skills + top modules + capability bars
- Click module → opens Project Modal

### How it helps the app
Recruiters self-serve a narrative (“show me backend”). Differentiates from static project grids.

### Technologies used
**React useMemo ranking**, **TypeScript union `RecruiterRole`**, **glass UI panels**

### Technology detail
- **Union types**: `RecruiterRole = 'backend' | 'fullstack' | ...` restricts valid roles at compile time.
- **Client-side ranking**: No backend required; sort is pure function of static data—fast and offline-friendly.

### Terminal
```bash
npm run dev
# Click Recruiter in nav, or Cmd+K → Recruiter Mode
```

### Git
```bash
git add src/components/RecruiterMode.tsx src/data/portfolioData.ts src/types.ts
git commit -m "Phase 7: Recruiter Mode with roleFit ranking"
```

---

## PHASE 8 — Project DNA

**Status:** TODO (tags + architecture pillars exist as text/list)

---

## PHASE 9 — Architecture Explorer

**Status:** TODO (architecture details + decisions in modal)

---

## PHASE 10 — Engineering Decision Records

**Status:** DONE (in Project Modal)

### What this phase is
“Why I built it this way” records: problem → options → chosen → reason.

### What it is doing
- `decisions[]` on projects (PulseOps, Pocket-Triage, SkyCall, …)
- Rendered under Architecture tab in `ProjectModal`

### How it helps the app
Interview gold: shows trade-off thinking, not only tech names.

### Technologies used
**Structured data in TS**, **conditional React render**

### Technology detail
- **Decision records (lightweight ADRs)**: Document architectural choices so future you and interviewers understand *why*, not only *what*.

### Git
```bash
git add src/components/ProjectModal.tsx src/data/portfolioData.ts
git commit -m "Phase 10: engineering decision records in project inspector"
```

---

## PHASE 11 — Live System Telemetry

**Status:** DONE

### What this phase is
HUD of **real browser metrics only** (no fake server uptime).

### What it is doing
- `useTelemetry` hook: FPS via `requestAnimationFrame`, viewport, `deviceMemory`, Network Information API, online/offline, WebGL detect, reduced-motion, language
- Collapsible HUD bottom-right

### How it helps the app
Proves performance awareness. Honest telemetry (explicitly labeled browser-measured).

### Technologies used
| Tech | Role |
|------|------|
| **requestAnimationFrame** | FPS sampling |
| **Network Information API** | `navigator.connection.effectiveType` |
| **WebGL context probe** | Capability detection |
| **matchMedia** | reduced-motion |

### Technology detail
- **rAF**: Browser schedules paint-aligned callbacks; counting frames per second measures actual display rate.
- **Network Information API**: Optional browser API exposing effective connection type (4g, 3g, etc.).
- **WebGL**: JavaScript API to GPU; probing `getContext('webgl2')` detects graphics capability for shaders.

### Git
```bash
git add src/hooks/useTelemetry.ts src/components/TelemetryHUD.tsx src/App.tsx
git commit -m "Phase 11: browser telemetry HUD (FPS, network, WebGL)"
```

---

## PHASE 12–21, 23–31, 33–35

**Status:** TODO  
(Performance Lab, GitHub integration, skill graph, mission timeline, interactive resume, voice, spatial 3D, easter eggs, lab simulators, security center, mobile UX polish, portfolio API, Prisma DB, RAG, OTel, testing, CI/CD, deployment topology, analytics, contact backend, Portfolio DNA signature.)

Existing related baselines: Comms terminal contact UI, WebGL shader background, Bento mobile-adjacent layout, Motion/audio.

---

## PHASE 22 — Accessibility Mode

**Status:** PARTIAL

### What is doing
- Reduced motion CSS
- Focus-visible outlines
- Dialog roles on Command Center / Recruiter
- Keyboard: Esc closes overlays; arrows in command list

### Still TODO
Dedicated accessibility panel (high contrast, large text toggles).

---

## PHASE 32 — SEO

**Status:** DONE (baseline)

### What this phase is
Discoverability and link previews.

### What it is doing
- Title, description, canonical, theme-color
- Open Graph + Twitter card meta
- JSON-LD `Person` structured data

### How it helps the app
Better Google/LinkedIn/Twitter previews when sharing `pulseops-server-29lu.vercel.app` or future domain.

### Technologies used
**HTML meta tags**, **JSON-LD**, **schema.org Person**

### Technology detail
- **Open Graph**: Protocol for rich previews when URLs are shared on social platforms.
- **JSON-LD**: Machine-readable graph embedded in page for search engines.

### Git
```bash
git add index.html
git commit -m "Phase 32: SEO meta, Open Graph, JSON-LD Person"
```

---

## Content phase — Featured projects data

**Status:** DONE

### What it is doing
Six modules in data: PulseOps, Pocket-Triage, SkyCall, NutriVibe, Beacon, Disaster Mesh—with tags, architecture bullets, metrics, GitHub links, roleFit, decisions where applicable.

### How it helps
Portfolio reflects strongest systems work (queues, RAG, realtime), not only CRUD demos.

---

# Full push sequence (Windows CMD)

```cmd
cd C:\Users\parul\Portfolio

git status
git add .
git commit -m "Portfolio 2.0 Sprint 1: Command Center, Recruiter Mode, Telemetry, decisions, SEO, error boundary"
git branch -M main
git remote -v
git push -u origin main
```

If remote missing:

```cmd
git remote add origin https://github.com/parulgupta-afk/Portfolio.git
git push -u origin main
```

If rejected (remote has commits you don’t):

```cmd
git pull origin main --rebase
git push origin main
```

# Local verify

```cmd
cd C:\Users\parul\Portfolio
npm install
npm run dev
```

Open http://localhost:3000 — try Ctrl+K, Recruiter, project Architecture tab, telemetry widget.


---

## Continuation log (Sep 2026)

- Voice interface (Web Speech)
- Interactive resume variants
- Spatial constellation (CSS)
- GitHub activity UI (preview + real profile link)
- BootSequence module checklist
- portfolio-api (`server/index.ts`) + `askPortfolioAgent` Gemini optional path
- GitHub Actions CI (lint + build)
