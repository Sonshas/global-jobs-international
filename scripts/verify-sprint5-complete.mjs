#!/usr/bin/env node
/**
 * Complete Sprint 5 verification — final core platform completion gaps:
 * staff notes, support conversations, campaigns, employer subscription
 * fields, staff payment monitoring, admin role/user management, audit log
 * API, and notify_email-aware notifications.
 *
 * Live, no-service-role verification against the linked Supabase project
 * (uses `npx supabase db query --linked` for the few admin-only setup steps
 * that RLS intentionally blocks for authenticated clients, mirroring
 * verify-sprint4-complete.mjs / verify-sprint5-workflow.mjs).
 */
import { createRequire } from 'node:module';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { assertSprint3Env } from './lib/env-preflight.mjs';

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(root, 'scripts', 'verify-sprint5-complete-results.json');
const reportPath = path.join(root, 'docs', 'sprint5-verification-report.md');
const { createClient } = createRequire(path.join(root, 'client', 'package.json'))('@supabase/supabase-js');

const names = [
  'Environment preflight',
  'Migration schema present (staff_notes, conversations.kind/staff_user_id, campaigns, employers.subscription_*, payments staff policy)',
  'Employer + admin + applicant provisioned',
  'Staff notes: staff can create/list, applicant is denied',
  'Campaigns: admin CRUD works, public read-only for active, non-staff write denied',
  'Employer subscription fields readable on employers row',
  'Staff can SELECT all payments (monitoring policy)',
  'Support conversation: employer opens thread, staff replies, unrelated employer denied',
  'Messaging read receipts + attachment_document_id round-trip',
  'Admin role assignment via POST /api/admin/users/:userId/role (service-role only, not directly callable by client)',
  'Audit log via GET/POST /api/audit',
  'notify_email=false suppresses email dispatch (server honors user setting)',
  'Interview reminders endpoint (POST /api/jobs/interview-reminders)',
  'System health endpoint (GET /api/health)',
  'Results and evidence written',
];
const steps = names.map((name, index) => ({ step: index + 1, name, status: 'BLOCKED', evidence: 'Not attempted.' }));
const set = (n, status, evidence) => Object.assign(steps[n - 1], { status, evidence });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const brief = (e) => String(e?.message ?? e ?? 'Unknown').replace(/\s+/g, ' ').slice(0, 500);

function client(url, anonKey, token) {
  return createClient(url, anonKey, {
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function fetchJson(url, init, attempts = 3) {
  let lastError;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url, { ...init, signal: AbortSignal.timeout(15_000) });
      const body = await response.json().catch(() => ({}));
      return { response, body };
    } catch (error) {
      lastError = error;
      await wait(800 * (i + 1));
    }
  }
  throw lastError;
}

async function linkedSql(sql, attempts = 4) {
  const relative = path.join('scripts', `.sprint5c-sql-${randomUUID().slice(0, 8)}.sql`);
  const absolute = path.join(root, relative);
  await writeFile(absolute, `${sql}\n`, 'utf8');
  let lastError;
  try {
    for (let i = 0; i < attempts; i += 1) {
      try {
        const command = `npx supabase db query --linked --file ${relative}`;
        const { stdout, stderr } = await execFileAsync(
          process.platform === 'win32' ? 'cmd.exe' : 'sh',
          process.platform === 'win32' ? ['/d', '/s', '/c', command] : ['-lc', command],
          { cwd: root, windowsHide: true, timeout: 90_000 },
        );
        const combined = `${stdout}${stderr}`.trim();
        if (/LegacyDbConfigConnectTempRoleError|Failed to connect|invalid message format/i.test(combined)) {
          throw new Error(combined.slice(0, 400));
        }
        return combined;
      } catch (error) {
        lastError = error;
        const detail = `${brief(error)} ${String(error?.stderr ?? error?.stdout ?? '')}`.trim();
        if (
          i < attempts - 1 &&
          /LegacyDbConfigConnectTempRoleError|Failed to connect|invalid message format|ECONNRESET|ETIMEDOUT/i.test(
            detail,
          )
        ) {
          await wait(1_200 * (i + 1));
          continue;
        }
        throw new Error(detail.slice(0, 500));
      }
    }
  } finally {
    await unlink(absolute).catch(() => {});
  }
  throw lastError ?? new Error('linkedSql failed.');
}

const probePort = 3018;
const probeBase = `http://127.0.0.1:${probePort}`;
let serverChild = null;
const ctx = {
  runId: `s5c-${Date.now()}-${randomUUID().slice(0, 6)}`,
  employerUserId: null,
  employerId: null,
  adminUserId: null,
  applicantUserId: null,
  applicationId: null,
  jobId: null,
  campaignId: null,
  supportConversationId: null,
};

try {
  const { url, anonKey, serverEnv } = await assertSprint3Env(root);
  const publicSb = client(url, anonKey);
  set(1, 'PASS', 'client/.env and server/.env required vars load and match.');

  serverChild = spawn('npm', ['run', 'dev', '-w', 'server'], {
    cwd: root,
    windowsHide: true,
    stdio: 'ignore',
    shell: process.platform === 'win32',
    env: { ...process.env, PORT: String(probePort) },
  });

  let healthy = false;
  for (let i = 0; i < 40; i += 1) {
    await wait(500);
    try {
      const { response } = await fetchJson(`${probeBase}/api/health`, {}, 1);
      if (response.ok) {
        healthy = true;
        break;
      }
    } catch {
      // retry
    }
  }
  if (!healthy) throw new Error('API health check failed to start.');

  // --- 2. Migration schema smoke check ---
  const schemaProbes = await Promise.all([
    publicSb.from('staff_notes').select('id').limit(1),
    publicSb.from('campaigns').select('id, title, slug, is_active').limit(1),
  ]);
  const schemaSql = await linkedSql(`
    select
      (select count(*) from information_schema.columns where table_schema='public' and table_name='conversations' and column_name='kind') as kind_col,
      (select count(*) from information_schema.columns where table_schema='public' and table_name='conversations' and column_name='staff_user_id') as staff_col,
      (select count(*) from information_schema.columns where table_schema='public' and table_name='employers' and column_name='subscription_plan') as sub_plan_col,
      (select count(*) from information_schema.columns where table_schema='public' and table_name='employers' and column_name='subscription_status') as sub_status_col,
      (select count(*) from pg_policies where schemaname='public' and tablename='payments' and policyname ilike '%staff%') as staff_payment_policy,
      (select count(*) from pg_indexes where schemaname='public' and tablename='interviews' and indexdef ilike '%scheduled_start_at%') as interview_idx;
  `);
  const schemaOk = !schemaProbes[0].error && !schemaProbes[1].error && !/error/i.test(schemaSql);
  set(
    2,
    schemaOk ? 'PASS' : 'FAIL',
    `staff_notes select=${schemaProbes[0].error ? 'ERR' : 'ok'}, campaigns select=${schemaProbes[1].error ? 'ERR' : 'ok'}. information_schema probe: ${schemaSql.replace(/\s+/g, ' ').slice(0, 300)}`,
  );

  // --- 3. Provision employer + admin + applicant ---
  const employerEmail = `s5c.employer.${ctx.runId}@example.invalid`;
  const employerPassword = `S5C!${randomUUID()}Aa`;
  const { data: employerSignup, error: employerSignupError } = await publicSb.auth.signUp({
    email: employerEmail,
    password: employerPassword,
    options: { data: { full_name: `Sprint5c Employer ${ctx.runId}`, role: 'employer', account_type: 'employer' } },
  });
  if (employerSignupError || !employerSignup.user || !employerSignup.session) {
    throw employerSignupError ?? new Error('Employer signup did not return a session.');
  }
  ctx.employerUserId = employerSignup.user.id;
  await wait(600);
  let employerClient = client(url, anonKey, employerSignup.session.access_token);
  const { data: employerRow, error: employerReadError } = await employerClient
    .from('employers')
    .select('id, status')
    .eq('owner_user_id', ctx.employerUserId)
    .single();
  if (employerReadError || !employerRow) throw employerReadError ?? new Error('Employer row not auto-created.');
  ctx.employerId = employerRow.id;

  const adminEmail = `s5c.admin.${ctx.runId}@example.invalid`;
  const adminPassword = `S5CA!${randomUUID()}Aa`;
  const { data: adminSignup, error: adminSignupError } = await publicSb.auth.signUp({
    email: adminEmail,
    password: adminPassword,
    options: { data: { full_name: `Sprint5c Admin ${ctx.runId}`, role: 'admin' } },
  });
  if (adminSignupError || !adminSignup.user || !adminSignup.session) throw adminSignupError ?? new Error('Admin signup failed.');
  ctx.adminUserId = adminSignup.user.id;
  // Privileged CLI has no auth.uid(); disable approval trigger briefly (same as sprint5-workflow).
  // Role grant uses direct inserts because assign_user_role execute is service_role-only via PostgREST,
  // while linked SQL runs as the database role and can write RBAC tables.
  await linkedSql(`
    insert into public.admin_users (user_id, title, is_active)
    values ('${ctx.adminUserId}'::uuid, 'Sprint5c Admin', true)
    on conflict (user_id) do update set is_active = true, title = excluded.title;
    insert into public.user_roles (user_id, role_id)
    select '${ctx.adminUserId}'::uuid, r.id
    from public.roles r
    where r.slug in ('admin', 'super_admin')
    on conflict (user_id, role_id) do nothing;
    alter table public.employers disable trigger trg_enforce_employer_approval_state;
    update public.employers
      set status = 'active', is_verified = true, verified_at = timezone('utc', now())
      where id = '${ctx.employerId}'::uuid;
    alter table public.employers enable trigger trg_enforce_employer_approval_state;
  `);
  await wait(800);
  const { data: adminLogin, error: adminLoginError } = await publicSb.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });
  if (adminLoginError || !adminLogin.session) throw adminLoginError ?? new Error('Admin login failed.');
  const adminClient = client(url, anonKey, adminLogin.session.access_token);
  employerClient = client(
    url,
    anonKey,
    (await publicSb.auth.signInWithPassword({ email: employerEmail, password: employerPassword })).data.session
      .access_token,
  );

  const applicantEmail = `s5c.applicant.${ctx.runId}@example.invalid`;
  const applicantPassword = `S5CP!${randomUUID()}Aa`;
  const { data: applicantSignup, error: applicantSignupError } = await publicSb.auth.signUp({
    email: applicantEmail,
    password: applicantPassword,
    options: { data: { full_name: `Sprint5c Applicant ${ctx.runId}`, role: 'applicant' } },
  });
  if (applicantSignupError || !applicantSignup.user || !applicantSignup.session) {
    throw applicantSignupError ?? new Error('Applicant signup failed.');
  }
  ctx.applicantUserId = applicantSignup.user.id;
  const applicantClient = client(url, anonKey, applicantSignup.session.access_token);

  const { data: country } = await employerClient.from('countries').select('id').limit(1).single();
  const { data: job, error: jobError } = await employerClient
    .from('jobs')
    .insert({
      employer_id: ctx.employerId,
      country_id: country.id,
      title: `Sprint5c Role ${ctx.runId}`,
      slug: `sprint5c-role-${ctx.runId}`.toLowerCase(),
      description: 'Verification job for Sprint 5 completion.',
      status: 'published',
      vacancies: 1,
      metadata: { verificationRun: ctx.runId },
    })
    .select('id')
    .single();
  if (jobError) throw jobError;
  ctx.jobId = job.id;

  const { data: applicantRow } = await applicantClient
    .from('applicants')
    .select('id')
    .eq('user_id', ctx.applicantUserId)
    .single();
  const { data: application, error: applicationError } = await applicantClient
    .from('applications')
    .insert({
      job_id: job.id,
      applicant_id: applicantRow.id,
      status: 'submitted',
      metadata: { verificationRun: ctx.runId, userId: ctx.applicantUserId },
    })
    .select('id')
    .single();
  if (applicationError) throw applicationError;
  ctx.applicationId = application.id;
  set(
    3,
    'PASS',
    `Provisioned employer=${ctx.employerId}, admin=${ctx.adminUserId}, applicant=${ctx.applicantUserId}, job=${ctx.jobId}, application=${ctx.applicationId}.`,
  );

  // --- 4. Staff notes ---
  const { data: note, error: noteError } = await adminClient
    .from('staff_notes')
    .insert({ application_id: ctx.applicationId, author_user_id: ctx.adminUserId, body: `Verification note ${ctx.runId}` })
    .select('id')
    .single();
  if (noteError) throw noteError;
  const { data: notesList } = await adminClient
    .from('staff_notes')
    .select('id, body')
    .eq('application_id', ctx.applicationId);
  const { data: applicantNotesAttempt } = await applicantClient
    .from('staff_notes')
    .select('id')
    .eq('application_id', ctx.applicationId);
  const staffNotesOk = Boolean(notesList?.some((n) => n.id === note.id)) && !(applicantNotesAttempt ?? []).length;
  set(
    4,
    staffNotesOk ? 'PASS' : 'FAIL',
    `Admin created staff_notes row ${note.id}; visible to staff (count=${notesList?.length ?? 0}); applicant read returned ${applicantNotesAttempt?.length ?? 0} rows (expected 0).`,
  );

  // --- 5. Campaigns ---
  const { data: campaign, error: campaignError } = await adminClient
    .from('campaigns')
    .insert({ title: `Sprint5c Campaign ${ctx.runId}`, slug: `sprint5c-campaign-${ctx.runId}`.toLowerCase(), is_active: true })
    .select('id')
    .single();
  if (campaignError) throw campaignError;
  ctx.campaignId = campaign.id;
  const { data: publicCampaigns } = await publicSb.from('campaigns').select('id').eq('is_active', true);
  const publicSeesActive = (publicCampaigns ?? []).some((c) => c.id === campaign.id);
  const { data: employerHackRows, error: employerWriteCampaignError } = await employerClient
    .from('campaigns')
    .update({ title: 'hacked' })
    .eq('id', campaign.id)
    .select('id, title');
  // PostgREST returns success with 0 rows when RLS blocks UPDATE — check row count/title.
  const employerWriteDenied =
    Boolean(employerWriteCampaignError) ||
    !(employerHackRows ?? []).length ||
    (employerHackRows ?? []).every((row) => row.title !== 'hacked');
  const { data: campaignAfter } = await adminClient
    .from('campaigns')
    .select('title')
    .eq('id', campaign.id)
    .single();
  const titleIntact = campaignAfter?.title === `Sprint5c Campaign ${ctx.runId}`;
  const campaignsOk = publicSeesActive && employerWriteDenied && titleIntact;
  set(
    5,
    campaignsOk ? 'PASS' : 'FAIL',
    `Admin created campaign ${campaign.id}; public select sees it=${publicSeesActive}; employer write denied=${employerWriteDenied}; title intact=${titleIntact}.`,
  );

  // --- 6. Employer subscription fields ---
  const { data: subRow, error: subError } = await employerClient
    .from('employers')
    .select('subscription_plan, subscription_status')
    .eq('id', ctx.employerId)
    .single();
  const subOk = !subError && typeof subRow?.subscription_plan === 'string';
  set(
    6,
    subOk ? 'PASS' : 'FAIL',
    subOk
      ? `employers.subscription_plan=${subRow.subscription_plan}, subscription_status=${subRow.subscription_status}.`
      : `Unable to read subscription fields: ${brief(subError)}.`,
  );

  // --- 7. Staff payment monitoring policy ---
  const { data: payment, error: paymentInsertError } = await applicantClient
    .from('payments')
    .insert({
      user_id: ctx.applicantUserId,
      payer_user_id: ctx.applicantUserId,
      provider: 'stripe',
      status: 'succeeded',
      amount: 10,
      currency: 'USD',
      description: 'Sprint5c verification payment',
      metadata: { verificationRun: ctx.runId },
    })
    .select('id')
    .single();
  if (paymentInsertError) throw paymentInsertError;
  const { data: staffPaymentsView, error: staffPaymentsError } = await adminClient
    .from('payments')
    .select('id')
    .eq('id', payment.id);
  const { data: employerPaymentsView } = await employerClient.from('payments').select('id').eq('id', payment.id);
  const staffMonitoringOk =
    !staffPaymentsError && (staffPaymentsView ?? []).some((p) => p.id === payment.id) && !(employerPaymentsView ?? []).length;
  set(
    7,
    staffMonitoringOk ? 'PASS' : 'FAIL',
    `Applicant payment ${payment.id}: staff/admin select sees it=${(staffPaymentsView ?? []).length > 0}; unrelated employer denied=${!(employerPaymentsView ?? []).length}.`,
  );

  // --- 8. Support conversation ---
  const { data: supportConv, error: supportConvError } = await employerClient
    .from('conversations')
    .insert({ kind: 'support', employer_user_id: ctx.employerUserId, subject: 'Support' })
    .select('id, kind, applicant_user_id')
    .single();
  if (supportConvError) throw supportConvError;
  ctx.supportConversationId = supportConv.id;
  const { error: claimError } = await adminClient
    .from('conversations')
    .update({ staff_user_id: ctx.adminUserId })
    .eq('id', supportConv.id);
  const { error: staffReplyError } = await adminClient
    .from('messages')
    .insert({ conversation_id: supportConv.id, sender_user_id: ctx.adminUserId, body: 'How can support help?' });
  const outsiderEmployerEmail = `s5c.outsider-employer.${ctx.runId}@example.invalid`;
  const { data: outsiderEmployerSignup } = await publicSb.auth.signUp({
    email: outsiderEmployerEmail,
    password: `S5CO!${randomUUID()}Aa`,
    options: { data: { role: 'employer', account_type: 'employer' } },
  });
  const outsiderEmployerClient = client(url, anonKey, outsiderEmployerSignup.session.access_token);
  const { data: outsiderView } = await outsiderEmployerClient.from('conversations').select('id').eq('id', supportConv.id);
  const supportOk =
    supportConv.kind === 'support' &&
    supportConv.applicant_user_id === null &&
    !claimError &&
    !staffReplyError &&
    !(outsiderView ?? []).length;
  set(
    8,
    supportOk ? 'PASS' : 'FAIL',
    `Support thread ${supportConv.id} (kind=support, applicant_user_id=null); staff claim ok=${!claimError}; staff reply ok=${!staffReplyError}; unrelated employer denied=${!(outsiderView ?? []).length}.`,
  );

  // --- 9. Read receipts + attachments ---
  const { data: sentMsg, error: sentMsgError } = await employerClient
    .from('messages')
    .insert({ conversation_id: supportConv.id, sender_user_id: ctx.employerUserId, body: 'Thanks, question about billing.' })
    .select('id, is_read')
    .single();
  if (sentMsgError) throw sentMsgError;
  const { error: markReadError } = await adminClient
    .from('messages')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', sentMsg.id);
  const { data: readCheck } = await employerClient.from('messages').select('is_read').eq('id', sentMsg.id).single();

  // Attachment round-trip on an application-kind thread (applicant <-> employer).
  const { data: appConv, error: appConvError } = await applicantClient
    .from('conversations')
    .insert({
      application_id: ctx.applicationId,
      applicant_user_id: ctx.applicantUserId,
      employer_user_id: ctx.employerUserId,
      employer_id: ctx.employerId,
      job_id: ctx.jobId,
      subject: 'Application discussion',
    })
    .select('id')
    .single();
  if (appConvError) throw appConvError;
  const { data: docRow } = await applicantClient
    .from('documents')
    .select('id')
    .eq('user_id', ctx.applicantUserId)
    .limit(1)
    .maybeSingle();
  const { data: attachMsg, error: attachMsgError } = await applicantClient
    .from('messages')
    .insert({
      conversation_id: appConv.id,
      sender_user_id: ctx.applicantUserId,
      body: docRow?.id ? 'Sharing my CV document' : 'No document on file for this run',
      attachment_document_id: docRow?.id ?? null,
    })
    .select('id, attachment_document_id')
    .single();
  if (attachMsgError) throw attachMsgError;
  const { data: employerReadsAttachment } = await employerClient
    .from('messages')
    .select('id, attachment_document_id')
    .eq('id', attachMsg.id)
    .single();
  const attachmentOk = employerReadsAttachment?.attachment_document_id === attachMsg.attachment_document_id;
  const readReceiptsOk = !markReadError && readCheck?.is_read === true && attachmentOk;
  set(
    9,
    readReceiptsOk ? 'PASS' : 'FAIL',
    `Message ${sentMsg.id} is_read flipped false→true and visible to sender=${readCheck?.is_read === true}. Attachment message ${attachMsg.id} attachment_document_id=${attachMsg.attachment_document_id ?? 'null (no document on file)'}, visible unchanged to employer=${attachmentOk}.`,
  );

  // --- 10. Admin role RPC is service-role only ---
  const { error: directRpcError } = await employerClient.rpc('assign_user_role', {
    p_user_id: ctx.employerUserId,
    p_role_slug: 'admin',
  });
  const roleRouteRes = await fetchJson(`${probeBase}/api/admin/users/${ctx.employerUserId}/role`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminLogin.session.access_token}` },
    body: JSON.stringify({ roleSlug: 'advisor' }),
  });
  const roleRouteDeniedForApplicant = await fetchJson(`${probeBase}/api/admin/users/${ctx.employerUserId}/role`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${applicantSignup.session.access_token}` },
    body: JSON.stringify({ roleSlug: 'advisor' }),
  });
  if (roleRouteRes.response.status === 503 && !serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
    set(
      10,
      'BLOCKED',
      `Direct client RPC call denied=${Boolean(directRpcError)} (expected — service_role only). POST /api/admin/users/:id/role → 503 (${roleRouteRes.body?.error}); requires server/.env SUPABASE_SERVICE_ROLE_KEY, not set in this environment. Route/auth code is in place (server/src/routes/admin.ts); applicant caller correctly denied with ${roleRouteDeniedForApplicant.response.status}.`,
    );
  } else {
    const roleOk =
      Boolean(directRpcError) &&
      roleRouteRes.response.ok &&
      roleRouteDeniedForApplicant.response.status === 403;
    set(
      10,
      roleOk ? 'PASS' : 'FAIL',
      `Direct client RPC call denied=${Boolean(directRpcError)}; POST /api/admin/users/:id/role as admin → ${roleRouteRes.response.status}; as applicant → ${roleRouteDeniedForApplicant.response.status} (expected 403).`,
    );
  }

  // --- 11. Audit log API ---
  const auditPost = await fetchJson(`${probeBase}/api/audit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminLogin.session.access_token}` },
    body: JSON.stringify({ action: 'sprint5_verification', detail: ctx.runId }),
  });
  const auditGet = await fetchJson(`${probeBase}/api/audit?limit=20`, {
    headers: { Authorization: `Bearer ${adminLogin.session.access_token}` },
  });
  const auditGetDenied = await fetchJson(`${probeBase}/api/audit?limit=20`, {
    headers: { Authorization: `Bearer ${applicantSignup.session.access_token}` },
  });
  const auditFound = (auditGet.body?.entries ?? auditGet.body ?? []).some?.((e) =>
    JSON.stringify(e).includes(ctx.runId),
  );
  const auditOk =
    (auditPost.response.status === 202 || auditPost.response.ok) &&
    auditGet.response.ok &&
    auditGetDenied.response.status === 403;
  set(
    11,
    auditOk ? 'PASS' : 'FAIL',
    `POST /api/audit → ${auditPost.response.status}; GET /api/audit (admin) → ${auditGet.response.status} (foundRun=${Boolean(auditFound)}); GET /api/audit (applicant) → ${auditGetDenied.response.status} (expected 403).`,
  );

  // --- 12. notify_email honored ---
  await applicantClient
    .from('settings')
    .upsert({ user_id: ctx.applicantUserId, key: 'notify_email', value: false }, { onConflict: 'user_id,key' });
  const emailWhenOff = await fetchJson(`${probeBase}/api/comms/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminLogin.session.access_token}` },
    body: JSON.stringify({
      userId: ctx.applicantUserId,
      to: applicantEmail,
      template: 'application_submitted',
      variables: { applicationNumber: 'S5C-TEST', jobTitle: 'Verification Role', country: 'Canada' },
    }),
  });
  await applicantClient
    .from('settings')
    .upsert({ user_id: ctx.applicantUserId, key: 'notify_email', value: true }, { onConflict: 'user_id,key' });
  const emailWhenOn = await fetchJson(`${probeBase}/api/comms/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminLogin.session.access_token}` },
    body: JSON.stringify({
      userId: ctx.applicantUserId,
      to: applicantEmail,
      template: 'application_submitted',
      variables: { applicationNumber: 'S5C-TEST', jobTitle: 'Verification Role', country: 'Canada' },
    }),
  });
  const notifyEmailOk =
    emailWhenOff.response.ok &&
    emailWhenOff.body?.delivered === false &&
    emailWhenOff.body?.provider === 'skipped' &&
    emailWhenOn.response.ok &&
    emailWhenOn.body?.provider !== 'skipped';
  set(
    12,
    notifyEmailOk ? 'PASS' : 'FAIL',
    `notify_email=false → POST /api/comms/email responded ${emailWhenOff.response.status} provider=${emailWhenOff.body?.provider}; notify_email=true → ${emailWhenOn.response.status} provider=${emailWhenOn.body?.provider}.`,
  );

  // --- 13. Interview reminders endpoint ---
  const scheduledStart = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();
  const { data: interview, error: interviewError } = await employerClient
    .from('interviews')
    .insert({
      application_id: ctx.applicationId,
      job_id: ctx.jobId,
      applicant_id: applicantRow.id,
      employer_id: ctx.employerId,
      scheduled_by: ctx.employerUserId,
      scheduled_start_at: scheduledStart,
      scheduled_end_at: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(),
      mode: 'video',
      status: 'scheduled',
      metadata: { verificationRun: ctx.runId },
    })
    .select('id')
    .single();
  if (interviewError) throw interviewError;
  const remindersRes = await fetchJson(`${probeBase}/api/jobs/interview-reminders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminLogin.session.access_token}` },
  });
  if (remindersRes.response.status === 503 && !serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
    set(
      13,
      'BLOCKED',
      `POST /api/jobs/interview-reminders → 503 (${remindersRes.body?.error}). Requires server/.env SUPABASE_SERVICE_ROLE_KEY, which is not set in this environment — route code and cron docs are in place (server/src/routes/jobs.ts).`,
    );
  } else {
    const { data: interviewAfter } = await adminClient
      .from('interviews')
      .select('metadata')
      .eq('id', interview.id)
      .single();
    const remindersOk = remindersRes.response.ok && Boolean(interviewAfter?.metadata?.reminder_sent_at);
    set(
      13,
      remindersOk ? 'PASS' : 'FAIL',
      `POST /api/jobs/interview-reminders (admin auth) → ${remindersRes.response.status}, body=${JSON.stringify(remindersRes.body).slice(0, 200)}; interview ${interview.id} metadata.reminder_sent_at=${interviewAfter?.metadata?.reminder_sent_at ?? 'unset'}.`,
    );
  }

  // --- 14. System health endpoint ---
  const health = await fetchJson(`${probeBase}/api/health`, {});
  const healthOk = health.response.ok && typeof health.body?.status === 'string';
  set(14, healthOk ? 'PASS' : 'FAIL', `GET /api/health → ${health.response.status}, status=${health.body?.status}.`);
} catch (error) {
  const open = steps.find((s) => s.status === 'BLOCKED' && s.step < 15);
  if (open) set(open.step, 'FAIL', brief(error));
  for (const step of steps) {
    if (step.status === 'BLOCKED' && step.step < 15) step.evidence = `Blocked: ${brief(error)}`;
  }
} finally {
  if (serverChild?.pid) {
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', String(serverChild.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
      } else {
        serverChild.kill();
      }
    } catch {
      // ignore
    }
  }
}

set(15, 'PASS', 'Verification JSON and Markdown evidence were written.');
const counts = Object.fromEntries(['PASS', 'FAIL', 'BLOCKED'].map((status) => [status, steps.filter((s) => s.status === status).length]));
const results = { generatedAt: new Date().toISOString(), context: ctx, counts, steps };
await writeFile(outputPath, `${JSON.stringify(results, null, 2)}\n`, 'utf8');

const table = steps.map((s) => `| ${s.step} | ${s.name} | ${s.status} | ${s.evidence.replace(/\|/g, '\\|')} |`).join('\n');
await writeFile(
  reportPath,
  `# Sprint 5 verification report

Generated: ${results.generatedAt}

Run id: \`${ctx.runId}\`

| # | Check | Status | Evidence |
|---|------|--------|----------|
${table}

**Summary: ${counts.PASS} PASS, ${counts.FAIL} FAIL, ${counts.BLOCKED} BLOCKED**

Context: employer=${ctx.employerId ?? 'n/a'}, admin=${ctx.adminUserId ?? 'n/a'}, applicant=${ctx.applicantUserId ?? 'n/a'}, job=${ctx.jobId ?? 'n/a'}, application=${ctx.applicationId ?? 'n/a'}, campaign=${ctx.campaignId ?? 'n/a'}, supportConversation=${ctx.supportConversationId ?? 'n/a'}

Re-run with \`node scripts/verify-sprint5-complete.mjs\` after any schema, RLS, or route change. Requires the linked Supabase CLI (\`npx supabase link\`) and a runnable \`npm run dev -w server\`.
`,
  'utf8',
);

console.log('Sprint 5 complete verification');
for (const step of steps) {
  console.log(`${String(step.step).padStart(2, '0')} | ${step.status.padEnd(7)} | ${step.name}: ${step.evidence}`);
}
console.log(`Summary: ${counts.PASS} PASS, ${counts.FAIL} FAIL, ${counts.BLOCKED} BLOCKED`);
console.log(`JSON: ${outputPath}`);
console.log(`Report: ${reportPath}`);
if (counts.FAIL > 0 || counts.BLOCKED > 0) process.exitCode = 1;
