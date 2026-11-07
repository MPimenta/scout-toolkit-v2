## Why

The Kit holds leaders' identities (eAEP/Orgo OAuth), a server-side `ORGO_API_TOKEN` that can create events in the association's system, and write endpoints for admins and members. Nobody has attacked it on purpose yet. Before wider rollout and the move to Azure, we need evidence that sign-in data, tokens and admin functions cannot be intercepted, forged or abused, and a way to keep checking as features land.

## What Changes

- Define a **security review baseline**: a threat model of the app and its Orgo integration, covering what travels to and from Orgo (authorization request, callback, token exchange, userinfo, `ORGO_API_TOKEN` calls) and where each secret lives.
- Add **automated security checks** that run in CI and locally: dependency audit, static analysis (secrets, injection patterns), security-header and cookie assertions, and a route-by-route authorisation matrix test (guest / member / admin / view-as-member) generated from the real route list.
- Add **dynamic scanning** (OWASP ZAP baseline, authenticated with the e2e session) against a local or Preview instance, never against Production without sign-off.
- Add **targeted abuse tests**: SQL injection payloads on every Zod-validated input, stored/reflected XSS in user-generated text, IDOR on programs and activities, open redirect on `callbackUrl`, CSRF on mutating routes, rate limiting on sign-in, import and report endpoints, upload abuse (type, size, SVG scripts).
- Review the **Orgo OAuth flow** specifically: PKCE is on but `state` is deliberately disabled in `src/lib/auth/orgo-provider.ts`; verify that is safe (PKCE-bound, redirect URI exact-match, session fixation, token and profile never logged or sent to the client, `ORGO_API_TOKEN` never reaches a browser bundle or response).
- Produce a **findings register** (`docs/security.md`) with severity, status and fix reference. Fix criticals and highs inside this change; log the rest.
- Add the **security response headers** and cookie flags the review shows to be missing (CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, frame protection).

## Capabilities

### New Capabilities
- `security-testing`: the security baseline the app must meet and the automated and manual checks that prove it.

### Modified Capabilities
- (none)

## Impact

- New: `tests/security/` (authorisation matrix, payload suites, header/cookie checks), `.github/workflows/security.yml`, `docs/security.md`, ZAP config under `tests/security/zap/`.
- Changed: `next.config.ts` and/or `src/middleware.ts` for headers; small fixes wherever the review finds a defect (each recorded in the register).
- Dependencies: dev-only scanners (`npm audit`, ZAP in a container, optionally Semgrep/gitleaks in CI). No new runtime dependencies expected, except possibly a rate limiter.
- Scope guard: testing happens only against local, e2e, or Preview environments we own. Orgo (`eaep.escoteiros.pt`) is a third-party system and is **not** attacked; we test only our side of the integration.
- Overlaps with `migrate-hosting-to-azure` (headers, TLS, secrets in Key Vault); that change owns infrastructure, this one owns application behaviour.
- The new `bulk-activity-ingest` endpoint is in scope for the abuse and rate-limit tests once it exists.
