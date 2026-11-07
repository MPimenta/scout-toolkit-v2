## Context

Today: Vercel builds the app on push (`npm run build` runs `scripts/ensure-hosted-db.mjs` first, detected by the `VERCEL` variable), Neon holds Preview and Production data, `vercel.json` schedules the usage purge, and secrets sit in Vercel scopes.

The AEP's Azure subscription (nonprofit sponsorship, inventory of 2026-11-07) already has: a Linux App Service plan `painelaep-plan` (B2, North Europe) running three Node 22 apps and Metabase as a Docker image; a PostgreSQL 16 Flexible Server `painelaep-pg` (Burstable B1ms, 32 GB, 7-day backups, private endpoint in `painelaep-vnet`, one database per app); a storage account; and Azure OpenAI/Search for a separate project. Month-to-date spend is small. Resource providers `Microsoft.Web`, `DBforPostgreSQL`, `KeyVault`, `Storage`, `Network`, `ManagedIdentity` are registered; `Microsoft.ContainerRegistry` is not. The maintainer's account is Owner. There is no budget, and the billing account is held in an individual's name.

The app needs Node 24 (pinned in `.nvmrc`), PostgreSQL, a Chromium for PDF export (Playwright), outbound access to Orgo and UploadThing, and writes nothing to local disk. Traffic is a small audience of leaders.

## Goals / Non-Goals

**Goals:** run Production and Preview on Azure from the repository, in the same style as the AEP's other apps; no personal or long-lived credentials in CI; secrets in Key Vault; same behaviour for users; reversible cutover.
**Non-Goals:** changing the app, the schema or the auth provider; per-pull-request environments; multi-region; Entra sign-in for users (Orgo stays); moving UploadThing or the illustrations to Blob Storage (possible later).

## Decisions

### App Service for Linux with a container, not Container Apps
The AEP already operates App Service and already runs a Docker image there, so the team keeps one platform to learn, no new resource provider is needed for hosting, VNet integration to the existing network is routine, and managed certificates and custom domains are built in. A container (instead of the built-in Node image) is needed because Chromium needs system libraries the built-in image does not ship. Container Apps (proposed earlier) would add a new provider, a Log Analytics workspace and jobs for little benefit at this scale. Rejected: AKS (far more operations than the audience justifies), Static Web Apps (poor fit for a server-rendered app with API routes).

### A dedicated plan, two Web Apps
A new Linux plan **B2** (2 vCPU, 3.5 GB) in North Europe holds `kit` (Production) and `kit-preview` (Preview). Basic tier has no deployment slots, so the two environments are separate apps; Preview is also where changes are tried. `Always on` is enabled. If PDF rendering shows memory pressure, move to a larger size or split Preview to its own plan. The existing `painelaep-plan` is left alone because Metabase already uses much of it.

### Container image and registry
`output: 'standalone'` keeps the image small. The image installs the Chromium build and libraries Playwright documents for Debian, in a dedicated layer, and runs as non-root; `postinstall-playwright` is skipped during the image build. Images live in **Azure Container Registry Basic**; each Web App pulls with its system-assigned managed identity holding `AcrPull`, so there is no registry password. This needs `Microsoft.ContainerRegistry` registered (approval needed). Rejected: GitHub Container Registry (needs a personal token as a pull credential, which is exactly what this change removes). A smoke test in the pipeline starts the built image and exports a PDF before anything is pushed.

### Database: two databases on the existing server
Create `kit` and `kit_preview` on `painelaep-pg`, each with its own login role that owns only its database (connect privilege revoked from `PUBLIC` on both). That matches how the other AEP apps use the server, costs nothing extra, and is covered by the same backups (7-day point-in-time restore). Both Web Apps use VNet integration into the existing `apps` subnet so they reach the server through its private endpoint. Connection limits on a B1ms are modest, so the app keeps a small pool and the number of connections per app is checked before cutover. A dedicated Production server is the documented fallback. PostgreSQL 16 is what the server runs; CI moves from 17 to 16 so tests match production. Rejected: new servers per environment now (extra monthly cost without evidence of need).

### Delivery: GitHub Actions + OIDC
`deploy.yml`: build image (tag = commit SHA) → smoke test → push to ACR → read secrets from Key Vault → add a temporary firewall rule for the runner on `painelaep-pg` → hosted DB step → remove the rule (`if: always()`) → set the Web App image to the new tag → wait for `/api/health` → on failure set the previous tag back. Azure login uses `azure/login` with a federated credential whose subject is limited to `repo:MPimenta/scout-toolkit-v2` on `master` (Production) and the `preview` GitHub environment (pull requests and listed branches). The workflow has `permissions: id-token: write, contents: read`. The identity gets the narrowest roles: push to ACR, update the two Web Apps, read the relevant Key Vault secrets, and manage firewall rules on the one database server. No client secret exists to rotate or leak. Rejected: publish profiles and service-principal secrets; running migrations at container start (a failing migration would take the site down and leave no previous image running); opening the database to the internet permanently.

### Hosted DB step
`scripts/ensure-hosted-db.mjs` currently exits unless `VERCEL` is set. It will exit unless `ENSURE_HOSTED_DB=1` is set (the workflow sets it); the logic (baseline compare, `drizzle-kit migrate`, reference data, seed when empty) is unchanged. It leaves `npm run build`, which becomes plain `next build`. Migrations stay backward compatible with the image that is still running during the step (expand/contract), as they already are in practice.

### Secrets and configuration
Key Vault holds `DATABASE_URL` for each environment, the migration role URL, `NEXTAUTH_SECRET`/`AUTH_SECRET`, `ORGO_CLIENT_SECRET`, `ORGO_API_TOKEN`, `UPLOADTHING_SECRET`, `CRON_SECRET`. Each Web App's managed identity has `Key Vault Secrets User`; settings use Key Vault references (`@Microsoft.KeyVault(...)`). Plain settings: `FEATURES`, `ADMIN_EMAILS`, `NEXTAUTH_URL`, `AUTH_URL`, `NEXT_PUBLIC_APP_URL`, `AUTH_TRUST_HOST=true`, `ORGO_ISSUER`, `ORGO_CLIENT_ID`, `UPLOADTHING_APP_ID`, `WEBSITES_PORT`. The app role (limited to its database) is the one the running app uses; the migration role is separate and used only by the workflow. Infrastructure is described in **Bicep** under `infra/` so environments can be recreated; the first apply is run by a person.

### Scheduled purge
`usage-purge.yml` runs daily (`cron: '17 3 * * *'`), reads `CRON_SECRET` from Key Vault through OIDC and calls `GET /api/usage/purge` for each environment where the flag is on. A non-200 answer fails the run, which GitHub reports by e-mail. `vercel.json` is deleted. Triggered WebJobs are not available on Linux App Service, and a timer inside the app would run once per instance.

### Domain and sign-in
The production host name is decided with the AEP (a sub-domain of an AEP domain). App Service gives a free managed certificate for sub-domains once the CNAME and TXT verification records exist. Orgo apps for Preview and Production get the new redirect URIs before cutover. Preview uses the Web App's own `azurewebsites.net` address, which is stable, so one redirect URI is enough.

### Data migration and cutover
1. Register `Microsoft.ContainerRegistry`, create the resources (Bicep), deploy Preview from `master` into an empty `kit_preview` and verify migrations from scratch.
2. `pg_dump` Neon Preview → restore into `kit_preview`; check the Neon server version first so the dump restores into 16; compare counts; sign in; export a PDF.
3. Production in a quiet window: lower DNS TTL, freeze writes on Neon (read-only role), final dump and restore into `kit`, run the hosted DB step (history baseline check), compare counts, switch the host name.
4. Keep Neon read-only and the Vercel project for 14 days, then delete both.
Rollback inside the window: point the host back, export rows created in Azure since cutover (by `created_at`) for manual replay.

### Observability and cost
Enable App Service HTTP and container logs with 30-day retention to the existing storage account (Log Analytics can be added later by registering `Microsoft.OperationalInsights`), set the health-check path, and turn on failure alerts by e-mail. Add a subscription budget with alerts at 50/80/100% of one twelfth of the grant, since other apps share the subscription. Current spend is about 10 EUR in the first week of November; the new plan, registry and Key Vault are the main additions, to be re-checked in the Azure pricing calculator before ordering.

## Risks / Trade-offs

- **Chromium in the container** may be heavy or fail on missing libraries. Mitigation: smoke test in CI before any push; dedicated image layer; room to scale the plan up.
- **Shared database server** means one app's load can affect another (Metabase, Painel, Bússola). Mitigation: small pool, off-peak migrations, fallback to a dedicated server.
- **Temporary firewall rule on the database** briefly opens the server to one runner address. Mitigation: narrow rule, removed in an `always()` step, and a nightly check that no leftover rule exists.
- **No slots on Basic tier**: a deploy restarts the app for a few seconds. Accepted for this audience; rollback is a one-command tag switch.
- **Grant lapse**: the grant is annual, unused credit does not roll over, and renewal has an activation window. Mitigation: budget alerts, a renewal reminder, and the portable container and dump procedures so the app can move again.
- **Billing owned by an individual**: a continuity risk. Mitigation: move billing ownership to an AEP identity and keep two Owners.
- **Neon to Azure data move** could lose writes or fail on version differences. Mitigation: write freeze, version check, counts check, rollback path above.
- **Vendor lock-in** is limited: a standard container and standard PostgreSQL.
- **Grant terms** (allowed services; credit applies to Microsoft-published services only) are confirmed against the AEP subscription before ordering anything new.

## Migration Plan

Phases: (1) decisions and approvals (provider registration, domain, budget, billing owner), (2) image and infrastructure as code, (3) Preview on Azure with a data copy, (4) pipeline switched and Vercel Preview off, (5) Production cutover, (6) grace period and clean-up. Each phase can stop without affecting users until phase 5.

## Open Questions

- Production host name and who controls its DNS.
- Who receives budget alerts and who is the second Owner; move billing ownership to which AEP identity.
- Approve registering `Microsoft.ContainerRegistry` (and optionally `Microsoft.OperationalInsights` later).
- Neon's PostgreSQL version (decides whether a plain dump restores into 16).
- Keep GitHub Actions for deploys only on `master` and pull requests, or also on `feat/*` automatically?
