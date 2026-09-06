## Context

See proposal.md. After `admin-dashboard`, role lives on `"user"`. There is no list API. Counts can be computed from `programs.user_id` and `reviews.user_id` (both already point at Auth.js `user`).

## Goals / Non-Goals

**Goals:**

- Paginated admin user list + role PATCH
- Last-admin guard
- Cheap counts

**Non-Goals:**

- Delete/ban/impersonate
- Syncing the unused `users` table
- Mapping Orgo `roles[]` to admin automatically after bootstrap

## Decisions

### 1. `GET /api/admin/users` and `PATCH /api/admin/users/[id]`

PATCH body `{ role: "user" | "admin" }`. Search `ilike` on name/email.

### 2. Last-admin check in the same transaction

Count admins; if the update would leave zero, 409.

### 3. Counts as subselects on the list

`program_count`, `review_count`, `activity_count` (created_by). Zero when none. Avoid N+1.

### 4. UI at `/admin/utilizadores`

Simple table (desktop) / stacked list (phone, via mobile-layout later).

## Risks / Trade-offs

- [Self-demote while last admin] → 409 covers self and others
- [Email search leaks existence] → Admin-only route

## Migration Plan

No new tables. Ship API then page. Rollback: remove routes; roles stay as stored.

## Open Questions

- None.
