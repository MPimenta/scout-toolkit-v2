## Context

See proposal.md. `session.user.role` is typed and `requireAdmin()` exists, but `"user"` in `drizzle/schema/auth.ts` has no `role` column, so the callback always falls back to `'user'`. `/admin` is a public placeholder. Unused `users.role` must not be wired. Apply this before 9.2–9.4.

## Goals / Non-Goals

**Goals:**

- One source of role: Auth.js `"user".role`
- Shared admin layout + stats endpoint
- First admin via env allowlist so the queue is not empty forever

**Non-Goals:**

- Activity/taxonomy/user CRUD
- Fine-grained permissions beyond `user` | `admin`
- Migrating data out of the unused `users` table

## Decisions

### 1. Add `role` on `"user"`

`text` enum `user` | `admin`, default `user`. Session callback reads `user.role`. Do not add a parallel `user_roles` table.

### 2. Bootstrap admin with `ADMIN_EMAILS`

Comma-separated emails in env. On sign-in, if the email matches and role is still `user`, set `admin`. After that, role changes go through 9.4. Alternative: SQL one-off only. Env is repeatable in prod/dev without a Neon console.

### 3. Gate in a small `requireAdminApi` helper

Pages: server check then render forbidden. APIs: 401/403 JSON. `middleware.ts` today only redirects `/` → `/home` — do not put admin auth only there; gate the layout and `/api/admin/*` as well.

### 4. `GET /api/admin/stats`

Counts: `activities`, `activities` where `is_approved = false`, `user` rows, `programs` where `is_public`, `edit_suggestions` where `status = pending`. Links on the dashboard are present even if the target page is still a stub.

### 5. Header Admin link

Show only when `session.user.role === 'admin'`. Portuguese: "Administração".

## Risks / Trade-offs

- [No admin exists until env is set] → Document `ADMIN_EMAILS`; first Orgo sign-in promotes
- [Adapter user object may omit unknown columns] → Confirm DrizzleAdapter returns custom columns; if not, load role in the session callback with an extra query
- [Placeholder /admin is currently public] → Gating is a behaviour change for anyone who bookmarked it

## Migration Plan

1. Add column default `user`
2. Set `ADMIN_EMAILS`, sign in once
3. Ship gated dashboard
4. Rollback: leave the column; revert routes

## Open Questions

- Whether `requireAdmin` should throw vs return a Result. Keep throw for pages, HTTP helpers for APIs — implementation detail.
