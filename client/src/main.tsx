import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProviders } from '@/app/providers';
import { App } from '@/app/App';
import { validateClientEnv } from '@/lib/env';
import '@/i18n';
import './index.css';

validateClientEnv();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
);
