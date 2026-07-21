import { FlightPaths } from '@/components/home/FlightPaths';

/** Subtle equirectangular-style world map for the hero. */
export function WorldMapBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,_rgba(0,82,204,0.14),_transparent_50%),radial-gradient(ellipse_at_75%_60%,_rgba(244,180,0,0.08),_transparent_45%),linear-gradient(180deg,_rgba(248,250,252,0.35)_0%,_rgba(248,250,252,0.94)_82%)] dark:bg-[radial-gradient(ellipse_at_30%_20%,_rgba(26,107,255,0.2),_transparent_50%),radial-gradient(ellipse_at_75%_60%,_rgba(244,180,0,0.08),_transparent_45%),linear-gradient(180deg,_rgba(15,23,42,0.45)_0%,_rgba(15,23,42,0.96)_84%)]" />

      <div className="map-grid absolute inset-0 opacity-[0.35] dark:opacity-[0.22]" />

      <svg
        className="absolute inset-0 h-full w-full text-brand/25 dark:text-brand-light/22"
        viewBox="0 0 1000 500"
        preserveAspectRatio="xMidYMid slice"
      >
        <g fill="currentColor" fillOpacity="0.9" stroke="currentColor" strokeWidth="0.6" strokeOpacity="0.45">
          {/* North America */}
          <path d="M95 120c35-42 95-58 155-42 42 11 78 8 112-10 28-15 58-12 78 8 18 18 42 28 68 22l18 34c-28 18-58 14-88 2-36-14-72-8-104 14-40 28-88 34-136 18-34-11-68-4-98 18-16 12-36 10-52-4-22-20-18-46 5-60 16-10 22-28 24-48z" />
          {/* South America */}
          <path d="M268 268c28-8 52 4 68 26 14 20 34 30 56 28 8 22-2 44-22 56-24 14-46 8-66-6-22-16-44-14-66 2-14 10-30 8-40-6-14-20-8-44 12-56 18-10 24-28 58-44z" />
          {/* Europe */}
          <path d="M470 118c28-16 62-14 88 4 18 12 40 14 58 4 14 18 8 40-10 52-24 16-50 12-74 2-28-12-56-8-80 8-12 8-28 6-38-6-14-16-10-38 8-48 14-8 22-18 48-16z" />
          {/* Africa */}
          <path d="M500 198c34-10 68-2 92 22 20 20 48 28 74 18 10 28-4 56-30 70-36 20-78 18-116 4-32-12-64-6-92 14-14 10-32 8-44-6-18-22-12-52 12-68 22-14 28-36 104-54z" />
          {/* Middle East / Asia */}
          <path d="M590 150c48-18 104-14 150 12 40 22 86 28 128 10 28-12 56-6 74 16 16 20 10 46-12 60-34 22-74 16-110 2-48-18-96-10-140 16-28 16-62 18-94 4-30-14-46-40-36-70 8-22 12-40 40-50z" />
          {/* Oceania */}
          <path d="M780 330c36-14 78-8 108 18 22 18 50 22 76 10 12 20 4 42-14 54-28 18-62 14-92 2-34-14-70-8-100 12-12 8-28 6-38-6-14-18-8-40 10-50 18-10 22-28 50-40z" />
        </g>
      </svg>

      <FlightPaths />
    </div>
  );
}
