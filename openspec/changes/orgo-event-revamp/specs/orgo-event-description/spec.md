## Purpose

Builds the description of the Orgo event from the program: the schedule, the desafios the leader could sign if behaviours are observed, and the program as a PDF attachment where Orgo allows it.

## ADDED Requirements

### Requirement: Program table in the description
The event description SHALL start with a short line naming the program and the Kit de Atividades, followed by a table with one row per program block: start time, end time, duration in minutes and the title (the custom title, or the activity name). Rows SHALL follow the program order. A program without blocks SHALL produce the short line only.

#### Scenario: Program with three blocks
- **WHEN** the program has three blocks
- **THEN** the description table has three rows with start, end, duration and title

#### Scenario: Empty program
- **WHEN** the program has no blocks
- **THEN** the description has only the introductory line

### Requirement: Desafios that could be signed
After the table the description SHALL list the *desafios* linked to the activities of the program. For each *desafio* it SHALL show its code and short title, the divisions it belongs to, which blocks of the program contribute, and the observable behaviours of the objectives that the contributing activities are linked to for that division. *Desafios* that are mandatory for integration SHALL be marked. The section SHALL state that a *desafio* can be signed only if the behaviours were observed. A program whose activities have no linked *desafios* SHALL omit the section.

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

### Requirement: Safe, bounded text
The description SHALL be built from stored data only, SHALL escape or strip characters that the Orgo description format treats as markup, and SHALL NOT exceed the length Orgo accepts; when the text would exceed it, the *desafios* section SHALL be shortened first (listing codes and short titles only) and the program table SHALL stay complete.

#### Scenario: Markup in a title
- **WHEN** a block title contains `<script>`
- **THEN** the description contains it as plain text, not as markup

#### Scenario: Too long
- **WHEN** the full text exceeds the allowed length
- **THEN** the table is complete and the *desafios* section lists only codes and short titles

### Requirement: PDF of the program as attachment
Where Orgo accepts attachments on events, the server SHALL generate the program PDF with the existing export and attach it to the event, and the dialog SHALL show the attachment option on by default with its file name and size. Where Orgo does not accept attachments, the dialog SHALL say that the PDF stays available in the app, and the description SHALL NOT link to a private program. A PDF that exceeds Orgo's size limit SHALL be reported and the event SHALL still be created.

#### Scenario: Attachment accepted
- **GIVEN** Orgo accepts event attachments
- **WHEN** the owner creates the event with the attachment option on
- **THEN** the event has the program PDF attached

#### Scenario: Attachments not supported
- **GIVEN** Orgo does not accept event attachments
- **WHEN** the owner opens the dialog
- **THEN** the dialog says the PDF can be downloaded from the program page
- **AND** the event description contains no link to the program

#### Scenario: PDF too large
- **WHEN** the generated PDF exceeds Orgo's limit
- **THEN** the owner is told the attachment was not added and the event exists without it
