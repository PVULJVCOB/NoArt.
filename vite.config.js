import { defineConfig } from 'vite'
import { resolve } from 'path'
import fs from 'fs'

// Small plugin to ensure service-worker and manifest/icons are copied to dist
function copyStatic() {
  return {
    name: 'copy-static',
    closeBundle() {
      // Files and directories to copy into dist so they are available at runtime
  const toCopy = ['service-worker.js', 'manifest.json', 'offline.html', 'main.js', 'styles', 'scripts', 'src/portrait.jpg']
      const iconDir = 'icons'
      const outDir = resolve(process.cwd(), 'dist')

      if (!fs.existsSync(outDir)) return

      // recursive copy helper
      function copyRecursive(src, dest) {
        const st = fs.statSync(src)
        if (st.isDirectory()) {
          fs.mkdirSync(dest, { recursive: true })
          for (const name of fs.readdirSync(src)) {
            copyRecursive(resolve(src, name), resolve(dest, name))
          }
        } else {
          // Ensure parent dir exists
          fs.mkdirSync(resolve(dest, '..'), { recursive: true })
          fs.copyFileSync(src, dest)
        }
      }

      for (const p of toCopy) {
        const src = resolve(process.cwd(), p)
        // Special-case copying the portrait into the assets folder
        const dest = p === 'src/portrait.jpg' ? resolve(outDir, 'assets', 'portrait.jpg') : resolve(outDir, p)
        if (!fs.existsSync(src)) continue
        copyRecursive(src, dest)
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
  // Allow overriding the base path at build time via BASE_URL env var.
  // Example: BASE_URL=/NoArt./ npm run build
  base: process.env.BASE_URL || '/',
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
