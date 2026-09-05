# BusinessNotes UI Action Coverage Audit

## Audit basis

Audit ini memeriksa `client/src/pages/Home.tsx`, komponen onboarding, router tRPC, database helpers, schema, dan test inventory. Prinsip klasifikasi: sebuah aksi hanya boleh diklaim sebagai fitur bila side effect-nya mencapai backend/persistence atau merupakan navigasi/local preference yang memang menjadi kontraknya.

| Area aksi UI | Aksi aktual | Status sebelum hardening | Keputusan |
|---|---|---|---|
| Language selector | Mengubah locale dan query deep-link | REAL client preference | Pertahankan; uji dengan i18n tests |
| Theme selector | Mengubah theme | REAL client preference | Pertahankan sebagai preference |
| Auth | Sign in melalui OAuth | REAL | Pertahankan; protected flows tetap gated |
| Navigation/search | Mengubah panel, filter, query search, scroll | REAL UI state | Pertahankan; bukan persistence claim |
| Onboarding/profile draft | localStorage draft dan progress | PARTIAL | Pertahankan sebagai draft lokal; jangan klaim profile persistence |
| Opportunity → Interest | protected mutation, unique constraint, count, audit log | REAL backend, PARTIAL UI integration | Pertahankan dan jangan replace |
| Feed like/follow/save | local `useState` only | MOCK behavior | Hapus side effect palsu atau ubah menjadi unavailable state |
| Comment | local count/text reset + toast | MOCK behavior | Hapus klaim submit; ubah menjadi unavailable state |
| Create post/article/opportunity | toast/local form state; backend procedures belum terhubung UI | PARTIAL | Hubungkan hanya bila form benar-benar memanggil mutation; jika belum, tampilkan unavailable |
| AI assistant | local canned result array | MOCK behavior | Hapus canned output; tampilkan unavailable sampai backend AI tersedia |
| Feed refresh/load more | toast tanpa fetch/pagination | MOCK behavior | Ubah menjadi unavailable atau hubungkan query invalidation/pagination |
| Profile builder | toast saja | MOCK behavior | Ubah menjadi unavailable sampai profile mutation tersedia |
| Trust & Safety / Privacy | toast saja | MOCK behavior | Ubah menjadi unavailable informational state; jangan klaim controls |
| Report | toast “received” tanpa storage | MOCK behavior | Hapus klaim receipt; unavailable sampai report endpoint tersedia |

## Audit conclusion

Tidak semua tombol perlu backend: navigasi, filter, search, theme, dan locale adalah local UI concerns. Sebaliknya, like, follow, save, comment, report, AI generation, feed refresh, profile builder, dan privacy/trust controls tidak boleh memberikan toast sukses seolah-olah tersimpan. Implementasi lanjutan harus memilih antara membangun vertical slice persisted yang diuji end-to-end atau menampilkan status **Not available yet** yang jujur.

## Post-audit verification

Setelah penggantian mock behavior, `pnpm test:e2e` menjalankan **2 browser E2E tests** terhadap dev server nyata tanpa API mocking. Test pertama memverifikasi locale switching EN/ID/ZH-CN, search, navigation, dan feedback auth/unavailable pada Opportunity → Interest. Test kedua memverifikasi AI assistant menampilkan unavailable state alih-alih canned output. Selain itu, `pnpm test` menjalankan **21 unit/integration tests** dan semuanya lulus.

Opportunity → Interest tetap dipertahankan. Backend tetap memiliki protected procedure, existence check, unique constraint, idempotency, interested counter update, audit event, dan NOT_FOUND mapping. Pada UI, kartu opportunity yang memiliki ID dari data server memanggil mutation nyata; kartu fallback yang belum terhubung tidak mengklaim persistence dan menampilkan pesan unavailable.

## Current claim boundary

BusinessNotes sekarang hanya boleh mengklaim locale/theme/navigation/search, local onboarding draft, dan Opportunity → Interest backend sebagai implemented scope yang telah diuji. Like, follow, save, comment, report, AI generation, refresh/load more, profile persistence, attachment upload, Trust & Safety controls, dan Privacy controls secara eksplisit belum tersedia dan tidak lagi memberikan success claim.

The final browser E2E run passes **4 tests** against the real dev server without API mocking. In addition to locale/search/navigation, Opportunity → Interest unavailable/auth feedback, and AI unavailable behavior, it now verifies theme persistence, profile draft persistence, and onboarding progress persistence. Live authenticated success/duplicate/error toast behavior remains outside the preview's seeded-data boundary and is therefore not claimed as browser-verified; the router contract remains covered separately.
