## 1. Development environment

- [x] 1.1 Add `.nvmrc` (24) and `engines` to `package.json`, and README guidance (fnm/Volta, Vercel Node 24.x as a manual step); verify `node -e "process.exit(Number(process.versions.node.split('.')[0] < 22))"` passes under the pinned version
- [x] 1.2 Add a `postinstall` that installs Playwright Chromium unless `CI`/`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` is set, and align the `playwright` and `@playwright/test` versions; verify `npx playwright test --list` runs and Chromium launches without the Edge fallback
- [x] 1.3 Add `typecheck` (`tsc --noEmit`) with `vitest/globals` in `tsconfig.json` and fix the remaining test-file type errors; verify `npm run typecheck` exits 0
- [x] 1.4 Docker: read the Neon major version (default 17), set the `postgres` image to it, remove `version:`, and create `scout_toolkit_e2e` in `drizzle/init`; verify after `npm run db:reset` that `psql -l` lists dev, test, and e2e databases
- [x] 1.5 Point Playwright web servers at `scout_toolkit_e2e`, with a global setup that pushes the schema and seeds; verify the suite runs and `scout_toolkit_dev` gains no "Proposta E2E" rows
- [x] 1.6 Add `.github/dependabot.yml` (npm weekly grouped minor/patch with listed majors ignored; github-actions monthly); verify the YAML validates against the Dependabot schema
- [x] 1.7 Update `.github/workflows/test.yml`: Node 24, the e2e database in the service, `E2E_LOGIN=1`, `FEATURES=all`, and the `typecheck` step; verify the workflow file parses (`actionlint` or a dry run) and lists the step

## 2. Dependencies

- [x] 2.1 Same-major bumps (next 15.5.x, next-auth beta, @auth/drizzle-adapter, drizzle-orm 0.45, drizzle-kit, zod, TanStack Query, Playwright, Radix, testing-library, pg, postgres, tsx, prettier, the rest at "Wanted") after reading the drizzle-orm 0.45 and next-auth release notes; verify lint, typecheck, `test:run`, and Playwright pass
- [x] 2.2 Replace `xlsx` 0.18.5 with the SheetJS CDN tarball; verify the Excel export unit/integration tests pass and a downloaded file opens with both sheets
- [x] 2.3 Remove unused `zustand`, `@types/better-sqlite3`, `@tailwindcss/postcss` after confirming no imports; verify `npm run build` succeeds
- [x] 2.4 Run `npm audit --omit=dev`; verify there are no critical/high advisories left except ones documented as unfixable within the current major (with reason in `docs/deployment.md`)

## 3. Safe schema deploys

- [x] 3.1 Un-ignore `drizzle/migrations/*.sql`, generate and commit the baseline migration from the current schema; verify `drizzle-kit migrate` on an empty database creates every table
- [x] 3.2 Rewrite `scripts/ensure-hosted-db.mjs`: compare existing tables/columns with the baseline (fail with a diff on mismatch), record the baseline when tables exist without migration rows, then `drizzle-kit migrate`, then seed if empty; verify against a local database in three states (empty, existing matching, drifted)
- [x] 3.3 Update README, `docs/deployment.md`, and CLAUDE.md for the generate → review → commit workflow; verify no doc still says the build runs `push --force`

## 4. API errors and test login

- [x] 4.1 Make the error serializer production-safe (no SQL, stack, or paths; generic message for unexpected errors; full error logged); verify a unit test with `NODE_ENV=production` and a Drizzle query error
- [x] 4.2 Move ad-hoc error bodies (`/api/programs*`, taxonomy routes, others found by `rg "error: '" src/app/api`) to `apiErrors.*`; verify `rg` finds no string-valued `error` responses and the API tests pass
- [x] 4.3 Gate `/api/e2e/session` on `E2E_LOGIN=1` and non-production, with `E2E_LOGIN=1` in Playwright and CI; verify integration tests for unset (404), set (200), and production (404)

## 5. Feature flags

- [x] 5.1 Add `src/lib/features.ts` (9 flag names, `FEATURES` parsing including `all`, `isFeatureEnabled`, `FEATURE_ROUTES`); verify unit tests for unset, single, `all`, and unknown names
- [x] 5.2 Make `src/middleware.ts` enforce `FEATURE_ROUTES` (pages → not-found, `/api/*` → 404 JSON); drop the `console.log` and the duplicate `/` redirect; verify a unit test that every listed prefix returns 404 when its flag is off
- [x] 5.3 Add a coverage test that enumerates `page.tsx`/`route.ts` files under flagged folders and fails if any is not covered by `FEATURE_ROUTES`; verify it fails when an entry is removed
- [x] 5.4 Guard method-specific endpoints in their handlers (`POST /api/activities`, `GET /api/activities/mine`, suggestion endpoints); verify SQL-integration tests on `scout_toolkit_test` (404 with the flag off, working with it on)
- [x] 5.5 Add `FeaturesProvider` and `useFeature`, fed from the root layout; verify a component test
- [x] 5.6 Hide flagged UI:
  - "Programas públicos" in the header and phone nav
  - Propor atividade and As minhas propostas
  - the Mosaicos/Tabela toggle
  - the suggestion form
  - the public toggle in program forms
  - admin dashboard links to Sugestões, Taxonomias, and Reportes
  - `ReportLauncher`

  Verify each with flags off in the `mvp` Playwright project.
- [x] 5.7 `english-locale`: `resolveLocale` returns `pt` and `LocaleSwitcher` is not rendered when off; verify a Playwright test that sets an English cookie and still sees Portuguese
- [x] 5.8 `review-discussion`: render reviews as stars, comment, author, and date when off; verify a component test for both flag states
- [x] 5.9 Document `FEATURES` and `E2E_LOGIN` in `.env.example`, `README.md`, and `docs/deployment.md`; verify the docs mention both variables

## 6. Program schedule

- [x] 6.1 Add `computeSchedule` in `src/lib/programs/schedule.ts`; verify unit tests for a 09:30 start, custom blocks, an empty program, and crossing midnight
- [x] 6.2 Add a server helper that rewrites positions and stored times in one transaction; call it from entries POST/PUT/DELETE, and from program PUT when `start_time` changes; verify SQL-integration tests for add, remove from the middle, reorder, and start-time change
- [x] 6.3 Make entries POST ignore client times, accept an optional position (default: end), and accept position 0; verify an integration test adding to an empty program
- [x] 6.4 Use `computeSchedule` in program GET, the programs list, the Excel/PDF export loader, and the Orgo dialog defaults; verify an integration test that list total, program total, and export end time agree (90+15+15 → 2h)
- [x] 6.5 Pass the real `program.start_time` to the builder, summary, and schedule table, and use `computeSchedule` for optimistic updates; verify a component test with a 09:30 start
- [x] 6.6 Stop `AddToProgramModal` sending times and positions; verify a Playwright test adds from the activity page and the entry lands last with the right times
- [x] 6.7 Confirm reorder and edit persist without "Save Program", then remove the button; verify by reloading after a reorder in Playwright
- [x] 6.8 Add a one-off script to recompute stored times for existing programs; verify it is idempotent by running it twice on the dev database

## 7. Orgo push hardening

- [x] 7.1 Exact, case-insensitive email match in `findOrgoUserId`, with no first-result fallback; verify unit tests with a mismatched search result
- [x] 7.2 Field-based event-create predicate, with no fallback and ended roles excluded; verify unit tests with captured role payloads (event-capable, member-only, ended)
- [x] 7.3 Zod schema for the POST body (end after start, unit, positive integer capacity, boolean publish); verify 400 responses and that Orgo is not called
- [x] 7.4 Implement the duplicate-safe create:
  - an atomic `pending` claim, reset if the create fails
  - store the uuid and URL before publishing
  - return 201 with `published: false` if publishing fails
  - a stale claim can be reclaimed after 5 minutes

  Verify SQL-integration tests with a mocked Orgo client for double submit (one create, one 409), create failure, and publish failure.
- [x] 7.5 Treat `pending` as "creation in progress" on the program page and in the GET handler; verify a component test
- [x] 7.6 Delete `src/lib/orgo/ensure-columns.ts` and its calls (the Orgo route and `POST /api/programs`); verify `rg ensureOrgoProgramColumns src` returns nothing and tests pass
- [x] 7.7 Dialog success state with a link, a draft-only warning, pt-PT date display, and "tu" copy; verify the existing Orgo Playwright test plus a new assertion for the success link

## 8. Activity browsing

- [x] 8.1 Zod schema for `GET /api/activities` query params; verify 400 for a bad enum, a bad operator, and page 0
- [x] 8.2 Contains-match search, escaping `%`, `_` and `\`; verify an integration test finds "Jogo do Fogo" for "fogo" and treats "50%" literally
- [x] 8.3 Move the SDG and educational-goal filters into SQL `EXISTS` clauses before pagination; verify an integration test with 30 activities (5 with SDG 13) returns total 5 on page 1
- [x] 8.4 Map `duration_operator` through a whitelist; verify `>=30` returns only activities of 30+ minutes

## 9. UI polish

- [x] 9.1 Copy sweep to "tu" in `pt.json`, and move hard-coded English (builder title and subtitle, Save, add-activity enum values) into the catalogues; verify `rg` finds no "Program Builder" or "Drag and drop" in `src` and the Playwright Portuguese assertions pass
- [x] 9.2 Catalogue: whole-card link, remove "Ver Detalhes", compact placeholder header, fix the empty type pill, remove the development banner, skeleton loading; verify in Playwright that keyboard Enter on a card opens the activity
- [x] 9.3 Catalogue on phones: search first, filters in a sheet without the duplicate title; verify at 390px in the `mvp` project with no horizontal scroll
- [x] 9.4 Activity page order (facts → actions → materials → reviews → goals/SDGs), remove the duplicate "Avaliações" heading, explain the disabled submit; verify by screenshot review at 1440px and 390px
- [x] 9.5 Program page: Orgo button primary, Editar/Eliminar in a "⋯" menu, compact facts row, slim schedule table with expandable details; verify by screenshot review at 1440px
- [x] 9.6 Program page on phones: no horizontal scroll, edit and remove next to Subir/Descer; verify a Playwright test that asserts `scrollWidth <= clientWidth` at 390px and removes an entry
- [x] 9.7 Sign-in page with the lockup and a one-line pitch; logged-out `/programs` reduced to a pitch and "Entrar com o eAEP"; verify by screenshot review
- [x] 9.8 Footer year from the current date; verify a component test

## 10. Verification

- [x] 10.1 Add the `mvp` Playwright project on a second web server with `FEATURES` unset. It covers sign-in (E2E session), browse and search, rate and comment, building a program, and creating the Orgo event (stubbed). Verify it passes locally and in CI.
- [x] 10.2 Run `npm run lint`, `npm run typecheck`, `npm run test:run`, and `npx playwright test` with `FEATURES=all`; verify all pass
- [x] 10.3 Retake the UI review screenshots (desktop and 390px, logged out and in) and compare them with the review findings; verify each finding is resolved or listed as a follow-up
