import { useId, useState, type FormEvent } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { jobCategories, searchCountries } from '@/data/homepage';

export function JobSearchSection() {
  const formId = useId();
  const reduceMotion = useReducedMotion();
  const [country, setCountry] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <section
      id="search"
      aria-labelledby="search-heading"
      className="relative z-20 bg-[var(--bg)] pt-4 pb-16 sm:pb-20"
    >
      <Container>
        <h2 id="search-heading" className="sr-only">
          Search international job opportunities
        </h2>

        <motion.form
          onSubmit={onSubmit}
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="-mt-10 grid gap-4 rounded-3xl border border-border/70 bg-white p-5 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.35)] sm:p-6 md:-mt-14 md:grid-cols-[1.1fr_1.3fr_1.1fr_auto] md:items-end dark:border-border-dark dark:bg-surface-elevated-dark dark:shadow-[0_24px_60px_-28px_rgba(0,0,0,0.65)]"
          aria-describedby={submitted ? `${formId}-result` : undefined}
        >
          <div>
            <label
              htmlFor={`${formId}-country`}
              className="mb-1.5 block text-xs font-semibold tracking-wide text-ink-muted uppercase dark:text-ink-muted-dark"
            >
              Country
            </label>
            <select
              id={`${formId}-country`}
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              className="h-12 w-full rounded-2xl border border-border bg-[var(--bg)] px-4 text-sm font-medium outline-none transition focus:border-brand dark:border-border-dark"
            >
              <option value="">All countries</option>
              {searchCountries.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor={`${formId}-title`}
              className="mb-1.5 block text-xs font-semibold tracking-wide text-ink-muted uppercase dark:text-ink-muted-dark"
            >
              Job Title
            </label>
            <input
              id={`${formId}-title`}
              type="search"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Nurse, Engineer"
              className="h-12 w-full rounded-2xl border border-border bg-[var(--bg)] px-4 text-sm font-medium outline-none transition focus:border-brand dark:border-border-dark"
            />
          </div>

          <div>
            <label
              htmlFor={`${formId}-category`}
              className="mb-1.5 block text-xs font-semibold tracking-wide text-ink-muted uppercase dark:text-ink-muted-dark"
            >
              Category
            </label>
            <select
              id={`${formId}-category`}
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-12 w-full rounded-2xl border border-border bg-[var(--bg)] px-4 text-sm font-medium outline-none transition focus:border-brand dark:border-border-dark"
            >
              <option value="">All categories</option>
              {jobCategories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" className="h-12 min-w-[8.5rem] rounded-2xl px-6" size="md">
            Search
          </Button>

          {submitted ? (
            <p
              id={`${formId}-result`}
              className="md:col-span-4 text-sm text-ink-muted dark:text-ink-muted-dark"
              role="status"
            >
              Showing placeholder results
              {title ? ` for “${title}”` : ''}
              {country ? ` in ${country}` : ''}
              {category ? ` · ${category}` : ''}.
            </p>
          ) : null}
        </motion.form>
      </Container>
    </section>
  );
}
