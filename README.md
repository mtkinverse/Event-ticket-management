# Event & Ticket Management

Full-stack event and ticket management platform.
**Stack:** React + Vite (frontend) · Fastify + Sequelize (backend) · PostgreSQL · Stripe · SMTP email.
**Roles:** Customer, Organizer, Super Admin.

## Layout

```
backend/     # Fastify API + Sequelize models
frontend/    # React SPA
resources/   # Original specs (PDFs, wireframe, WBS)
docs/        # SRS, change log
```

## Getting started

Requires Node 20+ and PostgreSQL 14+.

```bash
cd backend  && npm install && cp .env.example .env && npm run db:setup && npm start
cd frontend && npm install && cp .env.example .env && npm run dev
```

Backend serves on `:3000`, frontend on `:5173`.

## Conventions

- Backend follows a layered structure: `routes/` → `handlers/` → `services/` → `repos/` → `models/`. Only `repos/` touches Sequelize directly.
- Cross-cutting concerns use the strategy pattern (`backend/src/strategies/`): payment gateways, notification channels, role policies, event-state transitions.
- Frontend state is React Context + hooks (no Redux). Route protection lives in `frontend/src/guards/`.
- Small functions, single responsibility. Comments only when the *why* is non-obvious.

## Tests

```bash
cd backend && npm test
```
