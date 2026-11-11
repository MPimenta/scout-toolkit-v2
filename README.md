# Kit de Atividades

Web app for Escoteiros de Portugal leaders: browse activities, build session programs, and manage catalogue content. Built with Next.js 15, TypeScript, and PostgreSQL.

The product name stays **Kit de Atividades**. Chrome defaults to Portuguese; English is a header switcher (cookie `kit-locale`). There are no `/pt` or `/en` URLs.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-blue?style=flat-square&logo=postgresql)](https://www.postgresql.org/)

## What is implemented

- **Activity catalogue** — search, filters, table view, and activity detail
- **Program builder** — create and edit schedules (drag-and-drop on desktop; move up/down on phone)
- **Public programs** — gallery of programs marked public, plus copy as a template
- **Export** — program Excel (`.xlsx`) and PDF (Playwright Chromium)
- **Ratings and discussion** — one review per user, votes, reactions, and replies
- **Propose and suggest** — leaders can propose activities and suggest edits; admins approve
- **Issue reports** — floating **Reportar** / **Report** on every page (guests allowed)
- **eAEP login** — Orgo OAuth (`Entrar com o eAEP`), not Google
- **Admin** — dashboard, activities, taxonomies, users, suggestion queue, issue-report queue, usage analytics (`/admin/utilizacao`)
- **View as member** — admins can hide admin chrome without changing their stored role
- **Usage tracking** — anonymous, first-party search / activity-view / program-add events with a daily purge; behind the `usage-tracking` flag
- **Feature flags** — non-MVP features are switched off unless listed in `FEATURES` (`src/lib/features.ts`)
- **Orgo event** — owner can create the program as an eAEP event (`ORGO_API_TOKEN`, server-only)
- **Mobile layout** — hamburger, stacked catalogue, phone-sized builder
- **Image uploads** — signed-in users can attach JPEG / PNG / WebP images (max 5 MB) to an activity; stored in a private Azure Blob container and served by the app at `/media/activity-images/<name>`. The 97 catalogue illustrations ship with the app under `public/activity-illustrations/`
- **Hosted Preview on Azure** — `https://aep-kit-preview.azurewebsites.net`: App Service (Linux container) + the AEP's PostgreSQL server (database `kit_preview`), secrets in Key Vault, images in Azure Container Registry. Committed migrations apply on deploy, and the first seed runs only when the catalogue is empty
- **Privacy page** — `/privacy` explains the anonymous usage statistics

Where things stand:

- **Preview** runs on Azure with the catalogue (97 activities), search and filters, sign-in with eAEP, usage tracking and the installable app (flags `usage-tracking` and `pwa` on) and image storage. PDF export, the admin usage dashboard and the GitHub deploy workflows have not been exercised on Azure yet.
- **Production** (`aep-kit`) is provisioned on Azure but runs a placeholder image: there is no production Orgo app or database yet.
- **Activity creation by users** is not switched on in the hosted Preview yet; the upload path is built and deployed but not tested by a signed-in user there.

Not implemented (do not treat these as shipped):

- Admin Excel **import** of activities (OpenSpec only)
- A custom domain (the Preview uses the automatic Azure address, which Chrome may flag with a Safe Browsing warning until a domain exists)
- Email / SMTP notifications (in-app only)

### Planned (OpenSpec changes, not built)

| Change | What it is |
|---|---|
| `migrate-production-to-azure` | Re-evaluate after Preview testing, then deploy Production (domain, Orgo app, `kit` database) |
| `enable-activity-image-uploads` | Test uploads end to end with a signed-in user and decide when activity creation is opened |
| `admin-activity-excel-import` | Admin upload of an `.xlsx` of activities, skipping repeats |
| `security-testing` | Threat model, automated security checks, and a review of the Orgo sign-in flow |
| `bulk-activity-ingest` | Endpoint that stores raw batches of activities in a staging table, then processes them into the catalogue |
| `activity-import-agent` | Agent that reads a file or URL with a spec and skills and sends activities to the ingest endpoint |
| `activity-illustration-agent` | Agent that draws a house-style illustration for activities without an image |

Working specs live in `openspec/specs/` (including `azure-hosting` and `image-uploads`), proposed changes in `openspec/changes/`, finished ones in `openspec/changes/archive/`. The epic log is `docs/planning.md`.

## Quick start (local)

### Prerequisites

- Node.js 24 LTS (pinned in `.nvmrc`; `engines` allows 22.12+). Use a version manager that reads `.nvmrc`, such as [fnm](https://github.com/Schniz/fnm) (`fnm use`) or [Volta](https://volta.sh/). Nodist is unmaintained and does not read `.nvmrc`.
- Docker Desktop (Compose)
- An eAEP / Orgo OAuth app (for sign-in)
- Optional: Azurite (`docker compose --profile storage up -d azurite`) to try image uploads locally
- Playwright Chromium (PDF export and e2e). `npm install` fetches it automatically; run `npm run playwright:install` if it is missing.

Feature flags: non-MVP features are off unless `FEATURES` lists them (e.g. `FEATURES=all` locally to see everything). See `docs/deployment.md`, "Feature flags".

### Install and seed

```bash
git clone <repository-url>
cd scout-toolkit-v2
npm install
npm run setup:db
```

`setup:db` will:

1. Create `.env.local` if it is missing (defaults for Docker Postgres)
2. Start Compose (Postgres 17 with `scout_toolkit_dev`, `scout_toolkit_e2e` for Playwright, and `scout_toolkit_test` for SQL-integration)
3. Apply the Drizzle schema with `drizzle-kit push`
4. Seed taxonomies and demo activities (`npm run db:seed`)

Then edit `.env.local`:

```env
ORGO_ISSUER=https://eaep.escoteiros.pt
ORGO_CLIENT_ID=your-orgo-client-id
ORGO_CLIENT_SECRET=your-orgo-client-secret
ADMIN_EMAILS=you@escoteiros.pt
```

Register this exact Orgo Redirect URL on the **local** OAuth app:

```text
http://localhost:3000/api/auth/callback/orgo
```

Orgo allows **one Redirect URL per app**. Local, Preview, and Production each need their own app (same issuer, different client id/secret).

```bash
npm run playwright:install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in once with eAEP; `ADMIN_EMAILS` promotes that account to admin.

### Manual database commands

Locally, `setup:db` and `db:push` apply the current schema to a throwaway database. Schema changes themselves ship as **committed migrations** in `drizzle/migrations/` (see "Changing the schema" below); hosted environments only ever run `drizzle-kit migrate`.

```bash
npm run setup:env          # create .env.local if missing
npm run db:start           # docker compose up -d
npm run db:push            # drizzle-kit push (local throwaway databases only)
npm run db:generate        # create a migration from schema changes
npm run db:migrate         # apply committed migrations
npm run db:seed            # taxonomies + demo activities
npm run db:studio          # Drizzle Studio
npm run db:stop
npm run db:reset           # wipe the Docker volume, then start again (re-run db:push + db:seed)
```

Upgrading from an older checkout: the local image is Postgres 17 (the AEP's shared server on Azure is PostgreSQL 16 and CI uses 16, so keep schema changes compatible with both), and Compose creates `scout_toolkit_e2e`. An existing Postgres 15 volume will not start on 17, so run `npm run db:reset` once (or `pg_dump` your dev data first and restore it after), then `npm run db:push` and `npm run db:seed`.

`db:seed` reads `DATABASE_URL` from `.env.local`. Point it only at `scout_toolkit_dev` locally. Never seed `scout_toolkit_test` this way, and never point `npm run test:run` at a hosted database.

## Deploying

The Preview runs on **Azure App Service** (Linux container) with the AEP's PostgreSQL server; the infrastructure is described in `infra/` (Bicep) and the steps, secrets and rollback are in `docs/deployment.md` and `infra/README.md`. Secrets live in Azure Key Vault and are referenced from the Web App settings; nothing secret is in the repository or the image. Images are built from the `Dockerfile` (Next.js standalone output, with Chromium for PDF export) and pushed to Azure Container Registry. The workflows `.github/workflows/deploy.yml` and `usage-purge.yml` are written but have not run yet, so deploys are still done by hand.

There is no `.env.preview` file. Next.js never loads one. Hosted values are Web App settings and Key Vault secrets.

The hosted schema step (`scripts/ensure-hosted-db.mjs`) runs when `ENSURE_HOSTED_DB=1`: it applies the committed migrations in `drizzle/migrations/` (`drizzle-kit migrate`), then runs `db:seed` **only if** the `activities` table is empty. It never force-pushes the schema. A local `npm run build` skips it.

### Changing the schema

1. Edit `drizzle/schema/*`.
2. `npm run db:generate` creates a new SQL file in `drizzle/migrations/`.
3. Review the SQL (look for drops and renames), then commit it with the schema change.
4. Locally, `npm run db:push` or `npm run db:migrate` updates your dev database. Preview and Production apply the migration on their next deploy.

A hosted database created before migrations existed is checked against the baseline (`0000_baseline`) on its first deploy. If it matches, the baseline is recorded as applied; if not, the deploy fails and lists the differences.

### Preview and Production settings

Names used by the app (values for Azure are in Key Vault or the Web App settings; see `docs/deployment.md`):

| Name | Notes |
|---|---|
| `DATABASE_URL` | The environment's own database on the shared PostgreSQL server |
| `NEXTAUTH_SECRET` / `AUTH_SECRET` | Same generated secret |
| `NEXTAUTH_URL` / `AUTH_URL` / `NEXT_PUBLIC_APP_URL` / `AUTH_TRUST_HOST` | The environment's address; `AUTH_TRUST_HOST=true` |
| `ORGO_ISSUER` | `https://eaep.escoteiros.pt` |
| `ORGO_CLIENT_ID` / `ORGO_CLIENT_SECRET` | One Orgo app per environment |
| `ADMIN_EMAILS` | Comma-separated eAEP emails to promote on sign-in |
| `FEATURES` | Flags to switch on (Preview: `usage-tracking,pwa`) |
| `CRON_SECRET` | Bearer secret for the daily usage purge |
| `AZURE_STORAGE_ACCOUNT` | Image storage account name (managed identity, no key); locally `AZURE_STORAGE_CONNECTION_STRING` for Azurite |
| `ORGO_API_TOKEN` | Optional; program → eAEP event |

Register the environment's callback on its Orgo app (one Redirect URL per app):

```text
https://aep-kit-preview.azurewebsites.net/api/auth/callback/orgo
```

Key Vault references are cached by App Service; after rotating a secret, pin the new secret version in the setting to force a refresh. Promotion to admin runs on the **next Orgo sign-in**, not on a page refresh.

### Production (not set up yet)

Production (`aep-kit`) exists on Azure but runs a placeholder image. Deploying it (own Orgo app, `kit` database, custom domain) is tracked in `openspec/changes/migrate-production-to-azure/` and will be re-evaluated after the Preview has been tested. Do not reuse Preview `DATABASE_URL` or Orgo credentials for Production. There is no `db:seed:production` script.

## Testing

See [docs/testing.md](docs/testing.md). Short version:

```bash
npm run db:start
npm run test:run           # unit + SQL-integration; fails if scout_toolkit_test is down
npx playwright test        # default: Chromium (+ Mobile Chrome when you touch layout)
npx playwright test --project=pwa   # installable app: builds for production first, so it takes longer
```

To try the installable app by hand, build for production with `FEATURES=pwa` and open it on `localhost` (the worker is not registered under `npm run dev`); how to switch it on or off for the hosted Preview, and the rollback, are in [docs/deployment.md](docs/deployment.md#feature-flags-features).

SQL-integration tests use only `postgresql://test_user:test_password@localhost:5432/scout_toolkit_test`. CI uses workflow Postgres (`.github/workflows/test.yml`). `/api/e2e/session` only answers when `E2E_LOGIN=1` and `NODE_ENV` is not `production` (Playwright and CI set it); it is 404 on Preview and Production.

## Main routes

| Path | Who |
|---|---|
| `/` → `/home` | Everyone |
| `/activities`, `/activities/[id]` | Everyone |
| `/atividades/propor`, `/atividades/minhas` | Signed-in leaders |
| `/programs`, `/programs/[id]` | Owner (public programs also in the gallery) |
| `/programs/public` | Everyone |
| `/admin`, `/admin/atividades`, `/admin/taxonomias`, `/admin/utilizadores`, `/admin/sugestoes`, `/admin/reportes`, `/admin/utilizacao` | Effective admin |
| `/auth/signin` | Guests |
| `/api/docs` | OpenAPI / Swagger |

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Next.js dev server (Turbopack) |
| `npm run build` | Production build; also runs the hosted schema step when `ENSURE_HOSTED_DB=1` |
| `npm run start` | Serve the production build |
| `npm run lint` / `npm run format` | ESLint / Prettier |
| `npm run typecheck` | `tsc --noEmit` over app and tests |
| `npm run test:run` / `npm run test:e2e` | Vitest once / Playwright |
| `npm run setup:db` | Docker + schema push + seed |
| `npm run db:generate` / `npm run db:migrate` | Create / apply committed migrations |
| `npm run db:push` | Apply Drizzle schema to a local throwaway `DATABASE_URL` |
| `npm run db:seed` | Seed taxonomies and demo activities |
| `npm run playwright:install` | This project’s Chromium (PDF + Playwright) |

## Documentation

- [Deployment](docs/deployment.md) — Azure setup, env names, Orgo callbacks, rollback
- [Infrastructure](infra/README.md) — Bicep, Key Vault secrets, OIDC for GitHub
- [Testing](docs/testing.md) — unit / SQL-integration / e2e
- [Architecture](docs/architecture.md)
- [API](docs/api.md) — also `/api/docs` while the app is running
- [Planning](docs/planning.md) — epic log (OpenSpec is the working spec)
- [Brand](docs/brand-guidelines.md)

## Moving the repository

This README and the app do not depend on the GitHub owner name. When the repository moves (for example to the AEP organisation), these are the places that are tied to the old location:

1. **Remote**: `git remote set-url origin <new-url>`, then push all branches and tags. Update open clones.
2. **`devlog/`**: the header and footer links in `devlog/src/components/Header.astro` and `Footer.astro` point to the old GitHub URL, and `.github/workflows/deploy-devlog.yml` publishes from this repository.
3. **Generated API docs** in `docs/api/` embed source links to the old URL; regenerate with `npm run docs` after the move.
4. **GitHub Actions**: re-create repository secrets and variables (`AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`, and any others the workflows read). The Azure **OIDC federated credential** is bound to the repository name and branch, so it must be recreated for the new repository (see `infra/README.md`).
5. **Branch protection and required checks** (`.github/workflows/test.yml`) and the default branch name (`master`).
6. **Orgo**: redirect URLs depend on the hosting domain, not the repository, so they stay as they are unless the domain changes.
7. **Contributors and ownership**: add the new owners, review who can read Actions secrets, and add a `LICENSE` (none exists yet).

## Stack

Next.js 15, React 19, TypeScript, Tailwind + shadcn/ui, Drizzle ORM, Auth.js, TanStack Query, Playwright, Vitest. Hosted on Azure (App Service, PostgreSQL, Blob Storage, Key Vault, Container Registry). Specs and planning use OpenSpec.

## License

No license file is in the repository yet.
