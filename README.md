# CodeForge

Autonomous Coding Agent with Sandboxed Execution

**GitHub:** https://github.com/parulgupta-afk/CodeForge

## Current Status: Phase 9 – Live WebSocket Logs

### What works now
- Full agent loop with structured error classification
- Docker / local sandbox
- Studio UI
- **Live WebSocket events** streamed into the Working Journal

### Events emitted
```
run:started → attempt:started → code:generated → execution:started
→ execution:output | execution:error → error:classified → repair:started
→ attempt:completed → run:completed | run:failed
```

### Quick Start (Windows CMD)

**Terminal 1 – Backend**
```cmd
cd codeforge\server
npm install
npm run dev
```

**Terminal 2 – Frontend**
```cmd
cd codeforge\client
npm install
npm run dev
```

Open → http://localhost:5173

### Roadmap
- Phase 0–5 ✅
- Phase 6 ✅ Error Classifier
- Phase 7 → PostgreSQL (optional)
- Phase 8 ✅ Studio UI
- Phase 9 ✅ Live WebSocket Logs
- Phase 10 → Metrics Dashboard
