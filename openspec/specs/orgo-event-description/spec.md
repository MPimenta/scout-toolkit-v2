# orgo-event-description Specification

## Purpose

Builds the description of the Orgo event from the program: the schedule, the desafios the leader could sign if behaviours are observed, and the program as a PDF attachment where it is safe to do so.

## Requirements

### Requirement: Program list in the description
The event description SHALL be HTML and SHALL start with a short paragraph naming the program and the Kit de Atividades, followed by a list with one line per program block: start time, end time, duration in minutes and the title (the custom title, or the activity name). Lines SHALL follow the program order. The description SHALL NOT use a table, because Orgo does not render tables. A program without blocks SHALL produce the short paragraph only.

#### Scenario: Program with three blocks
- **WHEN** the program has three blocks
- **THEN** the description list has three lines with start, end, duration and title

#### Scenario: Empty program
- **WHEN** the program has no blocks
- **THEN** the description has only the introductory paragraph

### Requirement: Desafios that could be signed
After the list the description SHALL show the *desafios* linked to the activities of the program. For each *desafio* it SHALL show its code and short title, the divisions it belongs to, which blocks of the program contribute, and the observable behaviours of the objectives that the contributing activities are linked to for that division. *Desafios* that are mandatory for integration SHALL be marked. The section SHALL state that a *desafio* can be signed only if the behaviours were observed. A program whose activities have no linked *desafios* SHALL omit the section.

#### Scenario: Desafio with behaviours
- **GIVEN** a program block whose activity is linked to `CC-A` and to `4E.1.1` with an observable behaviour for Lobitos
- **WHEN** the description is built
- **THEN** it lists `CC-A` with its short title, the block that contributes and the behaviour to observe

#### Scenario: Mandatory desafio marked
- **WHEN** a listed *desafio* is mandatory for integration in a division
- **THEN** the line says it is mandatory for that division

#### Scenario: No desafios
- **WHEN** no activity in the program is linked to a *desafio*
- **THEN** the description has no *desafios* section

### Requirement: Safe, bounded HTML
The description SHALL be built from stored data only and SHALL use only the markup Orgo renders: paragraphs, bold, italic, underline, headings, lists, line breaks and links. Every stored value (titles, names, behaviours) SHALL be HTML-escaped before it is placed in the text, because Orgo stores the description as sent and relies on its own display filter. The text SHALL NOT exceed the length Orgo accepts (at least 100,000 characters were accepted); when the text would exceed the app's own limit, the *desafios* section SHALL be shortened first (codes and short titles only) and the program list SHALL stay complete.

#### Scenario: Markup in a title
- **WHEN** a block title contains `<script>`
- **THEN** the description contains it as escaped text, not as markup

#### Scenario: Too long
- **WHEN** the full text exceeds the allowed length
- **THEN** the program list is complete and the *desafios* section lists only codes and short titles

### Requirement: PDF of the program as attachment, for public programs only
The server SHALL attach the program PDF, generated with the existing export, only when the program is public in the app. A private program SHALL NOT get an attachment, because Orgo stores event files in a public-read bucket where anyone with the link can open them; the dialog SHALL explain that the PDF stays available in the app. For a public program the dialog SHALL show the attachment option on by default with its file name. The description SHALL NOT contain a link to a private program. A PDF that exceeds Orgo's limit SHALL be reported and the event SHALL still be created.

#### Scenario: Public program
- **GIVEN** a public program
- **WHEN** the owner creates the event with the attachment option on
- **THEN** the event has the program PDF attached

#### Scenario: Private program
- **GIVEN** a private program
- **WHEN** the owner opens the dialog
- **THEN** no attachment option is shown and the dialog says the PDF can be downloaded from the program page
- **AND** the event description contains no link to the program

#### Scenario: PDF too large
- **WHEN** the generated PDF exceeds Orgo's limit
- **THEN** the owner is told the attachment was not added and the event exists without it

### Requirement: The attachment runs as three Orgo calls
The server SHALL attach the file by asking Orgo for a signed upload, sending the file to the address Orgo returns, and registering it on the event. A failure at any of the three calls SHALL be reported as a failed attachment step without affecting the event, and SHALL be retryable without attaching the file twice.

#### Scenario: Upload fails
- **WHEN** the file upload to Orgo's storage fails
- **THEN** the event exists, the attachment step is reported failed, and a retry repeats only that step
