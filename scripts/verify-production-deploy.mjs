#!/usr/bin/env node
/**
 * Post-deploy production checks (run on build machine or VPS).
 * Usage:
 *   node scripts/verify-production-deploy.mjs --local-only
 *   node scripts/verify-production-deploy.mjs
 *   node scripts/verify-production-deploy.mjs https://globaljobsinternational.com
 */
import { readFile, readdir, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const localOnly = args.includes('--local-only');
const siteArg = args.find((arg) => !arg.startsWith('--'));
const site = (siteArg || 'https://globaljobsinternational.com').replace(/\/$/, '');
const failures = [];

function fail(message) {
  failures.push(message);
  console.error(`FAIL  ${message}`);
}

function pass(message) {
  console.log(`PASS  ${message}`);
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function checkDist() {
  const indexPath = path.join(root, 'client/dist/index.html');
  if (!(await exists(indexPath))) {
    fail('client/dist/index.html missing — run npm run build with client/.env.production');
    return;
  }
  const html = await readFile(indexPath, 'utf8');
  if (html.includes('/src/main.tsx')) {
    fail('index.html still points at /src/main.tsx (dev entry). Deploy Vite build output, not source.');
  } else {
    pass('index.html uses built module entry');
  }
  if (!html.includes('/assets/')) {
    fail('index.html has no /assets/ references');
  } else {
    pass('index.html references /assets/ bundles');
  }

  const assetsDir = path.join(root, 'client/dist/assets');
  if (!(await exists(assetsDir))) {
    fail('client/dist/assets missing');
    return;
  }
  const files = await readdir(assetsDir);
  const jsFiles = files.filter((name) => name.endsWith('.js'));
  let sawFallback = false;
  let sawSupabaseHost = false;
  for (const name of jsFiles) {
    const text = await readFile(path.join(assetsDir, name), 'utf8');
    if (text.includes('127.0.0.1:0') || text.includes('"unconfigured"') || text.includes("'unconfigured'")) {
      sawFallback = true;
    }
    if (text.includes('.supabase.co')) {
      sawSupabaseHost = true;
    }
  }
  if (sawFallback) {
    fail('Built JS still contains 127.0.0.1:0 or "unconfigured" (dev Supabase fallback leaked into production)');
  } else {
    pass('Built JS has no unconfigured Supabase fallback');
  }
  if (!sawSupabaseHost) {
    fail('Built JS does not contain a .supabase.co host — VITE_SUPABASE_URL was not inlined');
  } else {
    pass('Built JS contains inlined Supabase project host');
  }

  // Reject the known-broken live hash if it somehow reappears.
  const mainJs = html.match(/\/assets\/(index-[^"]+\.js)/)?.[1];
  if (!mainJs) {
    fail('Could not find main index-*.js in dist/index.html');
  } else if (mainJs === 'index-1Pp2xMKw.js') {
    fail('dist still points at known-broken live bundle index-1Pp2xMKw.js — rebuild required');
  } else {
    pass(`Main bundle is ${mainJs} (not the broken live hash)`);
  }
}

async function checkLive(urlPath, predicate, label) {
  try {
    const response = await fetch(`${site}${urlPath}`, {
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });
    const text = await response.text();
    if (!predicate(response, text)) {
      fail(`${label}: unexpected response (${response.status})`);
      console.error(text.slice(0, 300));
      return;
    }
    pass(label);
  } catch (error) {
    fail(`${label}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

await checkDist();

if (!localOnly) {
  await checkLive(
    '/api/health',
    (response, text) => {
      if (!response.ok) return false;
      try {
        const body = JSON.parse(text);
        return body.status === 'ok' && body.appEnv === 'production';
      } catch {
        return false;
      }
    },
    `${site}/api/health returns production ok`,
  );

  await checkLive(
    '/',
    (response, text) => response.ok && text.includes('/assets/') && !text.includes('/src/main.tsx'),
    `${site}/ serves built SPA index.html`,
  );
}

if (failures.length) {
  console.error(`\n${failures.length} production check(s) failed.`);
  process.exit(1);
}

console.log('\nAll production deploy checks passed.');
