import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

type HealthResponse = {
  status: string;
  appEnv: string;
  timestamp: string;
  checks: Record<string, boolean>;
};

function apiBase(): string | null {
  const raw = import.meta.env.VITE_API_URL as string | undefined;
  return raw ? raw.replace(/\/$/, '') : null;
}

async function fetchHealth(): Promise<HealthResponse | null> {
  const base = apiBase();
  if (!base) return null;
  const response = await fetch(`${base}/health`);
  if (!response.ok) return null;
  return (await response.json()) as HealthResponse;
}

const CHECK_LABELS: Record<string, string> = {
  clientOriginConfigured: 'Client origin',
  supabaseAnonConfigured: 'Supabase (anon)',
  serviceRoleConfigured: 'Supabase (service role)',
  resendConfigured: 'Resend email',
  stripeConfigured: 'Stripe',
  publicAppUrlConfigured: 'Public app URL',
};

/** Super Admin overview card — live `/api/health` status for operational visibility. */
export function SystemHealthCard() {
  const { t } = useTranslation();
  const { data: health, isLoading } = useQuery({
    queryKey: ['admin', 'system-health'],
    queryFn: fetchHealth,
    refetchInterval: 60_000,
  });

  return (
    <section className="rounded-3xl border border-border/70 bg-white/85 p-6 dark:border-border-dark dark:bg-slate-900/55">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold text-ink dark:text-ink-dark">
          {t('admin.systemHealth')}
        </h2>
        {health ? (
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              health.status === 'ok'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
            }`}
          >
            {health.status === 'ok' ? t('admin.healthy') : t('admin.degraded')}
          </span>
        ) : !isLoading ? (
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800 dark:bg-red-500/20 dark:text-red-300">
            {t('admin.unreachable')}
          </span>
        ) : null}
      </div>
      {health ? (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(health.checks).map(([key, value]) => (
            <li
              key={key}
              className="flex items-center justify-between gap-2 rounded-xl border border-border/50 px-3 py-2 text-sm dark:border-border-dark"
            >
              <span className="text-ink-muted dark:text-ink-muted-dark">{CHECK_LABELS[key] ?? key}</span>
              <span className={value ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                {value ? '✔' : '✕'}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-ink-muted dark:text-ink-muted-dark">
          {isLoading ? t('common.loading') : 'API is not reachable.'}
        </p>
      )}
    </section>
  );
}
