## Context

See proposal.md. Local app DB is Docker `scout_toolkit_dev`; SQL tests are `scout_toolkit_test`. `docs/testing.md` already says Preview is optional read-mostly and Production has no write tests. `docs/deployment.md` is outdated (Google OAuth, `.env.production` file). Vercel Preview builds set `NODE_ENV=production`, so `/api/e2e/session` stays 404 — that matches the testing spec. Next.js never loads `.env.preview`.

## Goals / Non-Goals

**Goals:**

- One Vercel project, Preview per PR, Production from `main` (or the branch you choose)
- Isolated Neon for Preview; documented env + Orgo redirect setup
- Schema apply on Preview deploy

**Non-Goals:**

- Custom production domain / DNS
- Preview write E2E or Neon truncate
- A repo `.env.preview`
- Changing the CI Postgres gate
- Full production launch checklist beyond what Preview needs (monitoring, Sentry) — note them in docs only

## Decisions

1. **Vercel + Neon, not a second Docker host**  
   Matches the existing deployment doc and Auth.js/UploadThing hosting.  
   Alternative: Railway/Fly with Docker Compose. Rejected: more ops for the same Next app.

2. **Preview database = Neon branch or a dedicated Neon project**  
   Prefer the Neon–Vercel integration (per-preview branch) when available; otherwise one shared `preview` Neon DB is acceptable for the first Preview. Production stays a separate Neon DB.  
   Alternative: point Preview at production Neon. Rejected.

3. **Auth URL on unique `*.vercel.app` previews**  
   Set `AUTH_URL` / `NEXTAUTH_URL` to `https://$VERCEL_URL` in a Vercel build env or use Auth.js `trustHost`. Document both; pick `trustHost` if unique preview URLs cannot all be listed. Orgo OAuth still needs either a wildcard redirect or a stable Preview domain (Vercel "Preview" alias) listed on the OAuth app.

4. **Schema on deploy**  
   `drizzle-kit migrate` or `drizzle-kit push` in a Vercel build command **only** against the Preview/Production `DATABASE_URL` for that environment. Never run `tests/setup.ts` against Neon.

5. **Orgo and UploadThing**  
   Reuse the same Orgo OAuth app with extra redirect URIs, or a dedicated Preview OAuth app. UploadThing can share the dev app for Preview. `ORGO_API_TOKEN` (write) is optional on Preview until `orgo-program-event` ships.

## Risks / Trade-offs

- [Risk] Unique Preview URLs break Orgo redirect → Mitigation: stable Vercel preview domain or `trustHost` + documented redirect URI list.
- [Risk] Shared preview Neon is wiped by two PRs → Mitigation: prefer per-preview Neon branch; if shared, say so in docs.
- [Risk] Accidental migrate against production → Mitigation: Vercel env isolation; Production vars are not visible to Preview.
- [Risk] Someone adds Preview write tests later → Mitigation: spec forbids it; testing-strategy already forbids it.

## Migration Plan

Create Vercel + Neon + OAuth redirects. Rollback: disconnect the Vercel project. Local Docker unchanged.

## Open Questions

None that block the spec. Stable preview domain vs listing every `*.vercel.app` URI is an ops choice recorded in `docs/deployment.md` when applying.
