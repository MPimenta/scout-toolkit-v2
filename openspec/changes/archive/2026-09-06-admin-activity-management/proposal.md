## Why

The catalogue is seed-only. Activities have `image_url`, `is_approved`, and `created_by`, but there is no create/update/delete API, no `/admin/activities` UI (the list still links to a missing edit page), and no image write path. Admins cannot keep the catalogue current.

## What Changes

- Admin CRUD for activities (fields, type, educational goals, SDGs)
- Image: HTTPS URL and/or upload (JPEG/PNG/WebP, 5MB) stored as `image_url`
- Approval: admin can approve or unpublish (`is_approved`)
- Public list/detail continue to show only approved activities
- Depends on `admin-dashboard` for role persistence and `/admin` shell
- User-facing create is `user-generated-activities`, not this change

## Capabilities

### New Capabilities

- `admin-activities`: Admin create, edit, delete, image, goal/SDG assignment, and approval of catalogue activities

### Modified Capabilities

- (none)

## Impact

- API: admin activity write routes; public GET stays approved-only
- Schema: retarget `activities.created_by` from unused `users` to Auth.js `"user"`
- UI: `/admin/activities` list + form; remove the dead edit link on the public list or point it at the admin form
- Tests: CRUD, approval visibility, non-admin 403, image validation
- Roadmap: `docs/planning.md` Story 9.2
