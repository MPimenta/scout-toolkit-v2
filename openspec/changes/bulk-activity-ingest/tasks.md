## 1. Schema and tokens

- [ ] 1.1 Add `activity_ingest_batches`, `activity_ingest_rows` and `ingest_tokens` to `drizzle/schema`, generate the migration and review the SQL before applying (ask first) — verify migration applies on `scout_toolkit_test` and indexes exist on batch hash, idempotency key and row status
- [ ] 1.2 Add `src/lib/ingest/tokens.ts` (generate, hash, constant-time verify, revoke) — verify unit tests for hash-only storage, revoked and unknown tokens
- [ ] 1.3 Add admin token create/revoke API and a tokens section in the admin UI (secret shown once) — verify Playwright as admin creates, copies, and revokes a token

## 2. Intake endpoint

- [ ] 2.1 Add Zod envelope schema and limit constants in `src/lib/ingest/` — verify unit tests for 200/201 records, 2 MB, control characters, non-https URLs
- [ ] 2.2 Add `POST /api/ingest/activities` with admin-session and Bearer-token auth, idempotency and parameterised inserts — verify SQL-integration tests for 401/403, 413, 400, idempotent replay, and the SQL-metacharacter corpus (`activities` untouched)
- [ ] 2.3 Add rate limiting and Portuguese errors via `src/lib/errors/` — verify a flood test returns 429
- [ ] 2.4 Classify the new routes in `FEATURE_ROUTES` behind a new `bulk-ingest` flag and in the security route matrix — verify `tests/unit/lib/feature-routes-coverage.test.ts` passes

## 3. Processing

- [ ] 3.1 Add normalise/map functions reusing `parseActivityWrite` and the Excel-import duplicate key — verify unit tests for PT labels, enum keys, goal codes, SDG numbers, duplicate key
- [ ] 3.2 Add `processBatch` with per-row transactions, unapproved-by-default and source fields — verify SQL-integration tests for processed, duplicate, invalid, mixed batch, and re-process after adding a taxonomy
- [ ] 3.3 Enforce that service tokens never approve — verify an integration test with `autoApprove` from a token
- [ ] 3.4 Add chunked processing for batches over 25 rows and the retention clean-up for old raw payloads — verify a 120-row batch completes and clean-up clears payloads but keeps counts

## 4. Admin screens

- [ ] 4.1 Add `/admin/importacoes` list and batch detail (counts, row outcomes, escaped raw payload, re-process, discard) with `pt.json`/`en.json` strings — verify Playwright as admin on desktop and phone width
- [ ] 4.2 Add the unapproved ingested activities to the existing admin review flow — verify an ingested activity can be approved and then appears in the catalogue

## 5. Docs

- [ ] 5.1 Document the request format, limits, token handling and example `curl` in `docs/api.md` and OpenAPI — verify `/api/docs` shows the endpoint and the example works against local dev
