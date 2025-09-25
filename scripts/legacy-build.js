#!/usr/bin/env node
// Archived esbuild-based build script kept for reference.
// The project now uses Vite for builds. This file is an exact copy of the
// previous `scripts/build.js` but renamed to `legacy-build.js`.
const path = require('path');
const fs = require('fs/promises');
const esbuild = require('esbuild');

async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

async function run() {
  const root = path.resolve(__dirname, '..');
  const buildDir = path.join(root, 'build');

  // clean
  await fs.rm(buildDir, { recursive: true, force: true });
  await fs.mkdir(buildDir, { recursive: true });

  // bundle main.js with source map
  const entry = path.join(root, 'main.js');
  if (await exists(entry)) {
    console.log('Bundling main.js with esbuild...');
    await esbuild.build({
      entryPoints: [entry],
      bundle: true,
      sourcemap: true,
      outfile: path.join(buildDir, 'main.js'),
      legalComments: 'none'
    });
  } else {
    console.warn('Entry file main.js not found, skipping JS bundle');
  }

  // copy static files / directories
  const staticItems = ['index.html', 'manifest.json', 'offline.html', 'service-worker.js'];
  for (const item of staticItems) {
    const src = path.join(root, item);
    if (await exists(src)) {
      await fs.copyFile(src, path.join(buildDir, item));
    }
  }

  const copyDirs = ['styles', 'icons', 'src'];
  for (const d of copyDirs) {
    const src = path.join(root, d);
    const dest = path.join(buildDir, d);
    if (await exists(src)) {
      // use recursive copy if available
      await fs.cp(src, dest, { recursive: true });
    }
  }

  console.log('Legacy build complete. Output in build/');
}

run().catch((err) => { console.error(err); process.exit(1); });
