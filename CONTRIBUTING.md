# Contributing to BusinessNotes

## Before opening a pull request

Run:

```bash
pnpm check
pnpm test
pnpm build
```

If you change UI behavior, also run the relevant Playwright tests when a local app/database environment is available.

## Rules

- Keep changes focused; do not mix unrelated feature work.
- Do not commit secrets or `.env` files.
- Add or update tests for authorization, privacy, and business-critical behavior.
- Prefer server-side enforcement for permissions and privacy.
- Review database migrations carefully before merging.
