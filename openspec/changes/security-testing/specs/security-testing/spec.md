## Purpose

Defines the security baseline the Kit must meet and the automated and manual checks that prove it, including the handling of Orgo sign-in data and tokens.

## ADDED Requirements

### Requirement: Every route has a declared access rule

Every API route and page route SHALL appear in an authorisation matrix stating the expected response for a guest, a member, an admin, and an admin viewing as member. A test SHALL fail when a route exists in the codebase but not in the matrix, and when a route's actual response differs from the matrix.

#### Scenario: New unclassified route fails CI

- **WHEN** a developer adds `src/app/api/foo/route.ts` without a matrix entry
- **THEN** the security test suite fails and names the route

#### Scenario: Admin route refuses a member

- **WHEN** a member calls any `/api/admin/*` route
- **THEN** the response is 403 and no data is read or changed

#### Scenario: View as member drops admin rights

- **WHEN** an admin has "view as member" active and calls an admin-only route
- **THEN** the response matches the member column of the matrix

### Requirement: Orgo credentials and tokens stay server-side

`ORGO_CLIENT_SECRET`, `ORGO_API_TOKEN`, access tokens, refresh tokens and authorization codes SHALL NOT appear in client bundles, API responses, error bodies, logs, or the Auth.js session object. Sign-in SHALL use authorization code with PKCE over HTTPS only. `callbackUrl` SHALL accept only same-origin relative paths.

#### Scenario: Secrets absent from the client bundle

- **WHEN** the production build output under `.next/static` is scanned
- **THEN** no configured secret value and no `ORGO_API_TOKEN` value appears

#### Scenario: Session carries no provider tokens

- **WHEN** a signed-in user requests `/api/auth/session`
- **THEN** the body contains no access token, refresh token, ID token or client secret

#### Scenario: Open redirect rejected

- **WHEN** sign-in is started with `callbackUrl=https://evil.example`
- **THEN** the user lands on a same-origin page after sign-in, never on the external URL

#### Scenario: Errors do not leak

- **WHEN** the Orgo token exchange or userinfo call fails
- **THEN** the user sees a Portuguese error message and the logs contain no token, code or secret

### Requirement: The missing OAuth `state` parameter is justified and compensated

The Orgo provider omits `state` because Orgo returns it altered. This SHALL be documented in `docs/security.md` with the compensating controls (PKCE binding, exact redirect URI match, short-lived verifier cookie). A test SHALL assert the verifier cookie is `HttpOnly`, `SameSite` Lax or stricter, and short-lived, and that a callback without a matching verifier is rejected.

#### Scenario: Forged callback rejected

- **WHEN** a callback request arrives with a valid-looking code but no PKCE verifier cookie
- **THEN** sign-in fails and no session is created

### Requirement: Inputs resist injection

Every endpoint that accepts user input SHALL reject or neutralise a shared corpus of SQL, script, HTML/SVG, path-traversal and header-injection payloads. Rejected input SHALL return a 4xx with a Portuguese message. Stored text SHALL render escaped. The codebase SHALL NOT build SQL by concatenating user input, and search patterns SHALL escape `%` and `_`.

#### Scenario: SQL payload stored harmlessly or rejected

- **WHEN** an activity name `'; DROP TABLE activities; --` is submitted
- **THEN** either the request is rejected with 4xx, or it is stored literally and the `activities` table is intact

#### Scenario: Stored script does not execute

- **WHEN** a review or program name contains `<script>alert(1)</script>` or an `onerror` attribute
- **THEN** it renders as text and no script runs

#### Scenario: Unsafe SVG upload refused

- **WHEN** a user uploads an SVG containing a `<script>` element
- **THEN** the upload is refused or the file is served so scripts cannot run

### Requirement: Objects are owned by their owners

Programs, user-generated activities, ratings and reports SHALL be readable and writable only by their owner or an admin, except where a resource is explicitly public. Changing an identifier in a request SHALL NOT expose or alter another user's private data.

#### Scenario: IDOR on a private program

- **WHEN** member A requests or edits a private program owned by member B
- **THEN** the response is 403 or 404 and nothing changes

### Requirement: Security headers and cookies are enforced

Responses SHALL carry a Content-Security-Policy, `Strict-Transport-Security` (non-local), `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` and frame protection. Session cookies SHALL be `HttpOnly`, `Secure` outside local development, and `SameSite=Lax` or stricter. Mutating routes SHALL reject cross-site requests.

#### Scenario: Headers present

- **WHEN** the home page and an API route are fetched in a production-like run
- **THEN** each required header is present with a non-permissive value

#### Scenario: Cross-site mutation rejected

- **WHEN** a POST to a mutating route arrives with a foreign `Origin`
- **THEN** it is rejected and nothing changes

### Requirement: Abuse is rate limited

Sign-in start, issue reports, uploads and any bulk import or ingest endpoint SHALL enforce a rate limit and return 429 with a Portuguese message when exceeded.

#### Scenario: Report flood

- **WHEN** one client posts issue reports faster than the limit
- **THEN** later requests receive 429

### Requirement: Security checks run automatically

CI SHALL run dependency audit, secret scanning, static analysis and the security Vitest suite on every pull request, and SHALL fail on high or critical findings. A dynamic scan SHALL run on a schedule against the e2e or Preview instance only. Findings SHALL be recorded in `docs/security.md` with severity and status; critical and high findings SHALL be fixed or explicitly accepted by the maintainer before this change is archived.

#### Scenario: Vulnerable dependency blocks merge

- **WHEN** a pull request introduces a dependency with a known high-severity advisory
- **THEN** the security workflow fails

#### Scenario: Scans never target Production

- **WHEN** the dynamic scan workflow starts
- **THEN** it refuses a target host that is the Production host name
