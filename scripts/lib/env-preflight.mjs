/**
 * Shared environment preflight for Sprint 3 verification scripts.
 * Fails fast with actionable messages (no generic Zod/stack dumps).
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export function parseEnv(text) {
  return Object.fromEntries(
    text.split(/\r?\n/).flatMap((line) => {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
      return !match || line.trimStart().startsWith('#')
        ? []
        : [[match[1], match[2].replace(/^['"]|['"]$/g, '')]];
    }),
  );
}

export async function loadEnvFile(root, relativePath) {
  try {
    return parseEnv(await readFile(path.join(root, relativePath), 'utf8'));
  } catch {
    return null;
  }
}

export function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

export function looksLikePlaceholder(value) {
  if (isBlank(value)) return true;
  return /your[-_]?(dev|staging|production)?[-_]?project|your[-_]?supabase|your[-_]?(dev|staging|production)?[-_]?anon|placeholder|example\.invalid|service-role-key|your-resend/i.test(
    String(value),
  );
}

/**
 * @param {string} root
 * @returns {Promise<{
 *   clientEnv: Record<string, string>,
 *   serverEnv: Record<string, string>,
 *   url: string,
 *   anonKey: string,
 *   missing: string[],
 *   warnings: string[],
 * }>}
 */
export async function assertSprint3Env(root) {
  const missing = [];
  const warnings = [];

  const clientEnv = await loadEnvFile(root, 'client/.env');
  const serverEnv = await loadEnvFile(root, 'server/.env');

  if (!clientEnv) {
    missing.push('client/.env is missing — copy client/.env.example and set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY');
  }
  if (!serverEnv) {
    missing.push('server/.env is missing — copy server/.env.example and set SUPABASE_URL + SUPABASE_ANON_KEY');
  }

  const url = clientEnv?.VITE_SUPABASE_URL;
  const anonKey = clientEnv?.VITE_SUPABASE_ANON_KEY;

  if (!clientEnv) {
    // already recorded
  } else {
    if (isBlank(url) || looksLikePlaceholder(url)) {
      missing.push(
        'client/.env VITE_SUPABASE_URL is missing or still a placeholder (Supabase → Project Settings → API → Project URL)',
      );
    }
    if (isBlank(anonKey) || looksLikePlaceholder(anonKey)) {
      missing.push(
        'client/.env VITE_SUPABASE_ANON_KEY is missing or still a placeholder (Supabase → Project Settings → API → anon public)',
      );
    }
    if (isBlank(clientEnv.VITE_API_URL)) {
      warnings.push('client/.env VITE_API_URL is empty; SPA will not reach the Express comms API');
    }
  }

  if (serverEnv) {
    if (isBlank(serverEnv.SUPABASE_URL) || looksLikePlaceholder(serverEnv.SUPABASE_URL)) {
      missing.push(
        'server/.env SUPABASE_URL is missing or still a placeholder — mirror client VITE_SUPABASE_URL',
      );
    } else if (url && serverEnv.SUPABASE_URL !== url) {
      missing.push(
        `server/.env SUPABASE_URL does not match client/.env VITE_SUPABASE_URL\n    server=${serverEnv.SUPABASE_URL}\n    client=${url}`,
      );
    }

    if (isBlank(serverEnv.SUPABASE_ANON_KEY) || looksLikePlaceholder(serverEnv.SUPABASE_ANON_KEY)) {
      missing.push(
        'server/.env SUPABASE_ANON_KEY is missing or still a placeholder — mirror client VITE_SUPABASE_ANON_KEY',
      );
    } else if (anonKey && serverEnv.SUPABASE_ANON_KEY !== anonKey) {
      missing.push('server/.env SUPABASE_ANON_KEY does not match client/.env VITE_SUPABASE_ANON_KEY');
    }

    if (!isBlank(serverEnv.SUPABASE_SERVICE_ROLE_KEY) && looksLikePlaceholder(serverEnv.SUPABASE_SERVICE_ROLE_KEY)) {
      missing.push(
        'server/.env SUPABASE_SERVICE_ROLE_KEY looks like a placeholder — leave blank for local JWT verification, or set the real service_role key from Supabase → API',
      );
    }

    if (isBlank(serverEnv.SUPABASE_SERVICE_ROLE_KEY)) {
      warnings.push(
        'SUPABASE_SERVICE_ROLE_KEY is unset (OK for local Sprint 3 — verifier uses linked CLI; required on staging/production hosts)',
      );
    }

    if (isBlank(serverEnv.RESEND_API_KEY)) {
      warnings.push(
        'RESEND_API_KEY is unset (OK for development — email uses provider=log; required for production delivery)',
      );
    } else if (looksLikePlaceholder(serverEnv.RESEND_API_KEY)) {
      missing.push(
        'server/.env RESEND_API_KEY looks like a placeholder — leave blank for log mode or set a real Resend key',
      );
    }
  }

  if (missing.length) {
    const message = [
      'Sprint 3 environment preflight failed.',
      '',
      'Fix these before re-running:',
      ...missing.map((item) => `  • ${item}`),
      '',
      'Templates: .env.example, client/.env.example, server/.env.example',
      'Setup guide: docs/sprint3-verification-setup.md',
      'Secret locations:',
      '  • SUPABASE_* → Supabase Dashboard → Project Settings → API (server/.env only for service_role)',
      '  • RESEND_* → https://resend.com (server/.env / host secrets only)',
    ].join('\n');
    const error = new Error(message);
    error.code = 'ENV_PREFLIGHT_FAILED';
    error.missing = missing;
    error.warnings = warnings;
    throw error;
  }

  return {
    clientEnv,
    serverEnv,
    url,
    anonKey,
    missing,
    warnings,
  };
}
