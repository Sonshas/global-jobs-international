type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  id?: string;
  tone?: 'default' | 'inverse';
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  id,
  tone = 'default',
}: SectionHeadingProps) {
  const alignment = align === 'center' ? 'mx-auto text-center' : 'text-left';
  const inverse = tone === 'inverse';

  return (
    <div className={`mb-10 max-w-2xl ${alignment}`}>
      {eyebrow ? (
        <p
          className={`mb-3 text-sm font-semibold tracking-wide uppercase ${
            inverse ? 'text-accent' : 'text-brand dark:text-brand-light'
          }`}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        id={id}
        className={`font-heading text-3xl font-bold text-balance sm:text-4xl ${
          inverse ? 'text-white' : 'text-ink dark:text-ink-dark'
        }`}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={`mt-4 text-base sm:text-lg ${
            inverse ? 'text-slate-300' : 'text-ink-muted dark:text-ink-muted-dark'
          }`}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
