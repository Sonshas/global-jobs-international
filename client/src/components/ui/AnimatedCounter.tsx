import { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';

type AnimatedCounterProps = {
  value: number;
  suffix?: string;
  duration?: number;
};

export function AnimatedCounter({ value, suffix = '', duration = 1.6 }: AnimatedCounterProps) {
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
      className="font-heading text-4xl font-bold tracking-tight text-ink tabular-nums sm:text-5xl dark:text-ink-dark"
    >
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}
