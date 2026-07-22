import { createApp } from './app.js';
import { env, hasResendKey, hasServiceRoleKey } from './config/env.js';

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`[server] Global Jobs International API listening on port ${env.PORT}`);
  console.log(`[server] APP_ENV=${env.APP_ENV} NODE_ENV=${env.NODE_ENV}`);
  console.log(
    `[server] Supabase anon configured · service_role=${hasServiceRoleKey() ? 'yes' : 'no (optional in development)'} · resend=${hasResendKey() ? 'yes' : 'no (log mode)'}`,
  );
});
