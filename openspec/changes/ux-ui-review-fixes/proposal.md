## Why

A review of the running app found that the **design system is well followed** (no hard-coded colours, Arial 400/700 only, 4 px radius, contrast passes in light and dark, one `h1` per page, alt text everywhere) but that **usability and accessibility gaps remain**. The review was repeated in **MVP mode** (`FEATURES` unset, port 3201), because many screens are hidden there: public programs, member proposals ("Propor atividade", "As minhas propostas"), edit suggestions, review discussion (reactions, votes, replies), admin taxonomies, issue reports (so no "Reportar" button), usage analytics, the English switcher, the table view and API docs. This change fixes only what an MVP user or admin can see. Findings that apply only to hidden features are recorded as deferred and attach to those features when they are switched on.

Method: axe-core (WCAG 2A/2AA/2.1 AA and best-practice) over 26 page/viewport runs (13 routes at 1280 px and 390 px), plus screenshots, a target-size script and a keyboard walk, against the e2e database. Routes covered: home, catalogue, activity detail, sign-in, about, privacy, programs, program page, program edit, admin dashboard, admin activities, admin create, admin users.

## What Changes

**In scope (visible in the MVP):**
- **Keyboard and structure**: add a "Saltar para o conteúdo" skip link (five tab stops precede the content), put the top bar and footer inside landmarks, give the two admin navigations distinct names, and fix the heading jump (`h1` to `h3`) on the activity detail page.
- **Touch targets**: top-bar links are 16 px high, footer links 20 px, catalogue and admin list title links 17–20 px, the "Entrar" button and avatar 32 px, admin form checkboxes 13 px, and the "Ver no GitHub" and e-mail links 17 px. Raise standalone controls to at least 24 px everywhere and to 44 px for primary controls on phones.
- **Admin activity editor** (used by "Nova atividade" and edit in the MVP): replace the free-text "Esforço" input (shows the English value `medium`) with a select or choice group using the translated labels, make "Descrição" and "Instruções" multi-line, use the shared `Select`/`Input`, move hard-coded labels into `pt.json`/`en.json`, validate each step with a visible error summary (required fields in hidden steps silently block submit), and add Anterior/Seguinte buttons.
- **Catalogue and detail**: the "Sem imagem" placeholder fills the first phone screen, so make it compact; collapse the empty image band on cards; make the objective chips (`5I.2`, `4S.2.2-3`, colour-coded by division) self-explanatory with an accessible name and a legend or tooltip.
- **Home**: the "Colaboração" card ("Partilha programas com outros Dirigentes") advertises public programs, which are off in the MVP, and the "Recursos" card promises materials the product does not offer. The four cards look interactive but are not links. Make them links and align the copy with what is visible (copy changes need the maintainer's approval).
- **Program page**: the "Criar evento no eAEP" button is greyed out with no explanation; the loading state is a bare spinner on the program page but "Carregando programa..." on the edit page; the edit page repeats its title twice. Explain the disabled state and unify loading.
- **Admin**: dashboard count cards (pending activities) become links to the filtered list; admin activities gets search, a status filter and pagination (39 rows unpaginated today, and bulk ingest will add many pending ones); show status as a badge. A full admin sub-navigation is deferred: the MVP admin has only two sections (Atividades, Utilizadores), so a back link and the existing links are enough.
- **Footer**: the "GitHub" link and the About page's "Ver no GitHub" link point at a hard-coded repository; make them configurable or remove them (relevant to the repository move).
- **Guard rail**: add an axe check through Playwright to CI for the MVP routes at desktop and phone width, so these regressions fail the build.

**Deferred until the feature is switched on** (kept in the design, no tasks now): the floating "Reportar" button overlapping content and its 36–40 px size (`issue-reports`); 22 px reaction pills and the orphaned "Sugerir alteração" button (`review-discussion`, `edit-suggestions`); the member "Propor atividade" page and the same editor form there (`activity-proposals`; fixed already by the shared editor work); the table-view toggle and its row link sizes (`activities-table-view`); admin taxonomies, reports, suggestions and usage pages and the full admin navigation; English-chrome parity (`english-locale`).

## Capabilities

### New Capabilities
- `ux-baseline`: accessibility, navigation, touch-target, form and state conventions the visible pages must meet, with an automated check over the MVP routes.

### Modified Capabilities
- `mobile-layout`: on a phone, standalone controls meet the touch size and a missing image does not take a screen.

## Impact

- Code: `src/components/layout/*`, `src/components/ui/button.tsx` (touch size), `ActivityEditorForm.tsx`, `ActivityCard.tsx`, `ActivityDetail*.tsx`, `ObjectivePill.tsx`, home page, program page and edit page, admin layout, dashboard and activity list, footer and About page, `src/messages/pt.json` and `en.json` (both updated).
- Tests: a Playwright accessibility spec that runs in the MVP project (`tests/e2e/mvp/`) and, for flagged features, in the full project once they ship; unit tests for editor validation; updated e2e selectors where labels change.
- Design system: no new colours or tokens. New pieces (skip link, status badge) use existing tokens and are added to `docs/design-system.md` through `npm run docs:design`.
- No schema changes. Pagination and filter parameters on the admin activities endpoint are added if missing.
- Interacts with: `activity-illustration-agent` (image slot and placeholder), `bulk-activity-ingest` (admin filtering by status and origin), `security-testing` (CSP must not break uploads in the admin editor).
