## 1. Structure and keyboard

- [ ] 1.1 Add a skip link as the first focusable element in the app shell with PT/EN strings — verify Playwright (mvp project): first Tab focuses it and activation moves focus into `main`
- [ ] 1.2 Put top bar and footer inside landmarks and give the admin navigations distinct names — verify axe `region` and `landmark-unique` report zero on all MVP routes
- [ ] 1.3 Fix the activity detail heading levels (`h1 h3 h4 h2`) — verify axe `heading-order` is clean on the detail page
- [ ] 1.4 Make the footer and About "GitHub" links configurable or remove them — verify no hard-coded repository URL remains in `src/`

## 2. Touch targets

- [ ] 2.1 Add a `touch` size to `Button` and equivalent padding for "Entrar", the account button, pills and primary links below `md` — verify a DOM test finds no primary control under 44 px high at 390 px
- [ ] 2.2 Enlarge hit areas for top-bar and footer links, catalogue and admin title links, the About/Privacy inline-standalone links and admin form checkboxes — verify nothing is under 24 px at any width and compare before/after screenshots at 1280 and 390 px

## 3. Admin activity editor

- [ ] 3.1 Replace the "Esforço" text input with a select or choice group using enum labels; make Descrição and Instruções textareas; use shared `Select`/`Input` — verify PT shows "Baixo/Médio/Alto" and EN shows the English labels
- [ ] 3.2 Move hard-coded editor labels and step names into `pt.json` and `en.json` — verify no Portuguese literals remain in `ActivityEditorForm.tsx` and the message-parity test passes
- [ ] 3.3 Add per-step validation, an error summary, focus on the first invalid field, automatic step switch, Anterior/Seguinte and required markers — verify unit tests and a Playwright case that submits with an empty step-1 field from step 4
- [ ] 3.4 Re-run admin create/edit e2e on chromium, Mobile Chrome and mvp — verify all pass

## 4. Catalogue, detail, home

- [ ] 4.1 Compact the missing-image placeholder and collapse the empty card image band — verify title and "Adicionar ao programa" are visible on first screen at 390×844 (coordinate with `activity-illustration-agent`)
- [ ] 4.2 Give objective chips accessible names and a legend or tooltip — verify an accessible-name test and that meaning is not colour-only
- [ ] 4.3 Make home cards links and settle the "Colaboração" and "Recursos" copy with the maintainer so nothing promises hidden features — verify each remaining card navigates and the home page in MVP mode has no hidden-feature copy

## 5. Program page and admin list

- [ ] 5.1 Check why "Criar evento no eAEP" is disabled for an empty program and add an explanation message — verify the message appears when disabled and the control works when enabled
- [ ] 5.2 Use one loading pattern with a text label on the program page and edit page, and remove the duplicated title on the edit page — verify screenshots
- [ ] 5.3 Make the dashboard "Atividades pendentes" count a link to the pending filter — verify it opens the filtered list
- [ ] 5.4 Add search, status filter and pagination to `/admin/atividades` and show status as a badge — verify an integration test with 100+ seeded activities and Playwright as admin on desktop and phone

## 6. Guard rail and follow-ups

- [ ] 6.1 Add a Playwright + axe spec for guest, member and admin MVP routes at 1280 and 390 px with `target-size` enabled and a 44 px check for primary controls on phone — verify it first runs report-only to show the baseline, then fails on regressions
- [ ] 6.2 Update `docs/design-system.md` through `npm run docs:design` for the skip link, status badge and touch size, with no new colours — verify `tokens.test.ts` and the doc-in-sync test pass
- [ ] 6.3 Add the deferred findings (Report button overlap, reaction and suggestion button sizes, table-view links, admin navigation, English parity) as notes on the specs of their feature flags — verify each deferred row in design.md points to a spec or change
- [ ] 6.4 Schedule a real screen-reader pass (NVDA or VoiceOver) and a real-phone check of home, catalogue, detail, program page and admin create — verify findings are logged or the task is explicitly deferred
