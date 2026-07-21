import { motion, useReducedMotion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { stats } from '@/data/homepage';

export function StatsSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="employers"
      aria-labelledby="stats-heading"
      className="relative z-10 -mt-4 border-y border-border/80 bg-white/90 backdrop-blur-md dark:border-border-dark dark:bg-surface-elevated-dark/90"
    >
      <Container className="py-12 sm:py-14">
        <h2 id="stats-heading" className="sr-only">
          Platform statistics
        </h2>
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.id}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              className="text-center"
            >
              <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              <p className="mt-2 text-sm font-medium tracking-wide text-ink-muted uppercase dark:text-ink-muted-dark">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
