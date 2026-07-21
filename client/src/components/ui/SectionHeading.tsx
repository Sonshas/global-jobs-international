type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  id?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  id,
}: SectionHeadingProps) {
  const alignment = align === 'center' ? 'mx-auto text-center' : 'text-left';

  return (
    <div className={`mb-10 max-w-2xl ${alignment}`}>
      {eyebrow ? (
        <p className="mb-3 text-sm font-semibold tracking-wide text-brand uppercase dark:text-brand-light">
          {eyebrow}
        </p>
      ) : null}
      <h2
        id={id}
        className="font-heading text-3xl font-bold text-balance text-ink sm:text-4xl dark:text-ink-dark"
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base text-ink-muted sm:text-lg dark:text-ink-muted-dark">
          {description}
        </p>
      ) : null}
    </div>
  );
}
