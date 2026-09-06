# Kit de Atividades

Web app for Escoteiros de Portugal leaders: browse activities, build programs, export Excel/PDF. Product name stays **Kit de Atividades**. UI default is Portuguese; English chrome is planned as `english-locale` (header switcher, no URL prefix).

## Stack

- Next.js 15, TypeScript, Tailwind, shadcn/ui
- PostgreSQL + Drizzle
- Auth.js + eAEP/Orgo (not Google domain restriction)
- Vitest + Playwright

## Conventions

- Do not invent brand tokens. See `docs/brand-handoff.md`.
- Do not truncate or seed Neon from tests.
- OpenSpec changes are the working spec for new work. `docs/planning.md` stays the epic log and roadmap (pilot decision: keep both; do not freeze planning.md yet).
- WCAG 2.1 AA for interactive brand colours.
