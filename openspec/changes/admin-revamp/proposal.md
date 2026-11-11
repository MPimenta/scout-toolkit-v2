## Why

The admin area grew screen by screen: a stats strip on the home page, an activity list with a form, a taxonomies page, a usage page, reports, suggestions and users. It does not yet answer the questions the catalogue owners actually have: *Which objectives, areas, divisions and desafios do our activities cover, and where are the gaps? Which activities do leaders really put in programs?* It also cannot manage the new formats and focuses (see `reference-sheet-alignment`), and managing ~1,000 activities one at a time through the current list is slow. With the full activity set about to be loaded, this is the moment to make the admin area usable at that size.

## What Changes

- **A statistics area** under one admin entry, with three views: *Utilização* (the existing usage page, unchanged in content), *Cobertura* (new) and *Ranking* (new).
- **Cobertura:** for the catalogue, how many approved activities cover each objective, general objective, educational path, area, division and *desafio*, with gaps (zero coverage) first, filters by division and area, and an Excel export. A second lens shows the same coverage for activities that leaders have **actually put in programs**, so the team can compare what exists with what is used.
- **Ranking:** the activities most added to programs (distinct programs and distinct leaders), with period, division, format and focus filters, and the same ranking for the least used approved activities.
- **Activities management at scale:** server-side pagination, search, filters (approval, format, focus, division, source, completeness), a *completeness* indicator (missing objectives, format, focus, image, risk), bulk approve/unapprove/delete with confirmation, duplicate an activity, and a warning on delete that shows how many programs use it.
- **Formats and focuses management** on the taxonomies page: values from the reference sheet are read-only; admins can add their own values, rename or delete them, and **move all activities** from one value to another before deleting it.
- **Notas de versão (release notes):** an admin-only page that shows what each release delivers, so the team can see what shipped and what is planned. The notes are kept in a Markdown file in the repository (`docs/release-notes.md`), one section per release (version, date, status *planeada* or *lançada*) with items grouped as *Novo*, *Melhorado* and *Corrigido*, each optionally naming the OpenSpec change that delivers it. The page shows them read-only, newest first, and can copy a release as plain text. Editing the notes is a change to the file, reviewed like any other.
- **One navigation:** an admin menu grouped as Catálogo (atividades, taxonomias), Estatísticas, Comunidade (sugestões, reportes), Plataforma (notas de versão) and Utilizadores, with counts of pending items.

## Capabilities

### New Capabilities
- `admin-coverage-statistics`: coverage of objectives, areas, divisions and *desafios* by the catalogue and by programs, gaps, and export.
- `admin-activity-ranking`: ranking of activities by additions to programs, with filters.
- `admin-release-notes`: the admin page that shows the release notes kept in the repository, and the format of that file.

### Modified Capabilities
- `admin-activities`: list at scale (pagination, filters, completeness), bulk actions, duplicate, delete warning with program count.
- `admin-taxonomies`: formats and focuses management (sheet values read-only, own values, move before delete).
- `admin-usage-analytics`: the usage page lives inside the statistics area; its figures and rules do not change.

## Impact

- Routes and pages: `/admin/estatisticas` (new, with `utilizacao` moved under it and a redirect from the old path), `/admin/estatisticas/cobertura`, `/admin/estatisticas/ranking`; new `/api/admin/coverage` and `/api/admin/ranking`; bulk endpoint for activities. All classified in `FEATURE_ROUTES`.
- The release notes page is `/admin/notas-de-versao` (server-rendered, admin only, classified in `FEATURE_ROUTES`); it reads `docs/release-notes.md`, which must be included in the deployed build. There is no API and no table for it.
- The usage views keep their `usage-tracking` flag; coverage and ranking read the catalogue and `program_entries` only, so they do not depend on that flag.
- No schema change is required by this change (indexes only if the aggregate queries need them, decided after measuring on the full activity set).
- Depends on `reference-sheet-alignment` for formats, focuses, the complete Matriz links and the full activity set, and on the archived `usage-tracking` and `admin-usage-analytics` for the existing usage page.
- Messages in `pt.json` and `en.json`; Portuguese admin copy needs approval before it is final.
- Tests: unit (coverage and ranking aggregation), SQL-integration (aggregates on a small seeded set, bulk actions, move-before-delete), API tests (403 for non-admins), Playwright for the filters, the gap list and the export.
- Out of scope: new tracking events, user-level analytics beyond what exists, public statistics, scheduled reports; a public "Novidades" page for leaders, editing release notes inside the admin, and generating them automatically from git.
