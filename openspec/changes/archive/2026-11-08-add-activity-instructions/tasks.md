## 1. Database

- [x] 1.1 Add nullable `instructions: text('instructions')` to `drizzle/schema/activities.ts`
- [x] 1.2 Run `npm run db:generate` (ask first), review the SQL (single `ALTER TABLE ... ADD COLUMN`), commit the migration

## 2. Types and validation

- [x] 2.1 Add `instructions: string | null` to `src/types/database.ts`, `api.ts`, `components.ts`
- [x] 2.2 Update guards in `src/types/guards.ts` to accept it (string or null/absent)
- [x] 2.3 Add `instructions` to `ACTIVITY_FIELDS`, `ActivityWrite`, parsing (trim, empty → null, max 5000) and insert/update in `src/lib/activities/write.ts`

## 3. API

- [x] 3.1 Select/return `instructions` in `src/app/api/activities/[id]/route.ts` (GET) and persist on PUT; same for `src/app/api/admin/activities/[id]/route.ts`
- [x] 3.2 Accept it on POST in `src/app/api/activities/route.ts`; return it where list payloads share the detail shape if applicable
- [x] 3.3 Update swagger config (`src/lib/swagger/config.ts`)
- [x] 3.4 Add `instructions` to `SUGGESTABLE_FIELDS` in `src/lib/suggestions/fields.ts`; confirm accept path and `SuggestEditForm` label/input work

## 4. UI

- [x] 4.1 Add a textarea variant to `Field` in `ActivityEditorForm.tsx` and an "Instruções" field after Materiais; pass defaults for edit
- [x] 4.2 Add an "Instruções" card below "Materiais Necessários" in `ActivityDetail.tsx` (`whitespace-pre-line`, hidden when empty)
- [x] 4.3 Add chrome strings to `src/messages/pt.json` and `en.json` if the detail/forms use message keys; keep catalogue content untranslated

## 5. Exports

- [x] 5.1 Add `instructions: string | null` to `ProgramExportActivity` (`src/lib/export/types.ts`) and select it in `load-program.ts`
- [x] 5.2 Add `instructions` label (`labels.ts`) and an "Instruções" column after Materiais in `excel.ts`
- [x] 5.3 Add an escaped, line-break-preserving instructions block per activity in `pdf-html.ts`, reusing existing grey styles

## 6. Tests

- [x] 6.1 Unit: guards and write parsing (empty → null, too long rejected)
- [x] 6.2 Integration: activity create/update/read with and without instructions; suggestion accept for `instructions`; extend `program-export.integration.test.ts` for Excel/PDF with and without instructions
- [x] 6.3 E2E: extend admin activities and propose specs to fill instructions and see them below materials
- [x] 6.4 Run `npm run lint`, `npm run typecheck`, `npm run test:run`

## 7. Specs

- [x] 7.1 `openspec validate add-activity-instructions`, then sync/archive after merge
