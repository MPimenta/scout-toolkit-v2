## Context

See proposal.md for why. `programs.is_public` already exists (default false) with `idx_programs_public`. Owners toggle it on create/edit. `GET /api/programs` and `GET /api/programs/[id]` filter by `session.user.id`, so a public flag is invisible to everyone else. Export already allows `user_id === userId || is_public` in `src/lib/export/access.ts`. Constants already mention `CACHE_DURATIONS.PUBLIC_PROGRAMS`. Tests that need Postgres use `scout_toolkit_test` only.

## Goals / Non-Goals

**Goals:**

- Guest-readable list + preview for `is_public = true`
- Reuse ProgramCard-style metadata (name, date, duration, entry count, author)
- Keep owner CRUD and the private `/programas` list unchanged

**Non-Goals:**

- Copy/template (next change)
- Changing how `is_public` is set
- Full-text search beyond name substring
- Filtering by age/SDG derived from nested activities (can add later)

## Decisions

### 1. Separate public routes, do not loosen owner GET

Add `GET /api/programs/public` (list) and `GET /api/programs/public/[id]` (preview). Owner `GET /api/programs/[id]` stays owner-only so we do not accidentally return private fields to the wrong client.

Alternative: one GET that returns public OR owned. Rejected — easier to leak a private program when the where-clause is wrong.

### 2. 404 for private ids, never 403

Guests and other users asking for a private id get 404 so we do not confirm that a private program exists.

### 3. Page at `/programas-publicos`

Portuguese path next to `/programas`. Header link: "Programas públicos". Reuse card chrome. Preview can reuse `ProgramBuilder` with `canEdit={false}` (that gate already exists) or a slimmer read-only schedule. Export stays on the owner program page unless a later change opens it. Existing `programs-crud` integration tests expect 404 when fetching another user's program via the owner GET — keep that; public preview uses the new public route.

### 4. Duration filter in SQL from entries

Same join/sum already used on the owner list. Duration bands: `< 60`, `60–180`, `> 180` minutes. Date filter: `has_date` true/false.

## Risks / Trade-offs

- [Public list grows] → Cap `limit` at 100; use `idx_programs_public`
- [Author name is nullable on Auth.js user] → Fall back to "Dirigente"
- [Export of public programs already allowed by helper but UI is owner-only] → Leave UI as-is in this change

## Migration Plan

No schema change. Deploy API then page. Rollback is remove the routes/page; `is_public` data stays.

## Open Questions

- Whether `/programas` should also show a teaser of public programs. Default: no; keep lists separate.
