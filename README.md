# CodeForge

Autonomous Coding Agent with Sandboxed Execution

**GitHub:** https://github.com/parulgupta-afk/CodeForge

## Current Status: Phase 7 – PostgreSQL Persistence

### What works now
- Full autonomous loop (Generate → Execute → Classify → Repair)
- Docker sandbox (optional)
- **PostgreSQL persistence** for runs and attempts
- Graceful fallback to in-memory store when DATABASE_URL is missing

### Database Tables
- `runs` – one row per task
- `attempts` – one row per generation/execution attempt

### Setup (Windows CMD)

```cmd
cd codeforge\server
npm install pg
npm install -D @types/pg

:: Add your Neon / Supabase / local Postgres URL
echo DATABASE_URL=postgresql://user:pass@host:5432/codeforge >> .env

npm run dev
```

### Free database options
- Neon → https://neon.tech
- Supabase → https://supabase.com

### Test

```cmd
curl -X POST http://localhost:3001/api/runs -H "Content-Type: application/json" -d "{\"task\": \"Calculate the average of numbers from 1 to 100\"}"
curl http://localhost:3001/api/health
```

## Roadmap Progress
- Phase 0 ✅ Environment + Architecture
- Phase 1 ✅ Backend Foundation
- Phase 2 ✅ LLM Code Generation
- Phase 3 ✅ Local Execution Engine
- Phase 4 ✅ Autonomous Repair Loop
- Phase 5 ✅ Docker Sandbox
- Phase 6 → Error Classifier (push when ready)
- Phase 7 ✅ PostgreSQL Persistence
- Phase 8 → React Frontend
