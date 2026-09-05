# BusinessNotes Batch 1 Contract

## Scope

Batch 1 hanya mencakup Profile Persistence, Company Persistence, dan Real Create Post. Opportunity → Interest tetap berada di luar perubahan ini dan tidak boleh mengalami regresi.

## Schema decision

Tidak diperlukan migration schema baru. Tabel yang sudah tersedia cukup untuk Batch 1: `profiles`, `companies`, dan `posts`. Profile dimiliki satu user melalui unique `profiles.userId`; company dimiliki melalui `companies.ownerId`; post dibuat oleh user melalui `posts.authorId`. Semua write procedure menggunakan `ctx.user.id`, bukan owner/author ID dari client.

## API contract

| Procedure | Access | Input | Output | Ownership rule |
|---|---|---|---|---|
| `business.profile` | Protected | none | `Profile | undefined` | Reads only `profiles.userId = ctx.user.id` |
| `business.updateProfile` | Protected | `headline`, `bio`, `location`, `industry` as trimmed bounded strings | persisted `Profile` | Upserts only the current user's profile |
| `business.companies` | Protected | none | `Company[]` | Reads only `companies.ownerId = ctx.user.id` |
| `business.createCompany` | Protected | `name`, `description`, `industry`, `location`, optional `website` | persisted `Company` | Writes `ownerId = ctx.user.id` |
| `business.createPost` | Protected | normal `post` body, optional title/source | persisted `Post` | Writes `authorId = ctx.user.id`; non-post types are not used by Batch 1 UI |

All input validation is enforced at the tRPC boundary and all database failures surface as errors. UI success is shown only after the mutation resolves successfully; reload verification uses the corresponding read query.
