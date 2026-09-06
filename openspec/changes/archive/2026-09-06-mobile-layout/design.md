## Context

See proposal.md. Header already has `hidden md:flex` nav and `md:hidden` hamburger (`Header.tsx`) — the panel has no backdrop, scroll lock, or Escape handling, and there is no `sheet.tsx`. Lists use `grid-cols-1 md:grid-cols-2`. Activity detail is `flex-col lg:flex-row`. Filters are an always-on multi-column card. `ActivitiesTable` (10 cols) and `ProgramScheduleTable` (12 cols) are overflow-x only. `ProgramBuilder` toolbars (export/PDF/save, edit/delete) stay one row. `ActivityCard` metadata rows do not wrap. `AddActivityModal` is `max-w-4xl`. Sign-in is `min-h-screen` but still renders the global Header/Footer. Container padding is `2rem` and some pages also set `px-4`. Playwright already has Mobile Chrome (Pixel 5) and Mobile Safari (iPhone 12), but existing “responsive” E2E only calls `setViewportSize` on desktop projects. `docs/api/media/architecture.md` already describes a stacked builder that is not implemented. Brand tokens stay. This epic is inserted as 11; former 11–13 become 12–14.

## Goals / Non-Goals

**Goals:**

- Phone-first behaviour at `< md` (768) for shell, catalogue, detail/ratings, programs/builder
- 44px targets; no horizontal scroll on the happy path
- E2E on existing mobile projects

**Non-Goals:**

- Native apps or PWA install
- Redesign desktop
- New typeface or brand colours
- Pixel-perfect visual regression suite (that stays in the testing epic)

## Decisions

### 1. One breakpoint: `md`

Match the header. Do not introduce `sm`-only product behaviour.

### 2. Add a Sheet primitive, then use it

There is no `sheet.tsx`. Add a shadcn Sheet and use it for phone filters and for the hamburger (backdrop, focus trap, Escape, scroll lock). Do not keep the current unlayered dropdown as the long-term menu.

### 3. Table view → stacked rows below `md`

Reuse card data; do not try to pinch-zoom a table. Desktop table unchanged.

### 4. Builder: buttons first, DnD optional

`@dnd-kit` can stay on `md+`. Below `md`, show up/down (and maybe delete) on each `ProgramEntryCard`. Same PATCH order API.

### 5. Header lockup and sign-in chrome

`h-8` / max-width on the PNG below `md` so Sign-in + hamburger fit. Menu includes Administração when role is admin. On `/auth/signin`, hide the global Header/Footer (or drop `min-h-screen` stacking) so the eAEP button is not below a second full header.

### 6. Dialogs

`AddActivityModal` and similar: `w-[100dvw] max-w-lg sm:max-w-4xl` and `max-h-[90dvh]`.

### 7. Stack builder toolbars and wrap card metadata

Below `md`, ProgramBuilder title + Editar/Eliminar and Export/PDF/Guardar SHALL wrap or stack. ActivityCard fact rows SHALL `flex-wrap`. Avoid double horizontal padding (`container` 2rem plus page `px-4`) on phone pages.

### 8. Apply after or with 8–10

Specs require new pages to inherit the shell. Implement mobile on existing pages first; 8–10 apply should use the same Header and sheet patterns.

### 9. E2E on the real mobile projects

New coverage MUST run under Playwright `Mobile Chrome` / `Mobile Safari`, not only `setViewportSize` inside desktop Chromium.

## Risks / Trade-offs

- [DnD users on a tablet in portrait] → `md` is 768; tablets in landscape keep DnD
- [Ratings chrome overflow] → Stack vote column above the comment
- [Admin tables] → Same stacked-row rule when those pages exist

## Migration Plan

CSS/component only. No schema. Rollback is revert the layout commits.

## Open Questions

- Whether phone should hide table view entirely instead of degrading it. Default: degrade so the toggle does not confuse returning users.
