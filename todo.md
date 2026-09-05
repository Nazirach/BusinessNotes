# Project TODO

- [x] Analisis dan pemetaan ruang lingkup MVP BusinessNotes dari MASTERCOMMAND
- [x] Menetapkan design system BusinessNotes: warna, tipografi, spacing, kartu, mode terang/gelap, dan aksesibilitas
- [x] Membangun shell aplikasi responsif dengan navigasi Home, Discover, News, Opportunity, Companies, People, Video, Messages, Notifications, dan Profile
- [x] Menambahkan feed bisnis dengan filter kategori News, Market, Opportunity, Company, Project, Investment, Video, Insight, dan Trend
- [x] Menambahkan composer post/article dengan tipe konten, validasi, dan state UI
- [x] Menambahkan interaksi feed: like, comment, share, save, follow, dan Interested
- [x] Menambahkan halaman dan kartu Opportunity dengan data sektor, lokasi, modal, tahap, status verifikasi, deadline, owner, dan interested count
- [x] Menambahkan search terpadu untuk people, company, opportunity, project, news, article, product, service, event, investor, dan industry
- [x] Menambahkan profil pengguna dan company profile ringkas
- [x] Menambahkan notification center dan basic messaging interface
- [x] Menambahkan AI BusinessNotes assistant untuk content ideation dan transformasi satu konten ke beberapa format
- [x] Menambahkan trust signals: source/evidence, verification status, dan moderation/report affordances
- [x] Menambahkan dashboard analytics ringkas untuk views, reach, followers, engagement, interested, leads, dan conversion
- [x] Menambahkan backend schema, query helpers, dan tRPC procedures untuk fitur MVP yang membutuhkan persistence
- [x] Menulis dan menjalankan unit tests Vitest untuk prosedur inti dan validasi
- [x] Memverifikasi aplikasi pada desktop dan mobile viewport serta memperbaiki masalah UI/runtime
- [ ] Menyimpan checkpoint final setelah seluruh item selesai

## Follow-up gaps discovered during validation

- [x] Mengaktifkan token design system global, dark mode switchable, dan baseline pemeriksaan aksesibilitas
- [x] Melengkapi navigasi dan in-page module sections untuk News, People, Video, Messages, Notifications, dan Profile
- [x] Melengkapi seluruh kategori feed serta composer dengan pemilihan tipe konten dan validasi lebih kaya
- [x] Menambahkan alur comment dan follow yang benar-benar memberi feedback interaktif
- [x] Melengkapi opportunity listing/detail dengan owner, deadline, stage, verification, dan supporting evidence
- [x] Mengubah search menjadi unified search lintas entity, bukan hanya filter teks post
- [x] Menampilkan output AI multi-format yang dapat ditinjau sebelum publikasi
- [x] Menambahkan source/evidence, verification status, report/moderation affordance, dan analytics metrics yang diminta

## Final validation corrections

- [x] Render selected opportunity detail from actual selected data with evidence/source metadata
- [x] Drive unified search from shared post, opportunity, and company datasets rather than a separate hardcoded result list

## Final data integrity corrections

- [x] Menyimpan source/evidence sebagai metadata pada setiap opportunity dan merendernya dari item terpilih
- [x] Membuat shared company dataset untuk unified search tanpa array khusus di dalam logic pencarian

## New onboarding feature

- [x] Menambahkan onboarding interaktif untuk pengguna baru dengan langkah yang dapat dilewati dan dilanjutkan
- [x] Menambahkan progress bar kelengkapan profil dengan checklist aksi nyata
- [x] Menghubungkan aksi onboarding ke panel Profile, Discover, Opportunity, dan Create
- [x] Menyimpan preferensi onboarding selesai agar tidak muncul berulang pada sesi yang sama
- [x] Menulis test dan memverifikasi onboarding pada desktop serta mobile

## Onboarding validation corrections

- [x] Menghitung progress dari field profil nyata dan topik yang dipilih, bukan hanya langkah onboarding
- [x] Menyembunyikan onboarding otomatis setelah seluruh langkah selesai dengan flag completion terpisah
- [x] Memastikan Vitest mengeksekusi test onboarding client melalui konfigurasi include yang tepat

## Final onboarding integrity corrections

- [x] Mengganti pseudo field Profile started dengan field profil eksplisit seperti headline, location, bio, company, dan topics
- [x] Memastikan file test client onboarding benar-benar terdeteksi dan dijalankan oleh script Vitest
