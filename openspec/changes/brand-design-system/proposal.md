## Why

The app still carries a first, partial reading of the rebrand: teal as the main action colour with dark text on it, an unreviewed neutral palette, no component rules, and no division colours. The 76-page *Brand Book* (Manual de Normas Gráficas, Marca Associativa) is now fully read, and the rebranded public site (`escoteiros.pt/staging`, theme `escoteiros-2026`) shows how the brand is applied in practice. Leaders move between the two sites, so Kit de Atividades should look like the same product family, with one written design system instead of ad-hoc choices per component.

## What Changes

- Define a **design system** from the Brand Book, aligned with the staging site: colour palette and tint ramps, neutrals, typography (Arial, per the Brand Book), spacing, shape and elevation, graphic motifs (ring, rhombus, star, gradients), component rules (buttons, links, cards, eyebrow labels, callouts, forms, navigation, footer, pills), imagery, motion and accessibility.
- Align action colours with the public site: **Azul AEP is the primary action colour** (white text, 8.9:1); **Verde-água AEP is the accent** (focus ring, underlines, card top rule, strips, leaf and ring motifs). This replaces the earlier "teal is primary" reading.
- Record where the Brand Book and the staging site disagree (dark blue, dark teal, light surfaces) and pick one value per token.
- Correct the Brand Book's contrast claims: white on `#00A5A5` measures 3.03:1, so teal fills carry dark text or large text only.
- Add **division colour tokens** for the five divisions. The Brand Book and the staging site define none, but the *Regulamento do Programa para Jovens* v1.2 names each division's colour by Pantone reference (Alcateia yellow 109, Tribo de Escoteiros dark green 348, Tribo de Exploradores dark blue 280, Clã red 032) and the brand owners confirmed Chefia is white. The design system records sRGB values, per-division label colours that pass AA (the Clã red needs near-black text, 4.02:1 with white) and a visible border for the white Chefia pill. These are the tokens the `progress-matrix-objectives` pills use.
- Add guard-rails: a token reference document, tests that pin the token values and check contrast pairs, and a test that rejects raw hex colours in components.
- Migrate existing components to the tokens (about 20 files use `primary`, `secondary`, hard-coded hex or palette colours).
- Not in scope: rewriting Portuguese copy, the PDF export palette, a Storybook or in-app style-guide route, and logo files (already shipped).

## Capabilities

### New Capabilities

- `design-system`: the token catalogue, component rules, graphic language, imagery, motion, accessibility rules, division colours, documentation and automated guard-rails.

### Modified Capabilities

- `visual-system`: primary/secondary roles, the handoff gate (the manual has now been received and read), and the contrast rules for interactive colours.

## Impact

- `src/app/globals.css`, `tailwind.config.js`, `src/components/ui/*` (button, badge, card, input, select, textarea, switch, dialog, sheet, table), header/footer and feature components that use `primary`/`secondary`, 3 files with raw hex, 6 with palette colours.
- New `docs/design-system.md`; `docs/brand-handoff.md` updated from "received" to a full inventory with page references.
- `devlog/src/styles/global.css` follows the new accents (existing `visual-system` requirement).
- Tests: token pin test, contrast test, no-raw-hex lint test; updated component snapshots.
- Coordination: `progress-matrix-objectives` consumes the division tokens (its colour task depends on this change's division tokens); typeface follows the Brand Book (Arial) even though the public site loads Plus Jakarta Sans.
- Open input: the brand owners confirm the sRGB hex conversions of the four Pantone references and the cream accent value (none is printed in the Brand Book).
