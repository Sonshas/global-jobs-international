import { motion, useReducedMotion } from 'framer-motion';

const particles = [
  { left: '8%', top: '18%', size: 3, delay: 0 },
  { left: '18%', top: '62%', size: 2, delay: 1.2 },
  { left: '28%', top: '28%', size: 4, delay: 0.4 },
  { left: '42%', top: '72%', size: 2, delay: 2.1 },
  { left: '55%', top: '22%', size: 3, delay: 0.8 },
  { left: '68%', top: '48%', size: 2, delay: 1.6 },
  { left: '78%', top: '16%', size: 4, delay: 0.2 },
  { left: '88%', top: '58%', size: 3, delay: 1.9 },
  { left: '12%', top: '44%', size: 2, delay: 2.4 },
  { left: '92%', top: '34%', size: 3, delay: 0.6 },
];

/** Aurora lighting, drifting clouds, glowing particles, and a slow rotating globe. */
export function HeroAtmosphere() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Aurora lighting */}
      <div className="hero-aurora absolute inset-0 opacity-80 dark:opacity-90" />

      {/* Stars */}
      <div className="absolute inset-0 opacity-70 dark:opacity-90">
        {Array.from({ length: 28 }).map((_, index) => (
          <span
            key={index}
            className={`absolute rounded-full bg-white/80 shadow-[0_0_6px_rgba(255,255,255,0.8)] ${
              reduceMotion ? '' : 'hero-star-twinkle'
            }`}
            style={{
              left: `${(index * 37) % 100}%`,
              top: `${(index * 53) % 70}%`,
              width: index % 4 === 0 ? 3 : 2,
              height: index % 4 === 0 ? 3 : 2,
              animationDelay: `${(index % 7) * 0.4}s`,
            }}
          />
        ))}
      </div>

      {/* Floating destination flags */}
      {[
        { code: 'us', left: '12%', top: '22%' },
        { code: 'ca', left: '22%', top: '18%' },
        { code: 'gb', left: '46%', top: '20%' },
        { code: 'de', left: '52%', top: '28%' },
        { code: 'ae', left: '62%', top: '36%' },
        { code: 'au', left: '78%', top: '58%' },
      ].map((flag, index) => (
        <motion.img
          key={flag.code}
          src={`https://flagcdn.com/w40/${flag.code}.png`}
          alt=""
          width={28}
          height={20}
          className="absolute rounded-[3px] shadow-lg ring-1 ring-white/40"
          style={{ left: flag.left, top: flag.top }}
          animate={
            reduceMotion
              ? undefined
              : { y: [0, -8, 0], opacity: [0.55, 1, 0.55] }
          }
          transition={{ duration: 5 + index, repeat: Infinity, ease: 'easeInOut', delay: index * 0.3 }}
        />
      ))}

      {/* Soft clouds */}
      <div
        className={`hero-cloud absolute top-[12%] left-[-10%] h-40 w-[38%] rounded-full bg-white/35 blur-3xl dark:bg-blue-200/10 ${
          reduceMotion ? '' : 'hero-cloud-drift-a'
        }`}
      />
      <div
        className={`hero-cloud absolute top-[48%] right-[-8%] h-48 w-[42%] rounded-full bg-slate-100/40 blur-3xl dark:bg-sky-300/10 ${
          reduceMotion ? '' : 'hero-cloud-drift-b'
        }`}
      />
      <div
        className={`hero-cloud absolute bottom-[8%] left-[20%] h-32 w-[30%] rounded-full bg-white/25 blur-3xl dark:bg-indigo-200/10 ${
          reduceMotion ? '' : 'hero-cloud-drift-c'
        }`}
      />

      {/* Rotating globe */}
      <div className="absolute top-1/2 right-[-6%] hidden h-[min(34rem,70vh)] w-[min(34rem,70vh)] -translate-y-1/2 lg:block xl:right-[2%]">
        <div
          className={`hero-globe relative h-full w-full rounded-full ${
            reduceMotion ? '' : 'hero-globe-spin'
          }`}
        >
          <div className="hero-globe-sphere absolute inset-0 rounded-full" />
          <div className="hero-globe-grid absolute inset-[6%] rounded-full opacity-60" />
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_28%_28%,rgba(255,255,255,0.35),transparent_42%)]" />
          <div className="absolute inset-0 rounded-full shadow-[inset_-28px_-18px_50px_rgba(15,23,42,0.35)]" />
        </div>
        {!reduceMotion ? (
          <motion.div
            className="absolute inset-[-6%] rounded-full border border-brand/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 48, repeat: Infinity, ease: 'linear' }}
          />
        ) : (
          <div className="absolute inset-[-6%] rounded-full border border-brand/20" />
        )}
      </div>

      {/* Glowing particles */}
      {particles.map((particle) =>
        reduceMotion ? (
          <span
            key={`${particle.left}-${particle.top}`}
            className="absolute rounded-full bg-brand/40 dark:bg-brand-light/50"
            style={{
              left: particle.left,
              top: particle.top,
              width: particle.size,
              height: particle.size,
            }}
          />
        ) : (
          <motion.span
            key={`${particle.left}-${particle.top}`}
            className="absolute rounded-full bg-accent/80 shadow-[0_0_12px_rgba(244,180,0,0.65)] dark:bg-brand-light"
            style={{
              left: particle.left,
              top: particle.top,
              width: particle.size,
              height: particle.size,
            }}
            animate={{ opacity: [0.2, 0.9, 0.2], y: [0, -10, 0], scale: [1, 1.35, 1] }}
            transition={{
              duration: 4.8,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: particle.delay,
            }}
          />
        ),
      )}
    </div>
  );
}
