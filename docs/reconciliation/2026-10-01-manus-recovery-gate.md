# Manus Recovery Integration Gate — 2026-10-01

Status: RECOVERY BRANCH / CONTROLLED INTEGRATION

Base: `sync/full-source-tree`
Archive: `businessnotes-manus(1).zip`

## Recovered and promoted

The recovered archive contains a complete BusinessNotes source tree and verified Manus runtime artifacts.

The first promotion is intentionally limited to small, self-contained application helpers whose archive blob identities were independently recovered:

- `client/src/lib/adminQueue.ts`
- `client/src/lib/adminQueue.test.ts`
- `client/src/lib/onboarding.ts`
- `client/src/const.ts`
- `server/rateLimit.ts`

These changes are application-code only. No database schema, migration journal, migration SQL, or production startup behavior is changed.

## Deliberately not promoted yet

The archive contains materially different versions of:

- `server/routers.ts`
- `server/db.ts`
- `server/ai.ts`
- `client/src/pages/Home.tsx`
- `client/src/components/AIChatBox.tsx`
- `client/src/components/DashboardLayout.tsx`
- `client/src/pages/PublicEditorial.tsx`
- multiple server/client tests

These require semantic diff review before promotion because they are large cross-cutting changes.

## Database gate

Migration files remain frozen. In particular, the archive confirms:

- missing `0005_business_network.sql`
- both `0015_curly_star_brand.sql` and `0015_trust_safety.sql`
- `0017_governance.sql` without a matching journal entry

No migration is reconstructed from schema inference.

## Runtime gate

The recovery branch is not declared production-ready until dependency installation and these gates can be executed in a network-enabled environment:

1. `pnpm check`
2. `pnpm test`
3. `pnpm build`
4. `pnpm test:e2e`
5. database migration audit against the real target database

## Next controlled promotion

Perform semantic diff/review of the large Manus revisions, then promote compatible application changes in small commits. Keep migration repair as a separate decision-gated change.
