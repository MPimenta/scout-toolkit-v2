> **Superseded (2026-11-09) by `reference-sheet-alignment`.** The reference sheet defines formats and focuses as two separate fields instead of one list of types. Keep this change only until that one is archived, then archive or delete it.

## Why

The activity-type list is the first filter people reach for, and today it does not describe the catalogue well:

- The curated sheet (tab `tipos`) defines **10 official types**: Jogo, Quebra-Gelo, Desafio, Reflexão, Criatividade, Cooperação, Liderança, Aventura, Serviço, Técnica. The local database holds those 10 **plus 5 leftover test types** ("Tipo E2E …") that should never reach a catalogue.
- The types are **plain, editable rows** with no code, no description and no order. Any admin can rename or delete a type the sheet relies on, and a new environment only has the 5-ish types that the demo seed happens to create.
- The types are not equally useful as filters. Of the 97 activities loaded so far, **Jogo is on 70 (72%)**, so filtering by it removes almost nothing; Cooperação (34), Desafio (25), Técnica (21) and Quebra-Gelo (14) carry more signal; **Serviço has no activity at all** (and does not appear in any of the sheet's ~1,030 rows that were read). Across the sheet, Jogo is again the most frequent value by a wide margin.
- Most activities carry several types, and the combinations are informative: Jogo + Cooperação, Jogo + Técnica, Jogo + Quebra-Gelo, Jogo + Aventura. Jogo works as a **format** tag, the others as a **focus** or **moment**.

This change turns the list into small, managed reference data (like the Matriz and the sources), gives every type a description and a group so the filter and the editor can present them well, and removes the leftovers.

## What Changes

- **Official list as reference data**: the 10 sheet types, each with a stable code, a one-line Portuguese description, a group (`format` or `focus`) and a position, loaded on every environment by the same idempotent loader pattern as the Matriz and the sources.
- **Managed rows** (`is_managed`): the 10 types cannot be renamed or deleted from the admin UI (409), but admins can still add their own types (unmanaged) when the content team needs one.
- **Grouping**: the read API returns `group`, `description`, `position` and the **number of approved activities** per type, so the filter can group types and show counts, and hide types with no activity.
- **Cleanup**: the 5 test types are removed from the local database after confirmation; the loader never deletes unmanaged rows by itself, and the e2e tests are changed so they stop leaving types behind.
- **Import**: the sheet loader keeps matching `Tipo` values by name and now also by code; unknown values are reported, not created.
- **Editor**: the type picker shows the two groups with each type's description as help text.

## Capabilities

### New Capabilities

- `activity-types`: the official type list, its managed rows and metadata, the read API fields, grouping and counts, and the cleanup rule.

### Modified Capabilities

- `admin-taxonomies`: managed types are read-only (an existing rule for managed rows, extended to types; the delta is stated in the new capability).

## Impact

- Schema (additive): `activity_types` gains `code` (unique), `kind`, `position`, `is_managed`; migration generated and reviewed, with a backfill that matches the existing 10 names to their codes.
- Data: new `drizzle/seeds/data/activity-types.json`, loader `applyActivityTypes` called from `db:load-reference`, `db:seed`, the Vercel deploy hook and e2e setup.
- API: `GET /api/taxonomies/activity-types` (new fields), admin taxonomy route (409 on managed types).
- UI: activity editor and the catalogue filter (the filter work itself is in `catalogue-filters-refresh`, which depends on the fields added here but degrades gracefully without them).
- Tests: e2e and integration helpers stop creating persistent "Tipo E2E" rows.

## Decisions

Confirmed by the product owner:

- **Two groups**, *Formato* and *Foco*. The assignment of each type, and of each activity, is being reviewed by the product owner together with the activity list; until that review lands the draft below stands: *Formato* = Jogo, Desafio, Aventura, Quebra-Gelo; *Foco* = Cooperação, Criatividade, Técnica, Liderança, Reflexão, Serviço.
- **Jogo and Serviço** follow the outcome of that review (for example a narrower Jogo, or a place for Serviço). Until then Jogo stays as it is and Serviço stays on the list but hidden from the public filter while it has no activity. Because the groups and the list are data, the review changes a JSON file and a migration backfill, not code.

Still open: the wording of the ten descriptions (drafted in the design for review).
