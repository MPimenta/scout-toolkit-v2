## 1. Re-evaluate after Preview testing

- [ ] 1.1 Test the Preview on Azure: PDF export, admin usage dashboard, usage purge, sign-in, program export; record load and memory of the B2 plan and the shared database server.
- [ ] 1.2 Decide go or no-go, the Production host name and who controls its DNS; revisit sizing (plan, dedicated Production database server as fallback).
- [ ] 1.3 Confirm the privacy wording and `FEATURES` for Production (usage tracking).

## 2. Pipeline

- [ ] 2.1 Commit the Dockerfile, `.dockerignore`, `infra/`, workflows and related changes (and decide on the duplicate `public/activity-illustrations/pilot/` folder).
- [ ] 2.2 Confirm the Entra app's federated credentials (Production on `master`, Preview on its environment) and that it holds only the roles it needs.
- [ ] 2.3 Make the deploy depend on the existing test workflow passing.
- [ ] 2.4 Run the deploy workflow on Preview for the first time (build, smoke test, firewall rule open and close, hosted DB step, image switch, health wait, rollback path) and run the usage-purge workflow.
- [ ] 2.5 Scheduled check that no leftover runner firewall rule remains on the database server.

## 3. Azure hardening

- [ ] 3.1 Confirm `kit` and `kit_preview` roles can reach only their own database and that `PUBLIC` connect is revoked.
- [ ] 3.2 Log retention of 30 days and failure alerts on both Web Apps.
- [ ] 3.3 Add a second Owner and move billing ownership from an individual to an AEP identity.
- [ ] 3.4 Remove the temporary `ClientIPAddress_…` firewall rule from `painelaep-pg`.
- [ ] 3.5 Production storage account access for `aep-kit` (done by the shared storage module); repeat the image checks in `enable-activity-image-uploads` when uploads are switched on.

## 4. Production configuration

- [ ] 4.1 Create the Production Orgo app and register its redirect URI for the Production address.
- [ ] 4.2 Put the Production secrets in Key Vault and the Key Vault references and plain settings on `aep-kit`, as done for Preview (pin secret versions to avoid cached values).
- [ ] 4.3 Custom domain and managed certificate; update `NEXTAUTH_URL`, `AUTH_URL`, `NEXT_PUBLIC_APP_URL`; confirm the browser warning is gone.

## 5. Cutover

- [ ] 5.1 Check Neon's PostgreSQL version and plan the dump so it restores into PostgreSQL 16.
- [ ] 5.2 Write the cutover and rollback runbook; lower the DNS TTL.
- [ ] 5.3 Freeze writes on Neon; dump and restore into `kit`; run the hosted DB step; compare counts; switch the host name; smoke test (sign in, search, open an activity, add to a program, PDF export).
- [ ] 5.4 Keep Neon (read-only) and the Vercel project for 14 days; then delete both.

## 6. Clean-up and docs

- [ ] 6.1 Remove `vercel.json`, the `.vercel` link note, the `VERCEL` checks in scripts and Vercel steps from `docs/deployment.md` and `README.md`; `build` becomes plain `next build`.
- [ ] 6.2 Document the Azure runbook (deploy, roll back to the previous tag, rotate a secret, restore a backup, renew the grant).
- [ ] 6.3 Update `.env.example`, `docs/api.md` (purge called by the scheduled workflow) and the Purpose line of `openspec/specs/preview-hosting/spec.md`.
- [ ] 6.4 `openspec validate migrate-production-to-azure --strict`, full test suites and a Production smoke test.
