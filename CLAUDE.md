# Kit de Atividades (scout-toolkit-v2)

Platform for Escoteiros de Portugal leaders to browse activities, build programs, and manage content. Keep the product name; do not rewrite Portuguese copy.

## Stack

- Next.js 15.5 (App Router, Turbopack), React 19, TypeScript (strict), Tailwind + shadcn/ui
- Auth.js v5 with eAEP/Orgo OAuth (`src/lib/auth/orgo-provider.ts`); roles in `src/lib/auth/roles.ts`, admin "view as member" in `src/lib/auth/view-as*.ts`
- PostgreSQL + Drizzle (`drizzle/schema`, seeds in `drizzle/seeds`); Neon for Preview/Production on Vercel
- TanStack Query for client data fetching (`src/hooks/queries`, `src/hooks/mutations`)
- Zod for all input validation; UploadThing for images; SheetJS for Excel, Playwright for PDF
- Vitest (unit + integration), Playwright (E2E)

## Commands

- `npm run dev` – dev server
- `npm run lint` – ESLint
- `npm run test:run` – Vitest once (`npm test` is watch mode)
- `npm run test:e2e` – Playwright
- `npm run db:start` – local Postgres via docker-compose
- `npm run db:generate | db:push | db:migrate | db:seed` – **ask before running any of these**

## Conventions

- UI defaults to Portuguese. English is chrome only, chosen by a cookie switcher (no URL prefix). Strings live in `src/messages/pt.json` and `en.json`; update both.
- Multilingual DB content is JSONB `{ "pt": "...", "en": "..." }`, with Portuguese as the default and English as the fallback.
- Shared types go in `src/types/`; avoid `any` (use `unknown` + type guards in `src/types/guards.ts`).
- Errors: use `src/lib/errors/` (API handler, logger, messages). User-facing error messages are in Portuguese. No stray `console.log`.
- Brand colours come only from CSS variables in `src/app/globals.css`; do not invent new ones (see `docs/brand-handoff.md`). Primary buttons/links must meet WCAG 2.1 AA contrast.
- Naming: components PascalCase, functions camelCase, constants UPPER_SNAKE_CASE, DB tables snake_case.

## Specs and planning

- OpenSpec is the working spec for new changes: `openspec/specs/`, `openspec/changes/`, context in `openspec/config.yaml`. Use the `/opsx:*` commands (propose, explore, apply, update, sync, archive).
- `docs/planning.md` is the historical epic log and roadmap. Don't duplicate full task lists in both places.
- The OpenSpec CLI wants Node >= 20.19; this machine may be on 20.10.

## Testing

- SQL-integration tests use only the local `scout_toolkit_test` DB (`test_user` / `test_password`). If it's down, `npm run test:run` must fail: never skip-to-green, and never point tests at Neon.
- Add tests with new work: unit tests in `tests/unit/`, API/DB tests in `tests/integration/`, critical flows in `tests/e2e/`.

## Safety

- Ask before deleting files or folders, clearing or fully rewriting a file, or bulk operations across many files.
- Ask before any command that changes database schema or data (migrate, push, seed, reset).
- If asked to "diagnose and plan", stop after the plan; only implement when asked to fix.
- Never read or print `.env.local`; use `.env.example` for variable names.
