import { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';

type AnimatedCounterProps = {
  value: number;
  suffix?: string;
  duration?: number;
  format?: 'standard' | 'compact';
};

function formatDisplay(value: number, format: 'standard' | 'compact') {
  if (format === 'compact') {
    if (value >= 1_000_000) {
      const millions = value / 1_000_000;
      return `${millions.toFixed(millions >= 10 ? 0 : 1).replace(/\.0$/, '')}M`;
    }
    if (value >= 1_000) {
      const thousands = value / 1_000;
      return `${thousands.toFixed(thousands >= 100 ? 0 : 1).replace(/\.0$/, '')}K`;
    }
  }
  return value.toLocaleString();
}

export function AnimatedCounter({
  value,
  suffix = '',
  duration = 1.6,
  format = 'standard',
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const reduceMotion = useReducedMotion();
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    if (!isInView || reduceMotion) return;

    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedValue(Math.round(value * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration, isInView, reduceMotion, value]);

  const display = reduceMotion ? (isInView ? value : 0) : animatedValue;

  return (
    <span
      ref={ref}
      className="font-heading text-3xl font-bold tracking-tight text-ink tabular-nums sm:text-4xl dark:text-ink-dark"
    >
      {formatDisplay(display, format)}
      {suffix}
    </span>
  );
}
