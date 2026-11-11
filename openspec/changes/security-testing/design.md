## Context

The app is a Next.js 15 App Router service with Auth.js v5. Sign-in goes through `OrgoProvider` (authorization code + PKCE, `client_secret_basic`, `checks: ['pkce']`, no `state`). Roles come from `ADMIN_EMAILS` and the user table; admins can "view as member" through a cookie. `ORGO_API_TOKEN` is used server-side by `src/lib/orgo/client.ts` to read unit roles and create events. Feature flags gate routes in `src/middleware.ts`. Inputs are validated with Zod; SQL goes through Drizzle. Uploads go through UploadThing. Hosting is moving from Vercel to Azure App Service.

"What is sent to and from Orgo" has two halves: what the **browser** sees (redirects, authorization code, session cookie) and what the **server** sends (token exchange, userinfo, API token calls). An attacker who can read either could take over a session or act as the association in Orgo.

## Goals / Non-Goals

**Goals:**
- A written threat model and a findings register the maintainers can act on.
- Repeatable checks in CI so regressions in authorisation, headers or injection handling fail the build.
- A clear verdict on the Orgo flow: what an interceptor can and cannot obtain.

**Non-Goals:**
- Attacking Orgo, Azure, UploadThing or any third-party system.
- A formal external pen test or certification (this change prepares for one).
- Rewriting authentication. Changes are limited to fixes the findings justify.

## Decisions

### Three layers, cheapest first
1. **Static and dependency** (every PR): `npm audit --omit=dev`, gitleaks for secrets, Semgrep with the Next.js/TypeScript rulesets. Fails on high/critical.
2. **Vitest security suite** (`tests/security/`, every PR): runs against route handlers and the real route list. It needs the `scout_toolkit_test` DB like other integration tests and obeys the same "fail, never skip" rule.
3. **Dynamic scan** (nightly and on demand): ZAP baseline then an authenticated active scan against the e2e instance (port 3200, `scout_toolkit_e2e`), logging in through `/api/e2e/session`. Never run active scans against Production.

### Authorisation matrix generated from the filesystem
Enumerate `src/app/api/**/route.ts` and page routes, and require each to be declared in a matrix file with the expected status for guest, member, admin and admin-viewing-as-member. A route missing from the matrix fails the test, in the same spirit as `feature-routes-coverage.test.ts`. This catches the realistic failure: a new endpoint shipped without a check.

### Orgo flow review is a checklist plus tests, not a speculative rewrite
Verify: redirect URI exact-match and one URI per app; PKCE verifier stored only in an httpOnly cookie; `state` omission justified in writing (PKCE-bound code, Orgo echoes `state` mangled, per the comment in the provider) and compensated if the review demands it; tokens never serialised into the session or logs; `callbackUrl` restricted to same-origin paths; `ORGO_API_TOKEN` and `ORGO_CLIENT_SECRET` absent from client bundles (scan `.next/static`) and from error bodies; HTTPS enforced end to end, including behind Azure's proxy (`AUTH_TRUST_HOST`, forwarded headers).

### Injection testing uses a shared payload corpus
One corpus (SQL metacharacters, stacked queries, Unicode tricks, oversized strings, HTML/script/SVG payloads, path traversal, CRLF) is replayed against every mutating and search endpoint discovered from the matrix. Expectations: 4xx with a Portuguese error from `src/lib/errors/`, nothing rendered unescaped, no stack traces. Drizzle parameterises queries, so the tests also grep for `sql.raw`, string-built SQL fragments, and `ilike` patterns built from user input without escaping `%` and `_`.

### Headers and cookies asserted, not assumed
A test fetches representative pages and asserts CSP (no `unsafe-eval` in production), HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors`, and that session cookies are `HttpOnly`, `Secure` (non-local) and `SameSite=Lax` or stricter. UploadThing and image hosts are whitelisted explicitly in CSP.

### Rate limiting
Add a limiter for sign-in start, issue reports, uploads and the bulk ingest endpoint. In-memory is enough for one App Service instance; a shared store is needed on scale-out (see Open Questions).

### Findings register
`docs/security.md` lists id, area, severity (low/medium/high/critical), evidence, fix and status. Criticals and highs block closing this change; mediums and lows may be accepted with a written reason.

## Risks / Trade-offs

- **Active scans can create junk data** → run only against the e2e database, reset after.
- **A strict CSP can break Next.js inline scripts, Swagger UI or UploadThing** → ship `Content-Security-Policy-Report-Only` first, fix violations, then enforce.
- **Scanner false positives create noise** → triage once, record accepted ones in an ignore file with a reason.
- **Rate limits in memory do not hold across instances** → acceptable on one instance, flagged for scale-out.
- **Testing the OAuth flow end to end needs Orgo** → test our provider configuration and callback handling with a mocked IdP; a manual run against the Preview Orgo app covers the real flow.

## Migration Plan

Land the static and Vitest layers first (no runtime effect). Add headers in report-only, then enforce. Add the dynamic scan to CI last, as a non-blocking nightly job until its noise is triaged, then make high findings blocking.

## Open Questions

- Does the AEP want an external pen test later, and who is the contact? This change prepares evidence for it.
- Single App Service instance or scale-out? Decides the rate-limit store.
- Is the `state` omission acceptable to AEP security, or should we ask the Orgo maintainers to fix the echo so `state` can be re-enabled?
