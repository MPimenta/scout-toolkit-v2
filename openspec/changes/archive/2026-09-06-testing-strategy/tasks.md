## 1. Kinds and naming

- [x] 1.1 Add `docs/testing.md` describing unit / SQL-integration / e2e and local vs preview vs prod write rights
- [x] 1.2 Update `openspec/config.yaml` context so SQL-integration fails when `scout_toolkit_test` is down (no skip-and-look-green)
- [x] 1.3 Rename mocked Epic 8–11 `*.integration.test.ts` files so they are unit tests, and verify `npm run test:run` still collects them

## 2. Local dual database

- [x] 2.1 Extend Docker Compose init so `scout_toolkit_test` and `test_user` / `test_password` exist beside `scout_toolkit_dev`
- [x] 2.2 Make SQL-integration setup fail `npm run test:run` when `scout_toolkit_test` is unreachable, and verify a down-DB run is non-zero
- [x] 2.3 Convert copy, last-admin, taxonomy 409, and unapproved-404 cases to real SQL on `scout_toolkit_test` only

## 3. CI gate

- [x] 3.1 Add a GitHub Actions workflow: Postgres service, create the test DB/user, `npm run test:run`, Playwright Chromium
- [x] 3.2 Keep Firefox / WebKit / mobile projects off the default CI matrix, and verify the workflow file does not call preview or prod URLs

## 4. Planning

- [x] 4.1 Rewrite Epic 12.1–12.3 in `docs/planning.md` to this change; mark 12.4 API docs completed
