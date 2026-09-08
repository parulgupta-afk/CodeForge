# CodeForge

Autonomous Coding Agent with Sandboxed Execution

**GitHub:** https://github.com/parulgupta-afk/CodeForge

## Current Status: Phase 10 – Metrics Dashboard

### What works now
- Full autonomous agent loop
- Studio UI with live WebSocket journal
- **Metrics dashboard**: success rate, first-attempt rate, avg attempts, failure categories

### API
```
GET /api/metrics
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

### Roadmap
- Phase 0–9 ✅
- Phase 10 ✅ Metrics Dashboard
- Phase 11 → Benchmarking
