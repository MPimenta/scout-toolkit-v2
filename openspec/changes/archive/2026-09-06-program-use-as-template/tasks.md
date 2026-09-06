## 1. Persistence

- [x] 1.1 Add `source_program_id` (FK, ON DELETE SET NULL) and `source_author_name` on `programs` (Drizzle + test setup). App DB ALTER still needs applying.

## 2. Copy API

- [x] 2.1 Implement `POST /api/programs/public/[id]/copy` (entries cloned, `is_public` false, attribution set); private source returns 404 and guest returns 401

## 3. UI

- [x] 3.1 Add "Usar como modelo" on the public preview, confirm success, and navigate to the new program

## 4. Tests

- [x] 4.1 Add integration tests for copy, 401, 404, and attribution
- [x] 4.2 Add a signed-in E2E copy path (`tests/e2e/programs/public-gallery.spec.ts`)
