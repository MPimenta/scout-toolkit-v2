## 1. Admin API

- [x] 1.1 Add `GET /api/admin/users` (search, pagination, program/review/activity counts) from Auth.js `"user"`
- [x] 1.2 Add `PATCH /api/admin/users/[id]` for `user` | `admin`; last-admin returns 409

## 2. Admin UI

- [x] 2.1 Add `/admin/utilizadores` with role controls and counts, linked from the dashboard

## 3. Tests

- [x] 3.1 Add integration tests for list, role change, last-admin guard, and 403
- [x] 3.2 Add an admin E2E role change (`tests/e2e/admin/users.spec.ts`)
