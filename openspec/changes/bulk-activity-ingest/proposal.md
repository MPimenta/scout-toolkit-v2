## Why

New activities arrive in bulk from spreadsheets, scraped sources and (soon) an import agent. Today the only planned path (`admin-activity-excel-import`) writes straight into the live `activities` table, so one bad file can pollute the catalogue and there is no record of what was received, what was rejected and why. A raw landing table separates "we received this" from "this is now catalogue content", lets us validate and re-process safely, and gives unattended callers a narrow door instead of full admin access.

## What Changes

- Add `POST /api/ingest/activities`: accepts a batch of raw activity records as JSON, validates the **envelope** strictly (size, count, shape, string lengths, no control characters) and stores each record **as received** in a staging table. It does not touch `activities`.
- Add staging tables: `activity_ingest_batches` (who, when, source label/URL, content hash, counts, status) and `activity_ingest_rows` (batch, row number, raw payload, status, error list, link to the created activity).
- Authenticate callers as either an **admin session** or a **service token** (long random secret, shown once, stored hashed, scoped to ingest only, revocable, with a last-used timestamp). The import agent uses a service token.
- Add a **processing step** that turns pending rows into catalogue activities: normalise, map Portuguese labels to enums and taxonomy ids, skip repeats (same normalised name and age group, as in the Excel import), and record per-row outcome. Valid rows become **unapproved** activities by default so an admin reviews them; a batch option can approve directly for trusted admins.
- Add an **admin screen** for batches: list, row outcomes, re-process failed rows after fixing taxonomies, discard a batch.
- Make ingest **idempotent**: the same payload (content hash) or the same client-supplied idempotency key returns the existing batch instead of creating a second one.
- All SQL access goes through Drizzle with parameterised queries; payloads are never concatenated into SQL, and the raw payload is stored as data only (never executed, never rendered unescaped).
- Rows that leave processing without an image are flagged so the illustration agent can pick them up.

## Capabilities

### New Capabilities
- `bulk-activity-ingest`: raw batch intake, service-token access, staging tables, and processing into catalogue activities.

### Modified Capabilities
- `admin-activities`: gains a batches screen and the unapproved-by-default review path for ingested activities.

## Impact

- Schema: two new tables and a service-token table (a committed migration; `db:generate` and review before applying, per project rules).
- API: new `/api/ingest/*` routes and `/api/admin/ingest/*` for the batches screen; both must be classified in `FEATURE_ROUTES` and in the security route matrix.
- Reuses `parseActivityWrite` / `createActivity` and the name+age duplicate key from `admin-activity-excel-import`. That change can later post its parsed rows here instead of writing directly; this change does not depend on it.
- Depends on `security-testing` for rate limiting and payload abuse tests on the new endpoint; this change must ship its own validation and limits regardless.
- Consumed by `activity-import-agent` (producer) and `activity-illustration-agent` (consumer of the "needs image" flag).
- Tests: unit (validation, normalisation), SQL-integration on `scout_toolkit_test` (staging, dedupe, processing, token auth), Playwright for the admin batches screen.
- Unchanged: public catalogue, one-by-one admin CRUD, edit suggestions.
