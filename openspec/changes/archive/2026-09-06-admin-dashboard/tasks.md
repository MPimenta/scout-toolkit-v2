## 1. Role persistence

- [x] 1.1 Add `role` (`user` | `admin`, default `user`) on Auth.js `"user"` (Drizzle + test setup). App DB ALTER still needs applying.
- [x] 1.2 Promote matching `ADMIN_EMAILS` on Orgo sign-in without using the unused `users` table

## 2. Gating and dashboard

- [x] 2.1 Gate `/admin` and `/api/admin/*` (401 guest, 403 non-admin) with a Portuguese forbidden page
- [x] 2.2 Add `GET /api/admin/stats` and replace the placeholder dashboard with counts plus links
- [x] 2.3 Show "Administração" in the header only for admins

## 3. Tests

- [x] 3.1 Add unit/integration tests for roles, requireAdminApi, and stats
- [x] 3.2 Add E2E: non-admin is blocked from `/admin`; admin sees the dashboard
