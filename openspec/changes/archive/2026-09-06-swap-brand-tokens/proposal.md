## Why

The 2026 AEP marca associativa and logo set are now in hand. Kit de Atividades still uses the Story 2.2 110-anos yellow-green / navy tokens and a missing `logo_escoteiros.png`.

## What Changes

- Replace CSS brand tokens with hex sampled from the official full-colour lockup
- Ship the lockup and flor-de-lis in `public/brand/` and use them in the header and app icon
- Sync the Astro devlog accent hex to the same pair
- Rewrite `docs/brand-guidelines.md` / `docs/brand-handoff.md` to the received assets
- Keep WCAG AA on buttons and small text (teal fails 4.5:1 as body/link colour on white)

## Capabilities

### New Capabilities

None. This modifies the existing `visual-system` capability.

### Modified Capabilities

- `visual-system`: token values, logo paths, and the handoff gate now that assets arrived

## Impact

- Visual only. Product name stays Kit de Atividades. No Portuguese copy rewrite.
- PDF export stays print-neutral.
- Official SDG colours stay UN-derived.
- No typeface change: the zip has no fonts; Inter and Atkinson stay.
