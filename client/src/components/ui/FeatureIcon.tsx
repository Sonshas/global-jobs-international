type FeatureIconProps = {
  name: 'shield' | 'route' | 'globe' | 'spark';
  className?: string;
};

export function FeatureIcon({ name, className = 'h-6 w-6' }: FeatureIconProps) {
  switch (name) {
    case 'shield':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <path
            d="M12 3 5 6v6c0 4.5 2.9 7.8 7 9 4.1-1.2 7-4.5 7-9V6l-7-3Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="m9 12 2 2 4-4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'route':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <circle cx="6" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="18" cy="18" r="2.5" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M8.5 7.5c2 0 3.5.5 5 2.5s3 2.5 5 2.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'globe':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M4 12h16M12 4c2.5 2.8 2.5 13.2 0 16M12 4c-2.5 2.8-2.5 13.2 0 16"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'spark':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <path
            d="M12 3v4M12 17v4M3 12h4M17 12h4M6.2 6.2l2.8 2.8M15 15l2.8 2.8M17.8 6.2 15 9M9 15l-2.8 2.8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
  }
}
