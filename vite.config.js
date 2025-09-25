import { defineConfig } from 'vite'
import { resolve } from 'path'
import fs from 'fs'

// Small plugin to ensure service-worker and manifest/icons are copied to dist
function copyStatic() {
  return {
    name: 'copy-static',
    closeBundle() {
      const filesToCopy = ['service-worker.js', 'manifest.json', 'offline.html']
      const iconDir = 'icons'
      const outDir = resolve(process.cwd(), 'dist')

      if (!fs.existsSync(outDir)) return

      for (const f of filesToCopy) {
        const src = resolve(process.cwd(), f)
        const dest = resolve(outDir, f)
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest)
        }
      }

      const srcIconDir = resolve(process.cwd(), iconDir)
      const destIconDir = resolve(outDir, iconDir)
      if (fs.existsSync(srcIconDir)) {
        fs.mkdirSync(destIconDir, { recursive: true })
        for (const name of fs.readdirSync(srcIconDir)) {
          const s = resolve(srcIconDir, name)
          const d = resolve(destIconDir, name)
          fs.copyFileSync(s, d)
        }
      }
    }
  }
}

// Only emit production sourcemaps when running in CI (e.g. GitHub Actions)
const emitSourcemapInCI = (() => {
  try {
    return process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true' || !!process.env.CI
  } catch (e) {
    return false
  }
})();

export default defineConfig({
  root: '.',
  base: '/',
    build: {
      outDir: 'dist',
      // Emit source maps so CI can upload them to Sentry (see scripts/sentry-upload.sh)
      // Only enable in CI to avoid generating local .map files by default.
      sourcemap: emitSourcemapInCI,
      emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  },
  plugins: [copyStatic()]
})
