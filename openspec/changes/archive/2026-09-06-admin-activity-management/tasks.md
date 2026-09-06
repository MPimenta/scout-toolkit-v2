## 1. Persistence

- [x] 1.1 Retarget `activities.created_by` to Auth.js `"user"` (Drizzle). App DB FK still needs applying if Neon still points at `users`.

## 2. Admin API

- [x] 2.1 Implement admin create/update/delete plus goal/SDG assignment; non-admin 403; delete 409 when referenced
- [x] 2.2 Implement image HTTPS URL plus UploadThing upload (JPEG/PNG/WebP, 5MB) and approval toggle; public GET hides unapproved

## 3. Admin UI

- [x] 3.1 Add `/admin/atividades` list + form (Portuguese) and dashboard link
- [x] 3.2 Remove Edit/Delete from the public activities table

## 4. Tests

- [x] 4.1 Add integration tests for CRUD, image 400, approval visibility, and 403
- [x] 4.2 Add admin E2E create + unpublish (`tests/e2e/admin/activities.spec.ts`)
