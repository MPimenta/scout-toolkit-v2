## 1. Tokens

- [x] 1.1 In `src/app/globals.css` define the palette tokens from the design-system table for `:root` and `.dark`: `--primary` Azul AEP (`217 76% 34%`) with white foreground, `--accent` and `--ring` Verde-água AEP (`180 100% 32%`) with near-black foreground, Azul escuro, Azul muito claro, Verde-água escuro/claro/muito claro, Fundo claro, Linha, Texto, Texto secundário; make `--secondary` the quiet surface role. Map them in `tailwind.config.js`.
- [x] 1.2 Add the five division pairs (`--division-cub-scouts`, `-scouts`, `-adventurers`, `-rovers`, `-leaders`, each with `-foreground`) with the values in the spec, the dark-theme outline and the Chefia border, and Tailwind keys for them.
- [x] 1.3 Add `src/lib/design/tokens.ts` with the typed token constants and the list of declared contrast pairs (name, foreground, background, minimum, theme), used by the tests and by the documentation script.
- [x] 1.4 Add scale tokens: type sizes, spacing steps, 4 px radius for controls, the three shadows, 150–200 ms transitions, and a `prefers-reduced-motion` rule.

## 2. Guard-rails (written first, expected to fail until step 3 is done)

- [x] 2.1 Token pin test: parse `globals.css` and compare every token with `tokens.ts` in both themes.
- [x] 2.2 Contrast test: resolve each declared pair, compute the WCAG ratio, fail below the minimum; include the division pairs (8.36, 4.81, 14.76, 4.97, 12.22) and the "never" pairs as expected failures.
- [x] 2.3 No-raw-colour scan over `src/components` and `src/app` (hex, `rgb(`, Tailwind palette classes, font weights 500 and 800) with an allow-list for SDG artwork and PDF styles, and a check that division tokens appear only in the pill component.
- [x] 2.4 `scripts/build-design-doc.ts` renders `docs/design-system.md` from `tokens.ts`; add `npm run docs:design` and a test that the committed file is up to date.

## 3. Components

- [x] 3.1 Migrate `src/components/ui/*` (button, badge, card, input, select, textarea, switch, dialog, sheet, table, alert-dialog, dropdown-menu): primary blue with white text, accent teal with near-black text, outline and ghost variants, 4 px radius, 400/700 weights, 3 px focus ring (white on blue backgrounds), disabled state.
- [x] 3.2 Card pattern: hairline border, 3 px teal top rule, optional 4:3 photo, eyebrow, Bold title clamped to 3 lines, emphasised text link, hover lift and shadow, reduced-motion safe. Apply to `ActivityCard` and program cards.
- [x] 3.3 Eyebrow label, callout box and (large-text-only) values strip as small shared components.
- [x] 3.4 Header and footer: white header with hairline, bold nav with 3 px teal underline for hover and current, submenu border and shadow, optional slim blue top bar, Azul escuro footer with uppercase teal headings. Keep the 44 px phone targets and the hamburger behaviour from `mobile-layout`.
- [x] 3.5 Form states: label above field, hairline border, invalid state with message and `aria-invalid`, placeholder in Texto secundário.
- [x] 3.6 Decorative motifs as `aria-hidden` components (ring, rhombus, star) and the two sanctioned gradients; use them in empty states and the home hero only.
- [x] 3.7 Replace the 3 files with raw hex and the 6 with palette colours; fix text links from teal to Azul AEP.
- [x] 3.8 `DivisionPill` component: division background and label tokens, code text, accessible name with the division name, Chefia border, dark-theme outline, neutral fallback. (Consumed by `progress-matrix-objectives` task 7.2.)

## 4. Documentation and coordination

- [x] 4.1 Run `npm run docs:design`; review `docs/design-system.md` (tokens, pairs, patterns, Brand Book page references).
- [x] 4.2 Rewrite `docs/brand-handoff.md`: sources read with page references, the disagreements table, division colours with Regulamento references, and open inputs (hex confirmation, cream value).
- [x] 4.3 Align `devlog/src/styles/global.css` accents with the new tokens (existing `visual-system` requirement).
- [ ] 4.4 Ask the brand owners to confirm the four sRGB conversions and the cream value; record the answer in the handoff file.

## 5. Verification

- [ ] 5.1 `npm run typecheck`, `npm run lint`, `npm run test:run`, `npm run test:e2e`.
- [ ] 5.2 Manual pass at 1440 px and 390 px in light and dark: header, catalogue, activity detail, editor, program builder, admin tables.
- [ ] 5.3 `openspec validate brand-design-system --strict`.
- [ ] 5.4 Archive after `multi-value-activity-categories`; `progress-matrix-objectives` follows this change.
