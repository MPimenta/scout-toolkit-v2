## Why

The app runs on Vercel with Neon. The Vercel project belongs to a team (`aep5`) that the maintainer's own login cannot operate, so deploys, environment variables and build logs cannot be managed or automated from the repository. The AEP already has an Azure subscription from the Microsoft for Nonprofits grant, with an App Service plan, a shared PostgreSQL Flexible Server, a virtual network and a storage account in use by other AEP apps. Moving hosting and PostgreSQL there puts the Kit on a platform the AEP controls and already pays for with the grant, following the pattern the AEP's other apps use.

## What Changes

- Host the Next.js app as a container on **Azure App Service for Linux (Web App for Containers)**, built from a new `Dockerfile` (Next.js standalone output, with the Chromium that PDF export needs, non-root, health-checked through `/api/health`). Containers already run on the AEP's App Service plan (Metabase), so the platform is proven.
- Two Web Apps on a **new, dedicated App Service plan** in North Europe (the region of the AEP's plan, database and network): one for Production and one for Preview. The existing `painelaep-plan` is not reused, because it already carries four apps including Metabase and PDF rendering is memory-hungry.
- Use the existing **PostgreSQL Flexible Server `painelaep-pg`** (private network): two new databases, `kit` (Production) and `kit_preview` (Preview), each with its own role that can reach only its own database. Both Web Apps join the existing virtual network through VNet integration. A dedicated Production server stays the fallback if shared load becomes a problem.
- Use **Azure Container Registry (Basic)** for images; the Web Apps pull with their managed identity (no registry password).
- Replace Vercel's Git integration with **GitHub Actions** that build the image, push it, apply migrations, update the Web App's image, wait for the health check, and roll back by redeploying the previous image tag. GitHub signs in to Azure with **OIDC federation**; no long-lived Azure credential is stored in GitHub.
- Production deploys from `master`; Preview deploys from pull requests and from the `feat/*` branches the maintainer chooses. Per-pull-request throwaway environments are not part of this change.
- Move the hosted schema step (`scripts/ensure-hosted-db.mjs`: baseline check, `drizzle-kit migrate`, reference data, seed when empty) out of the Vercel build hook into the deploy workflow. It runs **before the image is switched**, through a temporary firewall rule for the runner that is always removed afterwards, and is triggered by an explicit setting instead of the `VERCEL` variable.
- Replace the Vercel cron with a **scheduled GitHub workflow** that calls the usage purge once a day (App Service on Linux has no triggered WebJobs).
- Keep application secrets in **Azure Key Vault**, referenced from the Web App settings through its managed identity. Nothing secret goes in the repository, the image or GitHub.
- Give Production a custom domain with a free managed certificate, and update the Orgo OAuth redirect URIs and `NEXTAUTH_URL`/`AUTH_URL`.
- Move the data: dump the Neon Preview and Production databases and restore them into the new Azure databases, verify, cut over, keep Neon read-only for a grace period, then delete it.
- Add a cost guard: an Azure budget with alerts on the subscription, and a review of who owns the billing account.
- Remove Vercel-specific files and docs (`vercel.json`, the `.vercel` link, Vercel steps in `docs/deployment.md`, the `VERCEL` checks in scripts).
- UploadThing (images), Orgo (sign-in and events) and the test workflow stay as they are. Moving uploads or the 9 MB of illustrations to Blob Storage is a possible later change, not part of this one.

## Capabilities

### New Capabilities
- `azure-hosting`: how the app is built, deployed, configured, scheduled, backed up and rolled back on Azure App Service.

### Modified Capabilities
- `preview-hosting`: Preview now comes from an Azure Web App with an Azure PostgreSQL database instead of Vercel with Neon; secrets live in Azure instead of Vercel scopes.

## Impact

- New: `Dockerfile`, `.dockerignore`, `.github/workflows/deploy.yml`, `.github/workflows/usage-purge.yml`, infrastructure definition (Bicep) under `infra/`, deploy documentation.
- Changed: `next.config.ts` (`output: 'standalone'`), `scripts/ensure-hosted-db.mjs` (explicit trigger, no `VERCEL`), `package.json` build script, `docs/deployment.md`, `README.md`, `.env.example`, `docs/api.md`, CI Postgres version (the shared server is PostgreSQL 16).
- Removed: `vercel.json`, Vercel-specific notes; Neon after the grace period.
- Azure: one new App Service plan, two Web Apps, one Container Registry, one Key Vault, two databases and roles on the existing server, a budget; the resource provider `Microsoft.ContainerRegistry` must be registered on the subscription (a subscription-level change to approve).
- External: Microsoft for Nonprofits grant already active, DNS control for the production host name, Orgo app settings for new redirect URLs.
- Risk areas: Chromium inside the image for PDF export, connection limits on the shared small database server, restoring a Neon dump into PostgreSQL 16, billing account held by an individual.
- Does not change application behaviour or the database schema.
