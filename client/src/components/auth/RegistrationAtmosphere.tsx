import { motion, useReducedMotion } from 'framer-motion';

const routes = [
  'M180 160 C 320 90, 480 110, 640 170',
  'M220 280 C 400 240, 560 200, 760 250',
  'M140 240 C 300 320, 500 300, 700 280',
  'M280 140 C 460 180, 620 260, 800 320',
];

const markers = [
  { x: 210, y: 165 },
  { x: 390, y: 150 },
  { x: 520, y: 165 },
  { x: 630, y: 230 },
  { x: 720, y: 255 },
  { x: 780, y: 340 },
];

/** Full-bleed navy world-map atmosphere for premium auth surfaces. */
export function RegistrationAtmosphere() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[#020617]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_15%,rgba(0,82,204,0.45),transparent_50%),radial-gradient(ellipse_at_80%_10%,rgba(244,180,0,0.12),transparent_40%),radial-gradient(ellipse_at_70%_80%,rgba(26,107,255,0.22),transparent_45%)]" />

      <motion.div
        className="absolute -inset-[8%] opacity-70"
        animate={
          reduceMotion
            ? undefined
            : {
                x: [0, 18, -10, 0],
                y: [0, -12, 8, 0],
              }
        }
        transition={{ duration: 48, repeat: Infinity, ease: 'linear' }}
      >
        <svg
          className="h-full w-full text-blue-300/20"
          viewBox="0 0 1000 560"
          preserveAspectRatio="xMidYMid slice"
        >
          <g fill="currentColor" fillOpacity="0.55">
            <path d="M90 140c40-48 110-62 170-40 48 18 90 10 130-12 34-18 70-12 96 14 22 22 52 34 84 24l22 40c-34 20-70 14-106 0-42-16-84-8-122 18-46 32-100 38-156 18-40-14-80-4-114 22-18 14-42 12-60-4-26-24-20-56 8-72 18-10 24-32 28-58z" />
            <path d="M260 290c32-10 60 4 78 28 16 22 40 34 66 30 10 24-2 48-24 60-28 16-54 8-76-8-24-18-50-16-74 4-16 12-34 10-46-6-16-22-10-48 14-62 20-12 28-32 62-46z" />
            <path d="M470 130c34-18 74-16 104 6 22 16 48 18 70 4 16 20 8 44-12 56-28 18-58 12-86 0-32-14-64-8-92 12-14 10-32 8-44-6-16-18-12-42 8-52 16-8 26-20 52-20z" />
            <path d="M510 210c40-12 78 0 106 26 24 22 56 32 86 20 12 30-4 60-32 74-40 22-88 18-132 2-36-14-72-6-104 16-16 12-36 10-50-6-20-24-14-56 14-72 24-14 32-40 112-60z" />
            <path d="M600 160c52-20 112-14 160 16 42 26 92 32 138 10 30-14 60-6 78 18 18 22 10 50-14 64-36 24-80 16-120 0-52-20-104-10-152 18-30 18-68 20-102 4-32-16-50-44-38-74 8-24 14-44 50-56z" />
            <path d="M780 340c40-16 86-8 118 20 24 20 54 24 82 10 14 22 4 46-16 58-30 18-66 14-98 0-36-16-74-8-106 14-14 10-32 8-42-6-16-20-10-44 12-54 20-10 24-30 50-42z" />
          </g>

          {routes.map((d) => (
            <path
              key={d}
              d={d}
              fill="none"
              stroke="rgba(96,165,250,0.35)"
              strokeWidth="1.4"
              strokeDasharray="5 10"
            />
          ))}

          {markers.map((marker, index) => (
            <g key={`${marker.x}-${marker.y}`} transform={`translate(${marker.x} ${marker.y})`}>
              {!reduceMotion ? (
                <motion.circle
                  r="12"
                  fill="rgba(0,82,204,0.35)"
                  animate={{ opacity: [0.25, 0.05, 0.25], scale: [0.8, 1.5, 0.8] }}
                  transition={{ duration: 3.6, repeat: Infinity, delay: index * 0.35 }}
                />
              ) : null}
              <circle r="4.5" fill="#60A5FA" />
              <circle r="2" fill="#F4B400" />
            </g>
          ))}
        </svg>
      </motion.div>

      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-transparent to-slate-950/80" />
    </div>
  );
}
