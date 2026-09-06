## Why

A green test run does not mean the same thing twice. SQL integration files skip when `scout_toolkit_test` is down, newer “integration” tests only mock `db`, and no CI job runs Vitest or Playwright. Epic 12 was a generic 90% / visual-regression template; the real gap is a single local / preview / prod strategy.

## What Changes

- Define three test kinds: unit (mocks), SQL-integration (real Postgres, truncate), e2e (browser against the app DB)
- Require `scout_toolkit_test` for any test that inserts or truncates; fail the suite if that DB is missing instead of skipping
- Add `scout_toolkit_test` + `test_user` to local Docker next to `scout_toolkit_dev`
- Convert the high-value mocked Epic 8–11 API cases to real SQL
- Add a CI job: Postgres service + `npm run test:run` + Playwright Chromium
- Document the strategy in `docs/testing.md` and rewrite Epic 12 in `docs/planning.md`
- Do **not** add 90% coverage gates, visual regression, preview/prod write tests, or a11y/perf E2E (those stay Epic 13)

## Capabilities

### New Capabilities

- `testing-strategy`: How unit, SQL-integration, and e2e tests run on local, preview, and production — and what they may touch

### Modified Capabilities

- (none)

## Impact

- Infra: `docker-compose.yml` init, `tests/helpers/local-test-db.ts`, `openspec/config.yaml` context
- Tests: rename mocked `*.integration.test.ts` files; add real SQL cases for copy, last-admin, taxonomy 409, unapproved 404
- CI: new GitHub Actions workflow (none of the existing workflows run tests)
- Docs: `docs/testing.md`, Epic 12 stories 12.1–12.3
- Unchanged: product UI, `/api/e2e/session` production 404, Neon as preview/prod only
