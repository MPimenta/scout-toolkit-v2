## 1. Decisions and approvals

- [x] 1.1 Preview address policy: the Web App's own address (`aep-kit-preview.azurewebsites.net`). The Production host name is decided in `migrate-production-to-azure`.
- [x] 1.2 Approve registering `Microsoft.ContainerRegistry` on the subscription; decide whether to also register `Microsoft.OperationalInsights`.
- [x] 1.3 Create the Azure budget (`aep-monthly`) with alerts, recipients including manuel.pimenta@escoteiros.pt.

## 2. Image

- [x] 2.1 Set `output: 'standalone'` in `next.config.ts` and add `Dockerfile` and `.dockerignore` (Node 24, non-root, port from `PORT`, Chromium layer for PDF export, no secrets).
- [x] 2.2 Make `scripts/postinstall-playwright.mjs` skip inside the image build; add a smoke script that starts the image, calls `/api/health` and exports a PDF.
- [x] 2.3 `scripts/ensure-hosted-db.mjs` runs when `ENSURE_HOSTED_DB=1` (and, until Vercel is retired, on Vercel); `build` stays as it is during the transition and becomes plain `next build` at clean-up.
- [x] 2.4 Move the CI Postgres service from 17 to 16 to match the shared server.

## 3. Infrastructure as code

- [x] 3.1 `infra/` Bicep: resource group, App Service plan B2 (Linux), Web Apps `aep-kit` and `aep-kit-preview` with system-assigned identity, VNet integration into a dedicated `kit-apps` subnet, Container Registry (Basic), Key Vault.
- [x] 3.3 Role assignments `AcrPull` and `Key Vault Secrets User` for the Web Apps; health-check path `/api/health` and `Always on` set.
- [x] 3.4 First apply by a person for Preview.

## 4. Pipeline

- [x] 4.2 `.github/workflows/deploy.yml`: build, smoke test, push, temporary firewall rule, hosted DB step, remove the rule (`always()`), switch the image, wait for health, roll back the tag on failure; comment the Preview address on the pull request. (Written; first run is tracked in `migrate-production-to-azure`.)
- [x] 4.4 `.github/workflows/usage-purge.yml` (daily, reads `CRON_SECRET` from Key Vault, fails on a non-200 answer). (Written; first run is tracked in `migrate-production-to-azure`.)

## 5. Configuration and sign-in (Preview)

- [x] 5.1 Preview secrets in Key Vault and plain settings on `aep-kit-preview`; nothing removed from Vercel.
- [x] 5.2 Orgo redirect URI registered for the Preview address; `NEXTAUTH_URL`, `AUTH_URL`, `NEXT_PUBLIC_APP_URL`, `AUTH_TRUST_HOST` set; sign-in confirmed.

## 6. Data (Preview)

- [x] 6.1 Preview: migrations applied to `kit_preview` and data copied from the local development database (the old Neon Preview data was out of date); row counts compared and equal; sign-in and catalogue checked.

## Moved to `migrate-production-to-azure`

Production host name and DNS, second Owner and billing ownership, Neon version check and dump, database role scoping check, log retention and failure alerts, federated credentials check and first pipeline run, test-workflow dependency, leftover firewall-rule check, Production secrets, settings and Orgo app, custom domain, cutover and rollback runbook, Neon and Vercel retirement, documentation clean-up, PDF export and purge checks on Azure.
