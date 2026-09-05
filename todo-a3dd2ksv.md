# Project TODO

- [x] Audit struktur aktual BusinessNotes dan dokumentasi spesifikasi produk yang tersedia
- [x] Tetapkan kontrak locale EN, ID, dan ZH-CN beserta fallback deterministik
- [x] Implementasikan i18n provider, resource catalog, locale detection, dan persistensi preferensi
- [x] Integrasikan terjemahan ke seluruh UI dan alur produk yang tersedia
- [x] Tambahkan aksesibilitas, metadata bahasa, dan format tanggal/angka yang locale-aware
- [x] Tambahkan unit tests untuk locale resolution, fallback, persistence, dan resource completeness
- [x] Jalankan typecheck, tests, dan verifikasi visual lintas bahasa/responsive
- [x] Simpan checkpoint hasil implementasi multilingual
- [x] Localize all remaining hardcoded UI copy, aria-labels, placeholders, toasts, panel text, assistant text, and footer language UI across EN, ID, and ZH-CN
- [x] Apply and verify locale-aware number/date formatting in rendered UI where metrics/dates appear
- [x] Add tests for locale persistence via localStorage/provider initialization and for translation catalog completeness across all supported locales
- [x] Perform visual verification after switching to EN, ID, and ZH-CN on responsive viewports
- [x] Save a webdev checkpoint after multilingual implementation and verification
- [x] Localize the remaining panel copy, placeholders, aria labels, toasts, assistant outputs, and footer trust label
- [x] Capture mobile screenshots for EN, ID, and ZH-CN after locale deep-linking
- [x] Save the final checkpoint after corrective localization work

## Roadmap continuation: Phase 1 Foundation Hardening

- [x] Audit seluruh critical flow BusinessNotes terhadap Master Roadmap 60%→100%
- [x] Audit schema, router, UI state, tests, dan authorization aktual
- [x] Buat gap report dengan klasifikasi REAL, PARTIAL, MOCK/DEMO, MISSING, RISK, dan RECOMMENDED
- [x] Prioritaskan satu vertical slice Phase 1 yang dapat dibuat end-to-end dan teruji
- [x] Implementasikan persistence, API validation, authorization, loading/empty/error/success states pada vertical slice prioritas
- [x] Tambahkan security baseline dan auditability yang relevan
- [x] Tambahkan regression tests dan validasi UX/performance
- [x] Simpan checkpoint Phase 1 dan laporkan gate status secara jujur
- [x] Save a new webdev checkpoint after the Phase 1 hardening changes
- [x] Write and deliver an honest Phase 1 gate status report summarizing PASS/NOT PASS for each gate

## UI Action Audit and Persistent Backend Coverage

- [x] Inventarisasi semua button, form submit, navigation action, selector, toast, modal, dan callback pada UI aktual
- [x] Klasifikasikan setiap aksi sebagai persisted, backend-only, auth-gated, unavailable, atau mock behavior
- [x] Pertahankan Opportunity → Interest dan verifikasi tidak mengalami regresi
- [x] Implementasikan persistence/backend nyata untuk aksi yang tetap diklaim sebagai fitur
- [x] Hapus mock side effects dan ubah fitur yang belum tersedia menjadi unavailable state yang jujur
- [x] Tambahkan end-to-end tests untuk setiap aksi/f fitur yang dipertahankan
- [x] Jalankan typecheck, test suite, visual audit, dan final action coverage audit
- [x] Simpan checkpoint dan laporan coverage fitur yang jujur
- [x] Run post-audit typecheck and tests confirming Opportunity → Interest remains intact
- [x] Add regression coverage for Opportunity → Interest auth gate, success contract, duplicate idempotency, and user feedback
- [x] Re-evaluate Opportunity → Interest verification status after post-audit checks
- [x] Add real browser E2E tests for retained Home actions and local preference flows
- [x] Add UI-level E2E coverage for Opportunity → Interest auth prompt, success, duplicate, and error feedback
- [x] Update action coverage and gate report with explicit post-audit verification result
- [x] Save checkpoint and deliver final action coverage report
- [x] Add browser E2E coverage for theme preference and onboarding/profile-draft local persistence
- [x] Add UI E2E evidence boundary for live-connected Opportunity → Interest success/duplicate/error states, or explicitly remove those claims
- [x] Update docs/phase1-gate-status.md with latest no-mock action audit and E2E results
- [x] Save checkpoint after final UI-action-audit changes and deliver the coverage report
- [x] Add browser E2E coverage for onboarding local persistence
- [x] Save a new checkpoint after final UI-action-audit changes and deliver the report

## Batch 1: Profile → Company → Create Post

- [x] Audit terbatas schema, router, UI, dan tests hanya untuk Profile Persistence, Company Persistence, dan Real Create Post
- [x] Rancang schema/migration minimal dan kontrak tRPC untuk tiga fungsi Batch 1
- [x] Implementasikan Profile Persistence dengan auth, validation, ownership, loading/success/error, dan reload persistence
- [x] Implementasikan Company Persistence dengan auth, validation, ownership, loading/success/error, read-after-create, dan reload persistence
- [x] Implementasikan Real Create Post normal dengan author, validation, mutation nyata, feed update, loading/success/error, dan reload persistence
- [x] Tambahkan unit/integration dan browser E2E tests untuk tiga flow tanpa API mocking
- [x] Update dokumentasi status Batch 1 secara jujur, simpan checkpoint, laporkan hasil, lalu stop
- [x] Dokumentasikan kontrak Batch 1 secara eksplisit: profile read/update, company create/read, dan create-post input/output
- [x] Tegaskan keputusan no-migration atau migration schema beserta field dan ownership rules Batch 1

## Authenticated Batch 1 verification

- [x] Verify login session is active in the preview browser
- [x] Verify Profile Save persists through backend and reload
- [x] Verify Company Create/Read persists through backend and reload
- [x] Verify normal Create Post persists through backend, feed, and reload
- [x] Run relevant typecheck, unit/integration, and browser E2E tests
- [x] Mark Batch 1 statuses only according to observed evidence, save checkpoint, report, and stop

## Batch 1 cleanup: duplicate React key only

- [x] Identify the exact non-unique React key source without changing Batch 1 behavior
- [x] Replace it with a stable unique identity-based key
- [x] Run typecheck, relevant tests, existing browser E2E, and Preview console verification
- [x] Save a checkpoint only after the duplicate-key cleanup is verified

## Batch 2: Company Update → Profile Update → Post Update

- [ ] Audit terbatas schema, db helpers, router, UI, dan tests hanya untuk Company Update, Profile Update, dan Post Update
- [ ] Tetapkan kontrak update, validation, ownership, not-found, dan migration minimal
- [ ] Implementasikan Company Update end-to-end dengan reload persistence
- [ ] Implementasikan Profile Update/Completion end-to-end dengan reload persistence
- [ ] Implementasikan Post Update end-to-end dengan ownership preservation dan reload persistence
- [ ] Tambahkan unit/integration tests untuk valid, validation, auth/ownership, not-found, dan persistence boundaries
- [ ] Tambahkan browser E2E tanpa API mocking untuk Company, Profile, dan Post update
- [ ] Jalankan regression Batch 1, typecheck, test suite, browser E2E, lalu update status jujur
- [ ] Simpan checkpoint Batch 2 dan berhenti setelah laporan
