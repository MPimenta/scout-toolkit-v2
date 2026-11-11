## Context

See `proposal.md` for motivation and `specs/design-system/spec.md` for the requirements.

**Sources read in full**

- *Brand Book, Manual de Normas Gráficas, Marca Associativa* (Canva, 76 pages, screenshotted and read page by page). Relevant: colour system pp. 27–38, typography pp. 39–40, graphic elements p. 41, photography p. 42, grid and hierarchy pp. 44–51, voice pp. 52–57, patterns pp. 57–58, digital applications pp. 60–62, symbols pp. 67–71. It prints hex, RGB, CMYK, Pantone and tint tables for the two brand colours only. It defines **no** division colours and **no** dark theme.
- Public staging site `escoteiros.pt/staging`, WordPress block theme `escoteiros-2026` v2.2.0 (`style.css` and `theme.json` read directly). It ships its own named palette, a Plus Jakarta Sans type scale, a 4 px radius and a small set of patterns (top bar, nav with teal underline, cards with teal top rule, eyebrow with a leaf, values strip, callout box, arrow buttons). It uses **no** division colours either.
- *Regulamento do Programa para Jovens* v1.2 (Dec 2024). It names each division's identifying colour by Pantone reference and gives the official division names and ages.
- Workbook *Matriz Progresso Pessoal* (see `progress-matrix-objectives`).

**Where the sources disagree**

| Item | Brand Book | Staging site | Choice |
| --- | --- | --- | --- |
| Azul AEP / Verde-água AEP | `#154697` / `#00A5A5` | same | same |
| Dark blue | `#0F2F5A` | `#0F3474` | site (11.9:1 with white, already shipped) |
| Dark teal | `#007777` | `#007D80` | site (4.95:1 with white) |
| Light backgrounds | `#E8EEF9` / `#E6F6F6` | `#F1F6F5` | site for sections; manual tints kept as extra tokens |
| Digital typeface | Arial (p. 40) | Plus Jakarta Sans | **Arial**, chosen by the product owner |
| White on `#00A5A5` | "AAA" | used for strips and stickers | measured 3.03:1, large text only |
| Primary action colour | blue is the title/institutional colour | blue buttons, teal accents | blue primary, teal accent |

**Current app.** `--primary` is teal with a near-black foreground, `--secondary` is blue, body font Arial, `--radius` 0.5 rem, shadcn components. About 20 files use `primary`/`secondary`, 3 contain raw hex, 6 contain Tailwind palette colours.

## Goals / Non-Goals

**Goals:** one token source and one written rulebook; the app reads as a sibling of the public site; contrast guaranteed by tests; division colours available for the objective pills.

**Non-Goals:**

- No Storybook and no in-app style-guide route (a route would need classifying under the feature-route test; the Markdown document is enough for now).
- No Plus Jakarta Sans, no Garet on the web.
- No copy changes (CLAUDE.md): the public site's division names (Alcateia, Tribo de Escoteiros, Tribo de Exploradores, Clã) differ from some of our UI labels; aligning labels is a separate, copy-level change. Tokens are keyed by enum so they do not depend on it.
- No recolouring of the PDF export.
- No logo work (already shipped under `public/brand/`).

## Decisions

**D1. Roles: `--primary` becomes Azul AEP, the teal moves to `--accent` and `--ring`.**
shadcn semantics already separate `primary`, `secondary`, `accent` and `ring`. `--secondary` becomes the quiet surface/secondary-button role (Azul muito claro background, Azul AEP text) instead of blue. The about-20-file migration is mechanical: `bg-primary` buttons gain white text, `text-secondary` links become `text-primary`, teal fills become `bg-accent text-accent-foreground`.
*Alternative:* keep teal primary. Rejected: the public site's calls to action are blue, and teal with near-black text looks different from every AEP surface.

**D2. Contrast is a tested contract, not a guideline.**
A small module lists every declared text/background pair (name, foreground token, background token, minimum ratio, theme). A unit test resolves tokens from `globals.css`, computes WCAG ratios and fails below the minimum. This also catches the Brand Book's incorrect "AAA" claim for white on teal.

**D3. Division tokens carry their own label colour.**
Each division has `--division-<name>` and `--division-<name>-foreground`, because the right label colour differs per fill (dark on yellow, white on green and navy, near-black on red). Keys use the enum (`cub-scouts`, `scouts`, `adventurers`, `rovers`, `leaders`). Hex values are the sRGB conversions of the Regulamento's Pantone references (109, 348, 280, 032) and white for Chefia; confirmation by the brand owners is a recorded, non-blocking input. Dark theme: same fills, plus a 1 px light outline so navy and dark green stay visible; the Chefia pill keeps its border in both themes.
*Alternative:* derive division colours from the blue/teal ramps. Rejected once official colours turned up.

**D4. Tokens are enforced by tests and lint, not review.**
Three checks: (1) a token-pin test comparing `globals.css` values with a typed constant that the documentation also renders; (2) the contrast test; (3) a source scan rejecting hex colours, `rgb(`, and Tailwind palette classes in `src/components` and `src/app` outside an allow-list (SDG artwork, PDF styles). Division tokens are allowed only in the pill component, which the scan checks by name.

**D5. Typography stays Arial with two weights.**
Arial has no 500/800 cut, so `font-medium` and `font-extrabold` would be synthesised; the shadcn defaults that use `font-medium` change to 400 or 700. Letter-spacing is allowed only on the uppercase eyebrow label to match the public site.

**D6. Shape vocabulary comes from the Brand Book, applied sparingly.**
Ring, rhombus and star appear as `aria-hidden` decorations in empty states, hero bands and section markers. The rhombus-as-photo-mask and ring-grid patterns are available for marketing-style pages only. No page uses more than one gradient panel.

**D7. Documentation is generated from the same constants.**
`docs/design-system.md` is written by a small script from the token constants and pair list, so the table in the document cannot drift from the code. Page references to the Brand Book stay in prose.

## Risks / Trade-offs

- **Visual regression across ~20 files** → migrate in small steps (tokens first, then `ui/*`, then features), review each screen at desktop and phone widths, and update component tests.
- **Brand owners may have different sRGB values for the Pantone references** → values live in one place (`globals.css` plus the constant), so a correction is a one-line change and the pin test makes it deliberate.
- **Brand Book vs public site differences** (dark blue, dark teal, surfaces) → the table above records the choice; revisit if the brand owners prefer the manual's values.
- **Red label colour is near-black, not white** → looks unusual next to the other pills but is the only AA-passing option for small text; a larger, bold white label is allowed above 18.66 px.
- **Dark theme is ours** → limited to tokens that already pass; flagged as an extension.
- **Public site loads Plus Jakarta Sans, we do not** → the product owner chose Arial, following the Brand Book; the visual difference is typographic only.

## Migration Plan

1. Add division tokens and the new role tokens to `globals.css` and Tailwind keys; keep old names working through aliases for one pass.
2. Land the pin, contrast and no-raw-colour tests (they fail first, then pass as files migrate).
3. Migrate `src/components/ui/*`, then header/footer, then feature components, then pages.
4. Update `docs/design-system.md` and `docs/brand-handoff.md`; align the devlog accents.
5. Rollback is a revert of the token file and component classes; no data or schema is involved.

## Open Questions

- Do the brand owners want the manual's dark blue and dark teal instead of the site's? (Current choice: the site's.)
- Should the cream accent get a token once a value is confirmed, and where would it be used (footer bar, subtitle chips)?
