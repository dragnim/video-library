/// <reference types="svelte" />
/// <reference types="vite/client" />

// Only variables declared below are valid, others throw errors.
interface ViteTypeOptions {
  strictImportMetaEnv: unknown;
}

// The variables defined in .env / .env.production. Read only by src/lib/env.ts.
interface ImportMetaEnv {
  readonly VITE_API_VIDEOS: string;
  readonly VITE_API_EVENTS: string;
  readonly VITE_API_PRESENTERS: string;
  readonly VITE_BASENAME: string;
  readonly VITE_ASSETS_PREFIX: string;
}

// Injected by Vite's `define` at build time (see vite.config.ts).
declare const __APP_VERSION__: string;

interface Window {
  DyalogVideoLibrary: { version: string };

  // Set by dist/config.js. Left `unknown` because src/lib/config.ts parses it.
  DYALOG_VIDEO_CONFIG?: unknown;
}
