export function getAuthErrorMessage(error: unknown): string {
  if (!error) return 'Something went wrong. Please try again.';

  const message =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message: string }).message)
      : error instanceof Error
        ? error.message
        : 'Something went wrong. Please try again.';

  const normalized = message.toLowerCase();

  if (normalized.includes('invalid login credentials')) {
    return 'Invalid email or password.';
  }
  if (normalized.includes('email not confirmed')) {
    return 'Please verify your email before signing in.';
  }
  if (normalized.includes('user already registered')) {
    return 'An account with this email already exists. Try signing in.';
  }
  if (normalized.includes('password should be at least')) {
    return 'Password must be at least 6 characters.';
  }
  if (normalized.includes('email rate limit') || normalized.includes('over_email_send_rate_limit')) {
    return 'Email sending is temporarily rate-limited by Supabase. Wait a few minutes and try again.';
  }
  if (normalized.includes('rate limit') || normalized.includes('too many requests')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (normalized.includes('failed to fetch') || normalized.includes('network')) {
    return 'Unable to reach Supabase. Check your connection and environment variables.';
  }
  if (normalized.includes('placeholder') || normalized.includes('invalid api key')) {
    return 'Supabase is not configured. Add your project URL and anon key to client/.env.';
  }
  if (normalized.includes('pkce') || normalized.includes('code verifier')) {
    return 'Email confirmed. Please sign in on this device to continue.';
  }

  return message;
}
