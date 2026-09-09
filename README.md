# CodeForge

Autonomous Coding Agent with Sandboxed Execution

**GitHub:** https://github.com/parulgupta-afk/CodeForge

## Current Status: Phase 11 – Benchmarking

### What works now
- Full autonomous agent loop
- Studio UI with live WebSocket journal
- **Metrics dashboard**: success rate, first-attempt rate, avg attempts, failure categories
- **Benchmark Suite**: automated evaluation runner (`benchmark/runner.ts`) measuring Pass@1, Pass@3, self-repair effectiveness, and generating JSON/Markdown reports

### API
```
GET /api/metrics
POST /api/runs
```

### Quick Start (Windows CMD)

**Terminal 1**
```cmd
cd codeforge\server
npm install
npm run dev
```

**Terminal 2**
```cmd
cd codeforge\client
npm install
npm run dev
```

Open → http://localhost:5173

**Terminal 3 (Benchmark Suite)**
```cmd
cd codeforge\benchmark
npx ts-node runner.ts
```
*(Or run `npm run benchmark` from project root)*

### Roadmap
- Phase 0–9 ✅
- Phase 10 ✅ Metrics Dashboard
- Phase 11 ✅ Benchmarking

