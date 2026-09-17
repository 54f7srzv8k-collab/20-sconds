/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_CHECKOUT_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
