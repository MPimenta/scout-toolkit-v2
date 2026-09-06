## 1. Persistence

- [x] 1.1 Add `notifications` and create `edit_suggestions` in `tests/setup.ts`. App DB table still needs applying.

## 2. API

- [x] 2.1 Implement suggest + mine list (one pending per user/activity/field); guest 401, unknown field 400, duplicate 409
- [x] 2.2 Implement admin review (apply on accept, leave activity on reject)
- [x] 2.3 Implement notification list + mark-read

## 3. UI

- [x] 3.1 Add "Sugerir alteração" on the activity page
- [x] 3.2 Add `/admin/sugestoes` queue plus notification APIs

## 4. Tests

- [x] 4.1 Add integration tests for suggest/review/notifications
- [x] 4.2 Add E2E: signed-in suggest, admin accept (`tests/e2e/activities/suggestions.spec.ts`)
