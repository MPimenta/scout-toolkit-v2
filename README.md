# Kit de Atividades

Web app for Escoteiros de Portugal leaders: browse activities, build session programs, and manage catalogue content. Built with Next.js 15, TypeScript, and PostgreSQL.

The product name stays **Kit de Atividades**. Chrome defaults to Portuguese; English is a header switcher (cookie `kit-locale`). There are no `/pt` or `/en` URLs.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?style=flat-square&logo=postgresql)](https://www.postgresql.org/)

## What is implemented

- **Activity catalogue** — search, filters, table view, and activity detail
- **Program builder** — create and edit schedules (drag-and-drop on desktop; move up/down on phone)
- **Public programs** — gallery of programs marked public, plus copy as a template
- **Export** — program Excel (`.xlsx`) and PDF (Playwright Chromium)
- **Ratings and discussion** — one review per user, votes, reactions, and replies
- **Propose and suggest** — leaders can propose activities and suggest edits; admins approve
- **Issue reports** — floating **Reportar** / **Report** on every page (guests allowed)
- **eAEP login** — Orgo OAuth (`Entrar com o eAEP`), not Google
- **Admin** — dashboard, activities, taxonomies, users, suggestion queue, issue-report queue
- **View as member** — admins can hide admin chrome without changing their stored role
- **Orgo event** — owner can create the program as an eAEP event (`ORGO_API_TOKEN`, server-only)
- **Mobile layout** — hamburger, stacked catalogue, phone-sized builder
- **Hosted Preview** — Vercel Preview with its own Neon database; schema and first seed run on deploy

Not implemented (do not treat these as shipped):

- Admin Excel **import** of activities (OpenSpec only)
- Production Neon + Production Orgo app (Preview is the hosted environment today)
- Email / SMTP notifications (in-app only)

Working specs live in `openspec/specs/`. The epic log is `docs/planning.md`.

## Quick start (local)

### Prerequisites

- Node.js 24 LTS (pinned in `.nvmrc`; `engines` allows 22.12+). Use a version manager that reads `.nvmrc`, such as [fnm](https://github.com/Schniz/fnm) (`fnm use`) or [Volta](https://volta.sh/). Nodist is unmaintained and does not read `.nvmrc`.
- Docker Desktop (Compose)
- An eAEP / Orgo OAuth app (for sign-in)
- UploadThing keys (only needed to upload images)
- Playwright Chromium (PDF export and e2e). `npm install` fetches it automatically; run `npm run playwright:install` if it is missing.

Feature flags: non-MVP features are off unless `FEATURES` lists them (e.g. `FEATURES=all` locally to see everything). See `docs/deployment.md`, "Feature flags".

Hosting: set the Vercel project's Node.js version to **24.x** (Project → Settings → Build and Deployment). This is a dashboard setting, not in the repo.

### Install and seed

```bash
git clone https://github.com/MPimenta/scout-toolkit-v2.git
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

Schema is applied with **push**, not a migrations folder. `npm run db:migrate` is not the local path.

```bash
npm run setup:env          # create .env.local if missing
npm run db:start           # docker compose up -d
npm run db:push            # drizzle-kit push
npm run db:seed            # taxonomies + demo activities
npm run db:studio          # Drizzle Studio
npm run db:stop
npm run db:reset           # wipe the Docker volume, then start again (re-run db:push + db:seed)
```

Upgrading from an older checkout: the local image is now Postgres 17 (assumed to match Neon; confirm with `select version()` on the Neon database and change the image if it differs), and Compose creates `scout_toolkit_e2e`. An existing Postgres 15 volume will not start on 17, so run `npm run db:reset` once (or `pg_dump` your dev data first and restore it after), then `npm run db:push` and `npm run db:seed`.

`db:seed` reads `DATABASE_URL` from `.env.local`. Point it only at `scout_toolkit_dev` locally. Never seed `scout_toolkit_test` this way, and never point `npm run test:run` at Neon.

## Deploying (Vercel + Neon)

There is no `.env.preview` file. Next.js never loads one. Hosted values live in the Vercel dashboard.

`npm run build` on Vercel runs `scripts/ensure-hosted-db.mjs`: it applies the committed migrations in `drizzle/migrations/` (`drizzle-kit migrate`), then runs `db:seed` **only if** the `activities` table is empty. It never force-pushes the schema. A local `npm run build` skips that (no `VERCEL` env).

### Changing the schema

1. Edit `drizzle/schema/*`.
2. `npm run db:generate` creates a new SQL file in `drizzle/migrations/`.
3. Review the SQL (look for drops and renames), then commit it with the schema change.
4. Locally, `npm run db:push` or `npm run db:migrate` updates your dev database. Preview and Production apply the migration on their next deploy.

A hosted database created before migrations existed is checked against the baseline (`0000_baseline`) on its first deploy. If it matches, the baseline is recorded as applied; if not, the deploy fails and lists the differences.

### Preview

1. Create a Neon project used **only** for Preview (pooled URL).
2. In Vercel, set these on the **Preview** scope:

| Name | Notes |
|---|---|
| `DATABASE_URL` | Preview Neon, pooled |
| `NEXTAUTH_SECRET` / `AUTH_SECRET` | Same generated secret |
| `AUTH_TRUST_HOST` | `true` — do **not** set `NEXTAUTH_URL` (each Preview host differs) |
| `ORGO_ISSUER` | `https://eaep.escoteiros.pt` |
| `ORGO_CLIENT_ID` / `ORGO_CLIENT_SECRET` | **Preview** Orgo app |
| `ADMIN_EMAILS` | Comma-separated eAEP emails to promote on sign-in |
| `UPLOADTHING_SECRET` / `UPLOADTHING_APP_ID` | Image uploads |
| `ORGO_API_TOKEN` | Optional; program → eAEP event |

3. Register the Preview callback on that Orgo app:

```text
https://<preview-host>/api/auth/callback/orgo
```

A stable host such as `https://scout-toolkit-v2-git-master-aep5.vercel.app` is easier than adding a new callback for every unique `*.vercel.app` URL.

4. Redeploy after changing env vars. Promotion runs on the **next Orgo sign-in**, not on a page refresh.

This Vercel project’s **Production Branch is still `master`**. A `git push` to `master` creates a Production deploy. Preview and Production must not share Neon or Orgo apps.

### Production (not fully configured yet)

Production needs its own Neon, its own Orgo app, and the same variable names scoped to **Production**. Do not reuse Preview `DATABASE_URL`. After the first Production deploy, seed only if the catalogue is empty (the Vercel build already does that).

There is no `db:seed:production` script.

## Testing

See [docs/testing.md](docs/testing.md). Short version:

```bash
npm run db:start
npm run test:run           # unit + SQL-integration; fails if scout_toolkit_test is down
npx playwright test        # default: Chromium (+ Mobile Chrome when you touch layout)
```

SQL-integration tests use only `postgresql://test_user:test_password@localhost:5432/scout_toolkit_test`. CI uses workflow Postgres (`.github/workflows/test.yml`). `/api/e2e/session` only answers when `E2E_LOGIN=1` and `NODE_ENV` is not `production` (Playwright and CI set it); it is 404 on Preview and Production.

## Main routes

| Path | Who |
|---|---|
| `/` → `/home` | Everyone |
| `/activities`, `/activities/[id]` | Everyone |
| `/atividades/propor`, `/atividades/minhas` | Signed-in leaders |
| `/programs`, `/programs/[id]` | Owner (public programs also in the gallery) |
| `/programs/public` | Everyone |
| `/admin`, `/admin/atividades`, `/admin/taxonomias`, `/admin/utilizadores`, `/admin/sugestoes`, `/admin/reportes` | Effective admin |
| `/auth/signin` | Guests |
| `/api/docs` | OpenAPI / Swagger |

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Next.js dev server (Turbopack) |
| `npm run build` | Production build; on Vercel also push schema and seed if empty |
| `npm run start` | Serve the production build |
| `npm run lint` / `npm run format` | ESLint / Prettier |
| `npm run setup:db` | Docker + schema push + seed |
| `npm run db:push` | Apply Drizzle schema to `DATABASE_URL` |
| `npm run db:seed` | Seed taxonomies and demo activities |
| `npm run playwright:install` | This project’s Chromium (PDF + Playwright) |

## Documentation

- [Deployment](docs/deployment.md) — env names, Preview vs Production, Orgo callbacks
- [Testing](docs/testing.md) — unit / SQL-integration / e2e
- [Architecture](docs/architecture.md)
- [API](docs/api.md) — also `/api/docs` while the app is running
- [Planning](docs/planning.md) — epic log (OpenSpec is the working spec)
- [Brand](docs/brand-guidelines.md)

## Stack

Next.js 15, React 19, TypeScript, Tailwind + shadcn/ui, Drizzle ORM, Auth.js, TanStack Query, Playwright, Vitest.

## License

No license file is in the repository yet.
