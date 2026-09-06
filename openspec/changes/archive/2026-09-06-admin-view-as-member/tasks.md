## 1. Effective role

- [x] 1.1 Add `kit-view-as` parsing and `getEffectiveRole()` (stored admin + cookie `member` → `user`; otherwise stored role) and verify unit tests for admin/off, admin/on, user + forged cookie, and guest
- [x] 1.2 Switch `requireAdmin`, `requireAdminApi`, and `/admin` layout to effective role and verify SQL-integration on `scout_toolkit_test`: admin cookie on → `/api/admin/stats` is 403; cookie off → 200; stored `user` + forged cookie → 403
- [x] 1.3 Replace privilege checks that read `session.user.role === 'admin'` (activity visibility/edits) with effective role; leave notifications, last-admin count, and the user list on stored `user.role` — verify by grep plus the existing last-admin test still passing

## 2. Chrome

- [x] 2.1 Add `pt`/`en` catalog keys for **Ver como membro**, **A ver como membro**, **Voltar à vista de admin** and the English equivalents — verify default Portuguese matches the spec
- [x] 2.2 Add the account-menu toggle (session cookie, `router.refresh()`) and hide the Admin nav when effective role is `user` — verify Playwright Chromium as admin on `/activities`
- [x] 2.3 Add the member-view banner with the exit action (existing muted/border tokens) and verify turning it off restores the Admin link and `/admin` dashboard without changing stored `user.role`

## 3. Safety

- [x] 3.1 Confirm e2e session helpers never set `kit-view-as` and that existing admin Playwright specs still reach `/admin`
