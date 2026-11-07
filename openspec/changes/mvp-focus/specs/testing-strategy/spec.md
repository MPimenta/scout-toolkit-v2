## MODIFIED Requirements

### Requirement: Local Docker provides both app and test databases

Local Docker Compose SHALL provide `scout_toolkit_dev` for the running app, `scout_toolkit_e2e` for Playwright, and `scout_toolkit_test` with user `test_user` / password `test_password` for SQL-integration. Playwright runs SHALL write only to `scout_toolkit_e2e`, so test rows never appear in `scout_toolkit_dev`. Schema bootstrap for the test database MAY stay in `tests/setup.ts`. The local Postgres major version SHALL match the hosted (Neon) major version.

#### Scenario: Fresh compose

- **WHEN** a developer starts Compose and the init scripts run
- **THEN** all three databases exist
- **AND** `test_user` can create tables in `scout_toolkit_test`

#### Scenario: Playwright leaves the dev catalogue clean

- **GIVEN** a developer's `scout_toolkit_dev` catalogue
- **WHEN** they run the Playwright suite
- **THEN** no "Proposta E2E" activity or e2e user appears in `scout_toolkit_dev`

### Requirement: Environments have different write rights

Local and CI SHALL run unit, SQL-integration, and Playwright Chromium. Preview MAY run a read-mostly smoke against its own Neon branch and SHALL NOT truncate. Production SHALL NOT run write tests. `/api/e2e/session` SHALL respond only when the environment explicitly enables it (`E2E_LOGIN=1`) and `NODE_ENV` is not `production`; otherwise it SHALL return 404 and create no session.

#### Scenario: Local or CI

- **WHEN** tests run on a developer machine or in GitHub Actions
- **THEN** unit, SQL-integration, and Chromium e2e are in the default gate

#### Scenario: Production session helper

- **GIVEN** `NODE_ENV` is `production`
- **WHEN** a client POSTs `/api/e2e/session`
- **THEN** the response is 404 and no session row is created

#### Scenario: Development without opt-in

- **GIVEN** `NODE_ENV` is `development` and `E2E_LOGIN` is not set
- **WHEN** a client POSTs `/api/e2e/session`
- **THEN** the response is 404 and no session row is created

## ADDED Requirements

### Requirement: Type checking is part of the gate

The project SHALL provide a type-check command that covers application code and test files, including test-runner globals. CI SHALL run it with lint and tests, and SHALL fail on any type error.

#### Scenario: Test file type error

- **GIVEN** a test file passes a string where a number is expected
- **WHEN** CI runs
- **THEN** the type-check step fails
