/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the ANIMUS API (defaults to the same-origin /api path). */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
