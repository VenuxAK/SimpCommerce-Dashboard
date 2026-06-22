/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_STORE_SLUG?: string
  readonly VITE_APP_MODE?: 'system' | 'store' | 'pos'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
