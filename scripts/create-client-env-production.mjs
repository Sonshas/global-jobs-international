#!/usr/bin/env node
/**
 * Create client/.env.production from client/.env (Supabase keys) with production URLs.
 * Does not print secret values.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(root, 'client', '.env');
const outPath = path.join(root, 'client', '.env.production');

function parseEnv(text) {
  const result = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    result[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return result;
}

if (!existsSync(envPath)) {
  console.error('Missing client/.env — cannot derive production values.');
  process.exit(1);
}

const src = parseEnv(readFileSync(envPath, 'utf8'));
const url = src.VITE_SUPABASE_URL;
const anon = src.VITE_SUPABASE_ANON_KEY;

if (!url || !anon || url.includes('your-') || /placeholder|your-supabase/i.test(anon)) {
  console.error('client/.env is missing real VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.');
  process.exit(1);
}

const contents = [
  '# Generated for production build — do not commit.',
  'VITE_APP_ENV=production',
  'VITE_API_URL=/api',
  'VITE_PUBLIC_SITE_URL=https://globaljobsinternational.com',
  `VITE_SUPABASE_URL=${url}`,
  `VITE_SUPABASE_ANON_KEY=${anon}`,
  'VITE_STRICT_RBAC=true',
  'VITE_ALLOW_DEMO_ADMIN=false',
  '',
].join('\n');

writeFileSync(outPath, contents, 'utf8');
console.log('Wrote client/.env.production');
console.log('  VITE_APP_ENV=production');
console.log('  VITE_API_URL=/api');
console.log('  VITE_PUBLIC_SITE_URL=https://globaljobsinternational.com');
console.log(`  VITE_SUPABASE_URL set (host=${new URL(url).host})`);
console.log(`  VITE_SUPABASE_ANON_KEY set (length=${anon.length})`);
console.log('  VITE_STRICT_RBAC=true');
console.log('  VITE_ALLOW_DEMO_ADMIN=false');
