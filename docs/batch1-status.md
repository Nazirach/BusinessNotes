# BusinessNotes Batch 1 Status

## Step 1 — Profile

**Status: VERIFIED for Batch 1 scope.** The UI reads `business.profile` and submits `business.updateProfile` with validation, authenticated ownership, loading state, success/error feedback, and server read-back. In the logged-in preview browser, a unique headline (`Authenticated Operator QA 1920`) was saved, the UI entered `Saving...`, and after a full reload the same unique value was returned by the server query.

Primary files: `server/db.ts`, `server/routers.ts`, `client/src/pages/Home.tsx`, `server/business.router.test.ts`, `server/batch1.router.test.ts`, and `e2e/home-actions.spec.ts`. No schema migration was required because `profiles` already contained the required fields and unique `userId` ownership.

## Step 2 — Company

**Status: VERIFIED for Batch 1 scope.** The UI provides a minimal create/read company form for `name`, `description`, `industry`, `location`, and optional `website`. `business.createCompany` and `business.companies` are protected, validated, owner-scoped, and the create mutation refetches the owned company list after success. In the logged-in preview browser, `Nusantara QA Foods` was created and remained visible with its persisted fields after a full reload.

Primary files: `server/db.ts`, `server/routers.ts`, `client/src/pages/Home.tsx`, `server/business.router.test.ts`, `server/batch1.router.test.ts`, and `docs/batch1-contract.md`. No schema migration was required because `companies` already contained the required fields and `ownerId`.

## Step 3 — Real Create Post

**Status: VERIFIED for Batch 1 scope.** The normal Post composer sends `business.createPost` with the authenticated user enforced as `authorId`, validates the body, displays pending/error/success states, refetches the feed, and maps persisted posts with the database author name. In the logged-in preview browser, the post appeared with author `big money` and remained at the top of the feed after a full reload. The UI does not offer Article or Opportunity publishing from this composer.

Primary files: `server/db.ts`, `server/routers.ts`, `client/src/pages/Home.tsx`, `server/business.router.test.ts`, and `server/batch1.router.test.ts`. No schema migration was required because `posts` already supported a normal post with `authorId` and `body`.

## Verification

`pnpm check` passes. `pnpm test` passes with **26 tests**. `BASE_URL=http://127.0.0.1:3000 pnpm test:e2e` passes with **5 browser E2E tests** without API mocking, including Batch 1 authentication gates. No Opportunity → Interest code was replaced.

## Known limitations

The authenticated preview browser verification is complete for the three Batch 1 flows. The existing automated browser suite remains focused on no-mock UI and auth-gate coverage; the authenticated success/reload evidence was executed manually in the connected browser session as required. Advanced profile, company, and content features remain out of scope.

## Authenticated browser verification — latest run

Using the logged-in preview browser session, all three flows were executed without API mocking:

- Profile: Save profile returned success; after reload, the same headline, location, industry, and bio were repopulated from the server query.
- Company: Create company returned success; after reload, `Nusantara QA Foods` remained in the owned Companies list with its persisted fields.
- Real Create Post: the normal composer showed `Publishing...`; the new post appeared with author `big money`; after reload, the same post remained at the top of the feed.

Final automated validation: `pnpm check` passed; 9 Vitest files passed with 26 tests; browser E2E passed with 5 tests. No API mocking was used for the browser run. Opportunity → Interest was not modified.

The previous PARTIAL labels are superseded by this authenticated verification for the three specified flows. Features outside Batch 1 remain out of scope.
