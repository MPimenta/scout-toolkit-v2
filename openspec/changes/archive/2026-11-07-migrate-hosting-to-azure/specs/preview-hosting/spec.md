## MODIFIED Requirements

### Requirement: Pull requests get a Preview URL

The GitHub repository SHALL be connected to the Azure deployment pipeline so each pull request updates the Preview app, a public HTTPS address reachable by reviewers. Production SHALL deploy from the agreed production branch only.

#### Scenario: Open a pull request

- **WHEN** a pull request is opened against the connected repo
- **THEN** the pipeline builds the image and deploys it to the Preview Web App
- **AND** the pull request shows the Preview address

### Requirement: Preview uses its own Neon database

Preview `DATABASE_URL` SHALL point at an Azure Database for PostgreSQL database that is not production and not `scout_toolkit_dev` / `scout_toolkit_test`. Schema SHALL be applied to that database when Preview deploys. Preview SHALL NOT run `TRUNCATE` or SQL-integration tests against it.

#### Scenario: Preview can sign in and list data

- **GIVEN** Preview settings have an Azure PostgreSQL `DATABASE_URL` and schema applied
- **WHEN** a reviewer opens the Preview address
- **THEN** the app connects to that database
- **AND** production rows are unchanged

#### Scenario: No local test DSN on Preview

- **WHEN** Preview starts
- **THEN** it does not use `test_user` / `scout_toolkit_test`

### Requirement: Preview secrets live on the host

Preview configuration SHALL be set as Azure Key Vault secrets and Web App settings scoped to the Preview environment (and Production separately). The repo SHALL NOT add a `.env.preview` file. Required Preview values SHALL include `DATABASE_URL`, Auth.js secret, `NEXTAUTH_URL` / Auth URL appropriate to the Preview host, `ORGO_ISSUER`, `ORGO_CLIENT_ID`, `ORGO_CLIENT_SECRET`, `ADMIN_EMAILS`, and UploadThing keys.

#### Scenario: Missing database URL

- **WHEN** Preview is deployed without `DATABASE_URL`
- **THEN** the deployment is treated as misconfigured (the hosted database step or the health probe fails)
- **AND** no fallback to production is used

### Requirement: Preview is not a write-test target

CI SHALL keep using workflow Postgres. No GitHub job SHALL hit the Preview address to create programs, truncate tables, or mint e2e sessions.

#### Scenario: Pull request CI

- **WHEN** the existing test workflow runs
- **THEN** it still uses the workflow Postgres service
- **AND** it does not call the Preview address to write data
