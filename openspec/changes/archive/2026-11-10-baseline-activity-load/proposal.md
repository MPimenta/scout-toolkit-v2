> **Note (2026-11-09):** the remaining tasks (full-snapshot dry run, load, findings) fold into `reference-sheet-alignment`, which loads all rows keyed by the sheet's `ATV` id.

## Why

The catalogue only holds a handful of demo activities, which is too small to test search, filters, programs and exports realistically. The team keeps a curated Google Sheet (`atividades`, ~916 rows, with `bruto`, `mapeamento`, `valores`, `tipos`, `objetivos educativos`, `desafios`, `ods`, `fontes` tabs). A first controlled load of ~200 of those activities will give a realistic baseline for tests and will show what the sheet is missing or shaped wrongly for the product, before we invest in the admin Excel import.

## What Changes

- Add a repeatable, **local-only** loader that turns an exported snapshot of the sheet's `atividades` tab into catalogue activities (~200, chosen by a deterministic rule).
- Replace the current demo activities with the loaded set when explicitly asked (`--replace`), refusing non-local databases unless explicitly overridden.
- Normalise the sheet's free-form cells to our schema: duration text/ranges to minutes, comma-separated lists to lists of catalogue values (an activity can have several of each category), SDG names to numbers, type names to existing activity types, instructions to the new `instructions` column.
- Produce a **load report** (counts, per-field coverage, dropped values, unmapped taxonomy values, skipped rows with reasons) so we can decide how to improve the sheet and the collection process.
- Make the cleaned result usable as a test baseline (snapshot fixture and a documented command to load it into `scout_toolkit_test`), subject to the licence rule below.
- Out of scope: in-app Excel upload (see `admin-activity-excel-import`), educational goals and "desafios" linking, images, risk analysis, any schema change beyond what `add-activity-instructions` already adds.

## Capabilities

### New Capabilities

- `activity-baseline-load`: scripted load of sheet activities into the catalogue with selection, normalisation, replace safety and a load report.

### Modified Capabilities

(none)

## Impact

- New script under `scripts/` and a pure mapping module under `src/lib/activities/` (reusable later by the Excel import); no new runtime dependency (`xlsx` is already present).
- Data: replaces rows in `activities` and their relations on the targeted local database only.
- Depends on `add-activity-instructions` (the sheet's "Intruções?" column maps to `instructions`).
- Tests: unit tests for the mapping rules; one integration test loading a small fixture into `scout_toolkit_test`.
- Open questions that need an owner decision are listed in `design.md` (licences of sources, multi-valued fields, educational-goal taxonomy mismatch).
