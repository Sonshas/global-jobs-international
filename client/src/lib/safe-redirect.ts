/** Shared redirect helper (kept outside RouteGuards to satisfy react-refresh). */
export function safeRedirect(path: string | null | undefined, fallback = '/dashboard') {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return fallback;
  return path;
}
