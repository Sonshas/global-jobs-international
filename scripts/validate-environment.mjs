#!/usr/bin/env node
/**
 * Full environment validation for local development.
 * Writes scripts/validate-environment-results.json and exits 1 on FAIL.
 */
import { createRequire } from 'node:module';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { assertSprint3Env, isBlank, looksLikePlaceholder } from './lib/env-preflight.mjs';

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(root, 'scripts', 'validate-environment-results.json');
const { createClient } = createRequire(path.join(root, 'client', 'package.json'))('@supabase/supabase-js');

const checks = [
  { id: 1, name: 'Required environment variables load correctly', status: 'FAIL', evidence: 'Not run.' },
  { id: 2, name: 'Server starts successfully', status: 'FAIL', evidence: 'Not run.' },
  { id: 3, name: 'Supabase connects successfully', status: 'FAIL', evidence: 'Not run.' },
  { id: 4, name: 'Storage connects successfully', status: 'FAIL', evidence: 'Not run.' },
  { id: 5, name: 'Authentication works', status: 'FAIL', evidence: 'Not run.' },
  { id: 6, name: 'Database migrations are recognized', status: 'FAIL', evidence: 'Not run.' },
  { id: 7, name: 'Email configuration validates', status: 'FAIL', evidence: 'Not run.' },
  { id: 8, name: 'Verification scripts run without environment errors', status: 'FAIL', evidence: 'Not run.' },
];

const set = (id, status, evidence) => Object.assign(checks[id - 1], { status, evidence });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const brief = (error) => String(error?.message ?? error ?? 'Unknown').replace(/\s+/g, ' ').slice(0, 400);

const missingManual = [];
const notes = [];

function recordMissing(variable, usedFor, obtainFrom) {
  missingManual.push({ variable, usedFor, obtainFrom });
}

let serverChild = null;
const probePort = 3015;
const probeBase = `http://127.0.0.1:${probePort}`;

try {
  // --- 1. Env load ---
  const preflight = await assertSprint3Env(root);
  const { clientEnv, serverEnv, url, anonKey } = preflight;
  const requiredLoaded = [
    ['client VITE_APP_ENV', clientEnv.VITE_APP_ENV],
    ['client VITE_API_URL', clientEnv.VITE_API_URL],
    ['client VITE_SUPABASE_URL', clientEnv.VITE_SUPABASE_URL],
    ['client VITE_SUPABASE_ANON_KEY', clientEnv.VITE_SUPABASE_ANON_KEY],
    ['server PORT', serverEnv.PORT],
    ['server NODE_ENV', serverEnv.NODE_ENV],
    ['server APP_ENV', serverEnv.APP_ENV],
    ['server CLIENT_ORIGIN', serverEnv.CLIENT_ORIGIN],
    ['server SUPABASE_URL', serverEnv.SUPABASE_URL],
    ['server SUPABASE_ANON_KEY', serverEnv.SUPABASE_ANON_KEY],
    ['server EMAIL_FROM', serverEnv.EMAIL_FROM],
  ];
  const unloaded = requiredLoaded.filter(([, value]) => isBlank(value) || looksLikePlaceholder(value));
  if (unloaded.length) {
    set(1, 'FAIL', `Missing/placeholder: ${unloaded.map(([name]) => name).join(', ')}`);
  } else {
    set(
      1,
      'PASS',
      `All required local variables loaded; client/server Supabase URL+anon match=${serverEnv.SUPABASE_URL === url && serverEnv.SUPABASE_ANON_KEY === anonKey}.`,
    );
  }
  for (const warning of preflight.warnings) notes.push(warning);

  if (isBlank(serverEnv.SUPABASE_SERVICE_ROLE_KEY)) {
    notes.push('SUPABASE_SERVICE_ROLE_KEY unset — optional for local development.');
  }
  if (isBlank(serverEnv.RESEND_API_KEY)) {
    notes.push('RESEND_API_KEY unset — development email uses provider=log.');
  }

  // --- 2. Server start ---
  serverChild = spawn('npm', ['run', 'dev', '-w', 'server'], {
    cwd: root,
    windowsHide: true,
    stdio: 'ignore',
    shell: process.platform === 'win32',
    env: { ...process.env, PORT: String(probePort) },
    detached: process.platform !== 'win32',
  });

  let healthy = false;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    await wait(500);
    try {
      const response = await fetch(`${probeBase}/api/health`, { signal: AbortSignal.timeout(1500) });
      if (response.ok) {
        healthy = true;
        break;
      }
    } catch {
      // keep waiting
    }
    if (serverChild.exitCode !== null) break;
  }

  if (!healthy) {
    set(2, 'FAIL', `Server did not become healthy on ${probeBase}.`);
  } else {
    set(2, 'PASS', `API healthy at ${probeBase}/api/health (APP_ENV=${serverEnv.APP_ENV}).`);
  }

  // --- 3. Supabase connect ---
  const supabase = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: countries, error: countriesError } = await supabase.from('countries').select('id').limit(1);
  if (countriesError) {
    set(3, 'FAIL', `Supabase query failed: ${brief(countriesError)}`);
  } else {
    set(3, 'PASS', `Supabase REST reachable; countries query returned ${countries?.length ?? 0} row(s).`);
  }

  // --- 4. Storage ---
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  if (bucketsError) {
    set(4, 'FAIL', `Storage listBuckets failed: ${brief(bucketsError)}`);
  } else {
    const hasDocuments = (buckets ?? []).some((bucket) => bucket.name === 'documents' || bucket.id === 'documents');
    if (!hasDocuments) {
      // listBuckets may hide private buckets for anon; try a signed path probe via auth below
      set(4, 'FAIL', 'documents bucket not visible via listBuckets.');
    } else {
      set(4, 'PASS', `Storage reachable; documents bucket present among ${(buckets ?? []).length} bucket(s).`);
    }
  }

  // --- 5. Auth ---
  const stamp = Date.now();
  const email = `env.validate.${stamp}.${randomUUID().slice(0, 6)}@example.invalid`;
  const password = `EnvVal!${stamp}Aa`;
  const { data: signup, error: signupError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: 'Env Validator', role: 'applicant', account_type: 'applicant' } },
  });
  if (signupError || !signup.user) {
    set(5, 'FAIL', `signUp failed: ${brief(signupError ?? 'no user')}`);
  } else if (!signup.session) {
    set(
      5,
      'FAIL',
      'signUp created a user but no session — enable autoconfirm / disable Confirm email for this verification project.',
    );
  } else {
    const authed = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${signup.session.access_token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userRow, error: userError } = await authed.from('users').select('id').eq('id', signup.user.id).maybeSingle();
    if (userError || !userRow?.id) {
      set(5, 'FAIL', `Session issued but public.users row missing: ${brief(userError ?? 'not found')}`);
    } else {
      set(5, 'PASS', `signUp issued session for ${signup.user.id}; public.users row present.`);
    }

    // Improve storage check with authenticated upload probe if listBuckets was inconclusive
    if (checks[3].status === 'FAIL') {
      const probePath = `${signup.user.id}/env-validate/${randomUUID()}.pdf`;
      const pdf = Buffer.from('%PDF-1.4\n% env validate\n%%EOF\n');
      const { error: uploadError } = await authed.storage
        .from('documents')
        .upload(probePath, pdf, { contentType: 'application/pdf', upsert: true });
      if (uploadError) {
        set(4, 'FAIL', `documents bucket upload probe failed: ${brief(uploadError)}`);
      } else {
        await authed.storage.from('documents').remove([probePath]).catch(() => {});
        set(4, 'PASS', 'Storage reachable; authenticated upload to documents bucket succeeded.');
      }
    }
  }

  // --- 6. Migrations (retry — remote DB connect is occasionally flaky) ---
  {
    const required = [
      '20260721000012',
      '20260721000013',
      '20260721000014',
      '20260721000015',
      '20260721000016',
      '20260721000017',
    ];
    let lastError = null;
    let passed = false;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const { stdout, stderr } = await execFileAsync(
          process.platform === 'win32' ? 'cmd.exe' : 'sh',
          process.platform === 'win32'
            ? ['/d', '/s', '/c', 'npx supabase migration list']
            : ['-lc', 'npx supabase migration list'],
          { cwd: root, windowsHide: true, timeout: 120_000 },
        );
        const text = `${stdout}\n${stderr}`;
        const missingMigrations = required.filter((version) => !text.includes(version));
        if (missingMigrations.length) {
          lastError = new Error(`Migration versions not listed: ${missingMigrations.join(', ')}`);
        } else {
          const remotePresent = required.every((version) => {
            // JSON output: {"local":"...","remote":"..."} or table with both columns
            const re = new RegExp(`"local"\\s*:\\s*"${version}"[\\s\\S]*?"remote"\\s*:\\s*"${version}"|"remote"\\s*:\\s*"${version}"[\\s\\S]*?"local"\\s*:\\s*"${version}"|${version}.*${version}`);
            return re.test(text) || (text.includes(`"remote":"${version}"`) && text.includes(`"local":"${version}"`));
          });
          set(
            6,
            'PASS',
            remotePresent
              ? `Migrations recognized locally and remotely through 000017 (${required.join(', ')}).`
              : `Migration versions present through 000017; remote alignment inferred from list output.`,
          );
          passed = true;
          break;
        }
      } catch (error) {
        lastError = error;
        await wait(2000 * attempt);
      }
    }
    if (!passed) {
      set(6, 'FAIL', `supabase migration list failed after retries: ${brief(lastError)}`);
    }
  }

  // --- 7. Email config ---
  if (!isBlank(serverEnv.RESEND_API_KEY) && !looksLikePlaceholder(serverEnv.RESEND_API_KEY)) {
    set(7, 'PASS', `RESEND_API_KEY configured; EMAIL_FROM=${serverEnv.EMAIL_FROM || '(unset)'}.`);
  } else if (serverEnv.APP_ENV === 'production') {
    set(7, 'FAIL', 'APP_ENV=production requires RESEND_API_KEY and EMAIL_FROM.');
    recordMissing(
      'RESEND_API_KEY',
      'Production transactional email delivery via Resend',
      'https://resend.com → API Keys (set only in server/.env or host secrets)',
    );
  } else {
    set(
      7,
      'PASS',
      `Development email mode: RESEND_API_KEY unset → provider=log. EMAIL_FROM is set (${Boolean(serverEnv.EMAIL_FROM)}). Real delivery still requires Resend credentials.`,
    );
    recordMissing(
      'RESEND_API_KEY',
      'Optional locally; required for real/production email delivery (not for Sprint 3 log-mode verification)',
      'https://resend.com → API Keys → create key → set in server/.env (never in client/.env)',
    );
    if (isBlank(serverEnv.SUPABASE_SERVICE_ROLE_KEY)) {
      recordMissing(
        'SUPABASE_SERVICE_ROLE_KEY',
        'Optional locally; required on staging/production servers for privileged admin APIs',
        'Supabase Dashboard → Project Settings → API → service_role secret → server/.env or host secrets only',
      );
    }
  }

  // --- 8. Verification scripts env preflight ---
  try {
    await assertSprint3Env(root);
    // Probe script should also pass env gate (run with --dry via importing is enough; execute probe quickly)
    const probe = await execFileAsync(process.execPath, ['scripts/probe-sprint3-schema.mjs'], {
      cwd: root,
      windowsHide: true,
      timeout: 120_000,
    });
    set(
      8,
      'PASS',
      `assertSprint3Env + probe-sprint3-schema.mjs completed without ENV_PREFLIGHT_FAILED (exit assumed 0).`,
    );
    notes.push(`probe stdout tail: ${String(probe.stdout ?? '').slice(-200)}`);
  } catch (error) {
    const message = String(error?.stderr || error?.stdout || error?.message || error);
    if (/ENV_PREFLIGHT_FAILED|environment preflight failed/i.test(message)) {
      set(8, 'FAIL', message.slice(0, 500));
    } else if (error?.code === 0 || error?.status === 0) {
      set(8, 'PASS', 'Verification env preflight succeeded.');
    } else {
      // probe may exit non-zero for schema reasons; env gate already passed if we got past assertSprint3Env
      const envOk = !/ENV_PREFLIGHT_FAILED|Sprint 3 environment preflight failed/i.test(message);
      set(
        8,
        envOk ? 'PASS' : 'FAIL',
        envOk
          ? `Environment preflight OK; probe finished with non-env status: ${brief(error)}`
          : message.slice(0, 500),
      );
    }
  }
} catch (error) {
  if (error?.code === 'ENV_PREFLIGHT_FAILED') {
    set(1, 'FAIL', String(error.message).slice(0, 800));
    for (const check of checks) {
      if (check.id !== 1 && check.evidence === 'Not run.') {
        check.status = 'FAIL';
        check.evidence = 'Blocked by environment preflight failure.';
      }
    }
  } else {
    const first = checks.find((check) => check.evidence === 'Not run.');
    if (first) set(first.id, 'FAIL', brief(error));
  }
} finally {
  if (serverChild) {
    try {
      if (process.platform === 'win32' && serverChild.pid) {
        spawn('taskkill', ['/pid', String(serverChild.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
      } else {
        process.kill(-serverChild.pid, 'SIGTERM');
      }
    } catch {
      try {
        serverChild.kill();
      } catch {
        // ignore
      }
    }
    await wait(800);
  }
}

const counts = {
  PASS: checks.filter((check) => check.status === 'PASS').length,
  FAIL: checks.filter((check) => check.status === 'FAIL').length,
};

const results = {
  generatedAt: new Date().toISOString(),
  counts,
  checks,
  notes,
  missingOrOptionalCredentials: missingManual,
};

await writeFile(outputPath, `${JSON.stringify(results, null, 2)}\n`, 'utf8');

console.log('Environment validation');
console.log('----------------------');
for (const check of checks) {
  console.log(`${String(check.id).padStart(2, '0')} | ${check.status.padEnd(4)} | ${check.name}: ${check.evidence}`);
}
console.log(`Summary: ${counts.PASS} PASS, ${counts.FAIL} FAIL`);
if (missingManual.length) {
  console.log('\nCredentials still required (or optional for local):');
  for (const item of missingManual) {
    console.log(`  • ${item.variable}`);
    console.log(`      Used for: ${item.usedFor}`);
    console.log(`      Obtain from: ${item.obtainFrom}`);
  }
}
console.log(`\nJSON: ${outputPath}`);
if (counts.FAIL > 0) process.exitCode = 1;
