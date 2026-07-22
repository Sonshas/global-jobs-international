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

const envSchema = z
  .object({
    PORT: z.coerce.number().int().positive().default(3001),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
    CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
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
    console.error('      → Exact browser origin of the SPA (e.g. http://localhost:5173)');
    console.error('════════════════════════════════════════════════════════════');
    console.error('');
    process.exit(1);
  }

  return parsed.data;
}

export const env = loadServerEnv();

export function hasServiceRoleKey(): boolean {
  return Boolean(env.SUPABASE_SERVICE_ROLE_KEY) && !looksLikePlaceholder(env.SUPABASE_SERVICE_ROLE_KEY);
}

export function hasResendKey(): boolean {
  return Boolean(env.RESEND_API_KEY) && !looksLikePlaceholder(env.RESEND_API_KEY);
}

export function hasStripeKey(): boolean {
  return Boolean(env.STRIPE_SECRET_KEY) && !looksLikePlaceholder(env.STRIPE_SECRET_KEY);
}
