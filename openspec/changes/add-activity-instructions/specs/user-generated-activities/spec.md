## ADDED Requirements

### Requirement: Activity instructions

An activity SHALL support an optional free-text `instructions` field, entered via a textarea in the activity forms (after materials). The activity detail page SHALL show it in an "Instruções" section directly below "Materiais Necessários", preserving line breaks. When an activity has no instructions, the section SHALL NOT be rendered. A user proposing an activity MAY provide instructions; they follow the same approval flow as other fields.

#### Scenario: Detail shows instructions below materials

- **WHEN** a visitor opens an activity that has instructions
- **THEN** an "Instruções" section appears immediately after "Materiais Necessários" showing the text with line breaks preserved

#### Scenario: Activity without instructions

- **WHEN** a visitor opens an activity with no instructions
- **THEN** no "Instruções" section is shown

#### Scenario: Proposing with instructions

- **WHEN** a signed-in user proposes an activity including instructions
- **THEN** the instructions are stored with the pending activity
