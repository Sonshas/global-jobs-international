import path from 'node:path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const REQUIRED_PRODUCTION_ENV = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_API_URL'] as const;

function isAbsoluteHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function resolvePublicSiteUrl(env: Record<string, string>): string | null {
  const explicit = env.VITE_PUBLIC_SITE_URL?.trim();
  if (explicit && isAbsoluteHttpUrl(explicit)) return explicit.replace(/\/$/, '');

  const api = env.VITE_API_URL?.trim();
  if (api && isAbsoluteHttpUrl(api)) {
    try {
      const parsed = new URL(api);
      return parsed.origin;
    } catch {
      return null;
    }
  }
  return null;
}

function assertProductionClientEnv(mode: string, env: Record<string, string>) {
  if (mode !== 'production') return;

  const missing: string[] = [];
  for (const key of REQUIRED_PRODUCTION_ENV) {
    const value = env[key]?.trim();
    if (!value) {
      missing.push(key);
      continue;
    }
    if (key === 'VITE_SUPABASE_URL' && value.includes('your-') && value.includes('project')) {
      missing.push(`${key} (still a placeholder)`);
    }
    if (key === 'VITE_SUPABASE_ANON_KEY' && /your-.*anon|your-supabase|placeholder/i.test(value)) {
      missing.push(`${key} (still a placeholder)`);
    }
    if (key === 'VITE_API_URL') {
      const okRelative = value.startsWith('/') && !value.startsWith('//');
      const okAbsolute = isAbsoluteHttpUrl(value);
      if (!okRelative && !okAbsolute) {
        missing.push(`${key} must be an absolute https URL or a same-origin path like /api`);
      }
      if (/api\.example\.com|https?:\/\/example\.com/i.test(value)) {
        missing.push(`${key} (still an example.com placeholder)`);
      }
      if (/localhost|127\.0\.0\.1/i.test(value)) {
        missing.push(`${key} must not point at localhost for a production build`);
      }
    }
  }

  const siteUrl = resolvePublicSiteUrl(env);
  if (!siteUrl) {
    missing.push(
      'VITE_PUBLIC_SITE_URL (required when VITE_API_URL is relative, e.g. https://globaljobsinternational.com)',
    );
  } else if (/example\.com/i.test(siteUrl) || /localhost|127\.0\.0\.1/i.test(siteUrl)) {
    missing.push('VITE_PUBLIC_SITE_URL must be the real public HTTPS origin');
  }

  const appEnv = env.VITE_APP_ENV?.trim().toLowerCase();
  if (appEnv && appEnv !== 'production') {
    missing.push(`VITE_APP_ENV must be "production" for production builds (got "${appEnv}")`);
  }

  if (env.VITE_ALLOW_DEMO_ADMIN === 'true') {
    missing.push('VITE_ALLOW_DEMO_ADMIN must be false/unset for production builds');
  }

  if (missing.length > 0) {
    throw new Error(
      [
        '[vite] Refusing to build a production client without real environment values.',
        'Create client/.env.production (see client/.env.production.example) with:',
        ...missing.map((item) => `  - ${item}`),
        '',
        'Vite inlines these at build time. Building without them causes a blank white page in the browser.',
      ].join('\n'),
    );
  }
}

/** Rewrite SEO files and OG tags to absolute production URLs at build time. */
function productionSeoPlugin(siteUrl: string | null): Plugin {
  return {
    name: 'gji-production-seo',
    apply: 'build',
    transformIndexHtml(html) {
      if (!siteUrl) return html;
      return html
        .replace(/property="og:url" content="\/"/g, `property="og:url" content="${siteUrl}/"`)
        .replace(
          /property="og:image" content="\/og-image\.svg"/g,
          `property="og:image" content="${siteUrl}/og-image.svg"`,
        )
        .replace(
          /name="twitter:image" content="\/og-image\.svg"/g,
          `name="twitter:image" content="${siteUrl}/og-image.svg"`,
        );
    },
    generateBundle(_options, bundle) {
      if (!siteUrl) return;
      for (const item of Object.values(bundle)) {
        if (item.type !== 'asset' || typeof item.source !== 'string') continue;
        if (item.fileName === 'sitemap.xml') {
          item.source = item.source.replace(/<loc>(\/[^<]*)<\/loc>/g, (_m, path: string) => {
            const normalized = path === '/' ? '/' : path;
            return `<loc>${siteUrl}${normalized === '/' ? '/' : normalized}</loc>`;
          });
        }
        if (item.fileName === 'robots.txt') {
          item.source = item.source.replace(/^Sitemap:\s*\/sitemap\.xml$/m, `Sitemap: ${siteUrl}/sitemap.xml`);
        }
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const envDir = path.resolve(__dirname);
  const env = loadEnv(mode, envDir, '');
  assertProductionClientEnv(mode, env);
  const siteUrl = mode === 'production' ? resolvePublicSiteUrl(env) : null;

  // Force-inline production client env so a missing/mis-read .env.production
  // cannot silently ship undefined import.meta.env.VITE_* values.
  const defineEnv: Record<string, string> = {};
  if (mode === 'production') {
    for (const key of [
      'VITE_APP_ENV',
      'VITE_API_URL',
      'VITE_PUBLIC_SITE_URL',
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'VITE_STRICT_RBAC',
      'VITE_ALLOW_DEMO_ADMIN',
      'VITE_ALLOW_SAMPLE_CATALOG',
    ] as const) {
      if (env[key] !== undefined) {
        defineEnv[`import.meta.env.${key}`] = JSON.stringify(env[key]);
      }
    }
    console.log(
      `[vite] production env loaded from ${envDir} · supabase=${env.VITE_SUPABASE_URL ? new URL(env.VITE_SUPABASE_URL).host : '(missing)'} · api=${env.VITE_API_URL || '(missing)'}`,
    );
  }

  return {
    base: '/',
    envDir,
    envPrefix: 'VITE_',
    define: defineEnv,
    plugins: [react(), tailwindcss(), productionSeoPlugin(siteUrl)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@gji/shared': path.resolve(__dirname, '../shared/src'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
    build: {
      sourcemap: false,
      assetsDir: 'assets',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'scheduler'],
            supabase: ['@supabase/supabase-js'],
            query: ['@tanstack/react-query'],
            motion: ['framer-motion'],
          },
        },
      },
    },
  };
});
