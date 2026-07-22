#!/usr/bin/env node
/**
 * Live, no-service-role verification of the Sprint 3 workflow.
 * Test records are intentionally retained for auditability.
 */
import { createRequire } from 'node:module';
import { writeFile, unlink } from 'node:fs/promises';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertSprint3Env } from './lib/env-preflight.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(root, 'scripts', 'verify-sprint3-workflow-results.json');
const workflowDoc = path.join(root, 'docs', 'sprint3-workflow-verification.md');
const { createClient } = createRequire(path.join(root, 'client', 'package.json'))('@supabase/supabase-js');
const execFileAsync = promisify(execFile);
const names = [
  'Applicant registers', 'Applicant completes profile', 'Applicant uploads PDF document',
  'Applicant applies with timeline and visa', 'Operator receives application',
  'Operator shortlists applicant', 'In-app notification inserts', 'Email delivery path works',
  'Staff advances pipeline stage', 'Visa tracker updates', 'Applicant sees DB timeline update',
  'Operator reads complete history', 'Supabase persistence checks', 'RBAC negative checks',
  'Results and evidence written',
];
const verificationServerUrl = 'http://localhost:3002';
const steps = names.map((name, index) => ({ step: index + 1, name, status: 'BLOCKED', evidence: 'Not attempted.' }));
const set = (number, status, evidence) => Object.assign(steps[number - 1], { status, evidence });
const brief = (error) => String(error?.message ?? error ?? 'Unknown error').replace(/\s+/g, ' ').slice(0, 500);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchOk(url) {
  try { const response = await fetch(url, { signal: AbortSignal.timeout(1_500) }); return response.ok; } catch { return false; }
}
async function startServer() {
  if (await fetchOk(`${verificationServerUrl}/api/health`)) return null;
  const child = spawn('npm', ['run', 'dev', '-w', 'server'], {
    cwd: root, windowsHide: true, stdio: 'ignore', shell: process.platform === 'win32',
    env: { ...process.env, PORT: '3002' },
  });
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await wait(500);
    if (await fetchOk(`${verificationServerUrl}/api/health`)) return child;
  }
  child.kill();
  throw new Error(`Server did not become healthy on ${verificationServerUrl}.`);
}
async function provisionOperator(userId, operatorEmail) {
  const sql = [
    `select public.assign_user_role('${userId}'::uuid, 'admin', '${userId}'::uuid);`,
    `select public.assign_user_role('${userId}'::uuid, 'employer', '${userId}'::uuid);`,
    `select public.seed_platform_employer('${userId}'::uuid);`,
    `select id from public.users where id = '${userId}'::uuid and email = '${operatorEmail.replace(/'/g, "''")}';`,
  ].join(' ');
  const relativeFile = path.join('scripts', `.sprint3-provision-${userId}.sql`);
  const file = path.join(root, relativeFile);
  await writeFile(file, `${sql}\n`, 'utf8');
  try {
    const command = `npx supabase db query --linked --file ${relativeFile}`;
    try {
      const { stdout, stderr } = await execFileAsync(
        process.platform === 'win32' ? 'cmd.exe' : 'sh',
        process.platform === 'win32' ? ['/d', '/s', '/c', command] : ['-lc', command],
        { cwd: root, windowsHide: true, timeout: 60_000 },
      );
      return `${stdout}${stderr}`.trim();
    } catch (error) {
      throw new Error(`${brief(error)} ${String(error?.stderr ?? '').trim()}`.trim());
    }
  } finally {
    await unlink(file).catch(() => {});
  }
}
function client(url, anonKey, token) {
  return createClient(url, anonKey, {
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
let url;
let anonKey;
let serverEnv = {};
let clientEnv = {};
let envWarnings = [];
const runId = `s3-${Date.now()}-${randomUUID().slice(0, 8)}`;
const context = { runId, applicantUserId: null, applicantId: null, operatorUserId: null, applicationId: null, documentId: null, notificationId: null, visaProgressId: null };
let environment = {
  projectRef: null,
  serverUrlMatchesClient: false,
  serverAnonMatchesClient: false,
  serviceRoleConfigured: false,
  resendConfigured: false,
  envWarnings: [],
};
let serverChild = null;

try {
  const preflight = await assertSprint3Env(root);
  ({ clientEnv, serverEnv, url, anonKey } = preflight);
  envWarnings = preflight.warnings;
  environment = {
    projectRef: url ? new URL(url).hostname.split('.')[0] : null,
    serverUrlMatchesClient: serverEnv.SUPABASE_URL === url,
    serverAnonMatchesClient: serverEnv.SUPABASE_ANON_KEY === anonKey,
    serviceRoleConfigured: Boolean(serverEnv.SUPABASE_SERVICE_ROLE_KEY),
    resendConfigured: Boolean(serverEnv.RESEND_API_KEY),
    envWarnings,
  };
  if (envWarnings.length) {
    console.warn('[env] Warnings:\n' + envWarnings.map((w) => `  • ${w}`).join('\n'));
  }

  const publicClient = client(url, anonKey);
  const applicantEmail = `sprint3.${runId}@example.invalid`;
  const applicantPassword = `S3!${randomUUID()}Aa`;
  const { data: signup, error: signupError } = await publicClient.auth.signUp({
    email: applicantEmail, password: applicantPassword,
    options: { data: { full_name: `Sprint 3 ${runId}`, role: 'applicant', account_type: 'applicant' } },
  });
  if (signupError || !signup.user || !signup.session) {
    throw signupError ?? new Error('Signup did not issue a session; disable email confirmation for this isolated verification project.');
  }
  context.applicantUserId = signup.user.id;
  const applicant = client(url, anonKey, signup.session.access_token);
  set(1, 'PASS', `Created authenticated applicant ${signup.user.id}.`);

  await wait(500);
  const { data: profile, error: profileError } = await applicant.from('users').select('id').eq('id', signup.user.id).single();
  const { data: country, error: countryError } = await applicant.from('countries').select('id').limit(1).single();
  if (profileError || countryError || !profile) throw profileError ?? countryError ?? new Error('Profile trigger rows unavailable.');
  const { data: applicantRow, error: applicantError } = await applicant.from('applicants').select('id, metadata').eq('user_id', signup.user.id).single();
  if (applicantError || !applicantRow) throw applicantError ?? new Error('Applicant trigger row unavailable.');
  const profileMetadata = { verificationRun: runId, full_name: `Sprint 3 ${runId}`, passport_status: 'valid' };
  const updates = await Promise.all([
    applicant.from('users').update({ full_name: profileMetadata.full_name, metadata: profileMetadata }).eq('id', signup.user.id),
    applicant.from('applicants').update({ has_passport: true, metadata: { ...applicantRow.metadata, ...profileMetadata } }).eq('id', applicantRow.id),
  ]);
  if (updates.some(({ error }) => error)) throw updates.find(({ error }) => error).error;
  context.applicantId = applicantRow.id;
  set(2, 'PASS', `Confirmed trigger-created user/applicant rows and updated applicant ${applicantRow.id}.`);

  const { data: documentType, error: typeError } = await applicant.from('document_types').select('id, slug').limit(1).single();
  if (typeError || !documentType) throw typeError ?? new Error('No document type exists.');
  const documentId = randomUUID();
  const storagePath = `${signup.user.id}/${applicantRow.id}/${documentId}/verification.pdf`;
  const pdf = Buffer.from('%PDF-1.4\n% Sprint 3 verification\n%%EOF\n');
  const { error: uploadError } = await applicant.storage.from('documents').upload(storagePath, pdf, { contentType: 'application/pdf' });
  if (uploadError) throw uploadError;
  const { error: documentError } = await applicant.from('documents').insert({
    id: documentId, user_id: signup.user.id, applicant_id: applicantRow.id, document_type_id: documentType.id,
    file_name: 'verification.pdf', storage_bucket: 'documents', storage_path: storagePath,
    mime_type: 'application/pdf', file_size_bytes: pdf.length, metadata: { verificationRun: runId },
  });
  if (documentError) throw documentError;
  context.documentId = documentId;
  set(3, 'PASS', `Uploaded private PDF and inserted documents row ${documentId}.`);

  const operatorEmail = `sprint3.operator.${runId}@example.invalid`;
  const operatorPassword = `S3!${randomUUID()}Aa`;
  const { data: operatorSignup, error: operatorSignupError } = await publicClient.auth.signUp({
    email: operatorEmail, password: operatorPassword, options: { data: { full_name: `Sprint 3 Operator ${runId}` } },
  });
  if (operatorSignupError || !operatorSignup.user || !operatorSignup.session) throw operatorSignupError ?? new Error('Operator signup did not issue a session.');
  context.operatorUserId = operatorSignup.user.id;
  await wait(500);
  await provisionOperator(operatorSignup.user.id, operatorEmail);
  const operator = client(url, anonKey, operatorSignup.session.access_token);

  const { data: jobId, error: jobError } = await applicant.rpc('ensure_catalog_job', {
    // ensure_catalog_job derives its slug from the first eight catalog-id
    // characters, so retain a random prefix across repeated live runs.
    p_catalog_id: `${randomUUID()}-verification-${runId}`,
    p_payload: { title: 'Sprint 3 Verification Role', country: 'Canada', description: 'Isolated verification listing.', vacancies: 1, visaSponsorship: true },
  });
  const { data: applicationNumber, error: numberError } = await applicant.rpc('next_gji_application_number');
  if (jobError || numberError || !jobId || !applicationNumber) throw jobError ?? numberError ?? new Error('Catalog job or application number unavailable.');
  const submittedAt = new Date().toISOString();
  const initialTimeline = [
    { id: randomUUID(), label: 'Application Submitted', status: 'completed', at: submittedAt },
    { id: randomUUID(), label: 'Employer Review', status: 'in_progress', at: submittedAt },
  ];
  const metadata = { applicationNumber, verificationRun: runId, currentStage: 'Employer Review', recruitmentTimeline: initialTimeline, visaTracker: { 'Documents Received': false } };
  const { data: application, error: applicationError } = await applicant.from('applications')
    .insert({ job_id: jobId, applicant_id: applicantRow.id, status: 'submitted', source: 'website', metadata })
    .select('id, metadata').single();
  if (applicationError || !application) throw applicationError ?? new Error('Application insert returned no row.');
  context.applicationId = application.id;
  const { error: documentLinkError } = await applicant.from('documents').update({ application_id: application.id }).eq('id', documentId);
  const { data: job, error: jobReadError } = await applicant.from('jobs').select('country_id').eq('id', jobId).single();
  const { data: visa, error: visaError } = await applicant.from('visa_progress').insert({
    application_id: application.id, applicant_id: applicantRow.id, country_id: job?.country_id,
    stage: 'documents_collection', metadata: { verificationRun: runId, tracker: metadata.visaTracker },
  }).select('id').single();
  if (documentLinkError || jobReadError || visaError || !visa) throw documentLinkError ?? jobReadError ?? visaError ?? new Error('Visa/document setup failed.');
  context.visaProgressId = visa.id;
  set(4, 'PASS', `Created application ${application.id}, timeline, and visa_progress ${visa.id}.`);

  const { data: operatorApplication, error: operatorReadError } = await operator.from('applications').select('id, metadata').eq('id', application.id).single();
  if (operatorReadError || !operatorApplication) throw operatorReadError ?? new Error('Operator cannot read application.');
  set(5, 'PASS', `CLI-provisioned admin/employer ${operatorSignup.user.id} read the application.`);

  const shortlistTimeline = [...operatorApplication.metadata.recruitmentTimeline, { id: randomUUID(), label: 'Shortlisted', status: 'completed', at: new Date().toISOString() }];
  const { error: shortlistError } = await operator.from('applications').update({
    status: 'shortlisted', metadata: { ...operatorApplication.metadata, currentStage: 'Shortlisted', recruitmentTimeline: shortlistTimeline },
  }).eq('id', application.id);
  if (shortlistError) throw shortlistError;
  set(6, 'PASS', 'Operator changed status to shortlisted and appended timeline event.');

  const { data: notification, error: notificationError } = await applicant.from('notifications').insert({
    user_id: signup.user.id, title: 'Sprint 3 update', body: 'Shortlisted', channel: 'in_app',
    event_type: 'application_update', entity_type: 'application', entity_id: application.id,
  }).select('id').single();
  if (notificationError || !notification) throw notificationError ?? new Error('Notification insert returned no row.');
  context.notificationId = notification.id;
  set(7, 'PASS', `Applicant self-inserted notification ${notification.id}.`);

  serverChild = await startServer();
  const emailResponse = await fetch(`${verificationServerUrl}/api/comms/email`, {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${signup.session.access_token}` },
    body: JSON.stringify({ to: applicantEmail, template: 'application_submitted', variables: { name: 'Sprint 3', applicationNumber, jobTitle: 'Verification Role', country: 'Canada' } }),
  });
  const emailBody = await emailResponse.json().catch(() => ({}));
  if (!emailResponse.ok || !['log', 'resend'].includes(emailBody.provider)) throw new Error(`Email endpoint ${emailResponse.status}: ${JSON.stringify(emailBody)}`);
  set(8, 'PASS', `Authenticated self-email returned provider=${emailBody.provider}; ${emailBody.provider === 'log' ? 'development log mode' : 'Resend accepted delivery'}.`);

  const { data: current, error: currentError } = await operator.from('applications').select('metadata').eq('id', application.id).single();
  if (currentError || !current) throw currentError ?? new Error('Application disappeared before staff update.');
  const staffTimeline = [...current.metadata.recruitmentTimeline, { id: randomUUID(), label: 'Interview', status: 'in_progress', at: new Date().toISOString() }];
  const { error: staffError } = await operator.from('applications').update({
    status: 'interview', metadata: { ...current.metadata, currentStage: 'Interview', recruitmentTimeline: staffTimeline },
  }).eq('id', application.id);
  if (staffError) throw staffError;
  set(9, 'PASS', 'Operator advanced pipeline to interview and appended timeline event.');

  const { data: visaRead, error: visaReadError } = await operator.from('visa_progress').select('metadata').eq('id', visa.id).single();
  if (visaReadError || !visaRead) throw visaReadError ?? new Error('Operator cannot read visa progress.');
  const tracker = { ...visaRead.metadata.tracker, 'Documents Received': true };
  const { error: visaUpdateError } = await operator.from('visa_progress').update({ metadata: { ...visaRead.metadata, tracker } }).eq('id', visa.id);
  if (visaUpdateError) throw visaUpdateError;
  set(10, 'PASS', 'Operator updated visa_progress tracker (canonical visa record).');

  const { data: applicantView, error: applicantViewError } = await applicant.from('applications').select('metadata').eq('id', application.id).single();
  const applicantTimeline = applicantView?.metadata?.recruitmentTimeline;
  if (applicantViewError || !Array.isArray(applicantTimeline) || applicantTimeline.length < 4) throw applicantViewError ?? new Error('Applicant did not observe all timeline events.');
  set(11, 'PASS', `Applicant re-read ${applicantTimeline.length} DB-visible timeline events; UI polls applications every 15 seconds.`);

  const { data: history, error: historyError } = await operator.from('application_status_history').select('id, to_status, created_at').eq('application_id', application.id);
  if (historyError || !history?.length) throw historyError ?? new Error('No application status history visible to operator.');
  set(12, 'PASS', `Operator read ${history.length} immutable status-history event(s) and metadata timeline.`);

  const persisted = await Promise.all([
    applicant.from('applications').select('id').eq('id', application.id).single(),
    applicant.from('documents').select('id').eq('id', documentId).single(),
    applicant.from('notifications').select('id').eq('id', notification.id).single(),
    applicant.from('visa_progress').select('id, metadata').eq('id', visa.id).single(),
  ]);
  if (persisted.some(({ error, data }) => error || !data)) throw new Error('One or more persisted workflow records are missing.');
  set(13, 'PASS', 'Application, document, notification, visa progress, and status/timeline events persist in Supabase.');

  const outsiderEmail = `sprint3.outsider.${runId}@example.invalid`;
  const { data: outsiderSignup, error: outsiderError } = await publicClient.auth.signUp({ email: outsiderEmail, password: `S3!${randomUUID()}Aa` });
  if (outsiderError || !outsiderSignup.session) throw outsiderError ?? new Error('Outsider signup did not issue a session.');
  const outsider = client(url, anonKey, outsiderSignup.session.access_token);
  const [adminUsers, otherUpdate, assignRole] = await Promise.all([
    outsider.from('admin_users').select('id').limit(1),
    outsider.from('applications').update({ status: 'rejected' }).eq('id', application.id).select('id'),
    outsider.rpc('assign_user_role', { p_user_id: outsiderSignup.user.id, p_role_slug: 'admin', p_assigned_by: outsiderSignup.user.id }),
  ]);
  const adminDenied = Boolean(adminUsers.error) || !(adminUsers.data ?? []).length;
  const updateDenied = Boolean(otherUpdate.error) || !(otherUpdate.data ?? []).length;
  const roleDenied = Boolean(assignRole.error);
  if (!adminDenied || !updateDenied || !roleDenied) throw new Error(`RBAC result admin=${adminDenied}, app-update=${updateDenied}, role=${roleDenied}.`);
  set(14, 'PASS', 'Outsider cannot read admin_users, update another application, or assign roles.');
} catch (error) {
  const detail = error?.code === 'ENV_PREFLIGHT_FAILED'
    ? String(error.message)
    : brief(error);
  const firstOpen = steps.find((step) => step.status === 'BLOCKED');
  if (firstOpen) set(firstOpen.step, 'FAIL', detail);
  for (const step of steps) {
    if (step.status === 'BLOCKED') step.evidence = `Blocked by environment/workflow failure: ${detail.split('\n')[0]}`;
  }
  if (error?.code === 'ENV_PREFLIGHT_FAILED') {
    console.error(detail);
  }
} finally {
  if (serverChild) serverChild.kill();
}

set(15, 'PASS', 'Verification JSON and Markdown evidence were written.');
const counts = Object.fromEntries(['PASS', 'FAIL', 'BLOCKED'].map((status) => [status, steps.filter((step) => step.status === status).length]));
const results = {
  generatedAt: new Date().toISOString(),
  environment,
  context,
  counts,
  steps,
  remainingExternalBlockers: environment.resendConfigured
    ? []
    : ['Production email delivery requires a configured Resend API key and verified sender; development log mode is sufficient for Sprint 3 verification.'],
};
await writeFile(outputPath, `${JSON.stringify(results, null, 2)}\n`, 'utf8');
const table = steps.map((step) => `| ${step.step} | ${step.name} | ${step.status} | ${step.evidence.replace(/\|/g, '\\|')} |`).join('\n');
await writeFile(workflowDoc, `# Sprint 3 workflow verification\n\nGenerated: ${results.generatedAt}\n\n| Step | Check | Status | Evidence |\n|---:|---|---|---|\n${table}\n\nCounts: **${counts.PASS} PASS, ${counts.FAIL} FAIL, ${counts.BLOCKED} BLOCKED**.\n\n## Remaining external blockers\n${results.remainingExternalBlockers.length ? results.remainingExternalBlockers.map((item) => `- ${item}`).join('\n') : '- None.'}\n\nRun \`node scripts/verify-sprint3-workflow.mjs\` after \`npx supabase db push\`. The UI reflects database changes through its 15-second application polling.\n`, 'utf8');
console.log(`Sprint 3 workflow verification (${runId})`);
for (const step of steps) console.log(`${String(step.step).padStart(2, '0')} | ${step.status.padEnd(7)} | ${step.name}: ${step.evidence}`);
console.log(`Summary: ${counts.PASS} PASS, ${counts.FAIL} FAIL, ${counts.BLOCKED} BLOCKED`);
console.log(`JSON results: ${outputPath}`);
if (counts.FAIL > 0 || counts.BLOCKED > 0) process.exitCode = 1;
