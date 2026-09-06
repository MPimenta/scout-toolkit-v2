# testing-strategy Specification

## Purpose

Makes a green test suite mean the same thing every time: unit tests never touch Postgres, SQL-integration tests always use a disposable local database, and browsers only write against a dedicated app DB — never production.

## Requirements

### Requirement: Tests are named by kind

A test that only mocks collaborators SHALL be a unit test. A test that inserts or truncates Postgres SHALL be a SQL-integration test. A test that drives a browser SHALL be an e2e test. Files SHALL use names that match that kind so a mocked route test is not counted as SQL coverage.

#### Scenario: Mocked route test

- WHEN a test mocks `@/lib/db/server` and asserts HTTP status
- THEN it lives under a unit path or name, not `*.integration.test.ts`

#### Scenario: Truncating test

- WHEN a test inserts or truncates rows
- THEN it is a SQL-integration test and uses only `scout_toolkit_test`

### Requirement: SQL-integration uses only the local test database

SQL-integration tests SHALL connect to `postgresql://test_user:test_password@localhost:5432/scout_toolkit_test`. They SHALL NOT use Neon or the app `DATABASE_URL`. If that database is unreachable, `npm run test:run` SHALL fail rather than skip those files and report a green suite.

#### Scenario: Test database is up

- GIVEN `scout_toolkit_test` accepts connections as `test_user`
- WHEN `npm run test:run` executes
- THEN SQL-integration files run against that database

#### Scenario: Test database is down

- GIVEN `scout_toolkit_test` is unreachable
- WHEN `npm run test:run` executes
- THEN the run fails
- AND it does not report those files as skipped-success

### Requirement: Local Docker provides both app and test databases

Local Docker Compose SHALL provide `scout_toolkit_dev` for the running app and Playwright, and `scout_toolkit_test` with user `test_user` / password `test_password` for SQL-integration. Schema bootstrap for the test database MAY stay in `tests/setup.ts`.

#### Scenario: Fresh compose

- WHEN a developer starts Compose and the init scripts run
- THEN both databases exist
- AND `test_user` can create tables in `scout_toolkit_test`

### Requirement: Environments have different write rights

Local and CI SHALL run unit, SQL-integration, and Playwright Chromium. Preview MAY run a read-mostly smoke against its own Neon branch and SHALL NOT truncate. Production SHALL NOT run write tests. `/api/e2e/session` SHALL keep returning 404 when `NODE_ENV` is `production`.

#### Scenario: Local or CI

- WHEN tests run on a developer machine or in GitHub Actions
- THEN unit, SQL-integration, and Chromium e2e are in the default gate

#### Scenario: Production session helper

- GIVEN `NODE_ENV` is `production`
- WHEN a client POSTs `/api/e2e/session`
- THEN the response is 404 and no session row is created

### Requirement: CI runs the local gate

CI SHALL start Postgres, create `scout_toolkit_test`, run `npm run test:run`, and run Playwright Chromium. The default CI matrix SHALL NOT require Firefox, WebKit, or mobile projects. Preview and production write jobs SHALL NOT be added by this change.

#### Scenario: CI on a pull request

- WHEN a pull request workflow runs
- THEN Vitest and Playwright Chromium execute against the workflow Postgres
- AND the job fails if `scout_toolkit_test` was not created
