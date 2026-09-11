# CodeForge Security Model

This document describes the **actual** security posture of CodeForge. It is not a claim of perfect isolation.

## Threat model

Untrusted inputs include:

- Natural-language tasks that drive LLM code generation
- **LLM-generated Python** executed by the agent
- HTTP API clients (rate, payload size, abuse)

Attack classes considered:

| Threat | Example |
|--------|---------|
| Infinite loops / CPU abuse | `while True: pass` |
| Memory exhaustion | Huge allocations |
| Fork bombs | Process spawning |
| Network exfiltration | `urllib` / sockets |
| Filesystem abuse | Read/write outside workspace |
| Secret leakage | Child process inherits `GROQ_*` / `GEMINI_*` |
| Huge stdout/stderr | Log flooding / memory pressure |
| Huge source payloads | Oversized generated code |
| API flooding | Rapid `POST /api/runs` |
| Privilege escalation | Escape container / host |

## Mitigations implemented

### Docker sandbox (preferred)

When `USE_DOCKER=true` and Docker is available:

- **Network:** `NetworkMode: none`
- **Memory:** 512 MB hard limit
- **CPU:** 1 core (`NanoCpus`)
- **PIDs:** limit 64
- **Capabilities:** `CapDrop: ALL`
- **Privileges:** `no-new-privileges`
- **User:** `nobody` (65534)
- **Code mount:** read-only bind of temp dir
- **`/tmp`:** tmpfs, `noexec`, size-capped
- **Timeout:** wall-clock kill (`SIGKILL`)
- **Output:** truncated (~256 KB)
- **Code size:** rejected above ~200 KB
- **Env inside container:** minimal (`PYTHONUNBUFFERED`, etc.) — **not** host secrets

### Local subprocess fallback

When Docker is unavailable or `USE_DOCKER=false`:

- Temporary working directory + cleanup
- Wall-clock timeout + force kill
- Output size limits
- **Minimal child `env`** (PATH only; **API keys not inherited**)

### LOCAL SUBPROCESS EXECUTION IS NOT A SECURITY BOUNDARY

Local mode does **not** isolate the host filesystem or kernel resources the way a container does. Use Docker for any multi-tenant or exposed deployment.

### Docker is stronger than local — but not a microVM

CodeForge relies on the host Docker daemon and Linux namespaces. It is **not** equivalent to gVisor, Firecracker, or a dedicated sandboxed worker fleet. A determined attacker with a container escape chain against the host kernel could still be dangerous.

### API layer

- Helmet HTTP headers
- Rate limits on `/api` and `/api/runs`
- JSON body size limit (1 MB)
- CORS (should be tightened to a known origin in production)

## What is intentionally not claimed

- “Fully secure”
- “Production-proof multi-tenant isolation”
- Immunity to all kernel/Docker CVEs
- Safety of `USE_DOCKER=false` on a public internet host

## Future hardening (not implemented)

- gVisor / Firecracker microVMs
- Stronger seccomp profiles
- Dedicated execution workers on separate hosts
- Authentication on public APIs
- Per-tenant quotas beyond basic rate limits

## Operational recommendations

1. Prefer `USE_DOCKER=true` whenever Docker is available.
2. Do not expose the API publicly without auth + strict CORS + lower rate limits.
3. Keep LLM API keys only in server environment / secret manager — never in the client.
4. Treat benchmark/demo machines as single-tenant.
