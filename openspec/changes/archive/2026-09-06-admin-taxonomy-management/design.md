## Context

See proposal.md. Public GET exists for activity-types, educational-goals, and SDGs. Areas are only reached via goals. Icons are emoji/text plus SDG `icon_url`. Group size / effort / location / age group are both lookup tables and enums on `activities` — leave those seed-only so filters do not drift from the enum.

## Goals / Non-Goals

**Goals:**

- Admin write for types, areas, goals, SDGs
- Unique codes / SDG numbers enforced
- 409 when a row is still in use

**Non-Goals:**

- CRUD for group size, effort, location, age-group tables
- Uploading binary icon files (URL or emoji only)
- Reordering SDGs beyond `number`

## Decisions

### 1. `/api/admin/taxonomies/{activity-types|educational-areas|educational-goals|sdgs}`

POST/PATCH/DELETE. Public GET routes stay as they are.

### 2. Delete checks

- Type: any `activities.activity_type_id`
- Goal/SDG: junction rows
- Area: if any child goal is referenced, 409; if not, delete area (goals cascade)

### 3. UI tabs on `/admin/taxonomias`

Four tabs. Forms are small (name, description, code/number, icon, icon_url). Portuguese labels. No new colours.

### 4. SDG 1–17 unique

Updates may change name/description/icon but not collide on `number`.

## Risks / Trade-offs

- [Seed scripts vs admin edits] → Re-seed must not blindly wipe admin rows; document that seeds are upsert-by-code
- [Emoji vs image icons] → Keep both fields; cards already use `icon`

## Migration Plan

No schema change required unless a unique constraint is missing. Ship API then UI. Rollback: remove write routes; seed data remains.

## Open Questions

- Whether activity-type should gain an icon. Default: no; it has no icon column today.
