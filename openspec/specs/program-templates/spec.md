# program-templates Specification

## Purpose

Lets a signed-in leader copy a public program into their own account as a private draft, keeping attribution to the original author.

## Requirements

### Requirement: Copy a public program

A signed-in user SHALL create a new program owned by them from a public program. The copy SHALL include every entry (activity and custom) with the same position, times, activity id, and custom fields. The copy's `is_public` SHALL be false. The original program SHALL be unchanged.

#### Scenario: Successful copy

- **GIVEN** a public program with two activity entries and one custom slot
- **WHEN** a signed-in user copies it
- **THEN** they own a new program with three matching entries
- **AND** the new program is private
- **AND** the source program still has the same entries

#### Scenario: Cannot copy a private program

- **WHEN** a signed-in user who is not the owner requests a copy of a private program
- **THEN** the system returns 404 and creates nothing

### Requirement: Guests must sign in to copy

Guests SHALL receive 401 from the copy API. The preview SHALL send them to sign-in instead of creating a program.

#### Scenario: Guest copy

- **WHEN** a guest posts a copy request
- **THEN** the API returns 401 and stores no program

### Requirement: Attribution on the copy

The copy SHALL record the source program id and SHALL display the original author's name as attribution. If the source program is later deleted, the copy SHALL remain and attribution SHALL fall back to the stored author name or "Programa público" without breaking the copy.

#### Scenario: Attribution shown after copy

- **WHEN** Bruno copies Ana's public program
- **THEN** Bruno's program shows that it was based on Ana's program

### Requirement: Success takes the user to the new program

After a successful copy the UI SHALL confirm success in Portuguese and SHALL open the new program so the user can customise it with the existing builder.

#### Scenario: After copy

- **WHEN** the copy succeeds
- **THEN** the user sees a success message
- **AND** they are on the new program, not the public preview
