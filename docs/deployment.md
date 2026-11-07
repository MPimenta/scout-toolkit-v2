# Deployment

Kit de Atividades runs locally on Docker Postgres and on Vercel with Neon. Chrome defaults to Portuguese; English is a header cookie (`kit-locale`), not `/pt` or `/en` URLs. Auth is eAEP/Orgo, not Google.

The root [README](../README.md) has the short path. This page is the hosted checklist.

## Environments

| Environment | Database | Who sets env | Schema / seed |
|---|---|---|---|
| Local | Docker `scout_toolkit_dev` | `.env.local` | `npm run db:push` then `npm run db:seed` (or `npm run setup:db`) |
| Vitest SQL | Docker `scout_toolkit_test` | hardcoded DSN in tests | `tests/setup.ts` — never Neon |
| Preview | Dedicated Neon | Vercel **Preview** scope | `scripts/ensure-hosted-db.mjs` on Vercel builds |
| Production | A **second** Neon | Vercel **Production** scope | Same build hook; not fully configured yet |

Do **not** add a `.env.preview` file. Next.js never loads it. Do not point `npm run test:run` or Playwright at Neon.

## Azure (moving from Vercel and Neon)

The hosting is moving to Azure App Service with the AEP's PostgreSQL server (openspec `migrate-hosting-to-azure`). Until the cutover is done, Vercel and Neon described below stay in use. What is in place for the move:

- `Dockerfile` builds the app (Next.js standalone, with the Chromium that PDF export needs). Build it with `docker build -t kit-de-atividades .`.
- `infra/` describes the Azure resources (Bicep) and the database, Key Vault and deploy-identity steps; see `infra/README.md`.
- `.github/workflows/deploy.yml` builds the image, applies migrations, switches the Web App image and checks `/api/health`; `.github/workflows/usage-purge.yml` replaces the Vercel cron.
- `scripts/ensure-hosted-db.mjs` runs when `ENSURE_HOSTED_DB=1` (or on Vercel until it is retired).
- CI uses PostgreSQL 16, the version of the shared server. The local `docker-compose` database stays on 17 so existing data volumes keep working.

## Required environment variables

Copy names from `.env.example`. Values for hosted deploys stay in the Vercel dashboard.

```env
DATABASE_URL=
NEXTAUTH_SECRET=
AUTH_SECRET=                    # same value as NEXTAUTH_SECRET
NEXTAUTH_URL=                   # local only: http://localhost:3000
AUTH_TRUST_HOST=true            # required on Preview (unique hosts)
ORGO_ISSUER=https://eaep.escoteiros.pt
ORGO_CLIENT_ID=
ORGO_CLIENT_SECRET=
ORGO_API_TOKEN=                 # optional; program → eAEP event
ADMIN_EMAILS=                   # comma-separated; promote on Orgo sign-in
NEXT_PUBLIC_APP_URL=
FEATURES=                       # non-MVP features to switch on; unset = all off
CRON_SECRET=                    # bearer secret for the daily usage purge cron (flag usage-tracking)
# E2E_LOGIN=1                   # test-only login; local Playwright/CI only, never on Vercel
```

There is no Google OAuth. The old `ENABLE_USER_GENERATED_CONTENT` / `ENABLE_EDIT_SUGGESTIONS` variables are not used.

### Feature flags (`FEATURES`)

Non-MVP features are off unless `FEATURES` lists them (comma-separated, or `all`). Off means hidden, not deleted: menu entries and buttons disappear, pages show the 404 page, APIs answer 404, and the data stays. See `src/lib/features.ts` for the exact routes.

| Flag | Covers |
| --- | --- |
| `english-locale` | PT/EN switcher (off: Portuguese only) |
| `public-programs` | Public gallery, "use as template", the public toggle |
| `activity-proposals` | Propor atividade, As minhas propostas |
| `edit-suggestions` | Suggestions, notifications, admin suggestion queue |
| `review-discussion` | Votes, reactions, replies on reviews (stars + comment stay) |
| `activities-table-view` | Mosaicos/Tabela toggle |
| `admin-taxonomies` | Admin taxonomy pages |
| `api-docs` | Swagger UI, OpenAPI JSON, `/api/metrics` |
| `issue-reports` | Reportar button and the admin report queue |
| `usage-tracking` | Records searches, activity views and additions to programs (anonymous visitor id; 13-month retention). `/privacy` explains it; `vercel.json` runs the daily purge at `/api/usage/purge`. Keep it off in Production until the AEP has confirmed the privacy wording. |

Leave `FEATURES` unset on Preview and Production for the MVP. Changing it on Vercel needs a redeploy. CI runs the full suite with `FEATURES=all`.

`ORGO_API_TOKEN` is minted in eAEP: **Settings → Developers → API Tokens** (at least `HR_LOCAL`). It never goes to the browser.

## Local

```bash
npm install
npm run setup:db
```

That creates `.env.local` if missing, starts Compose, runs `drizzle-kit push`, and seeds. Then set Orgo keys and `ADMIN_EMAILS` in `.env.local`.

Register on the **local** Orgo app:

```text
http://localhost:3000/api/auth/callback/orgo
```

```bash
npm run playwright:install
npm run dev
```

Locally, `npm run db:push` is fine for your own throwaway database. Schema changes that ship are **migrations**: `npm run db:generate`, review the SQL, and commit it (see README, "Changing the schema"). After `npm run db:reset`, run `db:push` and `db:seed` again.

`db:seed` writes taxonomies (SDGs, activity types, educational areas, group sizes, effort, locations, age groups) and demo activities. It uses whatever `DATABASE_URL` is in the environment. Locally that must be `scout_toolkit_dev`.

## Preview (Vercel + Neon)

1. Create a Neon project used only for Preview. Copy the **pooled** connection string.
2. In Vercel → Settings → Environment Variables, add the table above on the **Preview** scope only.
3. Do **not** set `NEXTAUTH_URL` on Preview. Set `AUTH_TRUST_HOST=true`.
4. Create a **Preview** Orgo OAuth app (one Redirect URL per app). Callback:

```text
https://<preview-host>/api/auth/callback/orgo
```

Prefer a stable alias (for example the git-branch host) over adding every unique `*.vercel.app` deployment URL.

5. Redeploy after changing env vars. `ADMIN_EMAILS` is read at sign-in; an existing deploy keeps the old value until you redeploy, then the user must **sign out and sign in**.

On Vercel, `npm run build` runs `scripts/ensure-hosted-db.mjs`:

- If the database has app tables but no migration history, it is compared with `0000_baseline`; a match is recorded as applied, a mismatch fails the deploy with the differences
- `drizzle-kit migrate` applies committed migrations not yet applied (never `push --force`)
- `npm run db:load-reference` on **every** deploy: loads the Matriz Progresso Pessoal (areas, educational paths, general and specific objectives, challenge types, *desafios* and their links). It is idempotent, only touches rows it owns (`is_managed`), and retires the old placeholder objectives
- `npm run db:seed` only if `activities` is empty (it also runs the reference loader)

A local `npm run build` skips that hook (`VERCEL` is unset). `/api/e2e/session` returns 404 on Preview because `NODE_ENV` is `production`.

This project’s **Production Branch is still `master`**. Pushing `master` creates a Production deploy and can steal the `git-master` Preview alias. Change **Settings → Git → Production Branch** to `main` before treating `master` as Preview-only.

## Production

Not fully set up. When you launch it:

1. A second Neon project (not Preview, not Docker).
2. The same variable names, scoped to **Production**.
3. A third Orgo app whose Redirect URL is `https://<production-host>/api/auth/callback/orgo`.
4. New `NEXTAUTH_SECRET` (do not reuse the local or Preview secret).
5. Redeploy Production after saving vars.

There is no `db:seed:production` script. The first Production build seeds if the catalogue is empty. Do not run seed against a database that already has real activities unless you intend to insert the demo set again.

## Orgo checklist

| App | Redirect URL |
|---|---|
| Local | `http://localhost:3000/api/auth/callback/orgo` |
| Preview | `https://<preview-host>/api/auth/callback/orgo` |
| Production | `https://<production-host>/api/auth/callback/orgo` |

Same `ORGO_ISSUER`. Different client id and secret per app.

## CI

GitHub Actions (`.github/workflows/test.yml`) runs on `main` and `master`: workflow Postgres 17, `npm run typecheck`, `npm run test:run`, Playwright Chromium against `scout_toolkit_e2e` (its global setup pushes the schema and seeds). It does not deploy and does not write to Preview or Production.

## Health

`GET /api/health` reports process liveness. It is not a substitute for checking Neon or Orgo.

## Troubleshooting

**Not admin on Preview** — Confirm `ADMIN_EMAILS` on the Preview scope, redeploy so the running build sees it, then sign out and sign in on the Preview host. Promotion does not run on refresh. Preview uses its own Neon; changing a leftover local Neon URL does not help.

**Vercel login page** — Deployment Protection, not Kit. Continue with Vercel, then use **Entrar com o eAEP**.

**Orgo callback error** — The Redirect URL on that Orgo app must match the host you opened, path `/api/auth/callback/orgo`.

**Empty catalogue on a new Preview** — The build seeds only when `activities` is empty. If the schema step failed, check the Vercel build log for `ensure-hosted-db` (a baseline mismatch lists the differing columns).

**PDF export fails locally** — `npm run playwright:install` (this repo’s Playwright, not a global CLI).

## Dependencies and security

- Run `npm audit --omit=dev` before a release. The target is no critical or high advisory in production dependencies.
- `package.json` `overrides` pin a patched transitive package inside their current majors:
  - `postcss` `^8.5.32` under `next`: Next 15.5 bundles PostCSS 8.4.31, which has several advisories. Next 16 removes the need for this override.
  - Remove each override once the parent package ships the fix.
- `xlsx` (SheetJS) is installed from SheetJS's own CDN (`https://cdn.sheetjs.com/xlsx-<version>/xlsx-<version>.tgz`). The npm registry copy stopped at 0.18.5 and has unfixed advisories. Dependabot cannot update a tarball URL, so check https://docs.sheetjs.com/docs/getting-started/installation/nodejs and bump it by hand.
- Major upgrades (Next 16, Tailwind 4, Vitest 5, ESLint 10, TypeScript 7) are planned separately; Dependabot ignores them (`.github/dependabot.yml`).
