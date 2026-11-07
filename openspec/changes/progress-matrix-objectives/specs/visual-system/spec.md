## ADDED Requirements

### Requirement: Objective pills consume the division tokens

Objective pills SHALL take their background and label colours only from the division colour tokens that the `design-system` capability defines, and SHALL NOT define colour values of their own. The pill work SHALL NOT start before those tokens exist.

#### Scenario: Token source

- **GIVEN** an objective pill for an Escoteiros objective
- **WHEN** it renders
- **THEN** its colours originate from the `scouts` division tokens in `src/app/globals.css`

#### Scenario: Tokens not yet available

- **GIVEN** the division tokens have not been added
- **WHEN** this change is implemented
- **THEN** the pill task waits and the neutral outline badge is used meanwhile
