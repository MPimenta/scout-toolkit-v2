## Why

The Azure environment is built and the Preview runs on it (change `migrate-hosting-to-azure`, archived): image, infrastructure as code, Key Vault, database, sign-in and data are in place. Production was deliberately left out ("production is not for now"): `aep-kit` still runs a placeholder image, there is no production Orgo app, the `kit` database is empty, no custom domain exists, and the GitHub workflows have never run. Vercel and Neon still host the real service. This change holds everything that remains, to be re-evaluated once the Preview has been tested thoroughly and the AEP decides to go live.

## What Changes

- Re-evaluate the plan after Preview testing: sizing of the B2 plan and the shared `painelaep-pg` server under load, PDF export on Azure, the usage-purge job, and whether the Production host name and DNS are ready.
- Production configuration: separate Orgo app and redirect URIs, Production secrets in Key Vault and Key Vault references on `aep-kit`, `FEATURES` per the privacy decision, a custom domain with a managed certificate (this also resolves the Chrome Safe Browsing warning seen on the automatic address).
- Pipeline: commit the Dockerfile, Bicep and workflows; confirm the Entra app's federated credentials (Production on `master`, Preview on its environment) and minimal roles; make the deploy depend on the test workflow; run the deploy and purge workflows for the first time; add the scheduled check for leftover runner firewall rules.
- Hardening checks left from the Preview build: role scoping and revoked `PUBLIC` connect on `kit` and `kit_preview`, 30-day log retention and failure alerts, a second Owner and billing ownership by an AEP identity.
- Cutover: runbook and rollback; Neon version check and dump; lower DNS TTL; freeze writes on Neon; restore into `kit`; run the hosted database step; compare counts; switch the host name.
- Retire Vercel and Neon after a 14-day grace period; remove `vercel.json` and Vercel-specific code, scripts and documentation; document the Azure runbook (deploy, roll back, rotate a secret, restore a backup, renew the grant); update `.env.example`, `docs/api.md` and the Purpose line of the `preview-hosting` spec.
- Production storage for images follows `enable-activity-image-uploads`.

## Capabilities

### Modified Capabilities
- `azure-hosting`: Production goes live only after a rehearsed cutover with a documented rollback.

## Impact

- Azure: Production Web App `aep-kit` configured and running the real image, `kit` database restored, custom domain and certificate, alerts and role checks.
- GitHub: workflows and Dockerfile/infra committed, OIDC credentials verified, scheduled purge and firewall-rule checks.
- External: DNS control of the production host name, a Production Orgo app, billing ownership.
- Removes Vercel and Neon at the end. Does not change application behaviour or the database schema.
