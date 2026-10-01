# BUSINESSNOTES — CONTROLLED RECONCILIATION GATE
## Live GitHub Evidence Update — 2026-10-01

Status: **RECONCILIATION INCOMPLETE — EVIDENCE/DECISION REQUIRED**

## New evidence established

### Migration 0005
The live Drizzle journal explicitly contains:
- idx 5
- tag: `0005_business_network`
- version 5
- breakpoints: true

The corresponding SQL file `drizzle/0005.sql` is absent from `sync/full-source-tree`.

Classification:

**VERIFIED MISSING MIGRATION FILE WITH JOURNAL ENTRY**

We must not infer its SQL contents.

Migration 0006 immediately continues with editorial workflow changes to the `posts` table. This establishes metadata sequence continuity but does not reconstruct 0005.

### Migration 0014
`drizzle/0014_seo_public_editorial.sql` exists and explicitly contains no schema change; it is a checkpoint marker.

It is absent from the live journal.

Classification:

**VERIFIED FILE / UNJOURNALED CHECKPOINT**

### Migration 0015
`drizzle/0015_trust_safety.sql` exists, creates contentReports, userBlocks, and userMutes, and is present in the journal.

Classification:

**VERIFIED FILE / JOURNALED**

### Migration 0016
No 0016 SQL file was found and no 0016 journal entry exists.

Classification:

**VERIFIED ABSENCE — INTENT UNKNOWN**

### Migration 0017
`drizzle/0017_governance.sql` exists and creates moderationCases and privacySettings.

It is absent from the journal.

Classification:

**VERIFIED FILE / UNJOURNALED MIGRATION**

## Refined migration conclusion

The issue is not merely a missing sequence number. The SQL artifact set and Drizzle journal represent different historical states.

We do not yet know whether:
1. 0005 existed in an earlier tree and was later removed;
2. the source-tree extraction omitted historical artifacts;
3. 0014 and 0017 were generated after the current journal state;
4. journal metadata was intentionally or accidentally changed;
5. or another historical branch contains the intended migration state.

No explanation is adopted without evidence.

**No migration repair has been performed.**

## Manus checkpoint

Manus checkpoint `40e1d24` still has no verified GitHub commit representation.

Searching the repository for the literal checkpoint did not produce a matching commit.

The presence of `vite-plugin-manus-runtime` in source is not proof that checkpoint `40e1d24` is represented by the current Git history.

Classification:

**MANUS = PENDING / UNRECONCILED**

## Production migration behavior

The executable source contains `scripts/start-production.sh`, which runs:

1. `pnpm db:migrate`
2. `pnpm start`

The current Dockerfile points production startup to that script.

This behavior was introduced by commit:

`54d7b3f775fc0af0c093276fc21fe30162057af2`

Message:

`chore: run database migrations before production start`

Because migration history is unresolved, production migration safety remains:

**BLOCKED / REQUIRES DECISION**

No production script was changed.

## Working-source status

`sync/full-source-tree` remains:

**VERIFIED EXECUTABLE SOURCE CANDIDATE**

It must not automatically replace `main`.

## Runtime

No new controlled runtime/database proof was established during this GitHub evidence pass.

Runtime remains:

**UNVERIFIED**

## Decision gate

| Area | Status |
|---|---|
| Product identity | VERIFIED |
| Core flow | VERIFIED |
| Main baseline | VERIFIED |
| Executable source | VERIFIED |
| 0005 journal entry | VERIFIED |
| 0005 SQL file | MISSING |
| 0014 SQL file | VERIFIED |
| 0014 journal entry | MISSING |
| 0015 SQL + journal | VERIFIED |
| 0016 | ABSENT / INTENT UNKNOWN |
| 0017 SQL file | VERIFIED |
| 0017 journal entry | MISSING |
| Migration chain | BLOCKED |
| Manus 40e1d24 | PENDING |
| Runtime | UNVERIFIED |
| Production migration safety | BLOCKED |
| Architecture redesign | NOT REQUIRED BY EVIDENCE |
| Feature development | HOLD |
| main modification | NONE |

## Next evidence gate

The next safe operation is **historical reconstruction only**:

1. inspect commit ancestry of the migration directory;
2. identify the commit that introduced the `0005_business_network` journal entry;
3. determine whether `0005.sql` existed in an earlier tree;
4. identify introduction commits for 0014 and 0017;
5. compare the journal at those historical points;
6. inspect any surviving source-tree archive for the missing artifacts;
7. seek the original Manus checkpoint/export corresponding to `40e1d24`;
8. only after reconstruction decide whether migration repair is necessary.

Do not create replacement SQL from schema inference.

Do not edit `_journal.json`.

Do not run production migrations.

Do not merge `sync/full-source-tree` into `main`.

## Final

**BUSINESSNOTES — RECONCILIATION INCOMPLETE**

The executable source is real and usable as a candidate working source, but migration history and Manus checkpoint remain unresolved.

The next gate is historical evidence reconstruction, not feature development.
