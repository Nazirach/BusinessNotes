# BusinessNotes — Agent Handoff Protocol

## Before work
1. Read `01_MASTER_SYSTEM_CONTEXT.md`.
2. Read `02_PRODUCT_VISION.md`.
3. Read `03_DEVELOPMENT_ROADMAP.md`.
4. Read `04_CURRENT_STATE.md`.
5. Read this file.
6. Review relevant decision/audit/architecture records.
7. Inspect the current Git branch and latest commit.
8. Identify the previous agent's completed work and unresolved work.
9. Do not invent a parallel product concept.

## During work
- Make the smallest coherent change that advances the existing system.
- Preserve naming and architecture unless a documented decision changes them.
- Keep security and authorization server-side.
- Keep source/evidence provenance intact.
- Do not commit secrets.
- Do not apply production migrations without explicit review.
- Avoid destructive operations unless explicitly authorized.

## If an architectural conflict appears
Create a record under `docs/decisions/` containing:
- problem;
- current architecture;
- evidence;
- impact;
- alternatives;
- proposed change;
- migration/rollback plan;
- validation plan;
- status.

Use status **WAITING FOR DECISION** when the change materially alters system direction.

## After work
Record:
- agent;
- date;
- branch;
- base commit;
- files changed;
- behavior changed;
- tests/validation;
- unresolved issues;
- decisions made;
- next recommended task.

Update `04_CURRENT_STATE.md` and this handoff when appropriate.

## Handoff format

### Agent
[Name]

### Date
[YYYY-MM-DD]

### Task
[What was requested]

### Base
[Branch + commit]

### Changes
- ...

### Validation
- ...

### Issues
- ...

### Decisions
- ...

### Next task
- ...

## Golden rule
**BusinessNotes is a continuous system, not a series of independent AI sessions.**

Every agent inherits the system; no agent starts from zero.
