# ADR 0001: No LangGraph / Temporal for the agent loop

## Status
Accepted

## Context
The orchestrator is a bounded generate → execute → classify → repair loop.
Repository work adds a small explicit state machine and tool registry.

## Decision
Keep the control flow in plain TypeScript (transition table + injectable deps).
Do not adopt LangGraph, LangChain, or Temporal for the demo.

## Consequences
- Easier to test and explain in interviews
- No framework migration risk
- Revisit only if multi-tenant job queues become a real requirement
