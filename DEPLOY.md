# CodeForge Deployment Guide

## Architecture (recommended)

```
Vercel (React client)
        │
        ▼
Render / Fly.io (Express + Socket.IO backend)
        │
   ┌────┴────┐
   ▼         ▼
Anthropic   PostgreSQL (Neon / Supabase)
```

Docker sandbox on a typical PaaS is hard (no Docker daemon).
Options:
1. Run backend on a VPS / Fly.io machine with Docker installed
2. Keep `USE_DOCKER=false` and use the local executor with strict timeouts
3. Later: plug in E2B as an alternate sandbox backend

## Frontend → Vercel

```cmd
cd client
npm run build
```

- Connect the `client` folder as a Vercel project
- Set env: none required for static frontend (API URL via proxy or `VITE_API_URL`)

If API is on another domain, set in client:
```
VITE_API_URL=https://your-backend.onrender.com
VITE_WS_URL=https://your-backend.onrender.com
```

## Backend → Render / Fly.io

1. Create a Web Service from the repo
2. Root directory: `server` (or use `docker/backend.Dockerfile`)
3. Env vars:
   - `ANTHROPIC_API_KEY`
   - `DATABASE_URL` (Neon/Supabase)
   - `USE_DOCKER=false` (unless you have Docker)
   - `PORT` (platform usually sets this)
4. Health check path: `/api/health`

## Security checklist
- [x] Rate limiting on `/api` and `/api/runs`
- [x] Helmet security headers
- [x] CORS (tighten origin in production)
- [x] Body size limit (1mb)
- [x] Secrets only in env / platform secrets
- [x] Health endpoint
