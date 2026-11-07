## Context

`activities.materials` is a required plain-text column, surfaced through one write path (`src/lib/activities/write.ts`, shared by admin and propose flows), three API routes, a suggestion allow-list (`src/lib/suggestions/fields.ts`), and the detail card in `ActivityDetail.tsx`. Instructions follow the same shape, but optional.

## Goals / Non-Goals

**Goals:** one optional multi-line field, edited in the existing forms, shown below materials, suggestable.
**Non-goals:** rich text/markdown, structured steps, search, translation of content (content stays as authored Portuguese).

## Decisions

- **Nullable `text` column, no default, no backfill.** Existing rows stay valid; avoids a data migration. Alternative (NOT NULL default '') rejected: needless rewrite of every row and ambiguity between "empty" and "unset".
- **Empty/whitespace input is normalised to `null`** in `write.ts`, so "no instructions" has one representation and the detail card hides reliably.
- **Plain text with `whitespace-pre-line`** on the detail card to keep line breaks; no HTML rendering, so no new XSS surface.
- **Textarea in the form:** `ActivityEditorForm` only has a single-line `Field`; add a `multiline`/textarea variant (shadcn `Textarea`) rather than a new component. Label "Instruções", placed after Materiais.
- **Length cap:** Zod `max(5000)` on instructions (assumption; adjust if you prefer another limit).
- **Suggestions:** add `instructions` to `SUGGESTABLE_FIELDS`; the accept path writes `suggested_value` onto the same-named column, so it should work once the column exists. Verify the suggestion form renders a textarea-friendly input and has a Portuguese label for it.
- **Migration:** schema edit then a committed generated migration (per CLAUDE.md); never `db:push`. Requires your approval before running `db:generate`/`db:migrate`.
- **Detail card hidden when empty**, icon consistent with the materials card (e.g. `ListOrdered` from lucide).

- **Exports:** add `instructions` to `ProgramExportActivity`, select it in `load-program.ts`, add an `instructions: 'Instruções'` label, an Excel column right after Materiais, and a PDF per-activity block using `escapeHtml` and `white-space: pre-line`. Reuse the existing grey print styles (`visual-system`: PDF stays print-neutral). Body text is not translated.

## Risks / Trade-offs

- Required `materials` vs optional `instructions` is intentionally asymmetric; leaders may leave it blank, so the catalogue will be uneven at first. Mitigation: optional by design; admins can fill over time.
- Type guards (`src/types/guards.ts`) validate shape strictly; they must accept `instructions: string | null` or API reads/tests will fail.
(none open)
