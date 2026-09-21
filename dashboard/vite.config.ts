import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig } from 'vite'

// GitHub Pages（https://chronona.github.io/jev-llm-benchmark/）配下で
// アセットパスを解決するため、リポジトリ名を base に指定する。
// https://vite.dev/config/shared-options.html#base
export default defineConfig({
  base: '/jev-llm-benchmark/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
})
