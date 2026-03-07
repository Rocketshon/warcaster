/**
 * Generate PNG icons from SVG for PWA.
 * Run with: node scripts/generate-icons.js
 *
 * Since we don't have a canvas library, this creates a simple
 * HTML page that can be opened in a browser to download PNGs.
 *
 * For now, the SVG icons work for Android/modern browsers.
 * iOS will use the apple-touch-icon SVG fallback.
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const svg192 = readFileSync(join(__dirname, '../public/icons/icon-192.svg'), 'utf8');
const svg512 = readFileSync(join(__dirname, '../public/icons/icon-512.svg'), 'utf8');

const html = `<!DOCTYPE html>
<html>
<head><title>Generate PWA Icons</title></head>
<body>
<h1>PWA Icon Generator</h1>
<p>Right-click each image and "Save As" to download the PNG versions:</p>
<h2>192x192</h2>
<img src="data:image/svg+xml;base64,${Buffer.from(svg192).toString('base64')}" width="192" height="192" />
<h2>512x512</h2>
<img src="data:image/svg+xml;base64,${Buffer.from(svg512).toString('base64')}" width="512" height="512" />
<h2>Apple Touch Icon (180x180)</h2>
<img src="data:image/svg+xml;base64,${Buffer.from(svg192).toString('base64')}" width="180" height="180" />
</body>
</html>`;

writeFileSync(join(__dirname, '../public/icon-generator.html'), html);
console.log('Icon generator page created at public/icon-generator.html');
console.log('SVG icons are already in place and will work for most modern browsers including iOS 15+.');
