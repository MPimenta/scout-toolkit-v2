## Why

`/admin` is a placeholder with no role check. Session types include `user.role`, but the Auth.js `user` table has no `role` column, so everyone is treated as `user`. Stories 9.2–9.4 cannot ship until admin identity and a gated home exist.

## What Changes

- Persist `role` (`user` | `admin`) on the Auth.js `user` table and load it in the session
- Gate `/admin` and `/api/admin/*` so only `admin` enters; others get 403 / a Portuguese forbidden page
- Replace the placeholder with a dashboard of counts and links to later admin areas
- Do **not** implement activity, taxonomy, or user CRUD here

## Capabilities

### New Capabilities

- `admin-access`: Persisted roles, admin-only routes, and the dashboard overview

### Modified Capabilities

- (none)

## Impact

- Schema: `role` on `"user"` (default `user`); unused `users` / `user_roles` tables stay unused
- Auth: session callback reads the real column instead of always falling back
- UI: `/admin` overview; header link only for admins
- Tests: requireAdmin, non-admin 403, dashboard counts
- Roadmap: `docs/planning.md` Story 9.1
