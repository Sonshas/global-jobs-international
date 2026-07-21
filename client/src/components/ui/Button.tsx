import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

type SharedProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

type ButtonAsButton = SharedProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> & {
    href?: undefined;
  };

type ButtonAsLink = SharedProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children' | 'className' | 'href'> & {
    href: string;
  };

type ButtonProps = ButtonAsButton | ButtonAsLink;

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-brand text-white hover:bg-brand-dark shadow-sm shadow-brand/25 focus-visible:ring-brand',
  secondary:
    'bg-white text-ink border border-border hover:bg-slate-50 dark:bg-surface-elevated-dark dark:text-ink-dark dark:border-border-dark dark:hover:bg-slate-700',
  ghost:
    'bg-transparent text-ink hover:bg-slate-100 dark:text-ink-dark dark:hover:bg-slate-800',
  accent: 'bg-accent text-ink hover:bg-accent-dark shadow-sm shadow-accent/30',
  outline:
    'bg-transparent text-brand border border-brand/40 hover:bg-brand/5 dark:text-brand-light dark:border-brand-light/40',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

function isInternalPath(href: string) {
  return href.startsWith('/') && !href.startsWith('//');
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonProps) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  if ('href' in props && props.href) {
    const { href, ...anchorProps } = props;
    if (isInternalPath(href)) {
      return (
        <Link to={href} className={classes} {...anchorProps}>
          {children}
        </Link>
      );
    }
    return (
      <a href={href} className={classes} {...anchorProps}>
        {children}
      </a>
    );
  }

  const buttonProps = props as ButtonAsButton;
  return (
    <button type={buttonProps.type ?? 'button'} className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
