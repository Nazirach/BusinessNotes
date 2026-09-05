# BusinessNotes MVP — Product and Architecture Notes

## Product decision

BusinessNotes is scoped first as a trusted business information network rather than as a complete social platform. The MVP prioritizes the loop **information → insight → interest → connection → opportunity**. Advanced video processing, external social APIs, investment transactions, and automated AI publishing remain later-phase capabilities because they introduce compliance, moderation, credential, and operational risk.

## MVP experience

The first vertical slice is a responsive public discovery experience. It includes the live business feed, category filtering, lightweight search, opportunity radar, interest signals, share/save/like affordances, profile completion CTA, notifications feedback, and an AI assistant entry point that explicitly asks users to review facts and sources before publication. Authentication remains connected to the existing Manus OAuth foundation and the sign-in CTA is available without forcing a login wall on public discovery.

| Area | MVP decision | Later extension |
|---|---|---|
| Feed | Curated business signals with typed categories | Persistent posts, articles, comments, ranking, pagination |
| Opportunity | Digital cards with value, sector, location, status, type, and interest count | Owner workflows, documents, verification, leads, matching |
| AI | Content ideation and format suggestions with human review | Source-grounded generation, intelligent search, recommendation |
| Trust | Visible verified-source treatment and explicit review language | Verification workflows, moderation cases, audit logs |
| Distribution | Share/copy-link affordance using legal platform handoff | Official APIs per platform, scheduling, analytics |
| Clients | Responsive web as source of truth | Android, iOS, macOS clients using the same versioned API |

## System architecture

The existing project uses React 19, Tailwind 4, Express, tRPC, Drizzle, and Manus OAuth. New persisted features should follow the template's four touch points: schema, database helper, tRPC procedure, and typed frontend query/mutation. Public discovery can be rendered without authentication; mutations involving a user's profile, posts, interests, messages, or reports must use `protectedProcedure`. Administrative review must use `adminProcedure`.

The relational model should begin with the smallest useful set: `profiles`, `companies`, `posts`, `opportunities`, `interests`, `comments`, `follows`, `notifications`, and `reports`. `source` and `verification` should be first-class records before any verified badge is shown. Analytics should store aggregate events rather than unnecessary sensitive personal data.

## API and security principles

All feature procedures should be versionable beneath the shared tRPC router, validate inputs with Zod, paginate collection responses, and avoid exposing private contact or document fields in public queries. Rate limiting, abuse detection, report/block/mute, account recovery, audit logs, and human review are required before high-risk opportunity or messaging workflows are opened broadly. AI responses must distinguish **fact**, **source**, **analysis**, and **opinion**, and must never imply that a generated opportunity is verified without evidence.

## Design system

The visual system uses deep navy for trust, warm amber for action and opportunity, and sea-glass teal for intelligence and connection. Large editorial headlines, compact uppercase section labels, generous whitespace, soft borders, and rounded information cards create a professional but approachable identity. The layout is mobile-first, with a compact mobile menu, readable touch targets, visible focus states from the shared component primitives, and a desktop two-column discovery surface.

## Development roadmap

Phase 1 is the current foundation: public feed, typed content categories, opportunity discovery, responsive navigation, search feedback, and action states. Phase 2 should add persistent profiles, company pages, opportunities, interests, comments, notifications, and safe messaging. Phase 3 adds media and share cards. Phase 4 adds source-grounded AI, semantic search, and matching. Phase 5 adds analytics and intelligence. Phase 6 adds ecosystem integrations and enterprise controls.

## Success measures

The first product signals are discovery-to-interest conversion, saved/share rate, profile completion, qualified opportunity views, repeat weekly discovery, and report resolution quality. These metrics should be privacy-conscious and should measure whether information creates useful next actions rather than maximizing passive engagement.
