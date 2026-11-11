## Purpose

One written design system for Kit de Atividades, derived from the AEP Brand Book (Manual de Normas Gráficas, Marca Associativa) and aligned with the rebranded public site, so every screen looks like part of the same family and new components follow rules instead of taste.

## ADDED Requirements

### Requirement: One token source

All colour, type, spacing, radius and shadow values used by components SHALL come from named design tokens defined in `src/app/globals.css` (as CSS custom properties on `:root`, redefined on `.dark`) and exposed through Tailwind theme keys. Components SHALL NOT hard-code hex, `rgb()` or Tailwind palette colours (`bg-blue-500`, `text-gray-700`, …). The only exceptions are third-party artwork (official SDG icons) and the PDF export stylesheet.

#### Scenario: Component uses a token

- **WHEN** a button, card or badge renders
- **THEN** each colour it shows resolves to a token from `globals.css`

#### Scenario: Hard-coded colour

- **WHEN** a component file contains a hex colour or a Tailwind palette colour outside the allow-list
- **THEN** the automated check fails and names the file and line

### Requirement: Brand palette

The palette SHALL be these tokens and values. Azul AEP (`#154697`, Pantone 2945 C) and Verde-água AEP (`#00A5A5`, Pantone 7716 C) come from the Brand Book (pp. 28–30). Variants take the value the public site already ships where the site and the Brand Book differ.

| Role | Token meaning | Value |
| --- | --- | --- |
| Primary action, titles, links | Azul AEP | `#154697` |
| Pressed/hover, footer | Azul escuro | `#0F3474` |
| Tinted backgrounds | Azul muito claro | `#E8EEF9` |
| Accent, focus, rules, motifs | Verde-água AEP | `#00A5A5` |
| Teal text on light, teal fills with white text | Verde-água escuro | `#007D80` |
| Decorative highlight only (no text) | Verde-água claro | `#33BFBF` |
| Tinted background | Verde-água muito claro | `#E6F6F6` |
| Page | Branco | `#FFFFFF` |
| Sections | Fundo claro | `#F1F6F5` |
| Hairlines | Linha | `#DCE5E6` |
| Headings, navigation, body | Texto | `#15394B` |
| Secondary text, captions | Texto secundário | `#506471` |

The Brand Book's cream accent (used with blue and green for "balanced warm contrast", and as the footer bar) has no printed value; it SHALL NOT become a token until the brand owners confirm one.

#### Scenario: Token values match the sources

- **WHEN** the token pin test runs
- **THEN** `--primary` is `217 76% 34%` (`#154697`) and the accent is `180 100% 32%` (`#00A5A5`), and every other value equals the table above

#### Scenario: Cream accent

- **GIVEN** the brand owners have not confirmed a cream value
- **WHEN** a component needs a warm accent
- **THEN** it does not invent one

### Requirement: Contrast rules for colour pairs

Text and interactive colours SHALL meet WCAG 2.1 AA: 4.5:1 for normal text, 3:1 for large text (≥ 24 px, or ≥ 18.66 px bold) and for non-text indicators. The documented pairs and their measured ratios are the contract:

- Allowed for any text: `#15394B` on white 12.2, `#506471` on white 6.2 and on `#F1F6F5` 5.7, `#154697` on white 8.9 and on `#F1F6F5` 8.2, white on `#154697` 8.9, white on `#0F3474` 11.9, white on `#007D80` 4.95, `#007D80` on white 4.95.
- Large text and non-text only: `#00A5A5` on white 3.03, white on `#00A5A5` 3.03.
- Never: `#154697` on `#00A5A5` (2.94), `#00A5A5` on `#154697` (the Brand Book marks it "evitar"), white on `#33BFBF` (2.25), white on the Clã red `#EF3340` (4.02) for small text.
- Division pills use their own label colour per the division table (8.36, 4.81, 14.76, 4.97 and 12.22).
- Text on a Verde-água AEP fill SHALL use the near-black foreground token (≥ 4.5:1), or be large.

The Brand Book (pp. 29–30) states that white on `#00A5A5` is AAA; it measures 3.03:1, and this requirement overrides that statement.

#### Scenario: Declared pairs are measured

- **WHEN** the contrast test runs
- **THEN** it computes every declared pair in light and dark mode and fails if any falls below its minimum

#### Scenario: Teal button label

- **GIVEN** a solid Verde-água AEP button
- **WHEN** its label is measured
- **THEN** the label is near-black and at least 4.5:1

### Requirement: Typography

Text SHALL use Arial in Regular and Bold (and their italics), as the Brand Book prescribes for digital use (p. 40). Garet is the print face and SHALL NOT be loaded on the web. Letters SHALL NOT be stretched, condensed or artificially widened; letter-spacing is allowed only on short uppercase labels (up to 0.2 em). The scale is 0.75, 0.875, 1, 1.25, 2 and 3 rem (the two largest fluid down to 1.5 and 2.1 rem on phones). Body line height is 1.5–1.7, headings 1.1–1.2. Headings use Bold in Texto `#15394B`; body uses Texto or Texto secundário; weights other than 400 and 700 SHALL NOT be used, because Arial has no other cuts. UI text SHALL be at least 0.875 rem, except non-essential metadata at 0.75 rem that still meets 4.5:1.

#### Scenario: Heading

- **WHEN** a page title renders
- **THEN** it is Arial Bold in `#15394B` on the heading scale

#### Scenario: Unsupported weight

- **WHEN** a component asks for weight 500 or 800
- **THEN** the lint rule flags it, since Arial would only synthesise it

### Requirement: Spacing, layout, shape and elevation

Spacing SHALL use an 8 px base (0.5, 1, 1.5 rem steps, then fluid 2–3 rem and 3–5.5 rem for section gaps). Page gutters are `clamp(1rem, 4vw, 2rem)` (16 px on phones). Controls, cards, chips and callouts SHALL have a 4 px corner radius; circles are used only for avatars, badges and rings; large rounded panels (24 px or more) and rhombus masks are reserved for hero and illustration containers. Resting cards use a `#DCE5E6` hairline; elevation appears on hover and for floating layers only: card hover `0 12px 28px rgba(21,57,75,.14)`, menus `0 10px 24px rgba(21,57,75,.14)`, primary callouts `0 12px 30px rgba(21,70,151,.22)`.

#### Scenario: Card corners

- **WHEN** a card, input and button are placed side by side
- **THEN** all three have the same 4 px radius

#### Scenario: Phone gutter

- **WHEN** a page renders at 390 px wide
- **THEN** the content gutter is 16 px and nothing scrolls horizontally

### Requirement: Graphic language

Decorative graphics SHALL come from the Brand Book's elements (p. 41, 57–58): the ring (thick and thin), the rhombus (filled and outline), the five-point rounded star, ring-grid and rhombus-mosaic patterns, and two gradients: Azul AEP to Verde-água AEP (horizontal) and Verde-água AEP to Azul escuro (vertical). Gradients SHALL only run between palette colours. Text over a gradient SHALL be large white text. Decorative graphics SHALL be hidden from assistive technology and SHALL NOT carry information. A page SHALL show at most one gradient panel. The lockup rules (safe margin, minimum size, no distortion, no recolouring) from pp. 22–26 apply wherever the logo appears.

#### Scenario: Decorative motif

- **WHEN** a ring or rhombus appears next to content
- **THEN** it is `aria-hidden` and removing it loses no information

#### Scenario: Gradient text

- **WHEN** text sits on a gradient panel
- **THEN** it is white, large and bold

### Requirement: Buttons and links

Primary buttons SHALL be Azul AEP with white text, Azul escuro on hover and press, Bold 0.9375 rem, 4 px radius, padding `0.95em 1.6em`. Secondary buttons are outlined in Azul AEP; accent buttons are Verde-água AEP with near-black text; on blue backgrounds the buttons are white or outlined white. A navigation call to action MAY end with `→` (same page) or `↗` (leaves the page). Disabled buttons use 50 % opacity and no pointer. Text links are Azul AEP, turn Verde-água escuro on hover, and an emphasised text link is Bold with a 2 px Verde-água underline. Teal SHALL NOT be used as small text-link colour on white.

#### Scenario: Primary button

- **WHEN** a primary button is rendered on white
- **THEN** it is Azul AEP with white text (8.9:1) and darkens to Azul escuro on hover

#### Scenario: Button on a blue band

- **WHEN** buttons sit on an Azul AEP band
- **THEN** one may be Verde-água with near-black text and the others white or outlined white

### Requirement: Cards, labels and callouts

Cards SHALL be white with a hairline border, a 3 px Verde-água top rule, an optional 4:3 photo, a small uppercase eyebrow in Verde-água escuro, a Bold title in Texto (clamped to three lines), secondary text, and an emphasised text link. On hover a card lifts 3 px and gains its shadow. An eyebrow label is 0.7 rem Bold uppercase with a teal leaf marker. A callout is Azul AEP with white text, a 6 px Verde-água left border and the callout shadow. A values strip is a Verde-água band whose items are Bold white text separated by small white leaves, and SHALL be used only for short, large-enough text.

#### Scenario: Card

- **WHEN** an activity card renders
- **THEN** it shows the teal top rule, hairline border and an emphasised link, and lifts on hover

#### Scenario: Strip text size

- **WHEN** a values strip is rendered
- **THEN** its text is at least 18.66 px Bold, because white on Verde-água AEP only reaches 3.03:1

### Requirement: Forms

Inputs, selects and textareas SHALL have a `#DCE5E6` border, white fill, 4 px radius and Texto colour, with a visible label above. Focus shows the focus ring. An invalid field shows the destructive colour, an icon or text message, and `aria-invalid`; colour alone SHALL NOT signal the error. Placeholder text is Texto secundário.

#### Scenario: Invalid field

- **WHEN** a field fails validation
- **THEN** it shows a Portuguese message and `aria-invalid="true"` in addition to the red border

### Requirement: Navigation, header and footer

The header SHALL be white with a hairline bottom border and the AEP lockup, with navigation in Bold Texto; the hovered and current item show a 3 px Verde-água underline and turn Azul AEP. Submenus have a 3 px Verde-água top border and the menu shadow. A slim Azul AEP top bar MAY carry cross-site links in 0.75 rem white text. The footer SHALL be Azul escuro with white text, uppercase Verde-água claro headings, and a hairline rule; footer headings are large enough or non-essential per the contrast rules.

#### Scenario: Current item

- **WHEN** the user is on Atividades
- **THEN** that nav item shows the teal underline and is Azul AEP

### Requirement: Pills and badges

Neutral badges SHALL use an outline in Linha with Texto. Objective pills SHALL use the division colour tokens (next requirement), show the objective code, and put the division name in their accessible name; they are 4 px rectangles at 0.75 rem Bold. Status (approved, pending, error) SHALL be shown with text, and an icon where space allows, using only palette colours and the destructive token.

#### Scenario: Age group without a token

- **GIVEN** a value outside the five known age groups
- **WHEN** an objective pill renders
- **THEN** it falls back to the neutral outline badge with the code

### Requirement: Division colour tokens

There SHALL be one background/foreground token pair per division, keyed by the stable age-group values and defined for the light and dark themes. The division names, ages and colours come from the *Regulamento do Programa para Jovens* v1.2 (Dec 2024, §§ 22, 25, 60, 62, 99, 101, 150, 152), which names each division's identifying colour by Pantone reference; the hex values are the sRGB conversions of those references. The Brand Book and the public site define no division colours.

| Age group | Division (young people) | Official colour | Fill | Label | Contrast |
| --- | --- | --- | --- | --- | --- |
| `cub_scouts` | Alcateia (Lobitos, 7–10½) | Amarelo, Pantone 109 | `#FFD100` | Texto `#15394B` | 8.36 |
| `scouts` | Tribo de Escoteiros (Escoteiros, 10½–14) | Verde-escuro, Pantone 348 | `#00843D` | white | 4.81 |
| `adventurers` | Tribo de Exploradores (Exploradores, 14–17) | Azul-escuro, Pantone 280 | `#012169` | white | 14.76 |
| `rovers` | Clã (Caminheiros, 17–21) | Vermelho, Pantone 032 | `#EF3340` | near-black | 4.97 |
| `leaders` | Chefia | Branco | `#FFFFFF` | Texto `#15394B` | 12.22 |

Every label/fill pair SHALL meet 4.5:1. White text on the Clã red (4.02:1) SHALL NOT be used for small text. The Chefia fill is white, so its pill carries a 1 px Texto secundário border to be visible on white and on Fundo claro. In the dark theme every division pill also carries a 1 px light outline so the dark fills stay visible. Division colours identify divisions only: they SHALL NOT be used for status, buttons, links or page chrome. Tokens are keyed by the enum value, so changes to division names in copy do not affect them. The hex conversions SHALL be confirmed by the brand owners and recorded in `docs/brand-handoff.md`.

#### Scenario: Token values

- **WHEN** the token pin test runs
- **THEN** the five pairs equal the table above in both themes and each pair is at least 4.5:1

#### Scenario: Clã label

- **GIVEN** an objective pill for a Clã objective
- **WHEN** it renders
- **THEN** its text is near-black on `#EF3340`, not white

#### Scenario: Chefia pill

- **GIVEN** a pill for the Chefia age group on a white card
- **WHEN** it renders
- **THEN** it has a visible 1 px border and Texto text

#### Scenario: Division colour misuse

- **WHEN** a component uses a division token for a status badge or a button
- **THEN** the automated check flags it

### Requirement: Imagery

Photography SHALL be authentic, candid scouting scenes in natural colour, never tinted, duotoned or stock-looking. Cards and heroes crop to 4:3 or wider. Every informative image has Portuguese alt text; decorative images have empty alt. The white symbol watermark MAY sit on a photo corner. The Tradition and Classic symbols SHALL NOT appear in the UI, since the Brand Book restricts them to uses authorised by the Chefia Nacional (pp. 67–71).

#### Scenario: Informative image

- **WHEN** a photo carries meaning
- **THEN** it has alt text; if purely decorative, `alt=""`

### Requirement: Motion

Interactive transitions SHALL last 150–200 ms with ease timing: colour, border, shadow, and the 3 px card lift. When the user prefers reduced motion, translations and fades SHALL be removed and colours switch instantly.

#### Scenario: Reduced motion

- **GIVEN** the OS asks for reduced motion
- **WHEN** a card is hovered
- **THEN** it does not move

### Requirement: Focus, targets and colour cues

Keyboard focus SHALL show a 3 px outline with a 2 px offset: Verde-água AEP on light surfaces (3.03:1 against white), white on Azul backgrounds. Touch targets are at least 44 px. Information SHALL NOT depend on colour alone: a coloured element also carries text, an icon or a shape difference.

#### Scenario: Focus on a blue band

- **WHEN** a button on an Azul AEP band receives keyboard focus
- **THEN** its outline is white

### Requirement: Dark theme

The dark theme is an app extension (the Brand Book defines none). It SHALL use the same hues, take backgrounds from the Azul escuro / Texto end of the palette, keep Verde-água AEP as accent, and meet the same contrast minimums as the light theme.

#### Scenario: Dark pairs

- **WHEN** the contrast test runs in dark mode
- **THEN** every declared pair meets its minimum

### Requirement: Documentation and guard-rails

`docs/design-system.md` SHALL list every token with value, role, allowed pairs and an example, plus the component rules above and the Brand Book page each rule comes from. `docs/brand-handoff.md` SHALL list received assets with page references and open inputs (division colours, cream value). Automated tests SHALL pin token values, measure every declared contrast pair in both themes, and reject raw colours in components.

#### Scenario: Token drift

- **WHEN** someone edits a token value in `globals.css` without updating the documented table
- **THEN** the pin test fails

#### Scenario: New component

- **WHEN** a contributor adds a component
- **THEN** `docs/design-system.md` tells them which tokens and patterns to use
