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
UPLOADTHING_SECRET=
UPLOADTHING_APP_ID=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_UPLOADTHING_URL=https://uploadthing.com
```

There is no Google OAuth. `ENABLE_USER_GENERATED_CONTENT` / `ENABLE_EDIT_SUGGESTIONS` feature flags are not used — those features are always on.

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

Schema is **push**, not a migrations folder. `npm run db:migrate` is not the supported local path. After `npm run db:reset`, run `db:push` and `db:seed` again.

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

- `drizzle-kit push --force` against that environment’s `DATABASE_URL`
- `npm run db:seed` only if `activities` is empty

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

GitHub Actions (`.github/workflows/test.yml`) runs on `main` and `master`: workflow Postgres, `drizzle-kit push`, `npm run test:run`, Playwright Chromium. It does not deploy and does not write to Preview or Production.

## Health

`GET /api/health` reports process liveness. It is not a substitute for checking Neon or Orgo.

## Troubleshooting

**Not admin on Preview** — Confirm `ADMIN_EMAILS` on the Preview scope, redeploy so the running build sees it, then sign out and sign in on the Preview host. Promotion does not run on refresh. Preview uses its own Neon; changing a leftover local Neon URL does not help.

**Vercel login page** — Deployment Protection, not Kit. Continue with Vercel, then use **Entrar com o eAEP**.

**Orgo callback error** — The Redirect URL on that Orgo app must match the host you opened, path `/api/auth/callback/orgo`.

**Empty catalogue on a new Preview** — The build seeds only when `activities` is empty. If push failed, check the Vercel build log for `ensure-hosted-db`.

**PDF export fails locally** — `npm run playwright:install` (this repo’s Playwright, not a global CLI).
