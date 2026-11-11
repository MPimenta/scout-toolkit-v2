## Purpose

Lets admins and trusted services submit batches of raw activity records that are stored as received, then validated and turned into catalogue activities in a separate, repeatable step.

## ADDED Requirements

### Requirement: Batches are accepted only from authorised callers

`POST /api/ingest/activities` SHALL accept a request only from an admin session or from a valid, unrevoked service token sent as a Bearer token. Requests without credentials SHALL receive 401. Signed-in non-admins and revoked or unknown tokens SHALL receive 403 or 401 respectively. A service token SHALL be usable only on ingest routes.

#### Scenario: Guest rejected

- **WHEN** a request without credentials posts a batch
- **THEN** the API returns 401 and stores nothing

#### Scenario: Member rejected

- **WHEN** a signed-in user with role `user` posts a batch
- **THEN** the API returns 403 and stores nothing

#### Scenario: Valid token accepted

- **WHEN** a request carries a valid service token and a valid batch
- **THEN** the batch is stored and the token's last-used time is updated

#### Scenario: Token cannot reach other admin routes

- **WHEN** a service token is used on `/api/admin/users`
- **THEN** the API returns 401 or 403

### Requirement: Service tokens are generated, shown once, and stored hashed

An admin SHALL be able to create and revoke service tokens with a label. The secret SHALL be displayed only at creation and SHALL be stored only as a hash. Token comparison SHALL be constant-time.

#### Scenario: Secret not recoverable

- **WHEN** an admin reloads the tokens screen after creating a token
- **THEN** only the label, creation date and last use are shown, never the secret

#### Scenario: Revoked token fails

- **WHEN** an admin revokes a token and the holder posts a batch
- **THEN** the API returns 401

### Requirement: The envelope is validated strictly

The request body SHALL be at most 2 MB and contain at most 200 records. Each text field SHALL respect its length cap, contain no control characters, and URLs SHALL use `https`. An invalid envelope SHALL be rejected as a whole with 400 (shape) or 413 (size) and a Portuguese message. Individual record problems that are about content (unknown type, bad enum) SHALL NOT reject the batch; they are handled at processing.

#### Scenario: Oversized batch

- **WHEN** a request contains 201 records
- **THEN** the API returns 413 and stores nothing

#### Scenario: Control characters rejected

- **WHEN** a record's name contains a NUL character
- **THEN** the API returns 400 and stores nothing

#### Scenario: Odd content does not reject the batch

- **WHEN** a batch has nine good records and one with an unknown activity type
- **THEN** all ten rows are stored as pending and the batch is accepted

### Requirement: Raw records are stored as data, never executed

Each record SHALL be stored unchanged in the staging table through parameterised queries. SQL metacharacters, HTML and script content in a record SHALL be stored verbatim and SHALL NOT alter any other table or be rendered unescaped.

#### Scenario: SQL payload stays inert

- **WHEN** a record's description is `'); DROP TABLE activities; --`
- **THEN** the row is stored with that exact text and the `activities` table is intact

#### Scenario: Script text rendered as text

- **WHEN** an admin opens a batch whose record contains `<script>alert(1)</script>`
- **THEN** the screen shows it as text and no script runs

### Requirement: Ingest is idempotent

A batch whose records hash to an existing batch, or that reuses an existing idempotency key, SHALL return the existing batch (status 200) and SHALL NOT create new rows.

#### Scenario: Resubmitting the same file

- **WHEN** the same payload is posted twice
- **THEN** the second response references the first batch and the row count is unchanged

### Requirement: Processing turns staged rows into catalogue activities

Processing SHALL validate each pending row with the same rules as manual activity creation, map enum keys or Portuguese labels, resolve activity type, goal codes and SDG numbers against existing taxonomies, and create one activity per valid row. Each row SHALL be processed in its own transaction and SHALL end as `processed`, `duplicate`, or `invalid` with Portuguese error messages naming the field. Unknown taxonomy values SHALL fail the row and SHALL NOT create taxonomy entries.

#### Scenario: Valid row becomes an activity

- **WHEN** a pending row is complete and valid
- **THEN** an activity is created, the row is `processed`, and the row references the activity id

#### Scenario: Repeat is skipped

- **WHEN** a row has the same normalised name and age group as an existing activity
- **THEN** no activity is created and the row is `duplicate`

#### Scenario: One bad row does not block the rest

- **WHEN** a batch contains an invalid row between two valid rows
- **THEN** both valid rows become activities and the invalid row is `invalid` with its reasons

#### Scenario: Re-process after fixing a taxonomy

- **WHEN** an admin adds the missing activity type and re-processes a batch
- **THEN** previously invalid rows for that type are processed and already processed rows are not repeated

### Requirement: Ingested activities are reviewed before they go public

Activities created from a batch SHALL be unapproved and carry the batch's source label and URL. Only an admin session MAY request direct approval. Service tokens SHALL never create approved activities.

#### Scenario: Service token output is unapproved

- **WHEN** a batch posted with a service token is processed
- **THEN** the resulting activities are not visible in the public catalogue until an admin approves them

#### Scenario: Token cannot self-approve

- **WHEN** a service-token request sets `options.autoApprove`
- **THEN** the option is ignored or the request is rejected, and activities stay unapproved

### Requirement: Admins can review and manage batches

Admins SHALL see a list of batches (source, date, caller, counts by status) and per-row outcomes with errors, SHALL be able to re-process failed rows and discard a batch, and SHALL see raw payloads escaped. The endpoint and screens SHALL be rate limited and listed in the route access matrix and in `FEATURE_ROUTES`.

#### Scenario: Discard a batch

- **WHEN** an admin discards a batch with pending rows
- **THEN** those rows become `discarded` and are never processed

#### Scenario: Rate limit

- **WHEN** a caller exceeds the ingest rate limit
- **THEN** the API returns 429 with a Portuguese message
