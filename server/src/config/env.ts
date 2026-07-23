import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

// Load server/.env before validation (works from monorepo root or package cwd).
dotenv.config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env'),
});

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || String(value).trim() === '';
}

function looksLikePlaceholder(value: string | undefined): boolean {
  if (!value) return true;
  return /your[-_]?(dev|staging|production)?[-_]?project|your[-_]?supabase|your[-_]?(dev|staging|production)?[-_]?anon|placeholder|service-role-key|your-resend/i.test(
    value,
  );
}

/** Comma-separated origins, e.g. https://a.com,https://www.a.com */
function parseOriginList(raw: string): string[] {
  return raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function isHttpOrigin(value: string): boolean {
  try {
    const parsed = new URL(value);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && !parsed.pathname.replace(/\/$/, '');
  } catch {
    return false;
  }
}

const envSchema = z
  .object({
    PORT: z.coerce.number().int().positive().default(3001),
    /** Bind address. Production defaults to loopback (Nginx proxies). */
    HOST: z.string().default(''),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
    /** One origin, or comma-separated list (apex + www). */
    CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
    SUPABASE_URL: z.preprocess((value) => (isBlank(value) ? undefined : value), z.string().url().optional()),
    SUPABASE_ANON_KEY: z.preprocess((value) => (isBlank(value) ? undefined : value), z.string().min(1).optional()),
    SUPABASE_SERVICE_ROLE_KEY: z.preprocess(
      (value) => (isBlank(value) ? undefined : value),
      z.string().min(1).optional(),
    ),
    RESEND_API_KEY: z.preprocess((value) => (isBlank(value) ? undefined : value), z.string().min(1).optional()),
    EMAIL_FROM: z.preprocess((value) => (isBlank(value) ? undefined : value), z.string().min(3).optional()),
    STRIPE_SECRET_KEY: z.preprocess((value) => (isBlank(value) ? undefined : value), z.string().min(1).optional()),
    STRIPE_WEBHOOK_SECRET: z.preprocess((value) => (isBlank(value) ? undefined : value), z.string().min(1).optional()),
    PUBLIC_APP_URL: z.preprocess((value) => (isBlank(value) ? undefined : value), z.string().url().optional()),
    CRON_SECRET: z.preprocess((value) => (isBlank(value) ? undefined : value), z.string().min(1).optional()),
  })
  .superRefine((value, ctx) => {
    const issues: Array<{ path: string; message: string }> = [];
    const stagingOrProduction =
      value.APP_ENV === 'staging' || value.APP_ENV === 'production' || value.NODE_ENV === 'production';

    const origins = parseOriginList(value.CLIENT_ORIGIN);
    if (origins.length === 0) {
      issues.push({ path: 'CLIENT_ORIGIN', message: 'Required. Set the public SPA origin(s).' });
    }
    for (const origin of origins) {
      if (!isHttpOrigin(origin)) {
        issues.push({
          path: 'CLIENT_ORIGIN',
          message: `Invalid origin "${origin}". Use full origins like https://globaljobsinternational.com (comma-separated for www).`,
        });
      }
    }
    if (value.APP_ENV === 'production' || value.NODE_ENV === 'production') {
      if (origins.some((origin) => /localhost|127\.0\.0\.1/i.test(origin))) {
        issues.push({
          path: 'CLIENT_ORIGIN',
          message:
            'Must not be localhost in production. Example: https://globaljobsinternational.com,https://www.globaljobsinternational.com',
        });
      }
      if (origins.some((origin) => origin.startsWith('http://') && !/localhost|127\.0\.0\.1/i.test(origin))) {
        issues.push({
          path: 'CLIENT_ORIGIN',
          message: 'Use https:// origins in production.',
        });
      }
    }

    if (!value.SUPABASE_URL) {
      issues.push({
        path: 'SUPABASE_URL',
        message: 'Required. Set in server/.env from Supabase → Project Settings → API → Project URL.',
      });
    } else if (looksLikePlaceholder(value.SUPABASE_URL)) {
      issues.push({
        path: 'SUPABASE_URL',
        message: 'Looks like a placeholder. Replace with your real Supabase Project URL.',
      });
    }

    if (!value.SUPABASE_ANON_KEY) {
      issues.push({
        path: 'SUPABASE_ANON_KEY',
        message: 'Required. Set in server/.env from Supabase → Project Settings → API → anon public key.',
      });
    } else if (looksLikePlaceholder(value.SUPABASE_ANON_KEY)) {
      issues.push({
        path: 'SUPABASE_ANON_KEY',
        message: 'Looks like a placeholder. Replace with your real Supabase anon public key.',
      });
    }

    if (stagingOrProduction) {
      if (!value.SUPABASE_SERVICE_ROLE_KEY) {
        issues.push({
          path: 'SUPABASE_SERVICE_ROLE_KEY',
          message:
            'Required in staging/production. Set only on the server (never in Vite). Supabase → Project Settings → API → service_role.',
        });
      } else if (looksLikePlaceholder(value.SUPABASE_SERVICE_ROLE_KEY)) {
        issues.push({
          path: 'SUPABASE_SERVICE_ROLE_KEY',
          message: 'Looks like a placeholder. Replace with the real service_role key on the server host/secrets store.',
        });
      }
    }

    if (value.APP_ENV === 'production') {
      for (const key of ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'PUBLIC_APP_URL'] as const) {
        if (!value[key]) {
          issues.push({
            path: key,
            message: 'Required in production for Stripe Checkout payments.',
          });
        }
      }
      if (value.PUBLIC_APP_URL && /localhost|127\.0\.0\.1|example\.com/i.test(value.PUBLIC_APP_URL)) {
        issues.push({
          path: 'PUBLIC_APP_URL',
          message: 'Must be the real public HTTPS site URL in production.',
        });
      }
      if (!value.RESEND_API_KEY) {
        issues.push({
          path: 'RESEND_API_KEY',
          message:
            'Required in production for email delivery. Create a key at https://resend.com and set it only on the server.',
        });
      } else if (looksLikePlaceholder(value.RESEND_API_KEY)) {
        issues.push({
          path: 'RESEND_API_KEY',
          message: 'Looks like a placeholder. Set a real Resend API key on the server.',
        });
      }
      if (!value.EMAIL_FROM) {
        issues.push({
          path: 'EMAIL_FROM',
          message: 'Required in production when sending email. Use a verified sender domain in Resend.',
        });
      }
    }

    if (value.RESEND_API_KEY && looksLikePlaceholder(value.RESEND_API_KEY)) {
      issues.push({
        path: 'RESEND_API_KEY',
        message: 'Looks like a placeholder. Leave blank for development log mode, or set a real Resend key.',
      });
    }

    for (const issue of issues) {
      ctx.addIssue({ code: 'custom', path: [issue.path], message: issue.message });
    }
  });

export type ServerEnv = z.infer<typeof envSchema>;

/**
 * Validates process.env and returns the typed config.
 * On failure: prints a clear checklist and exits the process (no stack crash).
 */
export function loadServerEnv(envSource: NodeJS.ProcessEnv = process.env): ServerEnv {
  const parsed = envSchema.safeParse(envSource);

  if (!parsed.success) {
    const lines = parsed.error.issues.map((issue) => {
      const key = issue.path.join('.') || 'env';
      return `  • ${key}: ${issue.message}`;
    });
    console.error('');
    console.error('════════════════════════════════════════════════════════════');
    console.error('  Server environment validation failed');
    console.error('════════════════════════════════════════════════════════════');
    console.error('Fix server/.env (see server/.env.example and docs/environment-setup.md):');
    console.error(lines.join('\n'));
    console.error('');
    console.error('Where values come from:');
    console.error('  • SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY');
    console.error('      → Supabase Dashboard → Project Settings → API');
    console.error('  • RESEND_API_KEY / EMAIL_FROM');
    console.error('      → https://resend.com (API keys + verified domain)');
    console.error('  • CLIENT_ORIGIN');
    console.error(
      '      → Public SPA origin(s), comma-separated if needed (https://globaljobsinternational.com,https://www.globaljobsinternational.com)',
    );
    console.error('════════════════════════════════════════════════════════════');
    console.error('');
    process.exit(1);
  }

  return parsed.data;
}

export const env = loadServerEnv();

export function clientOrigins(): string[] {
  return parseOriginList(env.CLIENT_ORIGIN);
}

export function primaryClientOrigin(): string {
  return clientOrigins()[0] ?? env.CLIENT_ORIGIN;
}

export function listenHost(): string {
  if (env.HOST.trim()) return env.HOST.trim();
  if (env.APP_ENV === 'production' || env.NODE_ENV === 'production') return '127.0.0.1';
  return '0.0.0.0';
}

export function hasServiceRoleKey(): boolean {
  return Boolean(env.SUPABASE_SERVICE_ROLE_KEY) && !looksLikePlaceholder(env.SUPABASE_SERVICE_ROLE_KEY);
}

export function hasResendKey(): boolean {
  return Boolean(env.RESEND_API_KEY) && !looksLikePlaceholder(env.RESEND_API_KEY);
}

export function hasStripeKey(): boolean {
  return Boolean(env.STRIPE_SECRET_KEY) && !looksLikePlaceholder(env.STRIPE_SECRET_KEY);
}
