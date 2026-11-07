## Purpose

Defines how the Kit de Atividades behaves as an installable Progressive Web App on a phone: what the manifest declares, what the service worker may and may not cache, how a user installs and updates the app, and what is shown without a connection. It applies when the `pwa` feature flag is on.

## ADDED Requirements

### Requirement: The app declares a valid web app manifest

The app SHALL serve a manifest at `/manifest.webmanifest` with `name` "Kit de Atividades", a `short_name` that fits under a home-screen icon, a stable `id`, `start_url`, `scope` "/", `display` "standalone", `lang` "pt", and `theme_color` and `background_color` taken from the existing design tokens. It SHALL list a 192 px icon, a 512 px icon and a 512 px maskable icon whose artwork stays inside the maskable safe zone. No colour SHALL be introduced that is not already a token.

#### Scenario: Chrome considers the app installable

- **WHEN** the production build is opened in Chromium over HTTPS (or localhost) with the flag on
- **THEN** the browser reports no installability errors

#### Scenario: Manifest colours follow the tokens

- **WHEN** the manifest is generated
- **THEN** `theme_color` equals the primary token and `background_color` equals the light background token from `globals.css`

#### Scenario: Maskable icon is not cropped

- **WHEN** the maskable icon is masked to a circle
- **THEN** the mark remains fully visible inside the safe zone

#### Scenario: Flag off

- **WHEN** the `pwa` flag is off
- **THEN** `/manifest.webmanifest` answers 404 and no manifest link is rendered

### Requirement: The page head suits an installed phone app

The document SHALL set `viewport-fit=cover`, a `theme-color` for light and dark colour schemes, the Apple web-app capable and status-bar meta tags, and an Apple touch icon. Zoom SHALL NOT be disabled.

#### Scenario: Theme colour follows colour scheme

- **WHEN** the device is in dark mode
- **THEN** the browser or window chrome uses the dark theme colour

#### Scenario: Pinch zoom is available

- **WHEN** the viewport meta is inspected
- **THEN** it does not set `maximum-scale=1` or `user-scalable=no`

### Requirement: The service worker only caches what is safe to cache

The service worker SHALL be served from `/sw.js` at scope "/" with `Cache-Control: no-cache`. It SHALL cache-first the content-hashed files under `/_next/static/` and the brand images, and SHALL answer a failed navigation with the offline page. It SHALL NOT cache, store or replay: any `/api/` response, any `/auth/` or `/api/auth/` request, `/media/` and upload requests, program exports, any non-GET request, or HTML documents of signed-in pages. Cache names SHALL carry a version and old versions SHALL be deleted on activation.

#### Scenario: Static assets are reused

- **WHEN** a user returns to the app and a hashed JavaScript file is already cached
- **THEN** it is served from the cache without a network request

#### Scenario: Private data is not stored

- **WHEN** a signed-in user opens a program and then the caches are inspected
- **THEN** no cache entry contains an `/api/` response, a session cookie or a signed-in HTML page

#### Scenario: Auth routes bypass the worker

- **WHEN** the user signs in through Orgo
- **THEN** the sign-in and callback requests go to the network and are never answered by the worker

#### Scenario: Old caches are removed

- **WHEN** a new worker version activates
- **THEN** caches from earlier versions are deleted

### Requirement: Offline navigation shows a clear Portuguese page

When a navigation request fails because there is no connection, the app SHALL show an offline page in Portuguese that states there is no connection, says that sign-in, programs and exports need one, and offers a "Tentar novamente" action. The page SHALL meet the same accessibility baseline as other pages and SHALL work without any network request.

#### Scenario: Open the app offline

- **WHEN** the device is offline and the user opens a page that is not available
- **THEN** the offline page is shown instead of the browser error page

#### Scenario: Reconnect

- **WHEN** the user selects "Tentar novamente" after the connection returns
- **THEN** the requested page loads normally

#### Scenario: Actions that need a connection fail clearly

- **WHEN** the device is offline and the user submits a change
- **THEN** the app shows a Portuguese error that says the change was not saved, and nothing is queued silently

### Requirement: Users can install the app without being nagged

The phone menu and the About page SHALL offer "Instalar aplicação" when the app is installable and not already installed. On browsers with an install prompt it SHALL trigger that prompt. On iOS Safari it SHALL show short steps to add the app to the home screen. The entry SHALL be absent in standalone mode, SHALL NOT open on page load, and a dismissal SHALL be remembered for that browser. Install-related text SHALL be added to `pt.json` and `en.json`.

#### Scenario: Install from the menu on Android

- **WHEN** a user on Chrome for Android selects "Instalar aplicação"
- **THEN** the browser's install prompt appears

#### Scenario: iOS instructions

- **WHEN** a user on iOS Safari selects "Instalar aplicação"
- **THEN** a dialog explains how to add the app to the home screen and can be closed from the keyboard

#### Scenario: Already installed

- **WHEN** the app is running in standalone mode
- **THEN** no install entry is shown

#### Scenario: No automatic prompt

- **WHEN** a user visits for the first time
- **THEN** no install banner or dialog appears until they ask for it

### Requirement: Updates are applied safely

When a new service worker is waiting, the app SHALL tell the user that a new version is available and offer "Atualizar". Reloading SHALL activate the waiting worker. The app SHALL NOT swap code underneath an open admin form without the user's action.

#### Scenario: New version available

- **WHEN** a new worker has installed while the app is open
- **THEN** a Portuguese notice offers "Atualizar" and the current page is not reloaded automatically

#### Scenario: Update applied

- **WHEN** the user selects "Atualizar"
- **THEN** the page reloads on the new version and old caches are removed

### Requirement: Sign-out and kill switch clear the worker's data

Signing out SHALL delete every cache the worker created. The worker MAY store the public offline page again on the next navigation, so a signed-out phone still has an offline page; that page is fetched without credentials and holds no user data. Turning the `pwa` flag off SHALL serve a worker at `/sw.js` that deletes all caches and unregisters itself, so installed clients return to a plain website.

#### Scenario: Sign-out clears caches

- **WHEN** a user signs out
- **THEN** the service worker caches are empty until the next navigation, when only the public offline page and the static files it needs are stored again

#### Scenario: Kill switch

- **WHEN** the flag is switched off and a returning client loads the app
- **THEN** the worker unregisters itself and no caches remain

### Requirement: The feature is gated and classified

The `pwa` flag SHALL control manifest, worker registration and install entries. The offline page SHALL always be reachable. New routes SHALL be classified in `FEATURE_ROUTES` or the always-on list so the coverage test passes.

#### Scenario: Flag off in MVP

- **WHEN** `FEATURES` is unset
- **THEN** no service worker is registered, no install entry is shown and the manifest answers 404

#### Scenario: Route coverage

- **WHEN** the route coverage test runs
- **THEN** it passes with the new manifest and offline routes

### Requirement: Installability and caching rules are checked automatically

CI SHALL run unit tests for manifest content and token-derived colours, and Playwright checks on a production build for: no installability errors, worker registration, the offline page when the network is cut, and absence of private data in caches. The checks SHALL fail the build on regression.

#### Scenario: Regression caches an API response

- **WHEN** a change makes the worker cache `/api/` responses
- **THEN** the cache-contents check fails and names the offending entry
