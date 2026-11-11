## Why

Activity images are uploaded through UploadThing, a third-party service kept from before the move to Azure. It needs its own account, keys and privacy mention, and costs a dependency the AEP no longer needs: the AEP already pays for Azure through the nonprofit grant. No existing activity depends on it (all 97 catalogue images are shipped with the app), so replacing it is cheap now and expensive later.

## What Changes

- Store uploaded activity images in **Azure Blob Storage** in a new, private storage account, instead of UploadThing.
- A server route receives the upload from the editor, checks the session, the real file type (JPEG, PNG or WebP by content, not by name) and size (5 MB), saves it under a random name, and returns the address to store on the activity.
- Images are served by the app itself from a stable path (`/media/activity-images/<name>`) with long-lived cache headers, so the storage account stays private and no storage address leaks into pages or the database.
- The app reaches storage through its **managed identity** (no storage key or connection string in production). Local development uses the Azurite emulator.
- Remove UploadThing: the package, the route, the environment variables, the `uploadthing.com` image domain, its documentation and its Key Vault entries. The Bicep gains the storage account and the role assignment.
- Existing `image_url` values (paths under `/activity-illustrations/`) keep working; nothing is migrated.
- Out of scope: moving the shipped illustrations to Blob, image resizing or conversion, a CDN, and deleting blobs when an activity is removed (a clean-up job can follow).

## Capabilities

### New Capabilities
- `image-uploads`: how images are uploaded, validated, stored, served and removed from activities.

### Modified Capabilities
- `azure-hosting`: the Azure environment also includes a private storage account for images, reached through the Web Apps' managed identity.

## Impact

- Code: `src/app/api/uploadthing/*` and `src/lib/uploadthing.ts` replaced by an upload route, a media route and a small storage helper; `ActivityEditorForm.tsx` and its test; `next.config.ts` (image domains); `package.json` (remove `uploadthing` and `@uploadthing/react`, add `@azure/storage-blob` and `@azure/identity`); `FEATURE_ROUTES` coverage test; `.claude/rules/api.md`, `docs/api.md`, `docs/architecture.md`, `docs/deployment.md`, `README.md`, `.env.example`.
- Azure: a storage account (Standard LRS, private, TLS 1.2) with a container `activity-images`, and `Storage Blob Data Contributor` for each Web App's identity, added to `infra/main.bicep`.
- Removes the UploadThing dependency and its keys; Preview and Production no longer need `UPLOADTHING_*` settings.
- Risks: serving through the app costs a little compute for each image (mitigated by cache headers and the browser cache); malicious files (mitigated by content checks, a random name and a fixed content type); local Azurite needs Docker.
