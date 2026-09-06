## Why

The app runs locally on Docker Postgres. There is no hosted preview URL for a pull request or a stakeholder demo. `docs/deployment.md` describes a generic Vercel + Neon production story and still mentions Google OAuth. Testing strategy already forbids write tests against preview/prod and forbids a `.env.preview` file (Next.js never loads it). We need a real preview environment: Vercel Preview + its own Neon database + the same Orgo/UploadThing secrets the host stores.

## What Changes

- Connect the GitHub repo to a Vercel project so every PR (and `main`) gets a Preview or Production deployment
- Give Preview its own Neon database (branch or separate project), never `scout_toolkit_test` and never the local Docker volume
- Set Preview env vars in the Vercel dashboard (Preview scope), including `DATABASE_URL`, Auth.js URLs, Orgo OAuth, `ADMIN_EMAILS`, UploadThing — not a repo file named `.env.preview`
- Register the preview callback URLs on the Orgo OAuth app
- Apply schema to the preview database on deploy
- Keep `/api/e2e/session` 404 on Vercel (Preview builds use `NODE_ENV=production`)
- Do **not** add CI jobs that truncate or write through the preview URL

## Capabilities

### New Capabilities

- `preview-hosting`: How a hosted Preview is created, what it may touch, and how it differs from local and production

### Modified Capabilities

- (none)

## Impact

- Infra: Vercel project, Neon preview DB, Orgo OAuth redirect allow-list
- Docs: rewrite the Preview section of `docs/deployment.md` (drop Google-as-primary-auth)
- CI: unchanged default gate (local Postgres + Chromium). No preview write workflow
- Unchanged: `docs/testing.md` kinds; no `.env.preview`; no production write tests
