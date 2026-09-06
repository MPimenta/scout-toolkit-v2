## 1. Public API

- [x] 1.1 Add guest-readable `GET /api/programs/public` (search, duration band, has_date, pagination, sort) and verify private programs never appear
- [x] 1.2 Add `GET /api/programs/public/[id]` preview (schedule, duration, author name) and verify a private id returns 404 to guests and other users

## 2. Gallery UI

- [x] 2.1 Add `/programs/public` with Portuguese search/filters and cards, and verify a guest can browse without signing in
- [x] 2.2 Add a read-only preview page and a header link, and verify edit/delete are absent for non-owners

## 3. Tests

- [x] 3.1 Add integration tests on `scout_toolkit_test` for public list/preview visibility and verify they pass without touching Neon
- [x] 3.2 Add an E2E guest browse + preview path (`tests/e2e/programs/public-gallery.spec.ts`)
