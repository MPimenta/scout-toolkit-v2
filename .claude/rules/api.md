---
paths:
  - "src/app/api/**"
  - "src/lib/swagger/**"
---

# API routes

- Validate every request body and query with Zod before using it.
- Check auth and role server-side (admin routes: `/api/admin/*`).
- Return errors through `src/lib/errors/api-error-handler.ts` in the shared shape:
  `{ "error": { "code": "ERROR_CODE", "message": "<Portuguese message>", "details": {} } }`
- Success responses: `{ "data": ..., "pagination"?: ... }`. Paginate list endpoints.
- Keep the OpenAPI docs (`src/lib/swagger`) in sync when changing endpoints.
- Uploads (UploadThing, `src/app/api/uploadthing`): images only (JPEG/PNG/WebP), max 5MB, validated server-side.
