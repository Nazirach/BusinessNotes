# BusinessNotes

**The Business Information Network** — a business information, journalism, social, opportunity, media, AI, and governance platform.

## Current architecture

- React + Vite frontend
- Express + tRPC backend
- MySQL + Drizzle ORM
- Editorial workflow with sources, evidence, corrections, takedowns, and appeals
- Social interactions, messaging, notifications
- Media upload/processing, captions, moderation
- Trust & Safety: reports, blocks, mutes
- Governance: moderation cases, admin review, privacy controls, audit logs
- AI: content generation, source-grounded answers, search, recommendations, matching
- Public SEO routes: `/news/:id`, `/article/:id`, `/robots.txt`, `/sitemap.xml`

## Requirements

- Node.js 20+
- pnpm 10+
- MySQL-compatible database

## Local setup

```bash
cp .env.example .env
pnpm install
pnpm db:migrate
pnpm dev
```

Open `http://localhost:3000`.

## Validation commands

```bash
pnpm check
pnpm test
pnpm build
```

Optional browser tests:

```bash
pnpm test:e2e
```

The Playwright suite expects a running application at `BASE_URL` (default `http://127.0.0.1:3000`).

## Health checks

- `GET /healthz` — process health; returns HTTP 200 when the Node process is alive.
- `GET /readyz` — readiness check; returns HTTP 200 only when a database handle is available.

These endpoints are suitable for hosting/load-balancer health checks.

## Environment variables

See `.env.example`. **Never commit `.env`, production secrets, database passwords, OAuth credentials, or API keys.**

## GitHub workflow

Every push and pull request to `main`, `master`, or `develop` runs:

1. dependency installation with the locked pnpm version
2. TypeScript validation
3. unit tests
4. production build

The workflow intentionally does not run database migrations against CI or production. Migrations should be executed explicitly against the intended database.

## Database migrations

Migrations are stored in `drizzle/` and should be reviewed before applying them to production.

```bash
pnpm db:migrate
```

## Production deployment

This repository is deployment-platform agnostic. A production host should:

1. install Node 20 and pnpm 10;
2. install with `pnpm install --frozen-lockfile`;
3. configure all required environment variables;
4. run `pnpm db:migrate` against the production MySQL database;
5. run `pnpm build`;
6. start with `pnpm start`;
7. expose `/healthz` and `/readyz` for monitoring.

## Security baseline

- Secrets belong in GitHub Actions/hosting secret stores, never in Git.
- Database migrations are explicit and reviewable.
- Public APIs should expose DTOs rather than raw database rows.
- Privacy, block, mute, messaging, and moderation checks are enforced server-side; UI controls are not treated as security boundaries.
- Editorial takedown and moderation actions require elevated authorization.

## Project status

This repository is the GitHub-ready source baseline prepared before the real usage/runtime audit. Passing CI means the code passes the configured static/unit/build checks; it does **not** by itself prove production database, OAuth, media storage, LLM, or external-service configuration.
