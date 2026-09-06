## Why

`is_approved` and `created_by` exist so the catalogue can take leader-submitted activities, but there is no submit form, `created_by` still points at the unused `users` table, and new rows default to approved. Public GET already hides unapproved rows.

## What Changes

- Signed-in users create an activity that starts unapproved and is attributed to them
- Author can edit or withdraw their own activity while it is pending
- After approval, the author does not get a free edit; further changes go through `activity-edit-suggestions` (or an admin)
- Admins approve or reject via the `admin-activities` queue (this change defines the user side and the visibility rules)
- Public list/detail hide unapproved; author and admin can still open their pending item
- "Moderation" here is the approval queue, not a separate trust-and-safety product

## Capabilities

### New Capabilities

- `user-generated-activities`: Leader-submitted activities with attribution and approval-gated publication

### Modified Capabilities

- (none)

## Impact

- Schema: `created_by` → Auth.js `"user"` (shared with `admin-activity-management` if that lands first)
- API: authenticated POST; author PATCH/DELETE while pending; public GET stays approved-only
- UI: "Propor atividade" form; "As minhas propostas" list
- Tests: default unapproved, guest cannot create, author-only edit while pending, public 404 for unapproved
- Roadmap: `docs/planning.md` Story 10.2
