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
npx playwright test --project=pwa    # the installable app, on a production build
npm run test:coverage
```

### The `pwa` project

Service workers do not run under the dev server, so the `pwa` project builds the app (`next build`, into `.next-e2e-pwa`) and serves it on its own port (3202) with `FEATURES=pwa` and the e2e database. The first run takes a few minutes for the build. It checks the manifest and head, that Chromium reports no installability errors, that the worker controls the page, the offline page (and that retry returns to the page), that a signed-in browse leaves no `/api/`, `/auth/` or page document in any cache, and that signing out deletes the worker's caches. A production build has no test login, so this project signs in by writing a session row straight into `scout_toolkit_e2e` (`tests/e2e/helpers/db-session.ts`). The `mvp` project has a matching check that with the flag off there is no manifest, no registered worker, and `/sw.js` is the self-unregistering one. The phone-layout checks for the installed app (safe areas, back control, exports) are in `tests/e2e/mobile/standalone.spec.ts`, which emulates standalone mode and runs with the other Chromium specs.

Install this project's Chromium with `npm run playwright:install` (PDF export and Playwright share it).

## Reference data (Matriz objectives)

`npm run db:load-reference` loads the Matriz Progresso Pessoal from the committed `drizzle/seeds/data/progress-matrix.json` into whatever `DATABASE_URL` points at. `db:seed`, the deploy step (`ensure-hosted-db`) and the Playwright global setup run it too, so every environment starts with the same 6 areas, 20 educational paths, 40 general objectives, 174 specific objectives, 7 challenge types, 112 *desafios* (with their short title and the divisions for which each is mandatory for integration) and 287 links, plus the 8 activity formats, the 10 focuses and the 36 sources (the 31 of the sheet with their priority, plus the 5 that activities name but the `fontes` tab lacks). It also puts each ODS on its own icon and gives activities that still carry the former types a format and a focus (`format-focus-backfill`). Run it twice and the second run changes nothing.

The curated Google Sheet is the definitive reference. To regenerate the datasets (only when the sheet or the Matriz changes), export the sheet (File > Download > Microsoft Excel) to the git-ignored `data/` folder, then:

```bash
# objectives, desafios (short title, integration, matrix v1.1 links)
npx tsx scripts/build-progress-matrix.ts data/<workbook>.xlsx data/<regulamento>.pdf data/atividades.xlsx
# formats, focuses; checks the source priorities
npx tsx scripts/build-reference-values.ts data/atividades.xlsx
```

The first needs `pdftotext` (poppler) on the machine and writes `progress-matrix.json` plus `progress-matrix.report.json` (the objectives tab must have exactly the dataset's codes; it lists the *desafios* whose v1.0 and v1.1 links differ, and the differences with the Regulamento, which are known and not open items: the workbook wins).

## Loading the activities baseline

`scripts/load-baseline-activities.ts` loads an exported snapshot of the curated activities sheet (the `atividades` tab, XLSX or CSV) into the catalogue. Every row carries a sheet id (`ATV-0001`): the load creates the missing activities, updates the ones whose content changed and leaves the rest alone, so a second run changes nothing. Activities made in the app (no sheet id) are never touched. The snapshot lives under `data/`, which is git-ignored: some sources in the sheet are copyrighted, so it is never committed.

```bash
# plan and report only; reads taxonomies, writes nothing but the JSON report
npm run db:load-baseline -- data/atividades.xlsx --dry-run

# load every row; the sheet's Publicada cell decides the approval (all rows are FALSE today)
npm run db:load-baseline -- data/atividades.xlsx

# load every row and mark them approved, to see the whole set in a local catalogue
npm run db:load-baseline -- data/atividades.xlsx --approve-all

# a sample instead of every row (balanced by source and section, repeatable with --seed)
npm run db:load-baseline -- data/atividades.xlsx --limit 200

# replace the whole catalogue (refuses while programs use activities, unless --force)
npm run db:load-baseline -- data/atividades.xlsx --replace --approve-all
```

The script refuses any `DATABASE_URL` that is not `localhost`/`127.0.0.1`. Without `--dry-run` it changes data, so run it deliberately.

To load a snapshot into the test database, point `DATABASE_URL` at `scout_toolkit_test` for that one command:

```bash
DATABASE_URL=postgresql://test_user:test_password@localhost:5432/scout_toolkit_test npm run db:load-baseline -- data/atividades.xlsx --approve-all
```

Run `npm run db:load-reference` first: formats, focuses, SDGs, sources, objectives and *desafios* must already exist (the loader never creates reference values; an unknown value is dropped and listed in the report with its row, column and sheet id). Cells with several values (`Grupo`, `Local`, `Divisão`) become lists; `Formato`, `Foco` and `Foco secundário` are single values. The blocks written for Dirigentes are ignored on purpose (Dirigentes have no objectives). The report also counts the sheet's review fields (`estado`, `confianca`, `variantes`), which are not stored. The automated tests use a small synthetic sample, `tests/fixtures/baseline-sample.csv`.
