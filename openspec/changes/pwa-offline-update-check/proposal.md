## Why

`mobile-pwa` was verified on real devices (Android Chrome and iOS Safari: install, launch, Orgo sign-in, browse, export, icon). Two behaviours were covered by automated tests and the Azure Preview checks but not exercised by hand on a phone: the offline page and the "Atualizar" update notice. This change holds that remaining check so `mobile-pwa` can be archived.

## What Changes

- Hand-check the offline page on Android and iPhone, in the browser and in the installed app.
- Hand-check the update notice by deploying a new version to the Preview while the app is installed.
- Log any finding as a task here; no code change is planned unless a check fails.

## Capabilities

### Modified Capabilities
- `progressive-web-app`: no requirement changes; confirms the offline-page and update-notice requirements on real devices.

## Impact

None on code. Needs a phone and, for the update check, one extra Preview deploy.
