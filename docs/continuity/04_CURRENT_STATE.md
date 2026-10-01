# BusinessNotes — Current State

## Verified repository baseline
Repository: `Nazirach/BusinessNotes`  
Branch: `main`

The repository README identifies the platform as a business information, journalism, social, opportunity, media, AI, and governance platform.

## Verified architecture from repository documentation
- React + Vite
- Express + tRPC
- MySQL + Drizzle ORM
- Editorial workflow: sources, evidence, corrections, takedowns, appeals
- Social: interactions, messaging, notifications
- Media: upload/processing, captions, moderation
- Trust & Safety: reports, blocks, mutes
- Governance: moderation cases, admin review, privacy controls, audit logs
- AI: content generation, source-grounded answers, search, recommendations, matching
- Public SEO: news/article routes, robots.txt, sitemap.xml

## Validation documented by repository README
The project defines:
- `pnpm check`
- `pnpm test`
- `pnpm build`
- optional `pnpm test:e2e`

Health endpoints:
- `/healthz`
- `/readyz`

## Important source-control state
A Manus development checkpoint was previously prepared outside GitHub:
- Manus checkpoint: `40e1d24`
- local Manus commit: `d480b39f29ee9b915c57dce53284a9fb61b78d83`
- intended branch: `manus-sync-2026-10-01`

That commit was not found in GitHub when checked. Therefore it is **pending/unpublished**, not part of the verified GitHub main baseline.

The Manus work reportedly passed typecheck, unit tests, build, and browser E2E, but those results are historical agent-reported results and must be revalidated when that source is brought into GitHub.

## Current priority
1. Preserve continuity.
2. Audit actual repository source and runtime behavior.
3. Reconcile pending Manus work without overwriting or silently replacing the GitHub baseline.
4. Validate database schema and migrations.
5. Validate authentication/authorization.
6. Validate external integrations and production configuration.
7. Continue feature development only after the baseline is understood.

## Known constraint
The GitHub repository has previously contained source archives rather than all source paths being directly visible at repository root. Agents must inspect the actual repository tree before assuming a source path exists.

