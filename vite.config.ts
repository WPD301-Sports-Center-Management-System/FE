import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Local dev/preview forwards same-origin /api calls to this backend, so Render CORS does not apply.
  const apiProxy = {
    '/api': {
      target: env.VITE_PROXY_TARGET || 'https://wpd301-be.onrender.com',
      changeOrigin: true,
      secure: true,
      configure: (proxy: { on: (event: 'proxyReq', listener: (req: { removeHeader: (name: string) => void }) => void) => void }) => {
        proxy.on('proxyReq', req => req.removeHeader('origin'))
      },
    },
  }

  return {
    cacheDir: '.vite-cache',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: { proxy: apiProxy },
    preview: { proxy: apiProxy },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      globals: true,
    },
  }
})
