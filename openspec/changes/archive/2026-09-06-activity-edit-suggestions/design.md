## Context

See proposal.md. `edit_suggestions` already has `field`, `suggested_value` (text, not the jsonb mentioned in `docs/architecture.md`), `status`, `reviewed_by`, `reviewed_at`, and FKs to Auth.js `user`. No API/UI. `tests/setup.ts` does not create `edit_suggestions` yet. `ENABLE_EDIT_SUGGESTIONS` appears only in `docs/deployment.md` and is not read by code — do not add a flag; shipping the feature is the flag. Allowed fields in the spec are scalar activity columns (not goal/SDG graphs).

## Goals / Non-Goals

**Goals:**

- Use the existing table
- Apply accepted values with a typed coerce (duration int, enums validated)
- Minimal `notifications` inbox

**Non-Goals:**

- Email, push, or websocket
- Suggesting goal/SDG/type changes (would need structured JSON)
- Multi-field patches in one suggestion

## Decisions

### 1. Keep one-field rows

Matches the table. UI is a field picker + value input on the activity page.

### 2. Apply on accept in one transaction

Validate `suggested_value` against the column's zod rule, update `activities`, mark suggestion approved. If validation fails, 400 and leave pending.

### 3. `notifications` table

```
id, user_id → user, type, title, body, href, read_at, created_at
```

Types: `suggestion_submitted`, `suggestion_approved`, `suggestion_rejected`. On submit, insert one row per current admin. On decide, insert one row for the suggestor.

Alternative: poll only the suggestions table. Rejected — admins would not see a badge, and the AC asks for notifications.

### 4. Routes

```
POST   /api/activities/[id]/suggestions
GET    /api/activities/[id]/suggestions/mine
GET    /api/admin/suggestions
POST   /api/admin/suggestions/[id]/review   { decision: "approved" | "rejected" }
GET    /api/notifications
PATCH  /api/notifications/[id]              { read: true }
```

### 5. Portuguese copy

"Sugerir alteração", "Pendente", "Aceite", "Recusada". No new colours.

## Risks / Trade-offs

- [Enum fields sent as free text] → Validate against existing activity enums
- [Admin list grows] → Notify all current admins; acceptable at this scale
- [10.2 reject notifications] → Same table; 10.2 can reuse it

## Migration Plan

1. Create `notifications` on app DB and in `tests/setup.ts` (`scout_toolkit_test` only)
2. API then activity-page control + admin queue
3. Rollback: drop `notifications`; `edit_suggestions` rows can stay

## Open Questions

- Whether the activity author (if UGC) should also be notified. Default: admins only on submit; author of the catalogue is the platform until 10.2, then still admins decide.
