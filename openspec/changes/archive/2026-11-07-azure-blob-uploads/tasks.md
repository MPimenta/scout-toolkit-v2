## 1. Infrastructure

- [x] 1.1 Add the storage account (private, TLS 1.2, shared-key access off), the `activity-images` container and the `Storage Blob Data Contributor` role for both Web Apps (`infra/modules/storage.bicep`, wired into `infra/main.bicep`); add `AZURE_STORAGE_ACCOUNT` to the Web App settings.
- [x] 1.2 Deployed to the existing environment; anonymous access to the container is refused and no storage key exists in the app settings.

## 2. Storage and routes

- [x] 2.1 Storage helper `src/lib/storage/images.ts`: managed identity in Azure, Azurite connection string locally, clear error when unconfigured.
- [x] 2.2 Content detection for JPEG, PNG and WebP with unit tests.
- [x] 2.3 `POST /api/uploads/activity-image` with session check, 5 MB cap, type by content, random name, Portuguese errors, per-user limit and tests.
- [x] 2.4 `GET /media/activity-images/[name]` with name check, streamed blob, cache and `nosniff` headers, and tests.
- [x] 2.5 New routes classified in the coverage test.

## 3. Editor

- [x] 3.1 UploadThing control replaced by a file input with preview, limits text and Portuguese error handling that keeps the previous image; `image_url` validation accepts the stored address.
- [x] 3.2 Locale strings: the editor copy is Portuguese catalogue-admin text, not UI chrome, so `pt.json` and `en.json` are unchanged.

## 4. Remove UploadThing

- [x] 4.1 UploadThing route, library, packages, image domain, variables and documentation removed.
- [x] 4.2 Optional Azurite added to `docker-compose.yml` (profile `storage`) and documented.

## 5. Verification

- [x] 5.1 `npm run typecheck`, `npm run lint` and `npm run test:run` pass; `openspec validate azure-blob-uploads --strict` valid.

## Moved to `enable-activity-image-uploads`

End-to-end test of the upload in the editor (stub or Azurite), the signed-in upload test on Preview (card and detail page, guest refused), and the decision on when activity creation and image upload are switched on in the hosted environments.
