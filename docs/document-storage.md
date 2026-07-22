# Document storage (C4)

Applicant and apply-flow uploads use **Supabase Storage** bucket `documents` with matching rows in `public.documents`.

## Architecture

| Layer | Responsibility |
|--------|----------------|
| **Client** | `documents.repository.ts` — validate file, upload to Storage, insert/update `documents`, signed download URLs |
| **Postgres** | `documents` table (metadata, RLS) + `document_types` reference |
| **Storage** | Private bucket `documents`; path `{user_id}/{applicant_id}/{document_id}/{filename}` |
| **RLS** | Table policies in `20260721000010_rls_policies.sql` + staff read/review in `20260721000014_document_storage.sql` |

## UI entry points

- `/dashboard/documents` — document vault (upload, download, status)
- `/apply/:jobId` — required documents uploaded to Storage before submit
- Admin pipeline — document list from DB (`useApplicantDocuments`)

## Security controls

- **Private bucket** — no public URLs; downloads use short-lived signed URLs
- **MIME allow-list** — bucket `allowed_mime_types` + client `validateSecureUpload`
- **Size limit** — 8 MB client; bucket `file_size_limit` 8388608 bytes
- **Path sanitization** — `sanitizeStorageFileName` prevents path traversal in object keys
- **Rate limit** — client `checkRateLimit` on uploads per user
- **RLS** — applicants own prefix; employers/staff/admin per `documents` + `storage_document_readable()`

## Operations

1. Apply migration `20260721000014_document_storage.sql` on each environment.
2. In Supabase Dashboard → Storage, confirm bucket `documents` exists (private).
3. Verify upload as applicant and download as staff with staging checklist (`docs/staging-e2e-checklist.md`).

## Replacing a document

Uploading the same document **kind** again deletes the prior Storage object and `documents` row for that applicant/type, then inserts the new file.

## Malware / virus scanning (not implemented in V1)

There is **no server-side antivirus or content-disassembly step** in this repository today. Protection relies on:

- Private bucket + RLS (no anonymous reads)
- MIME allow-list on bucket and client (`validateSecureUpload`)
- File size cap (8 MB)
- Path sanitization on object keys
- Short-lived signed URLs for download

**Before high-volume production**, plan one of:

1. **Supabase Storage webhook** → Edge Function or Express route that scans new objects (e.g. ClamAV sidecar, cloud AV API) and quarantines on failure.
2. **Upload proxy** on the Node server (service role upload only after scan).
3. **Periodic scan** of bucket prefixes with alerting (weaker; does not block pre-download).

Until then, treat uploads as **untrusted** and restrict staff downloads to trusted workstations.
