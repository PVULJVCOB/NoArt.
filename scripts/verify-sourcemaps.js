#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd, opts = {}) {
  console.log(`> ${cmd}`);
  return execSync(cmd, { stdio: 'inherit', ...opts });
}

try {
  // simulate CI build
  console.log('Running CI-mode build (CI=true)...');
  run('CI=true npm run build');

  const dist = path.resolve(process.cwd(), 'dist');
  const maps = [];
  function collect(dir) {
    for (const e of fs.readdirSync(dir)) {
      const p = path.join(dir, e);
      if (fs.statSync(p).isDirectory()) collect(p);
      else if (p.endsWith('.map')) maps.push(p);
    }
  }
  collect(dist);
  console.log(`Found ${maps.length} map(s) in dist/`);
  maps.forEach(m => console.log(' -', m));

  if (maps.length === 0) {
    console.error('No sourcemaps found in dist/. Aborting verification.');
    process.exit(2);
  }

  // run strip script
  console.log('Removing sourcemaps via npm run strip-sourcemaps...');
  run('npm run strip-sourcemaps');

  // re-check
  const mapsAfter = [];
  function collectAfter(dir) {
    for (const e of fs.readdirSync(dir)) {
      const p = path.join(dir, e);
      if (fs.statSync(p).isDirectory()) collectAfter(p);
      else if (p.endsWith('.map')) mapsAfter.push(p);
    }
  }
  collectAfter(dist);
  console.log(`Found ${mapsAfter.length} map(s) after stripping.`);
  if (mapsAfter.length > 0) {
    console.error('Sourcemap strip failed: some .map files still present');
    process.exit(3);
  }

  console.log('Sourcemap verification passed.');
  process.exit(0);
} catch (e) {
  console.error('Error during verification:', e.message || e);
  process.exit(1);
}
