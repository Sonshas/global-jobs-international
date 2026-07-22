# Sprint 3 workflow verification

Generated: 2026-07-21T17:29:05.215Z

| Step | Check | Status | Evidence |
|---:|---|---|---|
| 1 | Applicant registers | PASS | Created authenticated applicant a705f1f4-674f-4cd5-a92f-910976263536. |
| 2 | Applicant completes profile | PASS | Confirmed trigger-created user/applicant rows and updated applicant 1095d3c5-aa0a-4bda-b198-11eea2f20464. |
| 3 | Applicant uploads PDF document | PASS | Uploaded private PDF and inserted documents row 8e00086c-8a96-4574-a081-a13531495437. |
| 4 | Applicant applies with timeline and visa | PASS | Created application cddd6690-d20b-43c4-ad09-8ca80550513f, timeline, and visa_progress 42692515-068f-492b-a7b7-7b197d0ce9c2. |
| 5 | Operator receives application | PASS | CLI-provisioned admin/employer e65dfb63-9470-4a71-99bd-4fc33a7c18a3 read the application. |
| 6 | Operator shortlists applicant | PASS | Operator changed status to shortlisted and appended timeline event. |
| 7 | In-app notification inserts | PASS | Applicant self-inserted notification 62c79c12-4696-4842-824e-e875b08b124d. |
| 8 | Email delivery path works | PASS | Authenticated self-email returned provider=log; development log mode. |
| 9 | Staff advances pipeline stage | PASS | Operator advanced pipeline to interview and appended timeline event. |
| 10 | Visa tracker updates | PASS | Operator updated visa_progress tracker (canonical visa record). |
| 11 | Applicant sees DB timeline update | PASS | Applicant re-read 4 DB-visible timeline events; UI polls applications every 15 seconds. |
| 12 | Operator reads complete history | PASS | Operator read 3 immutable status-history event(s) and metadata timeline. |
| 13 | Supabase persistence checks | PASS | Application, document, notification, visa progress, and status/timeline events persist in Supabase. |
| 14 | RBAC negative checks | PASS | Outsider cannot read admin_users, update another application, or assign roles. |
| 15 | Results and evidence written | PASS | Verification JSON and Markdown evidence were written. |

Counts: **15 PASS, 0 FAIL, 0 BLOCKED**.

## Remaining external blockers
- Production email delivery requires a configured Resend API key and verified sender; development log mode is sufficient for Sprint 3 verification.

Run `node scripts/verify-sprint3-workflow.mjs` after `npx supabase db push`. The UI reflects database changes through its 15-second application polling.
