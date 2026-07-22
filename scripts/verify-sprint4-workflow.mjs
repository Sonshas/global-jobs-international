#!/usr/bin/env node
/**
 * Sprint 4 smoke verification (payments + employer approval + ops artifacts).
 */
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { access, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { assertSprint3Env } from './lib/env-preflight.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(root, 'scripts', 'verify-sprint4-workflow-results.json');
const { createClient } = createRequire(path.join(root, 'client', 'package.json'))('@supabase/supabase-js');

const names = [
  'Environment preflight',
  'Deploy artifacts present',
  'Launch checklist and readiness report present',
  'API health reports config flags',
  'Checkout requires auth and Stripe when configured',
  'Pending employer cannot insert published job (RLS)',
];
const steps = names.map((name, index) => ({ step: index + 1, name, status: 'BLOCKED', evidence: 'Not attempted.' }));
const set = (n, status, evidence) => Object.assign(steps[n - 1], { status, evidence });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const brief = (e) => String(e?.message ?? e ?? 'Unknown').replace(/\s+/g, ' ').slice(0, 400);

async function fetchJson(url, init, attempts = 3) {
  let lastError;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url, { ...init, signal: AbortSignal.timeout(12_000) });
      const body = await response.json().catch(() => ({}));
      return { response, body };
    } catch (error) {
      lastError = error;
      await wait(1000 * (i + 1));
    }
  }
  throw lastError;
}

const probePort = 3016;
const probeBase = `http://127.0.0.1:${probePort}`;
let serverChild = null;

try {
  const { url, anonKey, serverEnv } = await assertSprint3Env(root);
  set(1, 'PASS', 'client/.env and server/.env required vars load and match.');

  const artifacts = [
    'deploy/nginx.conf.example',
    'deploy/ecosystem.config.cjs',
    'deploy/logrotate-gji.conf.example',
    'scripts/deploy-hostinger.sh',
    'scripts/backup-supabase.md',
    'docs/hostinger-vps.md',
    'docs/v1-launch-checklist.md',
    'docs/production-readiness-report.md',
  ];
  const missing = [];
  for (const relative of artifacts) {
    try {
      await access(path.join(root, relative));
    } catch {
      missing.push(relative);
    }
  }
  set(2, missing.length ? 'FAIL' : 'PASS', missing.length ? `Missing: ${missing.join(', ')}` : `All ${artifacts.length} deploy/ops artifacts present.`);
  set(
    3,
    missing.some((item) => item.includes('v1-launch') || item.includes('production-readiness')) ? 'FAIL' : 'PASS',
    'Launch checklist and production readiness report on disk.',
  );

  serverChild = spawn('npm', ['run', 'dev', '-w', 'server'], {
    cwd: root,
    windowsHide: true,
    stdio: 'ignore',
    shell: process.platform === 'win32',
    env: { ...process.env, PORT: String(probePort) },
  });

  let healthy = null;
  for (let i = 0; i < 40; i += 1) {
    await wait(500);
    try {
      const { response, body } = await fetchJson(`${probeBase}/api/health`, {}, 1);
      if (response.ok) {
        healthy = body;
        break;
      }
    } catch {
      // retry
    }
  }
  if (!healthy?.checks) throw new Error('Health endpoint did not become ready.');
  set(
    4,
    'PASS',
    `Health checks: stripe=${healthy.checks.stripeConfigured}, resend=${healthy.checks.resendConfigured}, supabaseAnon=${healthy.checks.supabaseAnonConfigured}, serviceRole=${healthy.checks.serviceRoleConfigured}.`,
  );

  const unauth = await fetchJson(`${probeBase}/api/payments/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ serviceId: 'cv_preparation' }),
  });
  if (unauth.response.status !== 401) {
    set(5, 'FAIL', `Expected 401 without JWT, got ${unauth.response.status}.`);
  } else if (!serverEnv.STRIPE_SECRET_KEY) {
    set(
      5,
      'PASS',
      'Unauthenticated checkout rejected with 401. STRIPE_SECRET_KEY unset locally (production must set Stripe secrets; checkout then creates sessions).',
    );
  } else {
    set(5, 'PASS', 'Unauthenticated checkout rejected with 401; Stripe keys are present for live checkout.');
  }

  try {
    const sb = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const employerEmail = `sprint4.employer.${Date.now()}@example.invalid`;
    const { data: employerSignup, error: employerSignupError } = await sb.auth.signUp({
      email: employerEmail,
      password: `S4!${randomUUID()}Aa`,
      options: { data: { full_name: 'Sprint 4 Employer', role: 'employer', account_type: 'employer' } },
    });
    if (employerSignupError || !employerSignup.session || !employerSignup.user) {
      throw employerSignupError ?? new Error('Employer signup failed (check network to Supabase).');
    }
    const employerClient = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${employerSignup.session.access_token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    await wait(500);
    const { data: employerRow, error: employerInsertError } = await employerClient
      .from('employers')
      .insert({
        owner_user_id: employerSignup.user.id,
        legal_name: 'Pending Co',
        status: 'pending',
        is_verified: false,
        metadata: { accountStatus: 'pending' },
      })
      .select('id, status')
      .single();
    if (employerInsertError) throw employerInsertError;

    const { data: country } = await employerClient.from('countries').select('id').limit(1).maybeSingle();
    const { error: jobError } = await employerClient.from('jobs').insert({
      employer_id: employerRow.id,
      country_id: country?.id,
      title: 'Should Fail',
      description: 'Pending employer job insert must be denied.',
      status: 'published',
      metadata: { source: 'employer' },
    });
    set(
      6,
      jobError ? 'PASS' : 'FAIL',
      jobError
        ? `Pending employer job insert blocked: ${jobError.message}`
        : 'Pending employer was able to insert a job — RLS enforcement failed.',
    );
  } catch (error) {
    // Migration 000018 is applied; live RLS probe needs Supabase Auth connectivity.
    set(
      6,
      'FAIL',
      `Live RLS probe could not run (${brief(error)}). Migration 000018 (can_manage_employer_jobs) was pushed; re-run when Supabase network is reachable.`,
    );
  }
} catch (error) {
  const open = steps.find((s) => s.status === 'BLOCKED');
  if (open) set(open.step, 'FAIL', brief(error));
  for (const step of steps) {
    if (step.status === 'BLOCKED') step.evidence = `Blocked: ${brief(error)}`;
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

const counts = Object.fromEntries(['PASS', 'FAIL', 'BLOCKED'].map((s) => [s, steps.filter((x) => x.status === s).length]));
const results = {
  generatedAt: new Date().toISOString(),
  counts,
  steps,
  remainingExternalBlockers: [
    'STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET (https://dashboard.stripe.com)',
    'RESEND_API_KEY for production email',
    'SUPABASE_SERVICE_ROLE_KEY on staging/production hosts',
    'Hostinger DNS/TLS/PM2 cutover and backup restore drill',
  ],
};
await writeFile(outputPath, `${JSON.stringify(results, null, 2)}\n`, 'utf8');
console.log('Sprint 4 verification');
for (const step of steps) console.log(`${String(step.step).padStart(2, '0')} | ${step.status.padEnd(7)} | ${step.name}: ${step.evidence}`);
console.log(`Summary: ${counts.PASS} PASS, ${counts.FAIL} FAIL, ${counts.BLOCKED} BLOCKED`);
console.log(`JSON: ${outputPath}`);
if (counts.FAIL > 0 || counts.BLOCKED > 0) process.exitCode = 1;
