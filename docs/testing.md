# Testing

A green `npm run test:run` means the same thing every time: unit tests passed, SQL-integration tests ran against a disposable local database, and nothing wrote to Neon.

## Kinds

| Kind | What it proves | Database | File names |
|---|---|---|---|
| **Unit** | Logic, components, and route status codes with mocks | None | `tests/unit/**/*.test.ts` |
| **SQL-integration** | Route + real Postgres (insert, FK 409, truncate) | `scout_toolkit_test` only | `tests/integration/**/*.integration.test.ts` or other files that call `requireLocalTestDatabase` |
| **E2E** | A browser can finish a user path | App `DATABASE_URL` (`scout_toolkit_dev` locally) | `tests/e2e/**/*.spec.ts` |

A test that mocks `@/lib/db/server` is a unit test, even if it imports a route handler. A test that inserts or truncates is SQL-integration and must use:

`postgresql://test_user:test_password@localhost:5432/scout_toolkit_test`

Never point those tests at Neon or `.env.local`.

## Environments

| Environment | What runs | Writes |
|---|---|---|
| **Local + CI** | Unit, SQL-integration, Playwright Chromium (mobile projects when you touch layout) | Test DB + local app DB |
| **Preview** | Optional read-mostly smoke | No truncate |
| **Production** | No automated write tests | `/api/e2e/session` returns 404 |

## Local databases

`npm run db:start` should give you both:

- `scout_toolkit_dev` — app and Playwright (`DATABASE_URL` in `.env.local`)
- `scout_toolkit_test` — Vitest SQL-integration (`test_user` / `test_password`)

Init scripts (`drizzle/init/*.sql`) run only on an empty Docker volume. If the container already exists without the test database, run `npm run db:reset` or create them by hand:

```sql
CREATE USER test_user WITH PASSWORD 'test_password';
CREATE DATABASE scout_toolkit_test OWNER test_user;
```

`npm run test:run` **fails** if `scout_toolkit_test` is unreachable. It does not skip SQL files and look green.

Schema for the test database is created in `tests/setup.ts` (`CREATE TABLE IF NOT EXISTS`). Do not run that against Neon.

## Commands

```bash
npm run db:start
npm run test:run
npx playwright test
npx playwright test --project="Mobile Chrome"
npm run test:coverage
```

Install this project's Chromium with `npm run playwright:install` (PDF export and Playwright share it).
