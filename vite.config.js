import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  base: '/',
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    open: true
  }
})
