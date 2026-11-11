## Context

The app has a feature-flag system (`src/lib/features.ts`). With `FEATURES` unset (the MVP), these are off: `english-locale`, `public-programs`, `activity-proposals`, `edit-suggestions`, `review-discussion`, `activities-table-view`, `admin-taxonomies`, `api-docs`, `issue-reports`, `usage-tracking`. The first review pass ran with `FEATURES=all` and so included screens users cannot reach. This revision re-ran everything on a server with `FEATURES` empty (port 3201, e2e database) and classifies each finding as **MVP** (fix now) or **Deferred** (belongs to a hidden feature).

What the MVP user sees: home, catalogue (card view only, star rating but no reactions or replies), activity detail (actions: "Adicionar ao programa", "Avaliar"), sign-in, About, Privacy, programs list, program page (schedule, Excel/PDF export, "Criar evento no eAEP"), program edit; for admins: a dashboard with three counts and two links, activities list, activity create/edit, users.

Not covered: a populated program schedule (the entries API rejected my test payload, so only the empty schedule was seen), real screen readers, real devices, and Production data. "E2E …" activity names in screenshots come from the test database. A floating round island icon at the bottom right of every screenshot is not in the app source and appeared only in the dev server; it was excluded.

## Goals / Non-Goals

**Goals:**
- Fix the concrete defects visible in the MVP and make the baseline checkable by a test.

**Non-Goals:**
- A redesign, new colours or tokens.
- Reviewing or fixing hidden features now.
- Rewriting Portuguese copy without the maintainer's approval.

## What the review found

### Passing (keep)
- Tokens only (no hex/rgb or Tailwind palette colours in components; two exceptions outside MVP screens: `error-boundary.tsx` and `api/docs/page.tsx`). Weights 400/700, 4 px radius.
- axe in MVP: no colour-contrast, name, label, alt, link-name or duplicate-id violations; one `h1` per page; `lang="pt"`; no horizontal overflow at 390 px; no console errors; mobile menu and filter sheet work; visible 3 px focus ring.

### MVP findings (fix now)

| # | Sev | Area | Evidence | Fix direction |
|---|---|---|---|---|
| 1 | H | Keyboard | Four top-bar external links and the logo precede the first nav link; no skip link anywhere in the code | Skip link to `#main` as first focusable element |
| 2 | H | Admin editor | "Esforço" is a text input prefilled `medium` (English) on a Portuguese page; "Descrição" is one line; labels hard-coded in Portuguese rather than in `pt.json` | Select or choice group with translated labels; textarea; move strings |
| 3 | H | Admin editor | All six steps stay in the DOM with `hidden`; required fields in a hidden step make native validation fail silently | Per-step validation, error summary, focus first invalid field, switch step |
| 4 | M | Touch targets | Under 24 px: top-bar links 16, footer links 20, catalogue and admin title links 17–20, admin form checkboxes 13, About "Ver no GitHub" and Privacy e-mail 17. Under 44 px on phone: "Entrar" 32, avatar 40×32, default buttons 40 | `touch` size for primary controls; larger hit areas for standalone links and checkboxes |
| 5 | M | Landmarks | axe `region` on every page; two unlabelled `nav`s on the admin dashboard | Wrap top bar and footer in landmarks; label navs |
| 6 | M | Headings | Activity detail goes `h1 h3 h4 h2` | Correct levels |
| 7 | M | Detail image | "Sem imagem" panel is about 270 px tall on phone and pushes the content down | Compact placeholder until an image exists |
| 8 | M | Catalogue cards | Image band shows only a category label when there is no image; objective chips are cryptic and colour-coded by division with no legend | Collapse the band; accessible names and a legend/tooltip |
| 9 | M | Home | Card "Colaboração" (share programs) describes the hidden `public-programs` feature; "Recursos" promises materials; the four cards look interactive but are not links | Make cards links; align copy with visible features (needs maintainer approval) |
| 10 | M | Program page | "Criar evento no eAEP" is greyed out with no reason; loading is a bare spinner here but "Carregando programa..." on the edit page; edit page repeats "Editar Programa" as page and card title | Explain disabled state; one loading pattern; single title |
| 11 | M | Admin | Dashboard has only three counts and two bare links; counts are not links; activities list is 39 unfiltered rows with no search, status filter or pagination; status is grey text | Count links, list search/filter/pagination, status badge |
| 12 | L | Footer/About | "GitHub" and "Ver no GitHub" are hard-coded to one repository | Configurable or removed |
| 13 | L | Type scale | 11 px (detail) and 12 px used for meaningful text | Minimum 12 px secondary, 14–16 px form text |

### Deferred (hidden in the MVP)

| Flag | Finding |
|---|---|
| `issue-reports` | Fixed "Reportar" button covers card text, checkboxes and footer links on phones; 36–40 px high |
| `review-discussion` | Reaction pills 22 px high; "Haha"/"Wow" tone |
| `edit-suggestions` | "Sugerir alteração" wraps alone onto a second row on phone |
| `activity-proposals` | Member "Propor atividade" shows the same editor defects (resolved by findings 2–3) |
| `activities-table-view` | Title links 17–20 px in table rows |
| `admin-taxonomies`, `edit-suggestions`, `issue-reports`, `usage-tracking` | Admin sub-navigation with many sections; status filters for these queues |
| `english-locale` | English parity per screen |

## Decisions

### Fix structurally, enforce with a test
Each fix lands with a test. A Playwright + axe spec over the MVP route list runs in the existing `mvp` project at 1280 px and 390 px. axe does not run the WCAG 2.2 target-size rule by default, so the spec enables it, with a custom check for 44 px on primary controls on phone (24 px is the WCAG 2.2 AA floor; 44 px is a project target proposed here). Flagged features get the same check when they ship.

### Touch targets without changing desktop density
A `touch` size on `Button` and equivalent padding for links and pills, applied below `md` and on coarse pointers. Links inside a sentence are exempt.

### Skip link and landmarks
A visually hidden link that shows on focus, using existing tokens and the 3 px focus style. The top bar goes inside the header landmark; the footer is `contentinfo`. No visual change.

### Editor form
One component, controlled step state, per-step validation using the existing Zod write schema, `Select`/`Textarea` and the enum label helpers already used by the checkbox groups. Strings go to `pt.json`/`en.json`. Step buttons keep `aria-current="step"` and gain Anterior/Seguinte.

### Admin without a new navigation yet
Link the pending count to a filtered list and give the list search, status filter and pagination through query parameters. A shared `AdminNav` waits until more admin sections are switched on.

### Home cards
Make them links to existing destinations. Which cards stay, and their text, is a content decision for the maintainer.

## Risks / Trade-offs

- **Larger touch targets change phone density** → apply only on touch/narrow viewports; compare screenshots.
- **New landmarks can break e2e selectors** → update selectors in the same change and run the chromium, Mobile Chrome and mvp projects.
- **Per-step validation touches a core admin flow** → unit tests plus the existing admin create/edit e2e.
- **Deferred findings can be forgotten** → each is recorded above and tagged to its flag; a task adds a note to the spec for those features.
- **Partly automated review** → a real screen-reader and phone pass is a follow-up task.

## Migration Plan

Ship as separate PRs: (1) skip link, landmarks, headings; (2) touch targets; (3) editor form; (4) catalogue, detail, home; (5) program page and admin list; (6) CI accessibility spec, first in report-only mode.

## Open Questions

- Home cards: reword "Colaboração" and "Recursos", or hide them until the features exist?
- Keep the GitHub links at all? If yes, from config.
- Is 44 px acceptable for admin tables on desktop, or keep admin compact?
- Why is "Criar evento no eAEP" disabled for an empty program: intended, or a missing Orgo configuration? (Needs a code check before writing the explanation.)
