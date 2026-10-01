# BusinessNotes — Master System Context

## 1. Identity
**BUSINESSNOTES**  
**THE BUSINESS INFORMATION NETWORK**  
**FROM INFORMATION TO OPPORTUNITY**

Core flow:

**INFORMATION → INSIGHT → CONNECTION → OPPORTUNITY → BUSINESS**

Core principle:

**POWERFUL INSIDE — SIMPLE OUTSIDE**

## 2. Purpose
BusinessNotes is a business information, journalism, social, opportunity, media, AI, and governance platform. It connects business information with people, companies, investors, government, communities, media, academia, projects, products, services, events, and opportunities.

## 3. System direction
All future work must strengthen the existing BusinessNotes system. Agents must extend, integrate, validate, simplify, secure, and document the current architecture before proposing a replacement architecture.

**DO NOT REINVENT THE PRODUCT.**

A new architectural direction is not a default. If a change is materially different, document the conflict and its migration path before implementation.

## 4. Current technical baseline
- React + Vite frontend
- Express + tRPC backend
- MySQL + Drizzle ORM
- Editorial sources/evidence/corrections/takedowns/appeals
- Social interactions, messaging, notifications
- Media upload/processing/captions/moderation
- Trust & Safety: reports, blocks, mutes
- Governance: moderation cases, admin review, privacy controls, audit logs
- AI: content generation, source-grounded answers, search, recommendations, matching
- Public SEO routes including news/article routes, robots.txt, sitemap.xml

## 5. Core product areas
Business feed; people; companies; projects; opportunities; news/articles/media; products/services/events; messaging; notifications; search; AI assistance; matching/recommendations; verification; evidence/source registry; reputation; analytics; moderation; governance; subscriptions/advertising; multilingual and accessibility support.

## 6. Non-negotiable engineering principles
1. Preserve product continuity.
2. Prefer incremental changes over rewrites.
3. Server-side authorization is authoritative.
4. Treat external claims as source/evidence-backed where applicable.
5. Never commit secrets.
6. Review migrations before production application.
7. Validate typecheck, tests, build, and relevant E2E flows.
8. Record decisions and unresolved issues.
9. Do not silently change product meaning or core terminology.
10. Every agent must leave a usable handoff.

## 7. Current repository source of truth
GitHub repository: `Nazirach/BusinessNotes`  
Primary branch: `main`

At the time this continuity protocol was created, the GitHub main baseline was the source that could be directly verified. A previously prepared Manus checkpoint exists outside the GitHub repository because its attempted push was rejected; it must not be represented as already merged or present in main.

## 8. Agent continuity rule
Before changing code, every AI agent must read:
- this file;
- `02_PRODUCT_VISION.md`;
- `03_DEVELOPMENT_ROADMAP.md`;
- `04_CURRENT_STATE.md`;
- `05_AGENT_HANDOFF.md`;
- relevant decision, audit, and architecture records.

After work, the agent must update the current state and handoff, record decisions, run applicable validation, and identify the exact next task.

