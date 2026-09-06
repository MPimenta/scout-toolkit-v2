## Context

Kit de Atividades already has three test runners that disagree:

- Vitest unit files mock `@/lib/db/server` and pass without Postgres
- Older SQL files (`activities-filters`, `programs-crud`, …) call `shouldSkipLocalTestDatabase()` and skip when `scout_toolkit_test` is down
- Newer Epic 8–11 files are named `*.integration.test.ts` but only mock `db`
- Playwright hits `npm run dev` and whatever `DATABASE_URL` is in `.env.local` (often Neon)
- `.github/workflows/` has no test job
- `docker-compose.yml` only creates `scout_toolkit_dev` as `postgres` / `password`

Epic 12 in `docs/planning.md` still asks for 90% coverage, visual regression, and Swagger. `/api/docs` already exists. A11y and Lighthouse belong in Epic 13.

## Goals / Non-Goals

**Goals:**

- One meaning for a green suite: unit + SQL-integration + Chromium e2e on local/CI
- Disposable SQL only on `scout_toolkit_test`; never Neon
- Fail `test:run` if that DB is missing
- Dual local databases via Compose
- CI Postgres + Vitest + Playwright Chromium
- Short `docs/testing.md` and a rewritten Epic 12

**Non-Goals:**

- 90% coverage threshold or visual regression
- Preview/prod Playwright write jobs
- Applying Neon schema for the live app
- Converting every mocked test to SQL (only the high-value Epic 8–11 cases)
- Changing `/api/e2e/session` production 404
- A11y, Lighthouse, or mobile-matrix-on-every-CI

## Decisions

1. **Fail, do not skip** when `scout_toolkit_test` is down. Skipping made 346 passed / 49 skipped look like a full run. Implementation: SQL-integration files stop using `describe.skipIf(shouldSkipLocalTestDatabase())`. A helper throws or the suite fails at setup if the probe returns false.

2. **Two local databases, one Compose file.** Keep `scout_toolkit_dev` for the app and Playwright. Add an init script under `drizzle/init/` that `CREATE DATABASE scout_toolkit_test` and `CREATE USER test_user`. Do not point `DATABASE_URL` at the test DB.

3. **Rename mocked “integration” files** to `*.test.ts` under `tests/unit/` (or keep path but drop `.integration.`). Convert copy, last-admin, taxonomy 409, and unapproved 404 to real SQL against `scout_toolkit_test`.

4. **CI is the local gate.** GitHub Actions: Postgres 15 service, create test DB/user, `npm run test:run`, `npx playwright test --project=chromium`. Full browser/mobile matrix stays local.

5. **Preview/prod are documentation + existing 404.** Spec records the rule; this change does not add remote smoke jobs.

6. **Capability is infra, not product UI.** `testing-strategy` describes how tests run. Portuguese product copy is unchanged.

## Risks / Trade-offs

- [Developers without Docker cannot get a green `test:run`] → Document `npm run db:start` + init; CI still gates PRs
- [Init scripts only run on an empty volume] → Document recreate (`db:reset`) or a one-shot SQL snippet for existing volumes
- [Playwright on CI needs Chromium + a running Next app] → Use Playwright `webServer` as today; give the job enough timeout
- [Converting only four SQL cases leaves many mocked files] → Acceptable; naming fix stops them counting as SQL coverage

## Migration Plan

1. Compose init + helper fail-fast
2. Rename mocked files; add four SQL-integration cases
3. `docs/testing.md` + `openspec/config.yaml` context (no more “skip when down”)
4. CI workflow
5. Rewrite Epic 12 stories in planning

## Open Questions

- None. Preview smoke jobs are optional later and out of this change.
