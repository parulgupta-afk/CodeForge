# CodeForge

Autonomous Coding Agent with Sandboxed Execution

**GitHub:** https://github.com/parulgupta-afk/CodeForge

## Current Status: Phase 12 – Deployment + Security

### Completed phases
- 0–11 ✅ (including 25-task benchmark)
- 12 ✅ Rate limiting, Helmet, Docker, deploy guide

### Security
- Rate limit: 60 req/min API, 10 runs/min
- Helmet headers
- Body size limit
- Secrets via `.env` only

### Deploy
See [DEPLOY.md](./DEPLOY.md)

### Benchmark (avoid rate limits)
```cmd
cd benchmark
set BENCH_DELAY_MS=3000
npm run bench
```

### Quick Start
```cmd
cd server && npm install && npm run dev
cd client && npm install && npm run dev
```
