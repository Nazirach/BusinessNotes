# Batch 16 — AI Functionality

Status: GREEN for the five requested AI capabilities.

Implemented:
1. AI generation (`business.aiGenerate`) — uses the existing BusinessNotes LLM gateway, rate limiting, professional business prompts, and explicit review-required output.
2. Source-grounded AI (`business.aiGrounded`) — grounds answers in public editorial content and registered source metadata; refuses to present unsupported material as grounded.
3. AI search (`business.aiSearch`) — public hybrid search across published posts, opportunities, and companies with ranked business signals.
4. Recommendation (`business.aiRecommend`) — personalized opportunity recommendations from the user's profile and opportunity relevance signals, with explainable reasons.
5. Matching intelligence (`business.aiMatch`) — ranks potential company partners for an opportunity and exposes explainable fit signals plus a due-diligence warning.

UI:
- The existing BusinessNotes AI composer now calls the real generation endpoint instead of the previous unavailable placeholder.
- Search displays AI-ranked business signals alongside the existing unified search.

Trust boundaries:
- AI output is not treated as verified fact.
- Source-grounded AI only claims grounding from supplied BusinessNotes source records.
- Match scores are advisory signals, not guarantees.
- Generation output is marked `reviewedRequired: true`.

## Batch 17 — Governance
- audit log viewer
- report intake + admin review
- moderation cases
- admin review queue
- governed takedown/appeal surfaces retained
- privacy settings
- migration: `0017_governance.sql`
