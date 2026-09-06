## 1. Locale runtime

- [x] 1.1 Add `pt` and `en` chrome catalogs plus a provider that reads a first-party `kit-locale` cookie (default `pt`) with no `[locale]` segment or i18n Edge middleware — verify `npm run build` still succeeds under Turbopack
- [x] 1.2 Set `document` / `<html lang>` from the active locale and verify a unit test: missing cookie → `pt`; `kit-locale=en` → `en`

## 2. Header switcher

- [x] 2.1 Put a compact PT/EN control in the header cluster immediately left of Entrar / the avatar (signed-in and signed-out) with an accessible name — verify it does not live only in the hamburger
- [x] 2.2 Switching locale writes the cookie, updates chrome without changing the path, and keeps the choice after reload — verify a unit test for the cookie write and default fallback

## 3. Chrome catalogs

- [x] 3.1 Move header, auth (Entrar / Sair / sign-in page), activities, programs, admin, and export chrome into catalogs; leave stored titles, descriptions, goals, and UGC as authored — verify the add-activity dialog is Portuguese in `pt` and English in `en` (no leftover "Add Activity to Program" as the only `pt` string)
- [x] 3.2 Keep the product name **Kit de Atividades** identical in both catalogs — verify a unit assertion on that string

## 4. Tests and phone header

- [x] 4.1 Add a Playwright spec that switches PT → EN → PT on `/activities` (desktop and Mobile Chrome) and assert unprefixed `/activities` — verify it passes
- [x] 4.2 Run the existing Playwright suite without setting `kit-locale` and verify it still sees Portuguese chrome and stays green
