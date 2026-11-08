# Testing

A green `npm run test:run` means the same thing every time: unit tests passed, SQL-integration tests ran against a disposable local database, and nothing wrote to a hosted database.

## Kinds

| Kind | What it proves | Database | File names |
|---|---|---|---|
| **Unit** | Logic, components, and route status codes with mocks | None | `tests/unit/**/*.test.ts` |
| **SQL-integration** | Route + real Postgres (insert, FK 409, truncate) | `scout_toolkit_test` only | `tests/integration/**/*.integration.test.ts` or other files that call `requireLocalTestDatabase` |
| **E2E** | A browser can finish a user path | App `DATABASE_URL` (`scout_toolkit_dev` locally) | `tests/e2e/**/*.spec.ts` |

A test that mocks `@/lib/db/server` is a unit test, even if it imports a route handler. A test that inserts or truncates is SQL-integration and must use:

`postgresql://test_user:test_password@localhost:5432/scout_toolkit_test`

Never point those tests at a hosted database or `.env.local`.

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

Schema for the test database is created in `tests/setup.ts` (`CREATE TABLE IF NOT EXISTS`). Do not run that against a hosted database.

## Commands

```bash
npm run db:start
npm run test:run
npx playwright test
npx playwright test --project="Mobile Chrome"
npm run test:coverage
```

Install this project's Chromium with `npm run playwright:install` (PDF export and Playwright share it).

## Reference data (Matriz objectives)

`npm run db:load-reference` loads the Matriz Progresso Pessoal from the committed `drizzle/seeds/data/progress-matrix.json` into whatever `DATABASE_URL` points at. `db:seed`, the deploy step (`ensure-hosted-db`) and the Playwright global setup run it too, so every environment starts with the same 6 areas, 20 educational paths, 40 general objectives, 174 specific objectives, 7 challenge types, 112 *desafios* and 286 links. Run it twice and the second run changes nothing.

To regenerate the dataset (only when the Matriz changes), put the workbook and the Regulamento PDF under the git-ignored `data/` folder and run `npx tsx scripts/build-progress-matrix.ts data/<workbook>.xlsx data/<regulamento>.pdf`. It needs `pdftotext` (poppler) on the machine and writes `progress-matrix.json` plus `progress-matrix.report.json` (differences between the two sources).

## Loading the activities baseline

`scripts/load-baseline-activities.ts` loads an exported snapshot of the curated activities sheet (the `atividades` tab, CSV or XLSX) into the catalogue. The snapshot lives under `data/`, which is git-ignored: some sources in the sheet are copyrighted, so it is never committed.

```bash
# plan and report only; reads taxonomies, writes nothing but the JSON report
npm run db:load-baseline -- data/atividades.csv --dry-run

# add ~200 activities (balanced by source and section, repeatable with --seed)
npm run db:load-baseline -- data/atividades.csv --limit 200

# replace the whole catalogue (refuses while programs use activities, unless --force)
npm run db:load-baseline -- data/atividades.csv --replace
```

The script refuses any `DATABASE_URL` that is not `localhost`/`127.0.0.1`. Without `--dry-run` it changes data, so run it deliberately.

To load a snapshot into the test database, point `DATABASE_URL` at `scout_toolkit_test` for that one command:

```bash
DATABASE_URL=postgresql://test_user:test_password@localhost:5432/scout_toolkit_test npm run db:load-baseline -- data/atividades.csv
```

Activity types and SDGs must already exist (the loader never creates taxonomies). Cells with several values (`Grupo`, `Local`, `Tipo`, `Divisão`) become lists. The automated tests use a small synthetic sample, `tests/fixtures/baseline-sample.csv`.
