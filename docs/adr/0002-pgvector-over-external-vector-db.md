# ADR 0002: pgvector inside existing Postgres

## Status
Accepted

## Context
Experience memory needs embeddings. The project already optionally uses Postgres.

## Decision
Use pgvector in the same database rather than Chroma/Qdrant/Mongo.

## Consequences
- One operational dependency
- Embedding model/dimension pinned in config when vectors are enabled
- Fine for portfolio scale; external vector DB can wait
