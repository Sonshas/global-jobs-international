/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_PUBLIC_SITE_URL?: string;
  readonly VITE_APP_ENV?: string;
  readonly VITE_STRICT_RBAC?: string;
  readonly VITE_ALLOW_DEMO_ADMIN?: string;
  readonly VITE_ALLOW_SAMPLE_CATALOG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
