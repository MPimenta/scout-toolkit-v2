## Context

See proposal.md. Activities already have a fixed write shape in `parseActivityWrite` / `createActivity`. Enums live on the `activities` columns (`group_size`, `effort_level`, `location`, `age_group`). Types, goal codes, and SDG numbers come from seed taxonomies. Admin CRUD exists at `/admin/atividades`. `xlsx` is already used for program export. No import path exists.

## Goals / Non-Goals

**Goals:**

- One admin upload that maps the published columns onto `createActivity`
- Duplicate key = normalised name + age group
- Continue past bad rows
- Template workbook checked into this change (`templates/atividades-import.xlsx`)

**Non-Goals:**

- CSV, Google Sheets live sync, or Update-existing-rows
- Creating new types / goals / SDGs from the sheet
- Image file upload in the import (URL only)
- Guest or member import
- Matching by UUID

## Decisions

1. **Duplicate key is name + age group**  
   The same game is often run for more than one section. Name-only would block that.  
   Alternative: name only. Rejected.  
   Alternative: hash of all fields. Rejected — a typo would create a second copy; the user asked to catch repeats.

2. **Portuguese headers; keys or labels in cells**  
   Fillers use `Escoteiros (10-14)` or `scouts`. Parser accepts both (trim, case-insensitive). Goals are **codes** (`SOCIAL_TEAM`); SDGs are **numbers** (`4;13`). Types match by name.  
   Alternative: UUIDs in the sheet. Rejected — not fillable by hand.

3. **First sheet named Atividades**  
   Extra sheets (Valores, Instruções) are ignored on import.  
   Alternative: import every sheet. Rejected.

4. **POST `/api/admin/activities/import` (multipart)**  
   `requireAdminApi`, max ~2MB, parse with `xlsx`. Response `{ created, skipped, invalid, rows: [...] }`. Reuse `createActivity` with `isApproved` from `publicada`.  
   Alternative: one-by-one client calls. Rejected — no atomic report, slower.

5. **Template is static in-repo**  
   `openspec/changes/admin-activity-excel-import/templates/atividades-import.xlsx` (later copied to `public/` on apply). Values sheet lists current seed enums/types/codes. If an admin adds a type later, they can still type that name; the static list is the starter set.  
   Alternative: generate the values sheet from the live DB on download. Nice later; not required to start filling.

6. **Skip, do not update**  
   A repeat is left untouched. Updating existing rows from Excel is a later change.

## Risks / Trade-offs

- [Risk] Taxonomy names differ between local and Preview → Mitigation: match case-insensitive; invalid row names the value
- [Risk] Huge file / timeout on Vercel → Mitigation: 2MB / ~200 rows documented; process sequentially
- [Risk] Near-duplicate names (`Jogo  da  bandeira`) → Mitigation: collapse whitespace before compare
- [Risk] `publicada` left blank → Mitigation: treat as `sim`

## Migration Plan

No schema. Add route + admin button + template download. Rollback: remove them.

## Open Questions

None that block the spec.
