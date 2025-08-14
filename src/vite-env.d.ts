/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_LMSTUDIO_URL: string
  readonly VITE_OPENROUTER_API_KEY: string
  readonly VITE_OPENROUTER_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}