import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProviders } from '@/app/providers';
import { App } from '@/app/App';
import { validateClientEnv } from '@/lib/env';
import '@/i18n';
import './index.css';

function renderBootFailure(error: unknown) {
  const root = document.getElementById('root');
  if (!root) return;

  const message = error instanceof Error ? error.message : String(error);
  root.innerHTML = `
    <main style="font-family:system-ui,sans-serif;max-width:42rem;margin:4rem auto;padding:0 1.25rem;line-height:1.5;color:#111">
      <h1 style="font-size:1.5rem;margin:0 0 0.75rem">Global Jobs International failed to start</h1>
      <p style="margin:0 0 1rem;color:#444">
        The production client was built without required environment variables, or configuration is invalid.
        Rebuild with a real <code>client/.env.production</code> and redeploy <code>client/dist</code>.
      </p>
      <pre style="white-space:pre-wrap;background:#f4f4f5;padding:1rem;border-radius:0.5rem;font-size:0.875rem">${message
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')}</pre>
    </main>
  `;
}

try {
  validateClientEnv();

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AppProviders>
        <App />
      </AppProviders>
    </StrictMode>,
  );
} catch (error) {
  console.error(error);
  renderBootFailure(error);
}
