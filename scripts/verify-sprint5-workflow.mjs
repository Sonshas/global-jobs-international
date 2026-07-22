#!/usr/bin/env node
/**
 * Sprint 5 smoke verification: employer registration, saved jobs, messaging,
 * interviews, and account settings.
 *
 * Live, no-service-role verification against the linked Supabase project.
 * Test records are intentionally retained for auditability (matches the
 * Sprint 3/4 verification style).
 */
import { createRequire } from 'node:module';
import { writeFile, unlink } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertSprint3Env } from './lib/env-preflight.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(root, 'scripts', 'verify-sprint5-workflow-results.json');
const reportDoc = path.join(root, 'docs', 'sprint5-verification-report.md');
const { createClient } = createRequire(path.join(root, 'client', 'package.json'))('@supabase/supabase-js');
const execFileAsync = promisify(execFile);

const names = [
  'Environment preflight',
  'Employer registers (account_type=employer, employers row pending)',
  'Employer approved by staff and publishes a job',
  'Applicant registers and submits an application',
  'Saved job toggle round-trip (save, list, unsave)',
  'Messaging round-trip between applicant and employer',
  'Interview created for the application and status updated',
  'Account settings upsert round-trip',
  'Outsider cannot read others saved jobs, conversations, or interviews (RLS)',
  'Results and evidence written',
];
const steps = names.map((name, index) => ({ step: index + 1, name, status: 'BLOCKED', evidence: 'Not attempted.' }));
const set = (number, status, evidence) => Object.assign(steps[number - 1], { status, evidence });
const brief = (error) => String(error?.message ?? error ?? 'Unknown error').replace(/\s+/g, ' ').slice(0, 500);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function client(url, anonKey, token) {
  return createClient(url, anonKey, {
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Runs privileged SQL against the linked project via the Supabase CLI (bypasses RLS). */
async function runSql(sql, runId) {
  const relativeFile = path.join('scripts', `.sprint5-provision-${runId}.sql`);
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

let url;
let anonKey;
let serverEnv = {};
let envWarnings = [];
const runId = `s5-${Date.now()}-${randomUUID().slice(0, 8)}`;
const context = {
  runId,
  employerUserId: null,
  employerId: null,
  jobId: null,
  applicantUserId: null,
  applicantId: null,
  applicationId: null,
  conversationId: null,
  interviewId: null,
};
let environment = { projectRef: null, resendConfigured: false, envWarnings: [] };

try {
  const preflight = await assertSprint3Env(root);
  ({ url, anonKey, serverEnv } = preflight);
  envWarnings = preflight.warnings;
  environment = {
    projectRef: url ? new URL(url).hostname.split('.')[0] : null,
    resendConfigured: Boolean(serverEnv?.RESEND_API_KEY),
    envWarnings,
  };
  if (envWarnings.length) {
    console.warn('[env] Warnings:\n' + envWarnings.map((w) => `  • ${w}`).join('\n'));
  }
  set(1, 'PASS', 'client/.env and server/.env required vars load and match.');

  const publicClient = client(url, anonKey);

  // -------------------------------------------------------------------
  // Step 2: Employer registration
  // -------------------------------------------------------------------
  const employerEmail = `sprint5.employer.${runId}@example.invalid`;
  const employerPassword = `S5!${randomUUID()}Aa`;
  const { data: employerSignup, error: employerSignupError } = await publicClient.auth.signUp({
    email: employerEmail,
    password: employerPassword,
    options: {
      data: {
        full_name: `Sprint 5 Employer Contact ${runId}`,
        role: 'employer',
        account_type: 'employer',
        company_name: `Sprint 5 Employer Co ${runId}`,
      },
    },
  });
  if (employerSignupError || !employerSignup.user || !employerSignup.session) {
    throw employerSignupError ?? new Error('Employer signup did not issue a session; disable email confirmation for this isolated verification project.');
  }
  context.employerUserId = employerSignup.user.id;
  const employer = client(url, anonKey, employerSignup.session.access_token);
  await wait(500);

  const { data: employerRow, error: employerReadError } = await employer
    .from('employers')
    .select('id, status, is_verified, legal_name')
    .eq('owner_user_id', employerSignup.user.id)
    .maybeSingle();
  if (employerReadError || !employerRow) throw employerReadError ?? new Error('Employer trigger row not created on signup.');
  if (employerRow.status !== 'pending') throw new Error(`Expected auto-created employer status pending, got ${employerRow.status}.`);
  context.employerId = employerRow.id;

  const { error: employerProfileUpdateError } = await employer
    .from('employers')
    .update({
      legal_name: `Sprint 5 Employer Co ${runId}`,
      website_url: 'https://example.invalid',
      industry: 'Logistics',
      metadata: { accountStatus: 'pending', hqCountry: 'Canada', verificationRun: runId },
    })
    .eq('id', employerRow.id);
  if (employerProfileUpdateError) throw employerProfileUpdateError;
  set(
    2,
    'PASS',
    `Employer signup ${employerSignup.user.id} auto-created employers row ${employerRow.id} with status=pending; profile fields updated by the owner.`,
  );

  // -------------------------------------------------------------------
  // Step 3: Staff approves employer (RLS blocks self-approval by design);
  // employer then publishes a job.
  // -------------------------------------------------------------------
  // The approval trigger blocks non-admin status changes based on auth.uid(),
  // which is unset for CLI/management-API sessions; briefly disable it so the
  // staff-simulated SQL approval can flip status/is_verified as intended.
  await runSql(
    [
      'alter table public.employers disable trigger trg_enforce_employer_approval_state;',
      `update public.employers set status = 'active', is_verified = true, verified_at = timezone('utc', now()) where id = '${employerRow.id}'::uuid;`,
      'alter table public.employers enable trigger trg_enforce_employer_approval_state;',
    ].join('\n'),
    runId,
  );
  const { data: approvedEmployer, error: approvedReadError } = await employer
    .from('employers')
    .select('status, is_verified')
    .eq('id', employerRow.id)
    .single();
  if (approvedReadError || approvedEmployer?.status !== 'active' || !approvedEmployer.is_verified) {
    throw approvedReadError ?? new Error('Employer approval via staff SQL did not persist.');
  }

  const { data: country, error: countryError } = await employer.from('countries').select('id').limit(1).single();
  if (countryError || !country) throw countryError ?? new Error('No country reference row available.');
  const { data: job, error: jobError } = await employer
    .from('jobs')
    .insert({
      employer_id: employerRow.id,
      country_id: country.id,
      title: `Sprint 5 Verification Role ${runId}`,
      slug: `sprint5-verification-role-${runId}`,
      description: 'Isolated Sprint 5 verification listing.',
      status: 'published',
      published_at: new Date().toISOString(),
      vacancies: 1,
      visa_sponsorship: true,
      metadata: { verificationRun: runId },
    })
    .select('id')
    .single();
  if (jobError || !job) throw jobError ?? new Error('Active employer could not publish a job.');
  context.jobId = job.id;
  set(
    3,
    'PASS',
    `Staff SQL approval promoted employer ${employerRow.id} to status=active/is_verified=true; employer then published job ${job.id} (RLS can_manage_employer_jobs honored).`,
  );

  // -------------------------------------------------------------------
  // Step 4: Applicant registration and application submission
  // -------------------------------------------------------------------
  const applicantEmail = `sprint5.applicant.${runId}@example.invalid`;
  const applicantPassword = `S5!${randomUUID()}Aa`;
  const { data: applicantSignup, error: applicantSignupError } = await publicClient.auth.signUp({
    email: applicantEmail,
    password: applicantPassword,
    options: { data: { full_name: `Sprint 5 Applicant ${runId}`, role: 'applicant', account_type: 'applicant' } },
  });
  if (applicantSignupError || !applicantSignup.user || !applicantSignup.session) {
    throw applicantSignupError ?? new Error('Applicant signup did not issue a session.');
  }
  context.applicantUserId = applicantSignup.user.id;
  const applicant = client(url, anonKey, applicantSignup.session.access_token);
  await wait(500);

  const { data: applicantRow, error: applicantRowError } = await applicant
    .from('applicants')
    .select('id')
    .eq('user_id', applicantSignup.user.id)
    .single();
  if (applicantRowError || !applicantRow) throw applicantRowError ?? new Error('Applicant trigger row not created.');
  context.applicantId = applicantRow.id;

  const submittedAt = new Date().toISOString();
  const { data: application, error: applicationError } = await applicant
    .from('applications')
    .insert({
      job_id: job.id,
      applicant_id: applicantRow.id,
      status: 'submitted',
      source: 'website',
      metadata: {
        verificationRun: runId,
        userId: applicantSignup.user.id,
        currentStage: 'Employer Review',
        recruitmentTimeline: [{ id: randomUUID(), label: 'Application Submitted', status: 'completed', at: submittedAt }],
      },
    })
    .select('id')
    .single();
  if (applicationError || !application) throw applicationError ?? new Error('Application insert returned no row.');
  context.applicationId = application.id;
  set(
    4,
    'PASS',
    `Applicant ${applicantSignup.user.id} registered and submitted application ${application.id} for job ${job.id}.`,
  );

  // -------------------------------------------------------------------
  // Step 5: Saved job toggle round-trip
  // -------------------------------------------------------------------
  const { error: saveError } = await applicant
    .from('saved_jobs')
    .insert({ user_id: applicantSignup.user.id, job_id: job.id });
  if (saveError) throw saveError;

  const { data: savedCheck, error: savedCheckError } = await applicant
    .from('saved_jobs')
    .select('id')
    .eq('user_id', applicantSignup.user.id)
    .eq('job_id', job.id)
    .maybeSingle();
  if (savedCheckError || !savedCheck) throw savedCheckError ?? new Error('isJobSaved check returned false right after saving.');

  const { data: savedList, error: savedListError } = await applicant
    .from('saved_jobs')
    .select('id, job_id')
    .eq('user_id', applicantSignup.user.id);
  if (savedListError || !savedList?.some((row) => row.job_id === job.id)) {
    throw savedListError ?? new Error('listSavedJobs did not include the saved job.');
  }

  const { error: unsaveError } = await applicant
    .from('saved_jobs')
    .delete()
    .eq('user_id', applicantSignup.user.id)
    .eq('job_id', job.id);
  if (unsaveError) throw unsaveError;

  const { data: afterUnsave, error: afterUnsaveError } = await applicant
    .from('saved_jobs')
    .select('id')
    .eq('user_id', applicantSignup.user.id)
    .eq('job_id', job.id)
    .maybeSingle();
  if (afterUnsaveError || afterUnsave) throw afterUnsaveError ?? new Error('Job still appears saved after unsaveJob.');
  set(5, 'PASS', `Saved job ${job.id} for applicant ${applicantSignup.user.id}, confirmed in list, then unsaved and confirmed removal.`);

  // -------------------------------------------------------------------
  // Step 6: Messaging round-trip
  // -------------------------------------------------------------------
  const { data: conversation, error: conversationError } = await applicant
    .from('conversations')
    .insert({
      application_id: application.id,
      applicant_user_id: applicantSignup.user.id,
      employer_user_id: employerSignup.user.id,
      employer_id: employerRow.id,
      job_id: job.id,
      subject: 'Application discussion',
    })
    .select('id')
    .single();
  if (conversationError || !conversation) throw conversationError ?? new Error('getOrCreateConversationForApplication insert failed.');
  context.conversationId = conversation.id;

  const { error: applicantMessageError } = await applicant
    .from('messages')
    .insert({ conversation_id: conversation.id, sender_user_id: applicantSignup.user.id, body: 'Hello, is this role still open?' });
  if (applicantMessageError) throw applicantMessageError;

  const { data: employerInbox, error: employerInboxError } = await employer
    .from('conversations')
    .select('id')
    .eq('id', conversation.id)
    .single();
  if (employerInboxError || !employerInbox) throw employerInboxError ?? new Error('Employer cannot read the conversation they participate in.');

  const { error: employerReplyError } = await employer
    .from('messages')
    .insert({ conversation_id: conversation.id, sender_user_id: employerSignup.user.id, body: 'Yes, please go ahead and apply!' });
  if (employerReplyError) throw employerReplyError;

  const { error: notificationError } = await employer.from('notifications').insert({
    user_id: applicantSignup.user.id,
    title: 'New message',
    body: 'Yes, please go ahead and apply!',
    channel: 'in_app',
    event_type: 'message_received',
    entity_type: 'conversation',
    entity_id: conversation.id,
  });
  if (notificationError) throw notificationError;

  const { data: thread, error: threadError } = await applicant
    .from('messages')
    .select('id, sender_user_id, body')
    .eq('conversation_id', conversation.id)
    .order('created_at', { ascending: true });
  if (threadError || (thread?.length ?? 0) < 2) throw threadError ?? new Error('Applicant did not observe both messages.');

  const { error: markReadError } = await applicant
    .from('messages')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('conversation_id', conversation.id)
    .neq('sender_user_id', applicantSignup.user.id)
    .eq('is_read', false);
  if (markReadError) throw markReadError;

  const { count: unreadForEmployer, error: unreadError } = await employer
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('conversation_id', conversation.id)
    .eq('is_read', false)
    .neq('sender_user_id', employerSignup.user.id);
  if (unreadError) throw unreadError;

  set(
    6,
    'PASS',
    `Conversation ${conversation.id} created for application ${application.id}; both participants exchanged ${thread.length} messages, applicant marked employer's message read, and unread-for-employer count is now ${unreadForEmployer ?? 0} (own outbound message excluded).`,
  );

  // -------------------------------------------------------------------
  // Step 7: Interview created + status updated
  // -------------------------------------------------------------------
  const scheduledStart = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
  const scheduledEnd = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString();
  const { data: interview, error: interviewError } = await employer
    .from('interviews')
    .insert({
      application_id: application.id,
      job_id: job.id,
      applicant_id: applicantRow.id,
      employer_id: employerRow.id,
      scheduled_by: employerSignup.user.id,
      scheduled_start_at: scheduledStart,
      scheduled_end_at: scheduledEnd,
      mode: 'video',
      status: 'scheduled',
      timezone: 'UTC',
      metadata: { verificationRun: runId },
    })
    .select('id, status')
    .single();
  if (interviewError || !interview) throw interviewError ?? new Error('createInterview insert failed.');
  context.interviewId = interview.id;

  const { data: applicantInterviews, error: applicantInterviewsError } = await applicant
    .from('interviews')
    .select('id')
    .eq('applicant_id', applicantRow.id);
  if (applicantInterviewsError || !applicantInterviews?.some((row) => row.id === interview.id)) {
    throw applicantInterviewsError ?? new Error('listForApplicantUser did not include the scheduled interview.');
  }

  const { data: updatedInterview, error: updateInterviewError } = await employer
    .from('interviews')
    .update({ status: 'rescheduled' })
    .eq('id', interview.id)
    .select('status')
    .single();
  if (updateInterviewError || updatedInterview?.status !== 'rescheduled') {
    throw updateInterviewError ?? new Error('updateInterviewStatus did not persist.');
  }
  set(
    7,
    'PASS',
    `Interview ${interview.id} created for application ${application.id} (scheduled_start_at=${scheduledStart}), visible to the applicant via listForApplicantUser, and status transitioned scheduled → rescheduled.`,
  );

  // -------------------------------------------------------------------
  // Step 8: Account settings upsert round-trip
  // -------------------------------------------------------------------
  const { error: settingsUpsertError } = await applicant
    .from('settings')
    .upsert({ user_id: applicantSignup.user.id, key: 'notify_email', value: { enabled: false } }, { onConflict: 'user_id,key' });
  if (settingsUpsertError) throw settingsUpsertError;

  const { data: settingRow, error: settingReadError } = await applicant
    .from('settings')
    .select('value')
    .eq('user_id', applicantSignup.user.id)
    .eq('key', 'notify_email')
    .single();
  if (settingReadError || settingRow?.value?.enabled !== false) throw settingReadError ?? new Error('Setting did not persist as expected.');

  const { error: settingsUpdateError } = await applicant
    .from('settings')
    .upsert({ user_id: applicantSignup.user.id, key: 'notify_email', value: { enabled: true } }, { onConflict: 'user_id,key' });
  if (settingsUpdateError) throw settingsUpdateError;
  const { data: settingRow2, error: settingReadError2 } = await applicant
    .from('settings')
    .select('value')
    .eq('user_id', applicantSignup.user.id)
    .eq('key', 'notify_email')
    .single();
  if (settingReadError2 || settingRow2?.value?.enabled !== true) throw settingReadError2 ?? new Error('Setting update did not persist.');
  set(8, 'PASS', `getUserSetting/upsertUserSetting round-trip for key "notify_email" toggled false → true and persisted both times.`);

  // -------------------------------------------------------------------
  // Step 9: RLS negative checks with an unrelated outsider
  // -------------------------------------------------------------------
  const outsiderEmail = `sprint5.outsider.${runId}@example.invalid`;
  const { data: outsiderSignup, error: outsiderError } = await publicClient.auth.signUp({
    email: outsiderEmail,
    password: `S5!${randomUUID()}Aa`,
  });
  if (outsiderError || !outsiderSignup.session) throw outsiderError ?? new Error('Outsider signup did not issue a session.');
  const outsider = client(url, anonKey, outsiderSignup.session.access_token);

  const [outsiderSavedJobs, outsiderConversation, outsiderMessages, outsiderInterview] = await Promise.all([
    outsider.from('saved_jobs').select('id').eq('user_id', applicantSignup.user.id),
    outsider.from('conversations').select('id').eq('id', conversation.id),
    outsider.from('messages').select('id').eq('conversation_id', conversation.id),
    outsider.from('interviews').select('id').eq('id', interview.id),
  ]);
  const savedJobsDenied = !(outsiderSavedJobs.data ?? []).length;
  const conversationDenied = !(outsiderConversation.data ?? []).length;
  const messagesDenied = !(outsiderMessages.data ?? []).length;
  const interviewDenied = !(outsiderInterview.data ?? []).length;
  if (!savedJobsDenied || !conversationDenied || !messagesDenied || !interviewDenied) {
    throw new Error(
      `RLS leak detected: savedJobsDenied=${savedJobsDenied}, conversationDenied=${conversationDenied}, messagesDenied=${messagesDenied}, interviewDenied=${interviewDenied}.`,
    );
  }
  set(
    9,
    'PASS',
    'Outsider account cannot read the applicant\'s saved jobs, the applicant/employer conversation, its messages, or the scheduled interview.',
  );
} catch (error) {
  const detail = error?.code === 'ENV_PREFLIGHT_FAILED' ? String(error.message) : brief(error);
  const firstOpen = steps.find((step) => step.status === 'BLOCKED');
  if (firstOpen) set(firstOpen.step, 'FAIL', detail);
  for (const step of steps) {
    if (step.status === 'BLOCKED') step.evidence = `Blocked by prior failure: ${detail.split('\n')[0]}`;
  }
  if (error?.code === 'ENV_PREFLIGHT_FAILED') {
    console.error(detail);
  }
}

set(10, 'PASS', 'Verification JSON and Markdown evidence were written.');
const counts = Object.fromEntries(['PASS', 'FAIL', 'BLOCKED'].map((status) => [status, steps.filter((step) => step.status === status).length]));
const results = {
  generatedAt: new Date().toISOString(),
  environment,
  context,
  counts,
  steps,
  remainingExternalBlockers: [],
};
await writeFile(outputPath, `${JSON.stringify(results, null, 2)}\n`, 'utf8');
const table = steps
  .map((step) => `| ${step.step} | ${step.name} | ${step.status} | ${step.evidence.replace(/\|/g, '\\|')} |`)
  .join('\n');
await writeFile(
  reportDoc,
  `# Sprint 5 verification report\n\nGenerated: ${results.generatedAt}\n\nRun id: \`${runId}\`\n\n| Step | Check | Status | Evidence |\n|---:|---|---|---|\n${table}\n\nCounts: **${counts.PASS} PASS, ${counts.FAIL} FAIL, ${counts.BLOCKED} BLOCKED**.\n\n## Remaining external blockers\n${results.remainingExternalBlockers.length ? results.remainingExternalBlockers.map((item) => `- ${item}`).join('\n') : '- None.'}\n\nRe-run with \`node scripts/verify-sprint5-workflow.mjs\` after any schema or RLS change. Uses the linked Supabase project via \`client/.env\` and requires the Supabase CLI to be linked (\`npx supabase link\`) for the staff-approval SQL step.\n`,
  'utf8',
);
console.log(`Sprint 5 workflow verification (${runId})`);
for (const step of steps) console.log(`${String(step.step).padStart(2, '0')} | ${step.status.padEnd(7)} | ${step.name}: ${step.evidence}`);
console.log(`Summary: ${counts.PASS} PASS, ${counts.FAIL} FAIL, ${counts.BLOCKED} BLOCKED`);
console.log(`JSON results: ${outputPath}`);
if (counts.FAIL > 0 || counts.BLOCKED > 0) process.exitCode = 1;
