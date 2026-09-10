# Resume / LinkedIn copy for CodeForge

## Short line
CodeForge — Autonomous coding agent with Docker-sandboxed execution and bounded self-repair (React, Node, TypeScript, Gemini/Groq, Docker).

## Bullets

• Built an autonomous coding agent: natural-language task → LLM code generation → isolated execution → structured error classification → repair loop (max 3 attempts).

• Implemented a Docker sandbox with CPU/memory/PID limits, network disabled, capability drop, non-root user, timeouts, and container cleanup for untrusted generated code.

• Built a rule-based error classifier (SyntaxError, MissingDependency, Timeout, PermissionDenied, etc.) to drive targeted repair prompts.

• Shipped a React Studio UI with live Socket.IO execution logs, attempt history, and a metrics dashboard.

• Evaluated on a fixed 25-task benchmark; committed results in the repo report 100% first-attempt success on that run (re-run for your environment).

## Skills
TypeScript · Node.js · Express · React · Docker · WebSockets · PostgreSQL · LLM APIs · Agent design · Benchmarking
