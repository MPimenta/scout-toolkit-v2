## Context

Zip `drive-download-20260905T223426Z-1-001` contains 18 transparent PNGs. The Canva [Manual de Normas](https://www.canva.com/design/DAHGXTHyXS8/6csiExlDrnk-Ok6vWtABJg/view?utm_content=DAHGXTHyXS8&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=hd749957af2#1) is a 20-page digital file (`#1`–`#20`). Official swatches in the design JSON: Pantone 7716 C `#00A5A5`, 2945 C `#154697`, 357 CVC `#035928`. Typeface named: Garet.

## Goals / Non-Goals

**Goals:** apply sampled tokens, header lockup, favicon, guidelines, devlog sync, AA for interactive text.

**Non-Goals:** PDF recolour, SDG recolour, copy rewrite, new typeface, downloading the whole Canva page as a PDF into the repo.

## Decisions

- **Teal `#00A5A5` Pantone 7716 C → `--primary` / `--accent` / `--ring`** (`180 100% 32%`).
- **Blue `#154697` Pantone 2945 C → `--secondary`** (`217 76% 34%`). PNG sample was `#0B4697`; the manual hex wins.
- **`--primary-foreground` stays near-black.** White-on-teal is ~3.0:1. Dark-on-teal is ~6.9:1.
- **Small links use secondary, not primary.**
- **Header lockup:** `/brand/marca_aep.png`. Icon: flor-de-lis.
- **Type:** Arial for digital/web (manual p.40). Garet is print-only (p.39). Do not vendor Canva’s Garet files.
- **PDF:** still print-neutral greys.

## Risks / Trade-offs

- The book claims teal-on-white is AAA; measured contrast is ~3.0:1, so small links stay blue.
- Grid/spacing chapter (pp. 49–50) is not yet a CSS scale.
- Teal headings that are large text (~3.0:1) only just meet large-text AA.
- White lockup is available for dark chrome later; the app header is light.

## Migration Plan

1. Copy lockup + FL (+ white fallbacks) into `public/brand/`
2. Swap CSS variables and header/icon paths
3. Sync devlog hex
4. Update brand docs and this delta
