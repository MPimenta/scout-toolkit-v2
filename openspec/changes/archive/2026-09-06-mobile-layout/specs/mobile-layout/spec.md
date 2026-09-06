## Purpose

Makes the existing Kit de Atividades web app usable on a phone-width viewport without horizontal scroll, hover-only actions, or a second native app.

## ADDED Requirements

### Requirement: Phone shell stays usable

At viewports under 768px the header SHALL show a hamburger that opens the same destinations as the desktop nav (Atividades, Programas, Sobre, and Admin when the user is an admin). The AEP lockup SHALL shrink so Sign-in and the menu button remain visible and tappable (minimum 44px target). The menu SHALL close after a destination is chosen. The page SHALL NOT require horizontal scroll for the shell.

#### Scenario: Hamburger reaches main destinations

- **WHEN** a phone-width user opens the menu
- **THEN** they can go to Atividades and Programas
- **AND** the lockup does not cover the Sign-in control

#### Scenario: Admin link only for admins

- **WHEN** a regular user opens the phone menu
- **THEN** Admin is not listed

#### Scenario: Sign-in is not buried under a second header

- **WHEN** a phone-width user opens `/auth/signin`
- **THEN** the eAEP button is in view without scrolling past a duplicate site header

### Requirement: Catalogue works without a wide filter bar

At viewports under 768px, activity filters SHALL open in a sheet or equivalent overlay, not a persistent multi-column bar that pushes content off-screen. The table view SHALL render as cards or a stacked list instead of a wide table. Search SHALL remain reachable.

#### Scenario: Filters on a phone

- **WHEN** a phone-width user opens Atividades
- **THEN** they can apply a search and at least one filter
- **AND** the result list is usable without horizontal scroll

#### Scenario: Table view degrades

- **WHEN** a phone-width user selects the table view
- **THEN** they see stacked rows or cards, not a clipped wide table

### Requirement: Activity detail and discussion stack

At viewports under 768px the activity detail SHALL stack image, facts, goals, and the ratings block in one column. Vote, reaction, and reply controls SHALL remain tappable. Dialogs (add to program, sign-in prompts) SHALL fit the viewport height.

#### Scenario: Detail does not clip discussion

- **WHEN** a phone-width user opens an activity with evaluations
- **THEN** they can expand a thread and reply without horizontal scroll

### Requirement: Program builder is vertical on a phone

At viewports under 768px the program builder SHALL present entries as a vertical list. The user SHALL reorder with explicit move-up and move-down (or equivalent) without relying on drag-and-drop. Adding an activity SHALL use a full-screen or sheet picker, not a dialog wider than the viewport.

#### Scenario: Reorder without drag

- **WHEN** a phone-width user moves the second entry up
- **THEN** the entry order updates and both entries stay fully visible

### Requirement: New surfaces inherit the shell

Public program gallery, admin pages, suggestion and UGC forms SHALL use the same phone header and SHALL NOT introduce a layout that needs a desktop width. Primary actions SHALL be visible without hover.

#### Scenario: Public gallery on a phone

- **WHEN** a phone-width user opens the public gallery (once it exists)
- **THEN** cards stack in one column and the preview is readable
