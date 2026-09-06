# visual-system Specification

## Purpose

Defines how Kit de Atividades applies brand colour, type, and the 2026 AEP lockup so the UI stays on one token source and does not invent replacement colours.

## Requirements

### Requirement: CSS variables are the brand tokens

The application SHALL define brand colours as CSS custom properties on `:root` and `.dark` in `src/app/globals.css`, mapped through Tailwind theme keys (`primary`, `secondary`, `accent`, `ring`). Components SHALL NOT introduce a second brand palette. Primary SHALL be Pantone 7716 C (`#00A5A5` / `180 100% 32%`). Secondary SHALL be Pantone 2945 C (`#154697` / `217 76% 34%`).

#### Scenario: Token source

- GIVEN the running web app
- WHEN a primary or secondary UI colour is rendered
- THEN it originates from the CSS variables in `src/app/globals.css`

#### Scenario: Sampled 2026 tokens

- GIVEN `docs/brand-handoff.md` lists the received lockup
- WHEN tokens are applied
- THEN `--primary` is `180 100% 32%` and `--secondary` is `217 76% 34%`

### Requirement: Official lockup on the header

The site header SHALL render the full-colour AEP lockup from `/brand/marca_aep.png` (transparent PNG). The favicon SHALL use `/brand/favicon.png` (outer white knocked out to transparency; centre diamond stays white).

#### Scenario: Header mark

- GIVEN a visitor on any app page
- WHEN the header renders
- THEN the image source is the 2026 lockup, not `/logo_escoteiros.png`

### Requirement: Handoff gate for new tokens

The system SHALL treat `docs/brand-handoff.md` as the inventory of received brand assets. Agents SHALL NOT invent replacement HSL values. Once the lockup PNGs are received, tokens SHALL come from those files (or from Pantone values printed in the manual if they are later transcribed).

#### Scenario: Missing manual

- GIVEN `docs/brand-handoff.md` still marks the manual or logos as missing
- WHEN a brand restyle is requested
- THEN no new primary or secondary HSL values are written to `globals.css`

#### Scenario: Received lockup

- GIVEN `docs/brand-handoff.md` marks the logo set as received
- WHEN a brand restyle is applied
- THEN primary and secondary HSL values match hex sampled from `marca_aep.png`

### Requirement: Product name is unchanged

The product name SHALL remain Kit de Atividades. This change SHALL NOT rewrite Portuguese marketing copy.

#### Scenario: Header and metadata

- GIVEN the root layout metadata and header
- WHEN the visual system change is applied
- THEN the visible product name is still Kit de Atividades

### Requirement: PDF export stays print-neutral

Program PDF HTML SHALL keep its current grey/print styling until a dedicated later change maps it to brand tokens. This change SHALL NOT recolour `src/lib/export/pdf-html.ts`.

#### Scenario: PDF colours

- GIVEN a program PDF is generated
- WHEN this change is archived
- THEN the PDF stylesheet still uses its existing grey tokens, not a new brand primary

### Requirement: Devlog shares the app palette when tokens change

The Astro devlog (`devlog/src/styles/global.css`) SHALL use the same brand accent colours as the Next.js app whenever app tokens are updated. Official SDG icon colours SHALL NOT be replaced by brand tokens.

#### Scenario: Token update

- GIVEN app `--primary` / `--secondary` are updated from a received lockup
- WHEN that token-swap change is applied
- THEN `devlog/src/styles/global.css` accent values match those tokens
- AND SDG fallback hues stay UN-derived

### Requirement: Contrast on interactive brand colours

Primary buttons, links, and focus rings SHALL meet WCAG 2.1 AA contrast against their backgrounds. Teal (`#00A5A5`) SHALL NOT be used as small-text link colour on white. Primary buttons SHALL use a dark foreground on teal. Small text links SHALL use secondary blue (`#154697`).

#### Scenario: Future token swap

- GIVEN new primary tokens from the manual
- WHEN they are applied to buttons and links
- THEN contrast is checked against AA before the change is archived

#### Scenario: Primary button

- GIVEN a default primary button on a white background
- WHEN contrast is measured
- THEN dark text on teal meets AA (≥ 4.5:1)

#### Scenario: Small link

- GIVEN a text link on a white background
- WHEN contrast is measured
- THEN the link colour is secondary blue and meets AA (≥ 4.5:1)
