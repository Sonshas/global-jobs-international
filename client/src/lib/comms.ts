import { supabase } from '@/lib/supabase';
import type { EmailTemplateId } from '@/data/email-automation';
import { insertNotification } from '@/repositories/notifications.repository';

function apiBase(): string | null {
  const raw = import.meta.env.VITE_API_URL as string | undefined;
  if (!raw) return null;
  return raw.replace(/\/$/, '');
}

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export async function dispatchNotification(input: {
  userId: string;
  title: string;
  body: string;
  href?: string;
  eventType?: string;
  entityId?: string;
}): Promise<void> {
  const base = apiBase();
  if (base) {
    try {
      const headers = await authHeader();
      const response = await fetch(`${base}/comms/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(input),
      });
      if (response.ok) return;
    } catch {
      // fall through
    }
  }
  await insertNotification(input);
}

export async function dispatchLifecycleEmail(input: {
  to: string;
  userId?: string;
  template: EmailTemplateId;
  variables?: Record<string, string>;
}): Promise<void> {
  const base = apiBase();
  if (!base) return;
  try {
    const headers = await authHeader();
    await fetch(`${base}/comms/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(input),
    });
  } catch {
    // best-effort
  }
}
