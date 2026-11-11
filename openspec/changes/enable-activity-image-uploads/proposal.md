## Why

Image uploads to Azure Blob Storage are built, deployed to the Preview and covered by unit tests (change `azure-blob-uploads`, archived), but they have not been tried by a signed-in user in the hosted environment. Creating activities in the hosted Kit is not wanted yet (the catalogue is still loaded and curated centrally), so the end-to-end check and the decision to switch uploads on were deliberately postponed. This change keeps that work visible so it is picked up when activity creation is opened to users.

## What Changes

- Prove the upload end to end in the hosted Preview: a signed-in user uploads a JPEG, PNG and WebP in the activity editor, saves, and sees the image on the card and the detail page; a guest is refused; the image is still served after a restart.
- Add an end-to-end test of the editor upload (against a stub or the Azurite emulator) so the flow is covered in CI.
- Decide, with the AEP, whether uploaded images stay public (as built) or become visible only to signed-in users, and whether the 5 MB limit is right. Adjust the media route if the answer changes.
- Decide when activity creation and image upload are switched on in Preview and in Production, and by which roles (today any signed-in user may upload).
- Create the storage account in Production when Production is created (same Bicep module).
- Out of scope: resizing or converting images, a CDN, deleting blobs when activities change, moving the shipped illustrations.

## Capabilities

### Modified Capabilities
- `image-uploads`: uploads are switched on in a hosted environment only after the hosted check has passed.

## Impact

- Code: possibly `src/app/media/activity-images/[name]/route.ts` (if images become sign-in only), `tests/e2e/` (new upload flow), a feature flag or role check if uploads are gated.
- Azure: the storage account `aepkitimg` already exists and serves Preview; Production reuses the same module when created.
- No change to the database schema.
