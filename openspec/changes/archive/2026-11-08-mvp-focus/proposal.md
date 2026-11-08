## Why

A competing app has appeared, so Kit needs a focused MVP soon: Orgo sign-in, browsing activities, rating and commenting, building a program, and pushing that program to Orgo as an event. Today those five flows sit among many secondary features, and some of them have bugs a leader would hit on day one:

- The schedule ignores the program's start time.
- Durations disagree between screens.
- Single-word search misses most matches.
- The Orgo push can offer the wrong units or create duplicate events.

Before real users arrive, the app should also stop leaking internals in API errors, deploy its schema safely, carry no known critical vulnerabilities, and run on a supported toolchain.

## What Changes

- **Feature flags for non-MVP features.** Add one server-side flag list (default: all off) that hides these features without deleting code or data. When a flag is off, its navigation entries and controls disappear, and its pages and API routes return 404.
  - English locale switcher (`english-locale`)
  - Public program gallery and "use as template" (`public-programs`)
  - User-proposed activities: Propor atividade, As minhas propostas (`activity-proposals`)
  - Edit suggestions, notifications, and the admin suggestion queue (`edit-suggestions`)
  - Votes, reactions, and replies on reviews (`review-discussion`); a plain star rating and comment stay
  - Activities table view (`activities-table-view`)
  - Admin taxonomy management (`admin-taxonomies`)
  - Swagger docs and `/api/metrics` (`api-docs`)
  - Reportar, the in-app issue report control, plus the admin report queue and its APIs (`issue-reports`)
- **Program builder fixes.**
  - The schedule starts at the program's start time, not a hard-coded 09:00.
  - Entry times and total duration come from one calculation, so the builder, programs list, summary, exports, and Orgo dialog agree.
  - The server, not the client, assigns entry positions.
- **Orgo push hardening.**
  - Look up the Orgo user by exact email only.
  - Offer only units where the user can create events, with no "all units" fallback.
  - Validate the request with Zod.
  - Never create a duplicate event when publishing fails or the user double-submits.
  - Stop altering the database schema during requests.
- **Activity browsing fixes.**
  - Search matches text anywhere in name, description, or materials.
  - SDG and educational-goal filters apply before pagination.
  - Invalid query parameters return 400 instead of 500.
- **API error hygiene.** In production, error responses carry a code and a Portuguese message only: no SQL, no stack traces, no internal error text. Details go to server logs.
- **Safer test login.** `/api/e2e/session` works only when explicitly enabled (`E2E_LOGIN=1`) and never in production, instead of whenever `NODE_ENV` is not `production`.
- **Safe schema deploys.** Vercel builds apply committed Drizzle migrations instead of `drizzle-kit push --force`. Migrations are generated in development, reviewed, and committed.
- **Dependency upgrades.**
  - Bump everything that has a fix within its current major version (Next 15.5.x, next-auth beta, the Drizzle adapter, drizzle-orm 0.45, Zod, TanStack Query, Playwright, and the rest).
  - Replace the unmaintained `xlsx` 0.18.5 with SheetJS's current release from its own CDN.
  - Remove unused packages.
  - Major upgrades (Next 16, Tailwind 4, Vitest 5, ESLint 10, TypeScript 7) stay out.
- **Development environment.**
  - Node 24 LTS, pinned with `.nvmrc` and `engines`.
  - The Playwright browser installed in `postinstall`.
  - A separate `scout_toolkit_e2e` database so Playwright stops polluting `scout_toolkit_dev`.
  - A `typecheck` script with Vitest globals, run in CI.
  - Local Postgres matching Neon's major version, and the obsolete `version:` key removed from `docker-compose.yml`.
  - Dependabot for npm and GitHub Actions.
- **UI polish for the five MVP flows**, following the UI review:
  - Translate leftover English chrome and raw enum values.
  - Make "Criar evento no eAEP" the primary program action.
  - Simplify the builder schedule and fix horizontal scroll on phones.
  - Reorder the activity page so reviews come before secondary content.
  - Make whole activity cards clickable.
  - Remove the "Funcionalidade em Desenvolvimento" banner.
  - Add the lockup to the sign-in page.
  - Use one copy register ("tu").

## Capabilities

### New Capabilities

- `feature-flags`: Which non-MVP features can be switched off, the default (off), and what "off" means for navigation, pages, and APIs.
- `activity-browsing`: Search and filter behaviour of the public catalogue: contains-match search, filters applied before pagination, validated query parameters, clickable cards.
- `api-errors`: What an API error response may and may not contain, in production and in development.

### Modified Capabilities

- `program-builder`: The schedule is derived from the program start time and entry durations; one total duration everywhere; server-assigned positions.
- `orgo-events`: Exact-email user lookup, no unit fallback, validated payload, no duplicate on publish failure or double submit, success state with a link.
- `activity-ratings`: The activity page shows stars, comment, and history; votes, reactions, and threads only when `review-discussion` is on.
- `locale`: The header locale control appears only when `english-locale` is on; otherwise chrome is Portuguese.
- `mobile-layout`: The locale-control requirement applies only when `english-locale` is on; the program page fits a 390px viewport.
- `issue-reports`: Reportar and the admin report queue exist only when `issue-reports` is on.
- `testing-strategy`: Playwright uses its own `scout_toolkit_e2e` database; the E2E login helper needs an explicit opt-in.
- `preview-hosting`: Hosted schema changes come from committed migrations, never a forced push.

## Impact

- **New code:** `src/lib/features.ts` (flag parsing), a client flags provider, a route guard in `middleware.ts`, and a production-safe error serializer in `src/lib/errors/`.
- **Touched UI:**
  - Layout: header and phone menu, `AppShell`/`ReportLauncher`, sign-in page.
  - Activities: catalogue page, cards and detail page, `ActivityRating`.
  - Programs: builder and schedule components, `CreateOrgoEventDialog`.
  - Also: admin dashboard links, and `src/messages/pt.json`/`en.json`.
- **Touched APIs:** `GET/POST /api/activities`, `/api/programs/[id]` and `/entries`, `/api/programs/[id]/orgo`, `src/lib/orgo/*`, `/api/e2e/session`, every handler that serializes errors. `ensure-columns.ts` is removed.
- **Build and deploy:**
  - `scripts/ensure-hosted-db.mjs` switches from push to `drizzle-kit migrate`.
  - `drizzle/migrations/*.sql` is no longer gitignored.
  - A baseline migration is generated from the current schema.
- **Configuration:**
  - New `FEATURES` variable (comma-separated, or `all`) and `E2E_LOGIN` variable, documented in `.env.example`.
  - CI sets `FEATURES=all` for the existing suites, `E2E_LOGIN=1`, and the e2e database URL.
- **Tooling:**
  - `package.json` gets version bumps, `engines`, and `typecheck`/`postinstall` scripts.
  - New `.nvmrc` and `.github/dependabot.yml`.
  - `docker-compose.yml` and `drizzle/init` get the e2e database; `playwright.config.ts` and `tsconfig.json` are updated.
- **Data:**
  - No table changes. Hidden features keep their tables and rows.
  - Existing hosted databases are marked as already at the baseline migration, so no data is rewritten.
- **Still out of scope:**
  - Major-version upgrades.
  - A darker brand teal for buttons, which needs a tint from the brand manual (see design).
