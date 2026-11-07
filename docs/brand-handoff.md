# Brand handoff inventory

Product name stays **Kit de Atividades**. Visual system only — no copy rewrite.

Manual: [76-page Canva brand book](https://www.canva.com/design/DAHGXTHyXS8/6csiExlDrnk-Ok6vWtABJg/view?utm_content=DAHGXTHyXS8&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=hd749957af2#1) — trailing `#n` is the page. Walked `#1`–`#76` in the viewer.

## Received

| Item | Status |
| --- | --- |
| Brand manual | Received — 76 pages. Colour system pp. 27–38, type pp. 39–40, digital p. 60 |
| Primary / secondary | Pantone **7716 C** `#00A5A5`, Pantone **2945 C** `#154697`, plus the tint tables on pp. 29–30 |
| Supporting green | Pantone **357 CVC** `#035928` (earlier JSON; not the two main digital tokens) |
| Logo set | `public/brand/` lockup + flor-de-lis |
| Typeface | **Arial** for web/digital (p.40). **Garet** for print (p.39) |
| Radius / spacing | Grid chapter exists (pp. 49–50). 4 px radius and the spacing scale follow the public site; see `docs/design-system.md` |

## Confirmed

- Product name: Kit de Atividades
- Organisation: Escoteiros de Portugal (2026 marca associativa)
- UI language: Portuguese only

## Contrast notes

The book marks white on teal (`#00A5A5`) as AAA. It measures **3.03:1**, so teal is large-text and non-text only: text on a teal fill is near-black, and small links are Azul AEP. Azul AEP `#154697` on white is 8.9:1. The full measured contract lives in `docs/design-system.md` (generated from `src/lib/design/tokens.ts`).

## Sources read

| Source | What it gave us |
| --- | --- |
| Brand Book, 76 pp. | Two brand colours with tints (pp. 27–30), Arial for digital (p. 40), graphic elements (p. 41), patterns (pp. 57–58), digital applications (pp. 60–62), lockup rules (pp. 22–26). **No division colours, no dark theme, no hex for the cream accent.** |
| Public staging site `escoteiros.pt/staging` (theme `escoteiros-2026`) | Palette variants, 4 px radius, card/nav/footer patterns. Uses Plus Jakarta Sans; we keep Arial (product owner decision). |
| Regulamento do Programa para Jovens v1.2 (Dec 2024) | Division names, ages and identifying colours by Pantone reference. |

## Where sources disagree (choice)

| Item | Brand Book | Public site | Used |
| --- | --- | --- | --- |
| Azul escuro | `#0F2F5A` | `#0F3474` | Site |
| Verde-água escuro | `#007777` | `#007D80` | Site |
| Light surface | `#E8EEF9` / `#E6F6F6` | `#F1F6F5` | Site for sections; manual tints kept as extra tokens |
| Typeface | Arial (digital) | Plus Jakarta Sans | Arial |
| White on teal | "AAA" | used on strips | 3.03:1, large text only |

## Division colours

| Age group | Division | Pantone (Regulamento) | Hex used (conversion) |
| --- | --- | --- | --- |
| `cub_scouts` | Alcateia | 109 | `#FFD100` |
| `scouts` | Tribo de Escoteiros | 348 | `#00843D` |
| `adventurers` | Tribo de Exploradores | 280 | `#012169` |
| `rovers` | Clã | 032 | `#EF3340` (label near-black: white is 4.02:1) |
| `leaders` | Chefia | white (product owner) | `#FFFFFF` with border |

## Open inputs

- [ ] Brand owners confirm the four sRGB conversions of the Pantone references (a one-line change in `globals.css` and `tokens.ts`).
- [ ] Brand owners supply a value for the cream accent (no token until then).
- [ ] Brand owners confirm the site's dark blue and dark teal over the manual's.
