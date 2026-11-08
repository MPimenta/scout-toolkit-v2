# preview-hosting Specification

## Purpose

Gives Kit de Atividades a hosted Preview on Azure with its own database so a pull request can be opened in a browser without writing to production or to the local Docker databases.

## Requirements

### Requirement: Pull requests get a Preview URL

The GitHub repository SHALL be connected to the Azure deployment pipeline so each pull request updates the Preview app, a public HTTPS address reachable by reviewers. Production SHALL deploy from the agreed production branch only.

#### Scenario: Open a pull request

- **WHEN** a pull request is opened against the connected repo
- **THEN** the pipeline builds the image and deploys it to the Preview Web App
- **AND** the pull request shows the Preview address

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

### Requirement: Preview secrets live on the host

Preview configuration SHALL be set as Azure Key Vault secrets and Web App settings scoped to the Preview environment (and Production separately). The repo SHALL NOT add a `.env.preview` file. Required Preview values SHALL include `DATABASE_URL`, Auth.js secret, `NEXTAUTH_URL` / Auth URL appropriate to the Preview host, `ORGO_ISSUER`, `ORGO_CLIENT_ID`, `ORGO_CLIENT_SECRET`, `ADMIN_EMAILS`, and UploadThing keys.

#### Scenario: Missing database URL

- **WHEN** Preview is deployed without `DATABASE_URL`
- **THEN** the deployment is treated as misconfigured (the hosted database step or the health probe fails)
- **AND** no fallback to production is used

### Requirement: Orgo sign-in works on Preview

The Orgo OAuth app SHALL allow the Preview callback URL(s). A reviewer SHALL be able to use "Entrar com o eAEP" on Preview. `/api/e2e/session` SHALL return 404 on Preview because the Next.js build is production.

#### Scenario: Sign-in on Preview

- **GIVEN** the OAuth app includes the Preview redirect URI
- **WHEN** a reviewer clicks Entrar on the Preview URL
- **THEN** they complete eAEP/Orgo login and land in the app

#### Scenario: E2E helper on Preview

- **WHEN** a client POSTs `/api/e2e/session` on Preview
- **THEN** the response is 404

### Requirement: Preview is not a write-test target

CI SHALL keep using workflow Postgres. No GitHub job SHALL hit the Preview address to create programs, truncate tables, or mint e2e sessions.

#### Scenario: Pull request CI

- **WHEN** the existing test workflow runs
- **THEN** it still uses the workflow Postgres service
- **AND** it does not call the Preview address to write data
