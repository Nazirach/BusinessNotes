# Decision 0001 — Continuity as a System Rule

## Status
Accepted

## Decision
BusinessNotes will maintain explicit continuity documentation so that AI agents and human developers work from the same product vision, architecture, roadmap, current state, decisions, audits, and handoff information.

## Rationale
Multiple agents may work on the same codebase at different times. Without a shared context, agents can duplicate work, introduce conflicting architecture, or lose important product decisions.

## Rule
Agents must extend, strengthen, integrate, and validate the existing system before introducing a new architecture.

## Consequence
Continuity records become part of the repository and should be updated as the system evolves.

## Related documents
- `docs/continuity/01_MASTER_SYSTEM_CONTEXT.md`
- `docs/continuity/02_PRODUCT_VISION.md`
- `docs/continuity/03_DEVELOPMENT_ROADMAP.md`
- `docs/continuity/04_CURRENT_STATE.md`
- `docs/continuity/05_AGENT_HANDOFF.md`
