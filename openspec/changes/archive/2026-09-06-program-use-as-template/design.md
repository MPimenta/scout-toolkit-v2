## Context

See proposal.md. Public preview from `public-program-gallery` is the entry point. There is no clone today. `program_entries` cascade on program delete. Auth user id is Auth.js `"user"`. Apply this after the gallery exists, or gate the button if the public preview is missing.

## Goals / Non-Goals

**Goals:**

- Deep-copy header + entries into a new row owned by the caller
- Force `is_public = false` on the copy
- Persist attribution if the source is later deleted

**Non-Goals:**

- Partial copy (pick some entries)
- Copying private programs, even by id guessing
- Fork graph / version history beyond one source pointer

## Decisions

### 1. `source_program_id` plus denormalised author name

```
programs.source_program_id  → programs.id  ON DELETE SET NULL
programs.source_author_name text nullable
```

On copy, store both. If the source is deleted, the FK clears and the name remains.

Alternative: only FK. Rejected — attribution would vanish when the original is deleted.

### 2. `POST /api/programs/public/[id]/copy`

Session required. Transaction: insert program, insert entries with new ids, same position/times/activity_id/custom fields. Recalculate nothing; times stay as in the source.

Alternative: client rebuilds via existing POST + entries API. Rejected — partial failure leaves an empty program.

### 3. New copy is private even if the user immediately wants it public

They toggle public on the existing edit form. Avoids accidentally republishing a half-edited clone.

### 4. Success navigates to `/programas/[newId]/builder`

Same customisation surface as a program they created from scratch.

## Risks / Trade-offs

- [Source activity later deleted] → `activity_id` is ON DELETE SET NULL; copy may keep a custom-looking hole. Accept; same as owner programs today
- [Gallery not applied yet] → Copy API can still exist; UI button lives on the public preview
- [Applying `source_program_id` on Neon] → Same targeted push as other schema adds; tests only on `scout_toolkit_test`

## Migration Plan

1. Add the two columns
2. Ship copy API
3. Button on public preview
4. Rollback: drop columns after copies are gone, or leave them unused

## Open Questions

- Whether copied custom titles should get a "Cópia de" prefix. Default: same name as source plus " (cópia)" on the program name only.
