// Simple sitemap generator for static pages found in root
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const baseUrl = process.env.SITE_URL || 'https://example.com';

const pages = ['/', '/gallery', '/about', '/contact', '/location'];

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  pages
    .map((p) => `  <url>\n    <loc>${baseUrl.replace(/\/$/, '') + p}</loc>\n  </url>`)
    .join('\n') +
  `\n</urlset>`;

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml, 'utf8');
console.log('sitemap.xml generated');
