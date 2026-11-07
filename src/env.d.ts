/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL?: string;
  readonly PUBLIC_SUPABASE_ANON_KEY?: string;
  /** R2 bucket’ning ommaviy manzili, masalan https://media.dilrabo.uz yoki https://pub-xxxx.r2.dev */
  readonly PUBLIC_R2_PUBLIC_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  __siteReady?: boolean;
}
