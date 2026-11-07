## Context

`ActivityEditorForm` uses the UploadThing React component; `src/app/api/uploadthing/core.ts` defines one file route (`activityImage`, image, 8 MB so a 5 MB image passes) that requires a session and returns the file address. The catalogue's 97 images are static files under `public/activity-illustrations/` and are not involved. `next.config.ts` allows `uploadthing.com` as an image domain. The Azure environment (change `migrate-hosting-to-azure`) has Web Apps with system-assigned identities, a Key Vault and a Bicep description in `infra/`.

## Goals / Non-Goals

**Goals:** replace UploadThing with Azure Blob Storage, with no storage credentials in production, safe handling of untrusted files, and the same editor experience.
**Non-Goals:** resizing or converting images, a CDN, moving the shipped illustrations, deleting blobs when activities change, uploads from guests.

## Decisions

### Private account, images served through the app
A public container would make every blob address reachable and bakes the storage host name into stored data and the image-domain allow-list. Serving through `GET /media/activity-images/[name]` keeps the account private, keeps stored addresses relative (`/media/activity-images/<uuid>.<ext>`) so a later change of storage or a CDN needs no data migration, and keeps `next/image` working with no new domain. The route streams the blob with `Cache-Control: public, max-age=31536000, immutable` (names are never reused), the stored `Content-Type`, and `X-Content-Type-Options: nosniff`. Cost: a little app compute per first request; the browser and any proxy cache absorb the rest. Rejected: SAS URLs (expire, leak the host), public container (see above).

### Identity-based access
In Azure the app uses `DefaultAzureCredential` with the Web App's managed identity and the blob endpoint from `AZURE_STORAGE_ACCOUNT` (plain setting). `Storage Blob Data Contributor` is granted on the container only. Shared-key access is disabled on the account. Locally, `AZURE_STORAGE_CONNECTION_STRING` points at Azurite (`UseDevelopmentStorage=true`), added to `docker-compose.yml` as an optional service; tests use the SDK against a stub so CI needs no emulator.

### Upload route
`POST /api/uploads/activity-image` (multipart, one `file` field): require a session (401), reject more than one file, read at most 5 MB + 1 byte (413/400 beyond), detect the type from magic bytes (JPEG `FF D8 FF`, PNG signature, WebP `RIFF....WEBP`), generate `crypto.randomUUID()` plus the extension for the detected type, upload with the detected content type, and return `201 { url: "/media/activity-images/<name>" }`. Errors use the shared error handler with Portuguese messages. A small in-memory per-user limit (as for reports) protects against abuse. When storage is not configured the route answers 503.

### Editor
Replace the UploadThing button in `ActivityEditorForm` with a file input that posts to the new route, shows the preview from the returned address, and shows a Portuguese error on failure while keeping the previous image. The 5 MB message and accepted types are shown next to the control.

### Removal
Delete `src/app/api/uploadthing/*`, `src/lib/uploadthing.ts`, the `uploadthing` and `@uploadthing/react` packages, the `uploadthing.com` image domain, the `UPLOADTHING_*` and `NEXT_PUBLIC_UPLOADTHING_URL` variables from `.env.example`, `infra/` settings and Key Vault references, and the references in docs and `.claude/rules/api.md`. The feature-route coverage test is updated for the new routes.

### Infrastructure
`infra/main.bicep` gains `Microsoft.Storage/storageAccounts` (StorageV2, Standard_LRS, `allowBlobPublicAccess: false`, `allowSharedKeyAccess: false`, `minimumTlsVersion: TLS1_2`), a `activity-images` container, and role assignments for both Web Apps. `AZURE_STORAGE_ACCOUNT` is added to the Web App settings. A separate account (not the AEP's existing `aepsemprepronto`) keeps the Kit's data and permissions apart.

## Risks / Trade-offs

- **Malicious or oversized uploads**: content sniffing instead of trusting names, random names, fixed content types, `nosniff`, size cap, rate limit, sign-in required.
- **App serves images**: acceptable at this audience size; immutable caching keeps repeat cost near zero. If traffic grows, put a CDN in front without changing stored addresses.
- **Local setup**: Azurite adds a container to the local stack; the editor works without it by showing the 503 message.
- **Existing UploadThing images**: none in the catalogue, but any activity proposal that already points to an UploadThing address elsewhere (for example in the old Preview database) would keep that address until edited; the old Preview data is being replaced, so this is expected to be empty.

## Migration Plan

1. Add storage to Bicep and deploy to Preview; test an upload end to end.
2. Ship the code with the new route and editor, remove UploadThing.
3. Repeat for Production with the same Bicep when Production is created.
Rollback: revert the change; UploadThing keys can be restored from the vault history if they were created.

## Open Questions

- Should uploaded images be visible only to signed-in users? Assumed public, like today.
- Is 5 MB still the right limit? Assumed yes.
