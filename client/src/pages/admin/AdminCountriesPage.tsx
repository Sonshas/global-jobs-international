import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Button } from '@/components/ui/Button';
import { listAllCountries, setCountryActive, setCountryFeatured } from '@/repositories/countries.repository';

export function AdminCountriesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: countries = [], isLoading } = useQuery({
    queryKey: ['admin', 'countries'],
    queryFn: () => listAllCountries(),
  });
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = () => void queryClient.invalidateQueries({ queryKey: ['admin', 'countries'] });

  const toggleActive = async (id: string, next: boolean) => {
    setBusyId(id);
    try {
      await setCountryActive(id, next);
      refresh();
    } finally {
      setBusyId(null);
    }
  };

  const toggleFeatured = async (id: string, next: boolean) => {
    setBusyId(id);
    try {
      await setCountryFeatured(id, next);
      refresh();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <DashboardShell title={t('admin.countriesTitle')} adminLink>
      <h1 className="font-heading text-3xl font-bold text-ink dark:text-ink-dark">{t('admin.countriesTitle')}</h1>
      <p className="mt-2 text-sm text-ink-muted dark:text-ink-muted-dark">{t('admin.countriesDesc')}</p>

      {isLoading ? (
        <p className="mt-8 text-sm text-ink-muted">{t('common.loading')}</p>
      ) : (
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {countries.map((country) => (
            <li
              key={country.id}
              className="rounded-2xl border border-border/70 p-4 dark:border-border-dark"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-ink dark:text-ink-dark">{country.name}</p>
                <span className="text-xs font-bold tracking-wide text-ink-muted uppercase">{country.isoCode}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={country.isActive ? 'secondary' : 'outline'}
                  disabled={busyId === country.id}
                  onClick={() => void toggleActive(country.id, !country.isActive)}
                >
                  {country.isActive ? t('admin.deactivate') : t('admin.activate')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={country.isFeatured ? 'secondary' : 'outline'}
                  disabled={busyId === country.id}
                  onClick={() => void toggleFeatured(country.id, !country.isFeatured)}
                >
                  {country.isFeatured ? t('admin.unfeature') : t('admin.feature')}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardShell>
  );
}
