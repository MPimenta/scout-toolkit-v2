# Brand Guidelines - Kit de Atividades

## Overview

Official visual system for Kit de Atividades. Product name stays **Kit de Atividades**. Visual system only — no copy rewrite.

Source: 2026 AEP [Manual de Normas — Marca Associativa](https://www.canva.com/design/DAHGXTHyXS8/6csiExlDrnk-Ok6vWtABJg/view) and the lockup set in `public/brand/`. Behaviour: `openspec/specs/visual-system/spec.md` plus change `swap-brand-tokens`.

Program PDFs stay print-neutral greys (`src/lib/export/pdf-html.ts`). Official SDG colours stay UN-derived.

## Color Palette

Swatches from the [Canva brand book](https://www.canva.com/design/DAHGXTHyXS8/6csiExlDrnk-Ok6vWtABJg/view?utm_content=DAHGXTHyXS8&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=hd749957af2#1) (pages `#1`–`#20` in this file). The lockup PNG teal matched 7716 C exactly; the wordmark blue is the official 2945 C hex, one step off the PNG sample.

### Primary — Teal (Pantone 7716 C)

- **Hex / RGB:** `#00A5A5` / 0 165 165
- **CMYK:** 100 / 0 / 0 / 35
- **CSS:** `--primary: 180 100% 32%`
- **Usage:** Primary buttons, icons, large headings, focus ring
- **Foreground:** near-black — white-on-teal fails AA for normal text

### Secondary — Blue (Pantone 2945 C)

- **Hex / RGB:** `#154697` / 21 70 151
- **CMYK:** 86 / 54 / 0 / 41
- **HSL (manual):** 217° / 76% / 34%
- **Usage:** Secondary buttons, small links, header hover
- **Foreground:** near-white

### Supporting — Forest (Pantone 357 CVC)

- **Hex / RGB:** `#035928` / 20 77 41
- **CMYK:** 80 / 0 / 100 / 56
- **HSL (manual):** 142° / 59% / 19%
- **Usage:** Not mapped to a Tailwind key yet (manual supporting green)

### Implementation

```css
:root {
  --primary: 180 100% 32%; /* #00A5A5 Pantone 7716 C */
  --primary-foreground: 222.2 84% 4.9%;
  --secondary: 217 76% 34%; /* #154697 Pantone 2945 C */
  --secondary-foreground: 210 40% 98%;
  --accent: 180 100% 32%;
  --ring: 180 100% 32%;
}
```

The Astro devlog uses `--accent: #00A5A5` and `--accent-dark: #154697`.

### Tints (manual pp. 29–30)

| Token | Hex | Use |
| --- | --- | --- |
| Azul claro | `#2A5FB8` | Hover, light UI |
| Azul base | `#154697` | Logo, titles, institutional |
| Azul escuro | `#0F2F5A` | Contrast, depth |
| Azul muito claro | `#E8EEF9` | Backgrounds |
| Verde claro | `#33BFBF` | Hover, highlights |
| Verde base | `#00A5A5` | Dynamic / accent |
| Verde escuro | `#007777` | Contrast, depth |
| Verde muito claro | `#E6F6F6` | Backgrounds (`--muted`) |

Do not pair teal-on-blue or blue-on-teal (manual: evitar).

## Typography

- **Print / institutional:** Garet — Regular, Bold, Italic, Bold Italic (p.39)
- **Digital, including this app (p.40):** Arial Regular / Bold / Italic / Bold Italic. Do not expand, condense, or distort characters.
- **Devlog:** Atkinson (unchanged; separate site)

## Logo Usage

| File | Use |
| --- | --- |
| `/brand/marca_aep.png` | Header lockup on light chrome |
| `/brand/marca_aep_branco.png` | Lockup on dark chrome |
| `/brand/marca_aep_FL.png` | Flor-de-lis / app icon |
| `/brand/favicon.png` | Tab/app favicon (outer white transparent) |
| `/brand/marca_aep_FL_branco.png` | Flor-de-lis on dark chrome |

- Maintain aspect ratio; minimum lockup height 40px
- Use `unoptimized` on the crafted PNG
- Backgrounds are transparent — do not place the white mark on white

## Accessibility

- WCAG 2.1 AA for buttons and small text
- Do not use teal as small-text colour on white
- Keyboard focus uses `--ring` (teal meets ~3:1 UI-component contrast)

## Version History

- **v1.0–v1.4** — Story 2.2 Pantone 383 C / 280 C (110 anos)
- **v1.5** — OpenSpec handoff gate; token swap blocked
- **v2.0** — 2026 marca associativa (Pantone 7716 C `#00A5A5` / 2945 C `#154697`); lockup in `public/brand/`
- **Date:** 2026-09-05
