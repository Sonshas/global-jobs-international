/**
 * Controls whether the generated sample job catalog (`@/data/jobs-catalog`) is
 * allowed to appear alongside real database-backed data.
 *
 * Production builds must be DB-only unless an operator explicitly opts back
 * into sample data (e.g. for a staging demo) via `VITE_ALLOW_SAMPLE_CATALOG`.
 */
export function allowSampleCatalog(): boolean {
  if (import.meta.env.DEV) return true;
  return import.meta.env.VITE_ALLOW_SAMPLE_CATALOG === 'true';
}
