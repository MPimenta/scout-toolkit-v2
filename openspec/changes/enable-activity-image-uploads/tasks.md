## 1. Decisions

- [ ] 1.1 Decide with the AEP: uploaded images public or sign-in only; keep the 5 MB limit or change it.
- [ ] 1.2 Decide when activity creation and image upload are switched on in Preview and Production, and which roles may upload (today: any signed-in user).

## 2. Tests

- [ ] 2.1 End-to-end test of the editor upload (stub or Azurite): choose a file, see the preview, save, see the image on the card and detail page; wrong type and too-large files show the Portuguese error and keep the previous image.
- [ ] 2.2 Add the test to the E2E projects that run in CI and keep it independent of Azure.

## 3. Hosted check (Preview)

- [ ] 3.1 As a signed-in user upload a JPEG, a PNG and a WebP in the editor, save, and see them on the card and detail page.
- [ ] 3.2 Confirm a guest is refused (401) and an unknown image name answers 404.
- [ ] 3.3 Restart the Web App and confirm the images are still served; confirm the app settings hold no storage key.

## 4. Adjustments and rollout

- [ ] 4.1 If images become sign-in only, add the session check to the media route and update the spec and tests.
- [ ] 4.2 Apply the role or flag decided in 1.2 to the upload route and the editor.
- [ ] 4.3 Production: deploy `infra/modules/storage.bicep` for the Production Web App when `migrate-production-to-azure` creates it, and repeat 3.1 to 3.3 there.
- [ ] 4.4 `npm run typecheck`, `npm run lint`, `npm run test:run`, `npm run test:e2e`, `openspec validate enable-activity-image-uploads --strict`.
