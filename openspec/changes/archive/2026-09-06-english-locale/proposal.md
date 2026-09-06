## Why

Kit de Atividades is used by Portuguese leaders first, but English-speaking leaders and guests also need the chrome. The product went Portuguese-only in Story 1.4.a after `[locale]` routing + next-intl broke Turbopack; that debt is gone, and leftover English strings (add-activity dialog) already leak. We need a default-Portuguese UI with an explicit language choice next to the user widget.

## What Changes

- Add a header locale control next to Entrar / the avatar (signed-in and signed-out)
- Default locale is Portuguese (`pt`); English (`en`) is opt-in
- Persist the choice in a cookie so the next request renders the same chrome
- Keep unprefixed routes (`/activities`, `/programs`, `/home`) — no `/pt` or `/en`
- Translate product chrome (nav, buttons, forms, empty and error states shown in the UI)
- Leave catalogue titles, descriptions, goals, and UGC as stored
- Product name stays **Kit de Atividades** in both locales

## Capabilities

### New Capabilities

- `locale`: Default Portuguese chrome, English via a header switcher, cookie persistence, no locale URL prefix

### Modified Capabilities

- `mobile-layout`: Phone header keeps the locale control in the top bar next to the user widget, not only inside the hamburger

## Impact

- Header (`src/components/layout/Header.tsx`) and SignInButton cluster
- Message catalogs for chrome; most pages and feature components that hardcode Portuguese
- `html` `lang` on the document
- Playwright: default stays Portuguese so the existing suite stays green; add switcher coverage
- Docs: `openspec/project.md`, `docs/planning.md` Epic 17
- Dependencies: a catalog + provider is required; `[locale]` middleware is not
