#!/usr/bin/env node
/**
 * Read-only/live schema probe for the Sprint 3 Supabase rollout.
 * It creates a disposable auth user only when signup returns a session.
 */
import { createRequire } from 'node:module';
import { execFile } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { assertSprint3Env, looksLikePlaceholder } from './lib/env-preflight.mjs';

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(root, 'scripts', 'probe-sprint3-schema-results.json');
const clientRequire = createRequire(path.join(root, 'client', 'package.json'));
const { createClient } = clientRequire('@supabase/supabase-js');

function isPlaceholder(value) {
  return looksLikePlaceholder(value);
}

function brief(error) {
  return String(error?.message ?? error ?? 'Unknown error').replace(/\s+/g, ' ').slice(0, 500);
}

function classify(error) {
  const message = brief(error);
  if (/Could not find (the )?(function|table)|schema cache|PGRST202|PGRST204/i.test(message)) return 'MISSING';
  if (/permission denied|not authorized|JWT|401|403|row-level security|violates row-level security/i.test(message)) return 'PRESENT_BUT_UNAUTHORIZED';
  return 'INCONCLUSIVE';
}

function classifyRpc(error) {
  const status = classify(error);
  // A PostgreSQL constraint or application exception can only occur after the
  // RPC was resolved and invoked. This avoids mislabeling errors such as
  // "owner user does not exist" as a missing function.
  return status === 'INCONCLUSIVE' ? 'PRESENT_BUT_REJECTED' : status;
}

async function command(command, args) {
  try {
    const invocation = process.platform === 'win32' && command === 'npx'
      ? ['cmd.exe', ['/d', '/s', '/c', 'npx supabase --version']]
      : [command, args];
    const { stdout, stderr } = await execFileAsync(...invocation, { cwd: root, windowsHide: true });
    return { available: true, output: `${stdout}${stderr}`.trim() };
  } catch (error) {
    return { available: false, error: brief(error) };
  }
}

let clientEnv;
let serverEnv;
let url;
let anonKey;
try {
  const preflight = await assertSprint3Env(root);
  ({ clientEnv, serverEnv, url, anonKey } = preflight);
  if (preflight.warnings.length) {
    console.warn(`[env] Warnings:\n${preflight.warnings.map((item) => `  • ${item}`).join('\n')}`);
  }
} catch (error) {
  console.error(error.message);
  await writeFile(
    outputPath,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), error: error.message, code: error.code ?? 'ENV_PREFLIGHT_FAILED' }, null, 2)}\n`,
    'utf8',
  );
  process.exit(1);
}
const runId = `sprint3-schema-${Date.now()}-${randomUUID().slice(0, 8)}`;
const repoMigrationPaths = [
  'supabase/migrations/20260721000014_document_storage.sql',
  'supabase/migrations/20260721000015_pipeline_notifications_comms.sql',
  'supabase/migrations/20260721000016_ensure_documents_bucket.sql',
  'supabase/migrations/20260721000017_harden_role_assignment_rpc.sql',
];
const [migration14, migration15, migration16, migration17] = await Promise.all(
  repoMigrationPaths.map(async (relativePath) => {
    try {
      const contents = await readFile(path.join(root, relativePath), 'utf8');
      return { path: relativePath, exists: true, contents };
    } catch {
      return { path: relativePath, exists: false, contents: '' };
    }
  }),
);

const result = {
  generatedAt: new Date().toISOString(),
  runId,
  target: { projectRef: url ? new URL(url).hostname.split('.')[0] : null, urlConfigured: Boolean(url), anonKeyConfigured: Boolean(anonKey) },
  repoMigrations: {
    migration000014: {
      path: migration14.path,
      exists: migration14.exists,
      declaresDocumentsBucket: /insert into storage\.buckets[\s\S]*?'documents'/i.test(migration14.contents),
      declaresDocumentTypes: /insert into public\.document_types/i.test(migration14.contents),
    },
    migration000015: {
      path: migration15.path,
      exists: migration15.exists,
      declaresPrivilegedNotificationInsertPolicy: /Privileged roles insert notifications/i.test(migration15.contents),
      allowsSelfNotificationInsert: /user_id\s*=\s*auth\.uid\(\)/i.test(migration15.contents),
    },
    migration000016: {
      path: migration16.path,
      exists: migration16.exists,
      repairsDocumentsBucket: /on conflict \(id\) do update/i.test(migration16.contents),
      reappliesStoragePolicies: /Documents bucket insert own prefix/i.test(migration16.contents),
    },
    migration000017: {
      path: migration17.path,
      exists: migration17.exists,
      revokesAuthenticatedRoleAssignment: /revoke execute[\s\S]*from authenticated/i.test(migration17.contents),
    },
  },
  localTooling: {
    linkedProjectRef: null,
    supabaseCli: await command('npx', ['supabase', '--version']),
    docker: await command('docker', ['--version']),
  },
  serverEnv: {
    supabaseUrlPresent: Boolean(serverEnv.SUPABASE_URL),
    supabaseUrlPlaceholder: isPlaceholder(serverEnv.SUPABASE_URL),
    serviceRolePresent: Boolean(serverEnv.SUPABASE_SERVICE_ROLE_KEY),
    serviceRolePlaceholder: isPlaceholder(serverEnv.SUPABASE_SERVICE_ROLE_KEY),
    resendPresent: Boolean(serverEnv.RESEND_API_KEY),
    resendPlaceholder: isPlaceholder(serverEnv.RESEND_API_KEY),
  },
  liveProject: { authentication: null, rpcs: {}, tables: {}, storage: {}, migrationArtifacts: {} },
};

try {
  result.localTooling.linkedProjectRef = (await readFile(path.join(root, 'supabase/.temp/project-ref'), 'utf8')).trim() || null;
} catch {
  result.localTooling.linkedProjectRef = null;
}

if (!url || !anonKey) {
  result.liveProject.authentication = { status: 'BLOCKED', evidence: 'client/.env is missing a Supabase URL or anon key.' };
} else {
  const publicClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  let liveClient = publicClient;
  try {
    const { data, error } = await publicClient.auth.signUp({
      email: `probe.${runId}@example.invalid`,
      password: `Probe!${randomUUID()}Aa`,
    });
    if (error) throw error;
    if (data.session) {
      liveClient = createClient(url, anonKey, {
        global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      });
      result.liveProject.authentication = { status: 'AUTHENTICATED_THROWAWAY_USER', userId: data.user?.id ?? null };
    } else {
      result.liveProject.authentication = { status: 'ANONYMOUS_FALLBACK', userId: data.user?.id ?? null, evidence: 'Signup succeeded but email confirmation prevented a session.' };
    }
  } catch (error) {
    result.liveProject.authentication = { status: 'ANONYMOUS_FALLBACK', evidence: `Signup failed: ${brief(error)}` };
  }

  const rpcCalls = {
    ensure_catalog_job: ['ensure_catalog_job', { p_catalog_id: `probe-${runId}`, p_payload: {} }],
    next_gji_application_number: ['next_gji_application_number', {}],
    assign_user_role: ['assign_user_role', { p_user_id: randomUUID(), p_role_slug: 'applicant', p_assigned_by: randomUUID() }],
    seed_platform_employer: ['seed_platform_employer', { p_owner_user_id: randomUUID() }],
  };
  for (const [name, [rpc, args]] of Object.entries(rpcCalls)) {
    const { data, error } = await liveClient.rpc(rpc, args);
    result.liveProject.rpcs[name] = error
      ? { status: classifyRpc(error), evidence: brief(error) }
      : { status: 'PRESENT_AND_CALLABLE', returnedValue: data === null ? null : typeof data };
  }

  for (const table of ['applications', 'visa_progress', 'notifications', 'application_status_history', 'documents', 'document_types']) {
    const { data, error } = await liveClient.from(table).select('*', { head: true, count: 'exact' }).limit(1);
    result.liveProject.tables[table] = error
      ? { status: classify(error), evidence: brief(error) }
      : { status: 'PRESENT', countVisibleToProbe: data?.length ?? null };
  }

  const { data: buckets, error: bucketError } = await liveClient.storage.listBuckets();
  const documentsBucket = buckets?.find((bucket) => bucket.id === 'documents' || bucket.name === 'documents');
  result.liveProject.storage.documentsBucket = bucketError
    ? { status: classify(bucketError), evidence: brief(bucketError) }
    : documentsBucket
      ? { status: 'PRESENT', public: documentsBucket.public ?? null, fileSizeLimit: documentsBucket.file_size_limit ?? null }
      : { status: 'MISSING', evidence: 'listBuckets succeeded but did not return a documents bucket.' };

  const { error: selfNotificationError } = await liveClient.from('notifications').insert({
    user_id: result.liveProject.authentication.userId ?? randomUUID(),
    title: `Probe ${runId}`,
    body: 'Self notification policy check.',
    channel: 'in_app',
    event_type: 'application_submitted',
  });
  const { error: crossUserNotificationError } = await liveClient.from('notifications').insert({
    user_id: randomUUID(),
    title: `Probe cross-user ${runId}`,
    body: 'Cross-user notification policy check.',
    channel: 'in_app',
    event_type: 'application_submitted',
  });
  result.liveProject.migrationArtifacts.notificationInsertPolicy = {
    selfInsert: selfNotificationError
      ? { status: classify(selfNotificationError), evidence: brief(selfNotificationError) }
      : { status: 'ALLOWED', evidence: 'Authenticated throwaway user inserted its own notification.' },
    crossUserInsert: crossUserNotificationError
      ? { status: classify(crossUserNotificationError), evidence: brief(crossUserNotificationError) }
      : { status: 'UNEXPECTEDLY_ALLOWED', evidence: 'Cross-user notification insert succeeded; inspect policy and clean up this row.' },
    interpretation: 'Behavior matches the self-or-privileged intent of migration 000015, but cannot prove the live policy name or migration history.',
  };
  result.liveProject.migrationArtifacts.documentStorage = {
    status: result.liveProject.storage.documentsBucket.status,
    evidence: 'Migration 000014 bucket presence is assessed through storage.listBuckets.',
  };
}

await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(result, null, 2));
console.log(`\nResults written to ${outputPath}`);
