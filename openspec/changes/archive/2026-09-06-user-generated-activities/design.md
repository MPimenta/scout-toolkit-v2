## Context

See proposal.md. Public GET already filters `is_approved = true`. Detail GET by id does **not** check approval — that leak must close. `created_by` still FKs to unused `users`. `ENABLE_USER_GENERATED_CONTENT` is documented in `docs/deployment.md` only — do not add a runtime flag; shipping the feature is the flag. Admin approval UI is `admin-activity-management`; this change is the user submit path and visibility rules. If 9.2 has not retargeted `created_by`, this change must.

## Goals / Non-Goals

**Goals:**

- Non-admin POST defaults `is_approved = false` and sets `created_by`
- Author can read/edit/delete only while pending
- Public 404 for unapproved ids

**Non-Goals:**

- A second moderation product (reports, bans)
- Author edit after approval
- Changing rating/discussion rules

## Decisions

### 1. `POST /api/activities` for signed-in users

Not under `/api/admin`. Always `is_approved = false` for `role === user`. Admins creating via this route SHOULD still use `/api/admin/activities` so catalogue creates stay published; if an admin hits this user route, still treat as UGC (unapproved) to keep one rule.

### 2. Close the detail leak

`GET /api/activities/[id]`: if not approved, allow only author or admin; else 404.

### 3. Author PATCH/DELETE on `/api/activities/[id]`

Allowed when `created_by === session.id` and `is_approved === false`. After approval, 403.

### 4. Attribution on public detail

Join `"user"` for `created_by` and show name. Seed/admin rows with null `created_by` show no author or "Kit de Atividades".

### 5. Reject = stay unapproved + notify

Do not delete on reject (author can see why). Withdraw = author DELETE. Reuse `notifications` if 10.1 already added it; otherwise a pending-status on "As minhas propostas" is enough until 10.1.

## Risks / Trade-offs

- [Apply order vs 9.2] → Both changes name the same `created_by` retarget; first one to apply does it, second is a no-op if already done
- [Unapproved enumerable via search] → Public list already filters; keep it
- [Default `is_approved = true` in schema] → Override on insert; consider flipping the DB default when UGC ships so a raw insert cannot publish

## Migration Plan

1. Retarget `created_by` if still on `users`
2. Optionally default `is_approved` to false
3. User POST + visibility fix + "Propor atividade"
4. Rollback: remove user POST; public GET remains approved-only

## Open Questions

- Whether rejected activities can be resubmitted. Default: author edits pending fields and a later admin approve; no extra status enum.
