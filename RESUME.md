# Resume / LinkedIn copy for CodeForge

## Short project line
CodeForge — Autonomous coding agent with Docker-sandboxed execution and bounded self-repair (React, Node, TypeScript, Gemini, Groq, Docker).

## Bullet points (copy/paste)

• Designed and built an end-to-end autonomous coding agent: natural-language task → LLM code generation → isolated execution → structured error classification → repair loop (max 3 attempts).

• Implemented a Docker-based sandbox with CPU/memory caps, network disabled, wall-clock timeouts, and guaranteed container cleanup so untrusted generated code never runs on the host.

• Built a rule-based error classifier (SyntaxError, MissingDependency, Timeout, etc.) to drive targeted repair prompts instead of raw traceback dumps.

• Shipped a React Studio UI with live Socket.IO execution logs, attempt history, and a metrics dashboard (success rate, first-attempt rate, failure categories).

• Created a fixed 25-task benchmark suite and measured agent reliability for portfolio evidence.

## Skills to list
TypeScript · Node.js · Express · React · Docker · WebSockets · PostgreSQL · LLM APIs · Agent design · Benchmarking
