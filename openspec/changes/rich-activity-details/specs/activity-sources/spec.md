## Purpose

Where an activity comes from: a catalogue of sources with licence terms, and attribution on the activity.

## ADDED Requirements

### Requirement: Source catalogue

The system SHALL keep a catalogue of sources (code, name, url, licence text, access note, language) loaded from reference data on every environment, like the Matriz. Rows written by the loader SHALL be managed (read-only for admins). The first load SHALL contain the sources of the curated sheet's `fontes` tab.

#### Scenario: Fresh environment

- **WHEN** the reference data is loaded
- **THEN** each source of the `fontes` tab exists once, and loading again changes nothing

### Requirement: Source on the activity

An activity MAY have a source and a link to the original page. The detail page SHALL show "Fonte: *name* ↗" linking to the original page when present, and the licence line of the source, in the page header next to the title (and nowhere else). Activities without a source SHALL show nothing.

#### Scenario: Sourced activity

- **GIVEN** an activity from "Online Scout Manager" with a link
- **WHEN** the page renders
- **THEN** it shows "Fonte: Online Scout Manager ↗" with the link and the licence line

#### Scenario: User proposal

- **GIVEN** a proposal with no source
- **WHEN** the page renders
- **THEN** no source line appears

### Requirement: Licence awareness

Sources whose licence forbids republishing text SHALL be flaggable so the content team can limit the public view to a link and a summary. The behaviour for flagged sources is an open decision recorded in the proposal; until it is made, the page SHALL show the licence line for every source.

#### Scenario: Restrictive licence

- **GIVEN** a source with licence "© … All rights reserved"
- **WHEN** an activity from it renders
- **THEN** the licence line is visible next to the source
