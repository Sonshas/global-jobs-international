import { motion, useReducedMotion } from 'framer-motion';
import { flightRoutes, mapLocations } from '@/data/homepage';

export function FlightPaths() {
  const reduceMotion = useReducedMotion();

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1000 500"
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="routeGlow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0052CC" stopOpacity="0.15" />
          <stop offset="50%" stopColor="#0052CC" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#F4B400" stopOpacity="0.35" />
        </linearGradient>
        <filter id="markerGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {flightRoutes.map((route) => (
        <g key={route.id}>
          <path
            d={route.d}
            stroke="url(#routeGlow)"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeDasharray="5 9"
            className="opacity-80 dark:opacity-70"
          />
          {!reduceMotion ? (
            <motion.circle
              r="3.5"
              fill="#F4B400"
              filter="url(#markerGlow)"
              initial={false}
              animate={{ offsetDistance: ['0%', '100%'] }}
              transition={{
                duration: 6.5,
                repeat: Infinity,
                ease: 'linear',
                delay: route.delay,
              }}
              style={{
                offsetPath: `path('${route.d}')`,
                offsetRotate: '0deg',
              }}
            />
          ) : null}
        </g>
      ))}

      {mapLocations.map((location, index) => (
        <g key={location.id} transform={`translate(${location.x} ${location.y})`}>
          {!reduceMotion ? (
            <motion.circle
              r="10"
              fill="#0052CC"
              initial={{ opacity: 0.15, scale: 0.6 }}
              animate={{ opacity: [0.2, 0, 0.2], scale: [0.7, 1.6, 0.7] }}
              transition={{
                duration: 2.8,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: index * 0.18,
              }}
            />
          ) : null}
          <circle r="5.5" fill="#0052CC" filter="url(#markerGlow)" className="dark:fill-brand-light" />
          <circle r="2.2" fill="#F4B400" />
        </g>
      ))}
    </svg>
  );
}
