## Purpose

Defines how Kit de Atividades is built, deployed, configured, scheduled, backed up and rolled back on Azure App Service, so that Production and Preview can be operated from the repository without personal credentials.

## ADDED Requirements

### Requirement: The app ships as a container image

The repository SHALL contain a `Dockerfile` that builds the production app (Next.js standalone output) into an image that runs as a non-root user, listens on the port the platform provides, includes the browser needed for PDF export, and contains no secrets. The same image SHALL be promoted from Preview to Production without being rebuilt with different settings.

#### Scenario: Image runs locally

- **WHEN** the image is started with the required environment variables
- **THEN** `GET /api/health` answers 200 and a program can be exported as PDF

#### Scenario: No secrets in the image

- **WHEN** the image layers are inspected
- **THEN** no `.env` file, key or password is present

### Requirement: Production and Preview are separate

Production and Preview SHALL each have their own Web App, their own database with its own role, their own secrets and their own Orgo OAuth app. The Preview role SHALL NOT be able to connect to the Production database, and the Preview app SHALL NOT hold the Production database credentials.

#### Scenario: Preview cannot reach Production data

- **WHEN** the Preview role tries to connect to the Production database
- **THEN** the server refuses the connection

### Requirement: Deployments come from GitHub Actions through OIDC

A GitHub Actions workflow SHALL build the image, push it to the Azure Container Registry, apply the hosted database step, switch the Web App to the new image tag and check its health. It SHALL authenticate to Azure with an OIDC federated identity limited to this repository and to the allowed branches, and SHALL NOT use a stored Azure password or client secret. A push to `master` SHALL deploy Production; a pull request, or a push to a branch listed for Preview, SHALL deploy Preview. The Web Apps SHALL pull images with their managed identity, not with a registry password.

#### Scenario: Merge to master

- **WHEN** a commit lands on `master` and the test workflow passes
- **THEN** the new image is built and Production runs it

#### Scenario: Pull request

- **WHEN** a pull request is opened or updated
- **THEN** Preview runs the new image and the pull request shows the Preview address

#### Scenario: Foreign branch

- **WHEN** a workflow runs from a fork or an unlisted branch
- **THEN** it cannot obtain an Azure token

### Requirement: Migrations run before the image is switched

The hosted database step (baseline check for an existing database without migration history, `drizzle-kit migrate`, reference data load, seed only when the catalogue is empty) SHALL run against the target database before the Web App is switched to the new image, triggered by an explicit setting and not by a hosting-vendor variable. The runner SHALL reach the database only through a temporary firewall rule limited to its own address, removed at the end of the job whether it succeeded or not. If the step fails, the Web App SHALL keep running the previous image and the deployment SHALL be reported as failed. The step SHALL NOT run `db:push` and SHALL NOT drop data unless a committed migration does.

#### Scenario: Migration fails

- **WHEN** a committed migration fails on the Preview database
- **THEN** Preview keeps running the previous image and the workflow fails with the error

#### Scenario: Firewall rule removed

- **WHEN** the deploy job ends, with success or failure
- **THEN** no firewall rule for the runner remains on the database server

#### Scenario: Restored database without history

- **WHEN** the database has app tables but no migration history
- **THEN** it is compared with the baseline and recorded as applied, or the deployment fails listing the differences

### Requirement: Secrets live in Azure

Application secrets (database URL, Auth secret, Orgo client secret, Orgo API token, UploadThing keys, cron secret) SHALL be stored in Azure Key Vault and given to the Web App through Key Vault references resolved by its managed identity. Non-secret settings (such as `FEATURES`, the public URLs and `ADMIN_EMAILS`) MAY be plain Web App settings. The repository SHALL NOT contain secret values, and GitHub secrets SHALL hold none of the application secrets; the workflows read what they need from Key Vault through the OIDC identity.

#### Scenario: Rotating a secret

- **WHEN** a secret is changed in Key Vault and the Web App is restarted
- **THEN** the new value is used without a code change or rebuild

### Requirement: Database protection

The application databases SHALL live on the AEP's PostgreSQL Flexible Server reachable from the Web Apps through the virtual network, SHALL require TLS, SHALL have automatic backups with at least 7 days of point-in-time restore, and SHALL be accessed by the app through a role limited to its own database. The administrator password SHALL NOT be used by the running app.

#### Scenario: Restore

- **WHEN** an operator restores the server to a point in the last 7 days
- **THEN** a new server with the data as of that point is created without touching the live one

#### Scenario: Plain connection

- **WHEN** a client connects without TLS
- **THEN** the server refuses it

#### Scenario: App role limits

- **WHEN** the app role tries to read another application's database
- **THEN** the server refuses it

### Requirement: Scheduled usage purge

A scheduled GitHub workflow SHALL call the usage purge once a day for each environment where usage tracking is on, authenticated with the cron secret read from Key Vault, and SHALL fail visibly when the call fails. No vendor-specific cron file SHALL remain in the repository.

#### Scenario: Daily purge

- **WHEN** the schedule fires
- **THEN** events older than 13 months are deleted and the workflow run succeeds

#### Scenario: Purge fails

- **WHEN** the purge endpoint answers an error
- **THEN** the workflow run is marked failed so the maintainers are notified

### Requirement: Domain, sign-in and URLs

Production SHALL be served from the agreed host name over HTTPS with a managed certificate. `NEXTAUTH_URL`/`AUTH_URL`, `NEXT_PUBLIC_APP_URL` and the Orgo redirect URI `https://<host>/api/auth/callback/orgo` SHALL match the host of each environment. `/api/e2e/session` SHALL answer 404 outside local and CI runs.

#### Scenario: Sign in on Production

- **WHEN** a leader opens the production host and chooses "Entrar com o eAEP"
- **THEN** they return from Orgo to the same host signed in

### Requirement: Cutover and rollback

The move from Vercel and Neon SHALL be done by restoring a dump of each Neon database into the matching Azure database, checking row counts of the main tables, and only then switching the host name. Neon and the Vercel project SHALL be kept (Neon read-only) for at least 14 days after cutover so the move can be reversed, and then removed. Rolling back a bad release SHALL be possible by redeploying the previous image tag. The cutover SHALL have a written rollback.

#### Scenario: Data check

- **WHEN** the restore finishes
- **THEN** counts of users, activities, programs and entries in Azure equal those in Neon

#### Scenario: Release rollback

- **WHEN** a release is found faulty
- **THEN** redeploying the previous image tag restores the previous behaviour within minutes

#### Scenario: Cutover rollback

- **WHEN** a serious problem appears within 14 days of cutover
- **THEN** the host name is pointed back at the previous deployment and the data written since is exported from Azure for manual replay

### Requirement: Cost, health and ownership guard

The Azure subscription SHALL have a budget with alerts at 50%, 80% and 100% of the monthly share of the nonprofit grant, resources SHALL use the smallest sizes that meet the load, each Web App SHALL expose `/api/health` as its health-check path, and container and HTTP logs SHALL be retained for at least 30 days. The subscription's billing account SHALL be owned by an AEP identity rather than an individual, and at least two people SHALL have the Owner role.

#### Scenario: Budget alert

- **WHEN** monthly spend reaches 80% of the budget
- **THEN** the configured recipients are e-mailed

#### Scenario: Unhealthy release

- **WHEN** the Web App fails its health check after a deploy
- **THEN** the workflow reports failure and the previous image tag is redeployed
