/**
 * Export Game Data — extracts bundled data into standalone JSON files
 * for hosting on GitHub/Discord/etc.
 *
 * Usage: npx tsx scripts/export-game-data.ts
 *
 * Creates:
 *   dist-data/
 *     manifest.json          — game manifest for the app
 *     wh40k-10e/
 *       units.json           — all faction datasheets
 *       rules.json           — all faction rules
 *       general.json         — core rules, crusade rules, commentary
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');
const outDir = resolve(projectRoot, 'dist-data');
const gameDir = resolve(outDir, 'wh40k-10e');

// Extract JS object from a TypeScript file
function extractExport(filePath: string, varName: string): unknown {
  const content = readFileSync(filePath, 'utf-8');
  // Remove the import and export statements, eval the object
  const cleaned = content
    .replace(/^import\s+.*$/gm, '')
    .replace(/^export\s+/, '');
  // Find the assignment
  const match = cleaned.match(new RegExp(`(?:const|let|var)\\s+${varName}[^=]*=\\s*`));
  if (!match || match.index === undefined) throw new Error(`Could not find ${varName} in ${filePath}`);
  const start = match.index + match[0].length;
  // Parse the JSON-like object
  let depth = 0;
  let end = start;
  for (let i = start; i < cleaned.length; i++) {
    if (cleaned[i] === '{' || cleaned[i] === '[') depth++;
    if (cleaned[i] === '}' || cleaned[i] === ']') {
      depth--;
      if (depth === 0) { end = i + 1; break; }
    }
  }
  const jsonStr = cleaned.slice(start, end);
  try {
    return JSON.parse(jsonStr);
  } catch {
    // Try eval for JS objects with trailing commas etc
    return new Function(`return ${jsonStr}`)();
  }
}

function main() {
  console.log('Exporting game data...\n');

  // Create output directories
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  if (!existsSync(gameDir)) mkdirSync(gameDir, { recursive: true });

  // Load raw data using dynamic import
  console.log('Reading data files...');
  const unitsPath = resolve(projectRoot, 'src/data/units.ts');
  const rulesPath = resolve(projectRoot, 'src/data/rules.ts');
  const generalPath = resolve(projectRoot, 'src/data/general.ts');

  // For units and rules, we can't easily eval TS, so we'll use a simpler approach:
  // strip the type annotations and import statements, then eval
  const unitsContent = readFileSync(unitsPath, 'utf-8')
    .replace(/^import\s+.*$/gm, '')
    .replace(/export const UNITS:\s*[^=]+=\s*/, '');
  const rulesContent = readFileSync(rulesPath, 'utf-8')
    .replace(/^import\s+.*$/gm, '')
    .replace(/export const FACTION_RULES:\s*[^=]+=\s*/, '');
  const generalContent = readFileSync(generalPath, 'utf-8')
    .replace(/^import\s+.*$/gm, '');

  // Parse units
  console.log('Parsing units...');
  let units: unknown;
  try {
    units = new Function(`return ${unitsContent.trim().replace(/;$/, '')}`)();
  } catch (e) {
    console.error('Failed to parse units:', e);
    process.exit(1);
  }

  // Parse rules
  console.log('Parsing rules...');
  let rules: unknown;
  try {
    rules = new Function(`return ${rulesContent.trim().replace(/;$/, '')}`)();
  } catch (e) {
    console.error('Failed to parse rules:', e);
    process.exit(1);
  }

  // Parse general — has multiple exports
  console.log('Parsing general rules...');
  const coreMatch = generalContent.match(/export const CORE_RULES[^=]*=\s*/);
  const crusadeMatch = generalContent.match(/export const CRUSADE_RULES[^=]*=\s*/);
  const commentaryMatch = generalContent.match(/export const RULES_COMMENTARY[^=]*=\s*/);

  function extractFromContent(content: string, exportMatch: RegExpMatchArray | null): unknown {
    if (!exportMatch || exportMatch.index === undefined) return null;
    const start = exportMatch.index + exportMatch[0].length;
    let depth = 0;
    let inString = false;
    let stringChar = '';
    let end = start;
    for (let i = start; i < content.length; i++) {
      const c = content[i];
      if (inString) {
        if (c === '\\') { i++; continue; }
        if (c === stringChar) inString = false;
        continue;
      }
      if (c === '"' || c === "'") { inString = true; stringChar = c; continue; }
      if (c === '{' || c === '[') depth++;
      if (c === '}' || c === ']') {
        depth--;
        if (depth === 0) { end = i + 1; break; }
      }
      // Handle null
      if (depth === 0 && content.slice(i, i + 4) === 'null') { end = i + 4; break; }
    }
    const raw = content.slice(start, end);
    try {
      return JSON.parse(raw);
    } catch {
      try { return new Function(`return ${raw}`)(); } catch { return null; }
    }
  }

  const general = {
    coreRules: extractFromContent(generalContent, coreMatch),
    crusadeRules: extractFromContent(generalContent, crusadeMatch),
    rulesCommentary: extractFromContent(generalContent, commentaryMatch),
  };

  // Write JSON files
  console.log('\nWriting JSON files...');

  const unitsJson = JSON.stringify(units, null, 0);
  writeFileSync(resolve(gameDir, 'units.json'), unitsJson);
  console.log(`  units.json: ${(unitsJson.length / 1024).toFixed(0)} KB`);

  const rulesJson = JSON.stringify(rules, null, 0);
  writeFileSync(resolve(gameDir, 'rules.json'), rulesJson);
  console.log(`  rules.json: ${(rulesJson.length / 1024).toFixed(0)} KB`);

  const generalJson = JSON.stringify(general, null, 0);
  writeFileSync(resolve(gameDir, 'general.json'), generalJson);
  console.log(`  general.json: ${(generalJson.length / 1024).toFixed(0)} KB`);

  // Write manifest
  const manifest = {
    version: '1.0.0',
    updated: new Date().toISOString(),
    games: [
      {
        id: 'wh40k-10e',
        name: 'Warhammer 40,000',
        edition: '10th Edition',
        icon: '⚔️',
        version: '2026.03.30',
        description: '26 factions, 1400+ datasheets, full rules and stratagems',
        files: {
          units: 'https://raw.githubusercontent.com/Rocketshon/warcaster-data/main/wh40k-10e/units.json',
          rules: 'https://raw.githubusercontent.com/Rocketshon/warcaster-data/main/wh40k-10e/rules.json',
          general: 'https://raw.githubusercontent.com/Rocketshon/warcaster-data/main/wh40k-10e/general.json',
        },
      },
    ],
  };

  writeFileSync(resolve(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('  manifest.json: written');

  console.log(`\nDone! Files written to ${outDir}`);
  console.log('\nNext steps:');
  console.log('1. Create repo: gh repo create Rocketshon/warcaster-data --public');
  console.log('2. Push the dist-data/ contents to that repo');
  console.log('3. The app will fetch from the raw GitHub URLs');
}

main();
