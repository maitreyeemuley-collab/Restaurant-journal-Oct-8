/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Leave unset to run on the local (localStorage) demo back end. */
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
