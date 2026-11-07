## MODIFIED Requirements

### Requirement: CSS variables are the brand tokens

The application SHALL define brand colours as CSS custom properties on `:root` and `.dark` in `src/app/globals.css`, mapped through Tailwind theme keys (`primary`, `accent`, `ring`, and the neutral roles). Components SHALL NOT introduce a second brand palette. Primary (the main action colour) SHALL be Pantone 2945 C (`#154697` / `217 76% 34%`). The accent SHALL be Pantone 7716 C (`#00A5A5` / `180 100% 32%`). The full palette and its roles are defined by the `design-system` capability.

#### Scenario: Token source

- GIVEN the running web app
- WHEN a primary or accent UI colour is rendered
- THEN it originates from the CSS variables in `src/app/globals.css`

#### Scenario: Sampled 2026 tokens

- GIVEN `docs/brand-handoff.md` lists the Brand Book colour pages as read (pp. 27–30)
- WHEN tokens are applied
- THEN `--primary` is `217 76% 34%` and the accent is `180 100% 32%`

### Requirement: Handoff gate for new tokens

The system SHALL treat `docs/brand-handoff.md` as the inventory of received brand assets and open inputs. Agents SHALL NOT invent replacement HSL values. Token values SHALL come from the Brand Book, from the public site's theme where the two differ and the design system records the choice, from the Pantone references the Regulamento do Programa para Jovens gives for each division, or from values the brand owners supply (Chefia white, the cream accent). A value that no source provides SHALL stay out of `globals.css`.

#### Scenario: Missing manual

- GIVEN `docs/brand-handoff.md` lists the cream accent value as not yet supplied
- WHEN a restyle is requested
- THEN no cream token is written to `globals.css`

#### Scenario: Received lockup

- GIVEN `docs/brand-handoff.md` marks the Brand Book colour pages as read
- WHEN a brand restyle is applied
- THEN each token matches the hex the Brand Book prints (or the choice recorded in the design system), and the handoff file cites the page

### Requirement: Contrast on interactive brand colours

Primary buttons, links, and focus rings SHALL meet WCAG 2.1 AA contrast against their backgrounds. Primary buttons SHALL be Azul AEP with white text. Teal (`#00A5A5`) SHALL NOT be used as small-text link colour on white, and text on a solid teal fill SHALL be near-black or large. Small text links SHALL use Azul AEP (`#154697`). The contrast contract in the `design-system` capability lists the measured pairs.

#### Scenario: Future token swap

- GIVEN new colour tokens from the Brand Book
- WHEN they are applied to buttons and links
- THEN contrast is checked against AA before the change is archived

#### Scenario: Primary button

- GIVEN a default primary button on a white background
- WHEN contrast is measured
- THEN white text on Azul AEP meets AA (≥ 4.5:1, measured 8.9:1)

#### Scenario: Small link

- GIVEN a text link on a white background
- WHEN contrast is measured
- THEN the link colour is Azul AEP and meets AA (≥ 4.5:1)

#### Scenario: Teal fill

- GIVEN a solid Verde-água AEP button
- WHEN its label contrast is measured
- THEN the label is near-black and meets AA
