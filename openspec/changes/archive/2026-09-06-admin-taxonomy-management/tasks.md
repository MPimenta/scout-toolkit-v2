## 1. Admin API

- [x] 1.1 Add admin write routes for activity types, educational areas, goals, and SDGs
- [x] 1.2 Reject deletes that would break activities (409); public GET taxonomies still work for guests

## 2. Admin UI

- [x] 2.1 Add `/admin/taxonomias` with four tabs and icon/URL fields
- [x] 2.2 Link the page from the dashboard

## 3. Tests

- [x] 3.1 Add integration tests for CRUD, uniqueness, and referenced delete
- [x] 3.2 Add an admin E2E create-type path (`tests/e2e/admin/taxonomies.spec.ts`)
