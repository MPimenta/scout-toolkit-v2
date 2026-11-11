# api-errors Specification

## Purpose
Defines what API error responses may reveal, so clients get a stable code and a Portuguese message while database queries, stack traces, and internal details stay in server logs.

## Requirements

### Requirement: Error responses have one shape

Every API error response SHALL be JSON of the form `{ "error": { "code": string, "message": string, "details"?: object } }` with a matching HTTP status. `message` SHALL be Portuguese and readable by a leader. Validation errors MAY include `details` naming the invalid fields.

#### Scenario: Unauthenticated program write

- **WHEN** a guest sends `POST /api/programs`
- **THEN** the response is 401 with `error.code` `UNAUTHORIZED` and a Portuguese `error.message`

#### Scenario: Validation error

- **WHEN** a signed-in user creates a program without a name
- **THEN** the response is 400 with `error.code` `VALIDATION_ERROR`
- **AND** `error.details` names the `name` field

### Requirement: Production errors reveal no internals

In production, error responses SHALL NOT contain SQL text, query parameters, stack traces, file paths, or messages of unexpected internal errors. An unexpected error SHALL return 500 with code `INTERNAL_ERROR` and a generic Portuguese message. The full error SHALL be written to the server log with the request path. Outside production, `details` MAY include the internal message and stack to help debugging.

#### Scenario: Database unreachable in production

- **GIVEN** the app runs in production and the database query fails
- **WHEN** a client calls `GET /api/programs/public`
- **THEN** the response is 500 with a generic Portuguese message
- **AND** the body contains no SQL, no stack trace, and no file path
- **AND** the server log contains the failed query error

#### Scenario: Same failure in development

- **GIVEN** the app runs in development
- **WHEN** the same query fails
- **THEN** the response may include the internal message in `details`
