## 1. Persistence and visibility

- [x] 1.1 Retarget `created_by` to Auth.js `"user"`; public GET-by-id returns 404 for unapproved ids except author/admin
- [x] 1.2 Default non-admin creates to `is_approved = false`

## 2. User API

- [x] 2.1 Add signed-in `POST /api/activities` (attributed, unapproved) and author PATCH/DELETE while pending

## 3. UI

- [x] 3.1 Add "Propor atividade" form and "As minhas propostas" list
- [x] 3.2 Reuse the admin approval queue from `admin-activities`

## 4. Tests

- [x] 4.1 Add integration tests for submit, visibility, and 403 after approve
- [x] 4.2 Add E2E: user submits, guest cannot see it, admin approves (`tests/e2e/activities/propose.spec.ts`)
