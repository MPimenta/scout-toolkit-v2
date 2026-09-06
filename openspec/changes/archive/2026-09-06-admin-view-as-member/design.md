## Context

See proposal.md. Stored role lives on Auth.js `"user"` and is copied into `session.user.role`. Header, `/admin/layout.tsx`, `requireAdmin` / `requireAdminApi`, and a few activity routes all read that session field. Locale already uses a client-written cookie (`kit-locale`) plus `router.refresh()`. `ADMIN_EMAILS` re-promotes on every Orgo sign-in, so demoting the first admin in the database would fight the next login.

## Goals / Non-Goals

**Goals:**

- Overlay privilege without writing `user.role`
- One helper so chrome and APIs agree
- Exit still visible when the Admin nav link is hidden
- Catalog chrome in `pt` / `en`

**Non-Goals:**

- Impersonating another user
- Guest / signed-out preview
- Changing JWT claims or forcing re-login
- New API for the toggle
- New brand colour

## Decisions

1. **Cookie overlay, not a role change**  
   Cookie `kit-view-as=member` (absent or any other value = overlay off). Session `role` stays the stored value. Effective role is `user` only when stored role is `admin` **and** the cookie is `member`.  
   Alternative: `UPDATE user SET role = 'user'`. Rejected — last-admin lock, `ADMIN_EMAILS` re-promote, and other admins would see a demotion.

2. **Session cookie (no max-age)**  
   Closing the browser returns to admin view. Matches “admin by default”.  
   Alternative: year-long cookie like locale. Rejected — easy to forget the overlay is on.

3. **Client-written cookie, same pattern as locale**  
   Account menu and banner write `document.cookie` (`path=/; SameSite=Lax`) and call `router.refresh()`. No `/api/admin/view-as` — that path would 403 while previewing if it used effective role.  
   Alternative: httpOnly API. Rejected for v1; the cookie can only reduce privilege, never grant it.

4. **`getEffectiveRole()` is the gate**  
   `requireAdmin`, `requireAdminApi`, and the admin layout read session + cookie. Call sites that today do `session.user.role === 'admin'` for privilege (unapproved activity visibility, edits) switch to effective role. Queries that mean “who is an admin in the database” (notifications, last-admin count, user list) keep using stored `user.role`.  
   Alternative: overwrite `session.user.role` in the Auth.js callback. Rejected — hides the stored truth and makes the user-list / last-admin path easy to get wrong.

5. **Account menu + banner**  
   Toggle in `SignInButton` (already a dropdown). While on, a slim banner under the header: **A ver como membro** / **Viewing as member** plus the exit action. Banner uses existing `muted` / `border` tokens.  
   Alternative: header link only. Rejected — Admin nav disappears, so the exit would be easy to lose.

## Risks / Trade-offs

- [Risk] A privilege check still uses raw `session.user.role` → Mitigation: grep those call sites in this change; add a helper test that effective role ignores a forged cookie on a stored `user`
- [Risk] Admin enables overlay while on `/admin` and hits the forbidden page → Mitigation: acceptable; banner still exits
- [Risk] Playwright admin specs pick up a leftover cookie → Mitigation: e2e session helper does not set `kit-view-as`; view-as spec sets and clears it
- [Risk] Banner overlaps the future Reportar control → Mitigation: banner is full-width under the header, not bottom-right

## Migration Plan

No schema. Ship the helper, then chrome. Rollback: stop reading the cookie.

## Open Questions

None that block the spec.
