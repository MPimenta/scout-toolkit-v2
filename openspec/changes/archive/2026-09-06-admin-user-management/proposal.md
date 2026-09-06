## Why

Roles will live on Auth.js `"user"` after `admin-dashboard`, but there is no screen to list people or promote an admin. The unused `users` / `user_roles` tables must not become a second identity store.

## What Changes

- Admin list of Auth.js users (name, email, role, created)
- Admin can set `role` to `user` or `admin`
- Per-user activity: program count, review count, and (when UGC exists) submitted-activity count
- An admin cannot remove the last remaining admin
- Depends on `admin-dashboard` for the `role` column
- No invite, delete-user, or impersonation

## Capabilities

### New Capabilities

- `admin-users`: List users, assign roles, and show per-user usage counts

### Modified Capabilities

- (none)

## Impact

- API: `/api/admin/users` list + role PATCH
- UI: `/admin/utilizadores`
- Tests: role change, last-admin guard, non-admin 403
- Roadmap: `docs/planning.md` Story 9.4
