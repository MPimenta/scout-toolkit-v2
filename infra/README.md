# Azure infrastructure

Describes where Kit de Atividades runs on Azure (openspec change `migrate-hosting-to-azure`). It holds no secret values.

| Resource | Name | Notes |
|---|---|---|
| Resource group | `rg-kit-de-atividades` | North Europe, same region as the AEP's database and network |
| App Service plan | `kit-plan` | Linux B2 |
| Web App, Production | `aep-kit` | `https://aep-kit.azurewebsites.net` until a domain is chosen |
| Web App, Preview | `aep-kit-preview` | `FEATURES=usage-tracking` |
| Container Registry | `aepkit` | Basic; Web Apps pull with their managed identity |
| Key Vault | `aepkit-kv` | RBAC, purge protection on |
| Integration subnet | `kit-apps` in `painelaep-vnet` | `10.20.3.0/26`, delegated to `Microsoft.Web/serverFarms` |
| Databases | `kit`, `kit_preview` | on the AEP's `painelaep-pg` server (PostgreSQL 16), one login role each |

## Create it

```bash
az group create -n rg-kit-de-atividades -l northeurope
az deployment group what-if -g rg-kit-de-atividades -f infra/main.bicep -p infra/main.parameters.json
az deployment group create  -g rg-kit-de-atividades -f infra/main.bicep -p infra/main.parameters.json
```

A person runs this the first time; it needs the `Microsoft.ContainerRegistry` provider registered on the subscription.

## Databases and roles (run once, with the server administrator)

```sql
-- as the administrator, connected to the `postgres` database
CREATE DATABASE kit;
CREATE DATABASE kit_preview;
REVOKE CONNECT ON DATABASE kit FROM PUBLIC;
REVOKE CONNECT ON DATABASE kit_preview FROM PUBLIC;
CREATE ROLE kit_app LOGIN PASSWORD '<generated>';          -- used by the running Production app
CREATE ROLE kit_preview_app LOGIN PASSWORD '<generated>';  -- used by the running Preview app
CREATE ROLE kit_migrator LOGIN PASSWORD '<generated>' CREATEROLE; -- used only by the deploy workflow
GRANT CONNECT ON DATABASE kit TO kit_app, kit_migrator;
GRANT CONNECT ON DATABASE kit_preview TO kit_preview_app, kit_migrator;
-- then, in each database: make kit_migrator the owner of the schema objects and grant
-- kit_app / kit_preview_app the DML rights on them (see docs/deployment.md, Azure section).
```

## Key Vault secrets

Names the workflows and Web Apps expect (values are created by a person, never committed):

| Secret | Used by |
|---|---|
| `kit-migration-url`, `kit-preview-migration-url` | deploy workflow (hosted database step) |
| `kit-database-url`, `kit-preview-database-url` | running apps (`DATABASE_URL`) |
| `kit-nextauth-secret`, `kit-preview-nextauth-secret` | `NEXTAUTH_SECRET` and `AUTH_SECRET` |
| `kit-orgo-client-secret`, `kit-preview-orgo-client-secret` | `ORGO_CLIENT_SECRET` |
| `kit-orgo-api-token`, `kit-preview-orgo-api-token` | `ORGO_API_TOKEN` (optional) |
| `kit-cron-secret`, `kit-preview-cron-secret` | `CRON_SECRET`, and the purge workflow |

A Web App setting then points at the secret with a Key Vault reference, for example
`@Microsoft.KeyVault(VaultName=aepkit-kv;SecretName=kit-database-url)`.

## Deploy identity (OIDC)

Create one Entra app registration with federated credentials for `repo:MPimenta/scout-toolkit-v2` on the GitHub environments `production` and `preview`, and set the repository variables `AZURE_CLIENT_ID`, `AZURE_TENANT_ID` and `AZURE_SUBSCRIPTION_ID` (they are identifiers, not secrets). Give it only: push on the registry, contributor on the two Web Apps, `Key Vault Secrets User` on the vault, and the right to manage firewall rules on the database server.
