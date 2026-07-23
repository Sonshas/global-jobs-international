/**
 * PM2 production process definition.
 * The API loads server/.env itself; keep that file mode 600 and never commit it.
 * Do not put secrets in `env` below.
 */
module.exports = {
  apps: [
    {
      name: 'gji-api',
      cwd: '/var/www/global-jobs-international',
      script: 'server/dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '512M',
      autorestart: true,
      watch: false,
      time: true,
      env: {
        NODE_ENV: 'production',
        // API is proxied by Nginx; keep it on loopback only.
        HOST: '127.0.0.1',
        PORT: 3001,
      },
    },
  ],
};
