# visual-system Delta

## ADDED Requirements

### Requirement: CSS variables are the brand tokens

The application SHALL define brand colours as CSS custom properties on `:root` and `.dark` in `src/app/globals.css`, mapped through Tailwind theme keys (`primary`, `secondary`, `accent`, `ring`). Components SHALL NOT introduce a second brand palette.

#### Scenario: Token source

- GIVEN the running web app
- WHEN a primary or secondary UI colour is rendered
- THEN it originates from the CSS variables in `src/app/globals.css`

### Requirement: Handoff gate for new tokens

The system SHALL keep the current Story 2.2 tokens (Pantone 383 C / 280 C) until `docs/brand-handoff.md` lists a received manual, logo set, favicon, and font license. Agents SHALL NOT invent replacement HSL values.

#### Scenario: Missing manual

- GIVEN `docs/brand-handoff.md` still marks the manual or logos as missing
- WHEN a brand restyle is requested
- THEN no new primary or secondary HSL values are written to `globals.css`

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

- GIVEN app `--primary` / `--secondary` are updated from a received manual
- WHEN that token-swap change is applied
- THEN `devlog/src/styles/global.css` accent values match those tokens
- AND SDG fallback hues stay UN-derived

### Requirement: Contrast on interactive brand colours

Primary buttons, links, and focus rings SHALL meet WCAG 2.1 AA contrast against their backgrounds after any future token swap. This change SHALL record that rule even while current tokens remain.

#### Scenario: Future token swap

- GIVEN new primary tokens from the manual
- WHEN they are applied to buttons and links
- THEN contrast is checked against AA before the change is archived
