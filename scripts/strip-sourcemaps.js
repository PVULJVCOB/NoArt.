#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const dist = path.resolve(process.cwd(), 'dist');

function removeMaps(dir) {
  if (!fs.existsSync(dir)) return 0;
  let removed = 0;
  for (const entry of fs.readdirSync(dir)) {
    const p = path.join(dir, entry);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      removed += removeMaps(p);
    } else if (p.endsWith('.map')) {
      fs.unlinkSync(p);
      removed++;
    }
  }
  return removed;
}

const count = removeMaps(dist);
console.log(`Removed ${count} .map files from ${dist}`);
process.exit(0);
