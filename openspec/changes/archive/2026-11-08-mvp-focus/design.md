## Context

See proposal.md for why. Current state that shapes the approach:

- **Root layout** (`src/app/layout.tsx`) is a server component. It already reads cookies and passes values to client providers (`LocaleProvider`, `ViewAsProvider`). Flags can follow the same path.
- **`middleware.ts`** only redirects `/` to `/home` and logs every request. Next.js 15.5 middleware runs on the Edge runtime by default.
- **Schedule times** are computed in four places that disagree:
  - The builder and summary receive a hard-coded `programStartTime="09:00"` (`ProgramBuilder.tsx`).
  - The builder total sums the stored `end_time - start_time` values.
  - The programs list sums activity durations in SQL.
  - `AddToProgramModal` saves every new entry at the program start time, with position `entry_count + 1`.
  - The entries `POST` handler rejects position `0`.
- **Orgo** (`src/lib/orgo/client.ts`):
  - `findOrgoUserId` falls back to the first search result.
  - `filterEventCreateUnits` falls back to all roles.
  - The `POST` body is cast, not validated.
  - The uuid is stored only after publish succeeds.
  - `ensureOrgoProgramColumns()` runs `ALTER TABLE` on requests. The columns already exist in `drizzle/schema`.
- **Catalogue search** (`GET /api/activities`):
  - A single word uses a prefix pattern (`term%`).
  - SDG and goal filters run in JavaScript after `LIMIT/OFFSET`.
  - `duration_operator` is interpolated as a bound parameter, which produces invalid SQL.
- **Specs that constrain the UI work:**
  - `visual-system` requires dark text on teal primary buttons, and new tokens wait for the brand handoff.
  - `issue-reports` requires Reportar on every page.
  - `mobile-layout` already requires no horizontal scroll and up/down reorder on phones.

## Goals / Non-Goals

**Goals:**
- One flag mechanism that hides a feature in navigation, pages, and APIs from a single table.
- One schedule calculation shared by the server and the client.
- Orgo writes that are safe to retry and never act on another person's Orgo identity.

**Non-Goals:**
- Per-user or percentage rollouts, a flag admin UI, or runtime toggling without a redeploy.
- Removing the code of hidden features, or migrating their data.
- New brand colours (the button colour stays dark-on-teal; see Open Questions).
- Major-version upgrades (Next 16, Tailwind 4, Vitest 5, ESLint 10, TypeScript 7, lucide 1.x, jsdom 30).
- A structured logging or monitoring service; errors go to the existing `log` helper and Vercel logs.

## Decisions

### 1. Flags: one env var, one table, enforced in middleware

- `FEATURES` is a comma-separated list (or `all`), parsed once in `src/lib/features.ts`. That module exports `FEATURE_FLAGS` (the 8 names), `isFeatureEnabled(name)`, and `FEATURE_ROUTES`, a table mapping path prefixes to flags.
  - Examples: `/programs/public` and `/api/programs/public` → `public-programs`; `/api/activities/*/ratings/*/vote|reactions|replies` → `review-discussion`.
- `src/middleware.ts` (default Edge runtime; with a `src/` layout a root-level `middleware.ts` is not run by `next dev`) checks `FEATURE_ROUTES`. Edge middleware reads `FEATURES` at request time, so the same build serves different flag sets. (A Node.js-runtime middleware was tried first: with `next build --turbopack` on 15.5 it was built but never registered, so nothing was hidden.) Pages get a rewrite to the not-found page; `/api/*` gets a 404 JSON in the standard error shape. The stray `console.log` and the duplicate `/` redirect (already done in `src/app/page.tsx`) are removed.
- Method-specific cases, such as `POST /api/activities` (a proposal) next to `GET /api/activities` (the catalogue), are checked in the route handler with the same `isFeatureEnabled` helper. Middleware matches paths, not intent.
- The root layout passes the enabled list to a new client `FeaturesProvider`. Components hide controls with `useFeature(name)`.
- **Alternatives considered:**
  - A `NEXT_PUBLIC_*` variable per flag: inlined at build time, eight variables, and the server and client could drift.
  - A `notFound()` call in every page and route: easy to miss one, and nothing central to test.
  - A flag service: unnecessary for eight on/off switches.
- **Tests:** a unit test asserts every flagged route in the table returns 404 when its flag is off. CI runs the existing suites with `FEATURES=all`. A second Playwright web server (port 3001, no `FEATURES`) backs a small `mvp` project, so the default configuration is tested too.

### 2. Locale when `english-locale` is off

`resolveLocale` in the root layout returns `pt` when the flag is off, whatever the cookie says, and `LocaleSwitcher` is not rendered. The cookie is left alone, so turning the flag back on restores each user's choice.

### 3. Schedule: derive on read, persist on write

- A pure function, `computeSchedule(startTime, entries)` in `src/lib/programs/schedule.ts`, returns each entry's start, end, and length, plus the total. Length is the activity's `approximate_duration_minutes`, or `custom_duration_minutes` for custom blocks.
- **Reads:** program `GET`, programs list, exports, and the Orgo dialog defaults all call it. Admin edits to an activity's duration then show up everywhere without stale stored times.
- **Writes:** after add, remove, reorder, edit, or a start-time change, the server rewrites positions (0..n-1) and the stored `start_time`/`end_time` in one transaction, so the stored columns stay a correct cache for anything that reads them directly.
- The entries `POST` ignores client times; position is optional and defaults to the end.
- The builder uses the same function for optimistic updates and receives the real `program.start_time`.
- "Save Program" is removed once every edit path saves on its own. Today reorder and edit already call the mutation hooks; the task checks this before removing the button.
- **Alternative considered:** compute only on write. Rejected, because activity-duration edits would leave programs stale.

### 4. Orgo: claim, create, store, then publish

- **Validation:** a Zod schema for the `POST` body. It requires `dateTimeEnd` and `unit`, requires end after start, takes an optional positive integer `maxCapacity`, and a boolean `publish`.
- **Identity:** `findOrgoUserId` returns a user only when its email equals the session email, compared case-insensitively. `filterEventCreateUnits` keeps active roles whose role or permission fields grant event creation, with no fallback. The predicate reads specific fields instead of `JSON.stringify(role)`.
- **No duplicates, no schema change.** Claim the program atomically:
  `UPDATE programs SET orgo_event_uuid = 'pending', updated_at = now() WHERE id = $1 AND user_id = $2 AND (orgo_event_uuid IS NULL OR (orgo_event_uuid = 'pending' AND updated_at < now() - interval '5 minutes')) RETURNING id`
  - Zero rows means 409 (or the existing link).
  - If create fails, reset the claim to `NULL`.
  - If create succeeds, store the uuid and url, *then* attempt publish. If publish fails, return 201 with `published: false` and a Portuguese "created as draft" message.
  - Every reader treats `pending` as "creation in progress", never as a link.
- `ensure-columns.ts` and its callers are deleted. Local databases pick up the columns with `npm run db:push`; Vercel already pushes the schema on build.
- **Alternative considered:** a new `orgo_event_status` column. It's cleaner, but needs a schema change; the sentinel is enough for an MVP.

### 5. Catalogue query

- A Zod schema parses all query parameters; invalid input returns 400 through `apiErrors.validation`.
- Search uses `ILIKE '%' || term || '%'` on name, description, and materials, after escaping `%`, `_` and `\`.
- SDG and goal filters become `EXISTS` subqueries on `activity_sdgs` and `activity_educational_goals`, inside the same `WHERE` as the count.
- The duration operator maps through a whitelist to Drizzle's `gte`/`lte`/`eq`/`gt`/`lt`.
- **Alternative considered:** Postgres full-text search with `unaccent`. Better recall, but it needs an extension and a migration; the catalogue is small, so this is deferred.

### 6. UI polish (within existing tokens and specs)

- **Copy:** use "tu" everywhere. Sweep `pt.json`, and move the hard-coded strings ("Program Builder", "Drag and drop…", "Save Program", raw enum values in the add-activity dialog) into the catalogue.
- **Program page:**
  - Header: "Criar evento no eAEP" (or "Ver evento no eAEP") is the primary button; Editar and Eliminar move into a "⋯" menu.
  - The four stat cards become one compact facts row.
  - The schedule table shows Início–Fim, Nome, Duração, and actions. Effort, location, age, goals, and SDGs move into an expandable row.
  - The phone layout gets edit and remove next to up and down, and the header wraps instead of overflowing.
- **Activity page:** title and facts → Adicionar ao programa / Avaliar → materials → reviews → goals and SDGs. The duplicate "Avaliações" heading is removed, and the suggestion form is hidden behind its flag.
- **Catalogue:**
  - Whole-card link (stretched-link pattern, keyboard accessible); the per-card "Ver Detalhes" button goes.
  - A smaller placeholder header instead of a large "Sem imagem" block.
  - The empty type pill is fixed.
  - The development banner is removed.
  - Search is the main element, and filters open in a sheet on phones (as `mobile-layout` already requires).
  - Loading uses skeleton cards instead of two "A carregar…" texts.
- **Sign-in:** add the AEP lockup and a one-line pitch, using the site's heading style.
- **Logged-out `/programs`:** replace the six marketing cards with a short pitch and an "Entrar com o eAEP" button.
- **Orgo dialog:** show dates in pt-PT format, add a success state with a link, and use "tu" in the copy.
- **Reportar:** hidden by the `issue-reports` flag. The flag only decides whether `ReportLauncher` is rendered; its layout is unchanged for when it's turned back on.
- **Footer:** the year comes from the current date.

### 7. API errors: one serializer, production-safe

- `withApiErrorHandler` and `createApiErrorResponse` in `src/lib/errors/` become the only way to build an error body.
- In production they drop `details.stack`, `details.query`, `details.originalError` and any unexpected-error message, replacing the message with "Ocorreu um erro inesperado.". The full error goes to `log.error` with the path.
- Routes that still return ad-hoc `{ error: 'Unauthorized' }` strings (`/api/programs*` and the taxonomy routes, among others) move to `apiErrors.*` so the shape is uniform. A unit test runs the serializer with `NODE_ENV=production` against a Drizzle query error.
- **Alternative considered:** strip fields in middleware. Rejected: middleware can't safely rewrite streamed bodies, and the leak starts in the serializer.

### 8. E2E login opt-in

- `e2eLoginAllowed()` becomes `NODE_ENV !== 'production' && E2E_LOGIN === '1'`.
- `playwright.config.ts` passes `E2E_LOGIN=1` to its web servers, and CI sets it.
- Developers who use the helper manually add it to `.env.local`.

### 9. Migrations instead of `push --force`

- `drizzle/migrations/*.sql` is no longer gitignored. A baseline migration (`0000_*`) is generated from the current schema and committed.
- `scripts/ensure-hosted-db.mjs`:
  - If the database already has the app tables but no `drizzle.__drizzle_migrations` rows, it records the baseline as applied without running it.
  - It then runs `drizzle-kit migrate`.
  - The seed-if-empty step stays.
- `npm run db:push` stays for local throwaway databases only. Schema changes from now on go through `npm run db:generate`, review, and commit.
- **Alternative considered:** keep `push` without `--force`. Rejected, because it prompts on data loss, which hangs a non-interactive build, and it gives no review step.

### 10. Dependencies

- Same-major bumps to the latest versions `npm outdated` reports as "Wanted", plus `drizzle-orm` 0.45 (pre-1.0 minor, with breaking-change notes read first). Then `npm audit` must show no critical or high advisory in production dependencies, except any documented as having no fix.
- **`xlsx`:** install `https://cdn.sheetjs.com/xlsx-<latest>/xlsx-<latest>.tgz` (SheetJS's official distribution). The API is the same, so `src/lib/export/excel.ts` needs no rewrite. The alternative, `exceljs`, means rewriting the export, and isn't needed for an MVP.
- **Removed if confirmed unused:** `zustand`, `@types/better-sqlite3`, and `@tailwindcss/postcss` (the app runs Tailwind 3 through `tailwindcss`). `@tanstack/react-table` stays, because the table view is flagged, not removed.
- **`uploadthing`:** `npm audit` suggests a v6 downgrade, which is wrong. Stay on 7.x latest and accept the transitive `effect` advisory if no 7.x fix exists, documenting it.

### 11. Development environment

- **Node 24 LTS:**
  - `.nvmrc` with `24`, and `"engines": { "node": ">=22.12 <25" }`.
  - Vercel's project Node version set to 24.x (a dashboard setting, listed as a manual step).
  - fnm or Volta recommended in the README instead of Nodist.
- **Playwright:** a `postinstall` script runs `playwright install chromium`, skipped when `CI` or `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` is set. Use one Playwright version for `playwright` and `@playwright/test`.
- **E2E database:**
  - `drizzle/init/` creates `scout_toolkit_e2e`.
  - `playwright.config.ts` web servers use `DATABASE_URL` for that database, and a global setup applies the schema (`db:push`) and seeds it.
  - CI's service container gets the same database.
- **Type checking:** `"typecheck": "tsc --noEmit"`, with `vitest/globals` added to `tsconfig.json`'s `types`. Fix the remaining test-file errors, which are mostly unused imports and stale call signatures. CI runs it.
- **Postgres version:** read the version from the Preview Neon database (`select version()`) and use the same major in `docker-compose.yml`, defaulting to 17 if it can't be read. Remove `version: '3.8'`. Changing the image needs a fresh volume, so the README notes `npm run db:reset`.
- **Dependabot:** `.github/dependabot.yml` covers npm (weekly, grouped minor/patch, majors ignored for next, tailwindcss, vitest, eslint and typescript until planned) and github-actions (monthly).

## Risks / Trade-offs

- **[Middleware silently not running]** (as happened with the Node.js runtime under Turbopack) → Route-table unit tests plus the `mvp` Playwright project, which requests hidden routes against a real server, catch it. If it misbehaves on Vercel, fall back to per-route guards using the same table.
- **[A route not listed in `FEATURE_ROUTES` stays reachable]** → The unit test enumerates `src/app/**/route.ts` and page files under flagged folders, and fails if one is not covered.
- **[Two Playwright web servers slow CI]** → The `mvp` project stays small: a smoke test of the five MVP flows with flags off.
- **[A `pending` claim is left behind if the server dies mid-create]** → It's reclaimable after 5 minutes. The owner sees "creation in progress" meanwhile.
- **[The Orgo role predicate guesses field names]** → Unit tests use captured real role payloads. Until the field is confirmed, users with no clearly event-capable role see the empty-state message rather than a wrong unit.
- **[Recomputing on read shifts saved times if an admin changes an activity's duration]** → That is intended: the schedule follows the catalogue. Exports already generated are not changed.
- **[The baseline migration doesn't match a hosted database that drifted]** → Before marking the baseline applied, the deploy script compares table and column names against the baseline and fails the deploy with a list of differences instead of guessing.
- **[Dependency bumps break something subtle]** (next-auth beta, drizzle 0.45) → Upgrade in its own commit, before the feature work, with the full test gate run after it; revert that commit alone if needed.
- **[The SheetJS CDN tarball is not on the npm registry]** → Dependabot can't update it; a note in `package.json` and the README says to bump it by hand. `npm ci` works with tarball URLs.
- **[`postinstall` downloading a browser slows installs]** → It's skipped in CI and on Vercel (where `CI` is set), and only fetches when the browser is missing.
- **[A changed Postgres image needs a fresh local volume]** → Documented, with `npm run db:reset`; dev data is reseeded.
- **[Hiding the public toggle]** leaves existing public programs public, and their Orgo `isPublic` mapping is unchanged → Acceptable; turning `public-programs` on restores the toggle.

## Migration Plan

1. Merge with `FEATURES` unset in Preview and Production (MVP default), and `FEATURES=all` and `E2E_LOGIN=1` in CI.
2. Developers:
   - Switch to Node 24 (`.nvmrc`) and run `npm ci`, which also installs the Playwright browser.
   - Recreate the Docker volume (`npm run db:reset`) to get the new Postgres image and the `scout_toolkit_e2e` database.
   - Run `npm run db:push` and `npm run db:seed` for the dev database.
   - Add `E2E_LOGIN=1` to `.env.local` if they use the test login by hand.
3. Manual host steps: set Vercel's Node version to 24.x. The first deploy after merge records the baseline migration on Preview (and later Production) without changing data.
4. One-off: recompute stored times for existing programs with a script that calls the shared schedule function. It's idempotent and safe to re-run.
5. Rollback:
   - Set `FEATURES=all` and redeploy to restore every feature without a code change (Vercel applies env changes on the next deployment).
   - Revert the commit for the schedule and Orgo changes; no data migration needs undoing.
   - Reverting the migration switch is safe: the baseline only records state.

## Open Questions

- **Which Orgo role field marks event creation** (for example a permission code or a function name)? This only changes the predicate's field names, not the behaviour or tasks. Confirm against the Orgo API docs or a real `/api/v1/user_roles` response.
- **A darker teal tint from the brand manual** (pp. 29–30) for white-text buttons. This is out of scope here, because `visual-system` requires dark-on-teal and new tokens need the handoff gate; raise it as a separate change once the tint is confirmed.
