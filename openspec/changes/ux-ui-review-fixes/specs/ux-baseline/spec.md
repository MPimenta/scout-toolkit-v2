## Purpose

Defines the accessibility, navigation, touch-target, form and state conventions the visible pages of the Kit must meet, and the automated check that enforces them. It applies to every screen that is visible under the current feature flags.

## ADDED Requirements

### Requirement: Keyboard users can skip repeated navigation

Every page SHALL provide a "Saltar para o conteúdo" link as the first focusable element. It SHALL be hidden until focused, SHALL use the standard focus style, and SHALL move focus to the main content.

#### Scenario: Skip link is first

- **WHEN** a keyboard user presses Tab once on any page
- **THEN** the skip link is focused and visible

#### Scenario: Skip link works

- **WHEN** the skip link is activated
- **THEN** focus moves to the main landmark and the next Tab reaches the first control inside it

### Requirement: Pages use landmarks and a correct heading outline

All page content SHALL be inside a landmark (header, nav, main, footer or a labelled region). Multiple navigation landmarks on one page SHALL have distinct accessible names. Each page SHALL have one `h1`, and heading levels SHALL not skip a level.

#### Scenario: Admin dashboard navigations are named

- **WHEN** an admin opens the dashboard
- **THEN** the primary navigation and any other navigation have different accessible names

#### Scenario: Activity detail outline

- **WHEN** the activity detail page is analysed
- **THEN** no heading level is skipped

### Requirement: Interactive targets are large enough

Standalone interactive controls SHALL be at least 24 by 24 CSS px on every viewport. Primary controls SHALL be at least 44 px high on phones. This covers buttons, toggle pills, top-bar and footer links, title links in lists, and checkbox or radio hit areas. Links inside a sentence are exempt.

#### Scenario: Footer links on a phone

- **WHEN** the footer is shown at 390 px wide
- **THEN** each standalone link has a hit area of at least 44 px high

#### Scenario: Top-bar links

- **WHEN** the top bar is shown on desktop
- **THEN** each link has a hit area of at least 24 px high

#### Scenario: Checkbox hit area

- **WHEN** a checkbox in the admin activity form is rendered on a phone
- **THEN** its label and box together form a hit area of at least 44 px high

### Requirement: Colour is never the only carrier of meaning

Objective codes, division indicators and status markers SHALL carry a text or icon cue and an accessible name in addition to colour. A legend or tooltip SHALL explain objective codes where they appear in lists.

#### Scenario: Objective chip is understandable

- **WHEN** a screen reader focuses an objective chip on a catalogue card
- **THEN** it announces the objective's code and name, not only the code

#### Scenario: Status is not colour-only

- **WHEN** an admin views a pending or published activity
- **THEN** the status is a text badge and is announced

### Requirement: Forms are labelled, validated and translated

Form fields SHALL have visible labels, mark required fields, use the shared input components, and take their labels from `pt.json` and `en.json`. Enumerated values SHALL be chosen from a select or choice group showing the translated label, never typed as free text. Multi-step forms SHALL validate the current step before moving on, SHALL show an error summary naming each invalid field, and SHALL move focus to the first invalid field, switching step if needed. Long text fields SHALL be multi-line.

#### Scenario: Effort level is a choice

- **WHEN** an admin creates an activity in Portuguese
- **THEN** effort is chosen from "Baixo", "Médio" and "Alto" and no English enum value appears

#### Scenario: Invalid field in another step

- **WHEN** an admin submits with a required field empty in an earlier step
- **THEN** the form switches to that step, shows an error message for the field, and focuses it

#### Scenario: Required field is marked

- **WHEN** a form is shown
- **THEN** required fields are marked and the marking is announced

### Requirement: Visible copy describes visible features

Copy and cards on public pages SHALL NOT promise features that are switched off by feature flags. Cards styled as interactive SHALL be links or buttons with a destination.

#### Scenario: Home cards match the MVP

- **WHEN** the home page is shown with `FEATURES` unset
- **THEN** no card describes public-program sharing or other hidden features

#### Scenario: Card is a link

- **WHEN** a user selects a feature card on the home page
- **THEN** they land on that feature's page

### Requirement: Disabled actions explain themselves

A disabled primary action SHALL show, next to it or in its accessible description, why it is disabled and what to do.

#### Scenario: Create Orgo event disabled

- **WHEN** "Criar evento no eAEP" is disabled
- **THEN** a message states the reason

### Requirement: Admin lists are manageable

The admin activities list SHALL provide search, a status filter and pagination, and SHALL show status as a text badge. Dashboard counts of items needing action SHALL link to the matching filtered list.

#### Scenario: From dashboard to pending activities

- **WHEN** an admin selects the "Atividades pendentes" count
- **THEN** the activities list opens filtered to pending activities

#### Scenario: Large list

- **WHEN** more activities exist than one page holds
- **THEN** the list is paginated and searchable

### Requirement: Loading, empty and error states are consistent

Lists and detail pages SHALL show a consistent loading state with a text label, a Portuguese empty state with a next action, and a Portuguese error state with a retry, using shared components.

#### Scenario: Program page loading

- **WHEN** the program page is loading
- **THEN** it shows the same loading pattern and label as the program edit page

### Requirement: Accessibility is checked automatically

CI SHALL run an automated accessibility check (axe with WCAG 2.1 AA, best-practice and target-size rules) over the routes visible in the MVP for guest, member and admin at 1280 px and 390 px, and SHALL fail on serious or critical violations and on primary controls below 44 px high on phone. Exceptions SHALL be listed with a reason. When a feature flag is turned on for release, its routes SHALL be added to the check.

#### Scenario: Regression fails the build

- **WHEN** a change introduces an unnamed button on a visible page
- **THEN** the accessibility check fails and names the page and element

#### Scenario: Flagged feature added to the check

- **WHEN** a feature flag is enabled by default
- **THEN** the accessibility check includes that feature's routes
