# Parul Gupta — Engineering Portfolio

Premium Engineering OS portfolio for software engineering recruiting.

**Static site works with zero API keys and zero paid services.**

## Design hierarchy

| Layer | Share |
|-------|------|
| Professional product UI | ~80% |
| Engineering OS (⌘K, labs, architecture) | ~15% |
| Discoverable commands | ~5% |

Palette: obsidian · graphite · ice cyan · subtle lime status.

**Core philosophy:** recruiter sees a portfolio; engineer discovers an Engineering OS.

## Flagship systems

| Project | Stack highlights | Links |
|---------|------------------|-------|
| **PriceLoop** | FastAPI · PostgreSQL · Stripe · Redis/Celery scaffold | [Source](https://github.com/parulgupta-afk/Priceloop) |
| **CodeForge** | Express · Socket.IO · Gemini/Groq · Docker sandbox | [Demo](https://code-forge-jade.vercel.app) · [Source](https://github.com/parulgupta-afk/CodeForge) |
| **PulseOps** | Node · queues · realtime incident workflows | [Source](https://github.com/parulgupta-afk/pulseops) |

Applied: Pocket-Triage, SkyCall · Experiments: NutriVibe, Beacon, Disaster Mesh

## Local development

```bash
npm ci
npm run dev
```

Open http://localhost:3000

### Quality gates

```bash
npm run typecheck
npm run lint
npm run format:check
npm run test
npm run build
npx playwright install chromium   # once
npm run e2e
```

### Optional AI API

```bash
cp .env.example .env
# set GEMINI_API_KEY
npm run api
# optional: VITE_API_URL=http://localhost:8787
```

Without the API, the AI agent uses local grounded retrieval from `src/data/portfolioData.ts`.  
**AI is an enhancement, not a dependency.**

## Deploy (static, free)

```bash
npm run build
```

Deploy the `dist/` folder to Vercel, Netlify, Cloudflare Pages, or GitHub Pages.

No database, no paid AI, no paid analytics required for the portfolio site.

## Command Center (⌘K / Ctrl+K)

| Command | Action |
|---------|--------|
| `help` | 30-second summary |
| `whoami` | About |
| `sudo inspect parul` | Recruiter Mode |
| `trace codeforge` / `priceloop` / `pulseops` | System Trace |
| `open resume` | Resume section |
| `recruiter mode` | Recruiter Mode |
| `engineering mode` | Engineering Lab |
| `contact parul` | Contact |

## Metric / evidence policy

Claims use **implemented / measured / demo / target / count** semantics.  
No fabricated uptime, latency SLAs, or production scale numbers without evidence.

## Content source of truth

`src/data/portfolioData.ts`

## License

Private portfolio project.
