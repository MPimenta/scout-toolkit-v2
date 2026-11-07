## MODIFIED Requirements

### Requirement: Preview uses its own Neon database

Preview `DATABASE_URL` SHALL point at a Neon database that is not production and not `scout_toolkit_dev` / `scout_toolkit_test` / `scout_toolkit_e2e`. Schema SHALL be applied to that database when Preview deploys, by running the committed migrations that have not yet been applied. A deploy SHALL NOT force-push the schema or drop columns or tables that no committed migration drops. A failed migration SHALL fail the deploy. Preview SHALL NOT run `TRUNCATE` or SQL-integration tests against Neon. The same migration rule SHALL apply to Production.

#### Scenario: Preview can sign in and list data

- **GIVEN** Preview env has a Neon `DATABASE_URL` and migrations applied
- **WHEN** a reviewer opens the Preview URL
- **THEN** the app connects to that database
- **AND** production rows are unchanged

#### Scenario: No local test DSN on Preview

- **WHEN** Preview starts
- **THEN** it does not use `test_user` / `scout_toolkit_test`

#### Scenario: Schema drift is not forced

- **GIVEN** the hosted database has a column that the code's schema no longer declares
- **WHEN** a deploy runs and no committed migration drops that column
- **THEN** the column and its data remain

#### Scenario: New migration

- **GIVEN** a committed migration adds a column
- **WHEN** Preview deploys
- **THEN** the column exists before the app serves requests
