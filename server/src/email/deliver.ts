import { env } from '../config/env.js';
import type { LifecycleEmailTemplateId, RenderedEmail } from './templates.js';

export async function deliverEmail(input: {
  to: string;
  rendered: RenderedEmail;
}): Promise<{ delivered: boolean; provider: string; detail?: string }> {
  const from = env.EMAIL_FROM || 'Global Jobs International <noreply@globaljobs.international>';

  if (env.RESEND_API_KEY) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.rendered.subject,
        html: input.rendered.html,
        text: input.rendered.text,
      }),
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Email provider error: ${detail}`);
    }
    return { delivered: true, provider: 'resend' };
  }

  if (env.NODE_ENV === 'production' || env.APP_ENV === 'production') {
    throw new Error('RESEND_API_KEY is required in production to send email');
  }

  console.info('[email:dev]', input.rendered.subject, '→', input.to);
  return { delivered: false, provider: 'log', detail: 'RESEND_API_KEY not set; logged only' };
}

export type { LifecycleEmailTemplateId, RenderedEmail };
