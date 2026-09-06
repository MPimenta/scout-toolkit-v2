## Why

The app still uses the Story 2.2 palette (Pantone 383 C / 280 C) and a missing header logo. A new associativa manual is coming. We need a specified visual system and a hard gate against inventing tokens, so the next apply can swap colours and type without guessing.

## What Changes

- Record the visual-system capability: CSS variables as the only brand tokens, logo/favicon/typeface rules, and WCAG AA contrast
- Document the handoff gate: no new Pantone values until `docs/brand-handoff.md` is complete
- Decide PDF export stays print-neutral (current greys) until a later token-swap change
- Decide the Astro devlog MUST share the same palette when tokens change (Epic 2 promise)
- Point `docs/planning.md` at this OpenSpec change; do not duplicate the task list there
- Product name stays Kit de Atividades (no copy rewrite)

## Capabilities

### New Capabilities

- `visual-system`: Brand tokens, logo, type, contrast, PDF and devlog colour policy

### Modified Capabilities

- (none)

## Impact

- Docs: `docs/brand-guidelines.md`, `docs/brand-handoff.md`, `docs/planning.md`
- Tokens: `src/app/globals.css`, later `src/app/layout.tsx`, `public/` logos, `devlog/src/styles/global.css`
- PDF HTML in `src/lib/export/pdf-html.ts` is explicitly out of this colour swap
- No API or schema changes
