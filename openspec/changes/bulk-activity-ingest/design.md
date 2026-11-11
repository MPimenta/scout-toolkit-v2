## Context

Activities live in `activities` with child tables for types, goals (per age group, with observable behaviour), SDGs and challenges. Content columns are plain Portuguese `text`. Creation goes through `createActivity` and validation through `parseActivityWrite`. `admin-activity-excel-import` (planned, not built) defines the column layout and the duplicate rule: normalised name (trim, collapse spaces, case-insensitive) plus age group. Auth.js sessions identify admins; there is no machine credential today. The app moves to Azure App Service, where a request body larger than a few MB or a long synchronous job is a risk.

## Goals / Non-Goals

**Goals:**
- Keep a faithful, queryable record of every received record, valid or not.
- Make it impossible for a malformed or hostile payload to reach `activities` without passing the same validation as manual creation.
- Give unattended callers a least-privilege credential.

**Non-Goals:**
- Fetching URLs or reading files (that is `activity-import-agent`).
- Generating images (that is `activity-illustration-agent`).
- Replacing the Excel import UI. It may later feed this endpoint.
- Inventing taxonomy entries. Unknown type, goal or SDG fails the row, as in the Excel import.

## Decisions

### Staging first, catalogue second
Two steps with separate tables. Step 1 (HTTP) validates the envelope and stores rows with status `pending`; it never fails a whole batch because one record is odd. Step 2 (processing) validates each record's content and creates the activity. This keeps the HTTP call fast and bounded and makes processing re-runnable.

### Raw payload column type
`raw_payload` is `jsonb` (it is staging data, not catalogue content; the "plain text columns" convention applies to catalogue and user content). The processed activity is written to the usual text columns. Reason for jsonb over text: the processor and admin screen can read individual keys, and invalid JSON is rejected at the door.

### Envelope validation (Zod, strict)
Request: `{ source: { label, url? }, idempotencyKey?, options?: { autoApprove? }, records: [...] }`. Limits: body at most 2 MB, at most 200 records per batch, each string field capped (name 200, description 5 000, materials 2 000, URLs 2 048), no NUL or other control characters, unknown keys kept in the raw payload but ignored by processing. Violations return 400/413 with a Portuguese message. URLs must be `https:`. These caps are constants in one file so they can change without a migration.

### SQL safety
Only Drizzle query builders with bound parameters. No `sql.raw`, no string-built SQL. Search/filter parameters on the admin screen escape `%` and `_`. A test posts a corpus of SQL metacharacter payloads and asserts they are stored verbatim in `raw_payload` and that no other table changed.

### Credentials: admin session or service token
A new `ingest_tokens` table: id, label, token hash (SHA-256 of a 32-byte random secret), created_by, created_at, last_used_at, revoked_at. The secret is shown once on creation. Requests send `Authorization: Bearer <token>`. Comparison is constant-time. A token can call only the ingest routes. Admin sessions use the normal Auth.js cookie and the existing admin check. The route is a machine endpoint, so it is exempt from CSRF origin checks but not from the rate limit.

### Idempotency
Batch content hash = SHA-256 of the canonical JSON of `records`. A second POST with the same hash (or the same `idempotencyKey`) returns the existing batch with `200` instead of `201`. Row-level duplicates against the catalogue are handled in processing, not at intake.

### Processing
`processBatch(batchId)` runs inside the request for small batches (≤ 25 rows) and via an admin-triggered or scheduled run for larger ones, in chunks, each row in its own transaction so one failure does not roll back others. Per row: normalise, map labels and enums, resolve taxonomy ids, compute the duplicate key, create the activity with `source_id`/`source_url` set from the batch, then store `activity_id` or the error list. Default `is_approved = false`; `options.autoApprove` is honoured only for admin sessions, never for service tokens.

### Row statuses
`pending` → `processed` | `duplicate` | `invalid` | `discarded`. Invalid rows keep their errors (Portuguese, with field names) so an admin can fix the taxonomy and re-process.

### Hook for illustrations
After a row creates an activity with no `image_url`, the activity is simply "an approved or pending activity without an image". The illustration agent finds work by querying that condition; no extra queue table is needed.

### Where it lives
`src/lib/ingest/` (schema, normalise, process, tokens), `src/app/api/ingest/activities/route.ts`, `src/app/api/admin/ingest/**`, admin page under `/admin/importacoes`. Strings in `pt.json`/`en.json`.

## Risks / Trade-offs

- **Service token leak** → scoped to ingest only, unapproved-by-default output, hashed at rest, revocable, rate limited, and every batch records the token used.
- **Large or repeated payloads fill the database** → hard caps, content-hash idempotency, and a retention rule: discarded and fully processed batches older than 90 days have their raw payloads cleared (counts kept).
- **Two import paths (Excel and ingest) drift apart** → both call the same normalise/validate functions; the Excel change should adopt this endpoint later.
- **Processing inside the request on Azure could hit timeouts** → small-batch cap for inline processing; larger batches run in chunks through an admin-triggered call.
- **jsonb makes raw payloads queryable, which tempts treating them as trusted** → processing only ever reads through the Zod schema.

## Migration Plan

Add the tables with a committed Drizzle migration (review SQL before applying). Ship the endpoint and processor behind a feature flag, off in Production until tokens exist and the security tests pass. Roll back by turning the flag off; tables are additive.

## Open Questions

- Should service tokens be limited to a fixed source label (so a token for one agent cannot impersonate another source)?
- Retention window for raw payloads (90 days proposed).
- Should batches from service tokens require a second admin approval to create *any* activity, or is "unapproved activity in the review queue" enough? Proposed: enough.
