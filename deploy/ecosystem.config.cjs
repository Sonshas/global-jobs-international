/**
 * PM2 production process definition.
 * The API loads server/.env itself; keep that file mode 600 and never commit it.
 * PM2 does not load a dotenv file through this config, so do not put secrets in
 * `env` below. Use the host environment or /var/www/global-jobs-international/server/.env.
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
      },
    },
  ],
};
