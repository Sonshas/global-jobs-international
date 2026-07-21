import 'dotenv/config';
import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`[server] Global Jobs International API listening on port ${env.PORT}`);
  console.log(`[server] Environment: ${env.NODE_ENV}`);
});
