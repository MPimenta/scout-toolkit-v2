## Why

Activities list the materials needed but give leaders no step-by-step guidance on how to run them. Leaders must infer it from the free-text description, which mixes the pitch ("what is this") with the procedure ("how do I do it"). A dedicated instructions field makes activities directly usable.

## What Changes

- Add an optional, multi-line **Instruções** text field to every activity.
- Show it on the activity detail page in its own card directly below "Materiais Necessários".
- Add it to the admin create/edit form and the user "propor atividade" form as a textarea, placed after Materiais.
- Allow `instructions` as a suggestable field in edit suggestions.
- Include it in the API read/write payloads and validation (optional; empty is allowed, so existing activities stay valid).
- Include instructions in program exports: an "Instruções" column in the Excel activity details sheet and a per-activity block in the PDF.
- Not required: no backfill; the card is hidden when an activity has no instructions.
- Out of scope: rich text/markdown, per-step structure, search by instructions.

## Capabilities

### New Capabilities

- `program-export`: program Excel/PDF exports include activity instructions.

### Modified Capabilities

- `admin-activities`: CRUD field list gains optional `instructions`.
- `user-generated-activities`: proposed activities may carry `instructions`; detail page shows it below materials.
- `edit-suggestions`: `instructions` becomes an allowed suggestion field.

## Impact

- DB: new nullable `text` column `instructions` on `activities` (committed Drizzle migration; schema command needs your go-ahead).
- Code: `drizzle/schema/activities.ts`, `src/lib/activities/write.ts`, `src/app/api/activities/route.ts` and `[id]/route.ts`, `src/app/api/admin/activities/[id]/route.ts`, `src/lib/suggestions/fields.ts`, `src/types/{api,database,components,guards}.ts`, `src/lib/export/{types,load-program,labels,excel,pdf-html}.ts`, `ActivityDetail.tsx`, `ActivityEditorForm.tsx`, swagger config, `src/messages/pt.json` / `en.json` for chrome labels.
- Tests: unit (guards/validation), integration (activity detail + write + suggestions + program export), e2e (admin and propose flows).
- No new dependencies; content stays plain Portuguese text as authored.
