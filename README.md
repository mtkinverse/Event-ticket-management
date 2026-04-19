# Event & Ticket Management

Full-stack event and ticket management platform.
**Stack:** React + Vite (frontend) · Fastify + Sequelize (backend) · PostgreSQL · Stripe · SMTP email.
**Roles:** Customer, Organizer, Super Admin.

## Layout

```
backend/     # Fastify API + Sequelize models
frontend/    # React SPA
resources/   # Original specs (PDFs, wireframe, WBS)
CLAUDE.md    # Agent operating manual — read first
MEMORY.md    # Frozen project context — single source of truth
```

## Getting started

Phase 0 (this commit) is scaffolding only. No dependencies installed, no database set up. Service-specific implementation begins in the next chat session (see `MEMORY.md` §13).

When you are ready:

```bash
cd backend  && npm install && cp .env.example .env
cd frontend && npm install && cp .env.example .env
```

## Agent notes

`CLAUDE.md` at the repo root is the operating manual for AI-assisted work. It enforces:

1. Always update `MEMORY.md` when facts change.
2. Read the frozen resource analyses in `MEMORY.md` §2–§5 before opening `resources/`.
3. Jump to `MEMORY.md` sections by line range (TOC at §0) to save tokens.
4. Use the design-pattern map — no ad-hoc if/else ladders for roles, payments, notifications, or event state.

Do not run `/init`; it would overwrite the hand-authored `CLAUDE.md`.
