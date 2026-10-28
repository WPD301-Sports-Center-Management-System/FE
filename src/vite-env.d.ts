/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_APP_NAME: string
  readonly VITE_BANK_BIN?: string
  readonly VITE_BANK_NAME?: string
  readonly VITE_BANK_ACCOUNT_NO?: string
  readonly VITE_BANK_ACCOUNT_NAME?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
