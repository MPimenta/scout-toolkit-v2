---
paths:
  - "drizzle/**"
  - "drizzle.config.ts"
  - "src/lib/db/**"
---

# Database (Drizzle)

- Schema-first: change `drizzle/schema`, then generate/push. Generated SQL in `drizzle/migrations/` is gitignored.
- UUID primary keys, `created_at`/`updated_at` timestamps, real foreign keys, and indexes for search/filter columns.
- Content fields are plain Portuguese `text` (no per-locale columns).
- Don't alter the schema at runtime (no `ALTER TABLE` in request paths); change `drizzle/schema` instead.
- Watch for N+1 queries; batch or join instead.
- Ask before running `db:generate`, `db:push`, `db:migrate`, `db:seed`, or `db:reset`.
