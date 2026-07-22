import { useId, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import {
  searchCategories,
  searchCountryNames,
  searchExperienceLevels,
} from '@/data/jobs-catalog';

export function JobSearchSection() {
  const { t } = useTranslation();
  const formId = useId();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [country, setCountry] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [experience, setExperience] = useState('');
  const [salaryMin, setSalaryMin] = useState('');

  const countries = useMemo(() => [...searchCountryNames].sort(), []);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (country) params.set('country', country);
    if (title.trim()) params.set('q', title.trim());
    if (category) params.set('category', category);
    if (experience) params.set('experience', experience);
    if (salaryMin) params.set('salaryMin', salaryMin);
    navigate(`/jobs?${params.toString()}`);
  };

  return (
    <section
      id="search"
      aria-labelledby="search-heading"
      className="relative z-20 bg-[var(--bg)] pt-4 pb-16 sm:pb-20"
    >
      <Container>
        <h2 id="search-heading" className="sr-only">
          {t('home.searchSrOnly')}
        </h2>

        <motion.form
          onSubmit={onSubmit}
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="-mt-10 grid gap-4 rounded-3xl border border-border/60 bg-white/85 p-5 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.35)] backdrop-blur-xl sm:p-6 md:-mt-14 md:grid-cols-2 xl:grid-cols-[1.2fr_1fr_1fr_1fr_1fr_auto] xl:items-end dark:border-border-dark dark:bg-slate-900/70"
        >
          <div className="md:col-span-2 xl:col-span-1">
            <label
              htmlFor={`${formId}-title`}
              className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-600 uppercase dark:text-slate-300"
            >
              {t('home.searchJobLabel')}
            </label>
            <input
              id={`${formId}-title`}
              type="search"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t('home.searchJobPlaceholder')}
              className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-brand dark:border-slate-600 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor={`${formId}-country`}
              className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-600 uppercase dark:text-slate-300"
            >
              {t('common.country')}
            </label>
            <select
              id={`${formId}-country`}
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-brand dark:border-slate-600 dark:bg-slate-950 dark:text-white"
            >
              <option value="">{t('countries.allCountries')}</option>
              {countries.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor={`${formId}-category`}
              className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-600 uppercase dark:text-slate-300"
            >
              {t('home.jobCategory')}
            </label>
            <select
              id={`${formId}-category`}
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-brand dark:border-slate-600 dark:bg-slate-950 dark:text-white"
            >
              <option value="">{t('home.allJobs')}</option>
              {searchCategories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor={`${formId}-salary`}
              className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-600 uppercase dark:text-slate-300"
            >
              {t('home.minSalary')}
            </label>
            <select
              id={`${formId}-salary`}
              value={salaryMin}
              onChange={(event) => setSalaryMin(event.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-brand dark:border-slate-600 dark:bg-slate-950 dark:text-white"
            >
              <option value="">{t('home.any')}</option>
              <option value="2000">2,000+</option>
              <option value="3000">3,000+</option>
              <option value="4000">4,000+</option>
              <option value="5000">5,000+</option>
            </select>
          </div>

          <div>
            <label
              htmlFor={`${formId}-experience`}
              className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-600 uppercase dark:text-slate-300"
            >
              {t('jobs.experience')}
            </label>
            <select
              id={`${formId}-experience`}
              value={experience}
              onChange={(event) => setExperience(event.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-brand dark:border-slate-600 dark:bg-slate-950 dark:text-white"
            >
              <option value="">{t('home.any')}</option>
              {searchExperienceLevels.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" className="h-12 min-w-[8.5rem] rounded-2xl px-6" size="md">
            {t('common.search')}
          </Button>
        </motion.form>
      </Container>
    </section>
  );
}
