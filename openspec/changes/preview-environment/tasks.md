## 1. Hosting and database

- [ ] 1.1 Create or connect the Vercel project to this GitHub repo and verify a pull request receives a Preview URL
- [ ] 1.2 Provision a Neon database for Preview (branch or dedicated project) and set Preview `DATABASE_URL` on Vercel — verify it is not production and not `scout_toolkit_test`

## 2. Env, auth, and schema

- [ ] 2.1 Set Preview-scoped Vercel env (Auth secret, Orgo OAuth, `ADMIN_EMAILS`, UploadThing, Auth URL / `trustHost`) with no `.env.preview` file — verify `.env.example` lists the names only
- [ ] 2.2 Register Preview callback URL(s) on the Orgo OAuth app and verify "Entrar com o eAEP" completes on the Preview URL
- [ ] 2.3 Apply schema to the Preview Neon DB on deploy and verify `/home` loads against that database

## 3. Docs and guardrails

- [x] 3.1 Rewrite the Preview section of `docs/deployment.md` (Vercel scopes, Neon isolation, Orgo redirects, no write tests, e2e session 404) and point Epic 16 in `docs/planning.md` at this change
- [x] 3.2 Confirm `.github/workflows/test.yml` still uses workflow Postgres only (no Preview write job)
