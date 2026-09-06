## Context

See proposal.md. Activities are read-only via GET. `created_by` FKs to unused `users`. `is_approved` defaults true and public GET filters it. Image is a nullable URL; `MAX_FILE_SIZE` / `SUPPORTED_IMAGE_FORMATS` already exist. `uploadthing` and `@uploadthing/react` are in `package.json` and `next.config.ts` allows `uploadthing.com`, but no UploadThing router or activity form is wired. The public activities table shows Edit/Delete to **everyone**; Edit goes to a missing `/admin/activities/[id]/edit` page and Delete only logs.

## Goals / Non-Goals

**Goals:**

- Admin write API + `/admin/atividades` list/form
- Retarget `created_by` to `"user"`
- Public visibility stays approved-only

**Non-Goals:**

- Leader self-serve create (10.2)
- A second storage vendor beyond UploadThing (already a dependency)
- Rich text

## Decisions

### 1. Admin routes under `/api/admin/activities`

POST create, PATCH update, DELETE, POST image, PATCH `{ is_approved }`. Reuse Zod field rules from the activity insert schema. Goals/SDGs replaced as a set on write.

### 2. Image: HTTPS URL or UploadThing

Wire the existing UploadThing dependency (JPEG/PNG/WebP, 5MB) and keep a paste-HTTPS-URL field. Store the resulting URL in `image_url`. Do not write to `public/uploads` (ephemeral on Vercel).

Alternative: local `public/uploads` only. Rejected — the package is already installed and disk is not durable in prod.

### 3. Delete 409 if `program_entries.activity_id` references it

No silent SET NULL from the admin UI. A later "force" can be added; spec default is 409.

### 4. Admin-created activities default `is_approved = true`

Catalogue edits by an admin are published. 10.2 will default false for non-admin POST.

### 5. Hide catalogue Edit/Delete from the public list

Remove Edit/Delete from `ActivitiesTable` / the public activities page. Admins manage content on `/admin/atividades`. The public list stays browse-only for every role.

## Risks / Trade-offs

- [Neon `created_by` still points at `users`] → Drop old FK, add FK to `"user"`, null existing orphans
- [UploadThing env missing in some environments] → Form still accepts an HTTPS URL; tests can stub the upload route
- [Force-delete not in first slice] → 409 may annoy; safer than breaking programs

## Migration Plan

1. Retarget `created_by`
2. Admin API + form
3. Point nav from dashboard
4. Rollback: remove write routes; public GET unchanged

## Open Questions

- None that change the spec. Storage host can be swapped later without changing `image_url`.
