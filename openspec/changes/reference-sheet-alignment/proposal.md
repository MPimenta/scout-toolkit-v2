## Why

The team has reviewed the curated Google Sheet (`atividades_v2`, ~1,080 activities plus reference tabs for objectives, *desafios*, ODS, sources, focuses, formats, divisions, locations, effort, group size and risk levels) and declared it the **definitive reference** for the catalogue. The database and the loaders were built from earlier snapshots and now differ from it: five *desafios* use old links, activity types are a flat list instead of format and focus, risk has three levels instead of five, division and group-size labels differ, and *integração* (the *desafios* that are mandatory for the first stage in a division) is buried in free text. Only ~100 activities are loaded, too few to test search, filters, programs and statistics realistically.

## What Changes

- **Objectives follow the sheet (the workbook codes).** `progress-matrix.json` stays as generated from the workbook: `2C.3-4`, `4F.2.3` / `4F.2.4`, `6C.2` / `6C.3`, `7C.3-4` and the workbook wording of `4A.2` and `4I.2`. The earlier idea of following the Regulamento where it differs is dropped. Recorded as a decision in `progress-matrix-objectives`.
- **Five *desafios* move to matrix v1.1 links:** `VAL-G` (adds `4C.2`, `4C.3`), `CC-H` (`7S.2.3`), `CC-I` (`8S.1.3`, `7S.2.2`), `CC-M` (adds `2I.4`), `CR-N` (only `4I.4`).
- ***Desafio* integration and short titles.** Each *desafio* gets the list of divisions for which it is **mandatory to complete the first stage** (*integração*), stored as data and shown as a highlight. The `[Integração …]` marker is removed from the *desafio* text, and the sheet's short title is stored for lists and pills.
- **Formato and Foco replace activity types.** 8 formats (one per activity) and 10 focuses (a main one and an optional secondary one), as managed reference data with description and position. *Serviço* disappears; *Aventura* becomes the format *Aventura/Percurso*. This supersedes `activity-types-review`.
- **Five risk levels** for physical and psychological risk: Baixo, Baixo a médio, Médio, Médio a alto, Alto.
- **Labels match the sheet:** divisions (Lobitos 6-10, Escoteiros 10-14, Exploradores 14-17, Caminheiros 17-21, Dirigentes 21+) and group sizes (Pequeno 2-6, Médio 7-15, Grande 16+). The stale `age_groups` and `group_sizes` rows in the local database are retired.
- **Sources** carry the sheet's priority.
- **Activities** gain a stable external id (`ATV-0001`) used as the upsert key, and a duration range (minimum and maximum minutes) next to the single duration.
- **Dirigentes never get objectives.** The importer ignores the "Dirigentes (referência: …)" blocks.
- **Fix** the ODS 11 icon (the seed points at the ODS 9 image).
- **Load all ~1,080 activities** from an exported snapshot of the sheet, idempotently, with a report of unknown codes and values (dropped and listed, never guessed). This reuses and extends the baseline loader.

## Capabilities

### New Capabilities
- `reference-sheet-sync`: the sheet as definitive reference, the snapshot loader, stable ids, idempotency, the load report, the Dirigentes rule and the source priority.
- `activity-format-focus`: formats and focuses as managed reference data, assigned per activity, with API fields and filters.
- `desafio-integration`: per-division mandatory *desafios*, short titles, and the v1.1 links.
- `catalogue-reference-values`: five risk levels, division and group-size labels, duration range, and the ODS icon fix.

### Modified Capabilities

- `admin-activities`: an activity needs a format and a main focus instead of one or more activity types, and the external id is read-only. (The specs for risk and the Matriz are still in open changes, so the rest is stated as new capabilities; the design says which open changes this one replaces.)

## Impact

- Schema (committed migrations; `db:generate` and review before applying): new `activity_formats` and `activity_focuses` (or one reference table with a kind), `activities` columns for external id, duration range, format and focuses; `challenges` columns for short title and integration divisions; wider risk-level check; `activity_sources.priority`. Existing risk values stay valid.
- Reference data: new managed datasets loaded by the same idempotent loader as the Matriz and the sources; `progress-matrix.json` regenerated for the five *desafios* and the integration field.
- Code: the baseline loader and its mapping, the activity write path and Zod schemas, filters (type filter becomes format and focus filters), the editor, the detail page, the API and swagger types, the i18n messages (pt and en) and the feature-routes classification if any route is added.
- Open changes affected: `activity-types-review` (superseded by `activity-format-focus`), `baseline-activity-load` (extended; remaining tasks fold in), `bulk-activity-ingest` and `admin-activity-excel-import` (keep their scope, reuse the new mapping), `rich-activity-details` (risk levels), `catalogue-filters-refresh` (type filter replaced), `progress-matrix-objectives` (decision recorded, then archive).
- Data: loading the full sheet changes the local dev database only after approval, and Preview and Production only through the normal deploy path.
- Tests: unit (mapping, parsing of objective, *desafio* and risk cells), SQL-integration on `scout_toolkit_test` (reference loaders, idempotency, upsert by external id), and a Playwright check of the new filters.
