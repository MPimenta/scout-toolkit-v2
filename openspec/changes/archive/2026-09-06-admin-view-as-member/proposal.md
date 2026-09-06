## Why

Admins (including the first `ADMIN_EMAILS` account) land as admin and stay that way, so they cannot see Kit the way a normal leader does without demoting themselves. We need a preview that hides admin chrome and powers without changing the stored role.

## What Changes

- Let a signed-in admin switch to “view as member” and back without writing `user.role`
- While previewing, treat them as a member for navigation, `/admin`, `/api/admin/*`, and any other admin-only authorization
- Keep a visible exit (account menu + banner) so they are not stuck without the Admin link
- Default remains admin view whenever the overlay is off
- Do **not** impersonate another person, preview as a guest, or change `ADMIN_EMAILS` promotion

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `admin-access`: Stored admin role stays admin; an overlay can make the effective role `user` for UI and authorization until the admin turns it off

## Impact

- Auth helpers (`requireAdmin`, `requireAdminApi`, admin layout) use effective role
- Header Admin link and account menu
- Cookie overlay (same idea as `kit-locale`); no schema change
- Catalog keys in `pt`/`en`
- Tests: unit + SQL-integration on `scout_toolkit_test` + Playwright as admin
- Unchanged: stored `user.role`, last-admin protection, Orgo, issue reports
