// ---------------------------------------------------------------------------
// Edition Data Scraper Scaffold
// ---------------------------------------------------------------------------
// Scaffold for scraping new edition data from wahapedia.
// This will be the pipeline for 11th Edition data when it launches.
//
// Usage: npx tsx scripts/scrape-edition.ts --edition 11th
//
// Steps:
// 1. Scrape faction list from wahapedia
// 2. For each faction, scrape datasheets, rules, detachments
// 3. Output to src/data/editions/11th/
// 4. Build type-safe TypeScript data modules
//
// The existing build-data.ts handles step 4.
// This script handles steps 1-3.
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const editionArg = args.find(a => a.startsWith('--edition='))?.split('=')[1];

if (!editionArg) {
  console.log('Usage: npx tsx scripts/scrape-edition.ts --edition <10th|11th>');
  console.log('');
  console.log('Example:');
  console.log('  npx tsx scripts/scrape-edition.ts --edition 11th');
  process.exit(1);
}

console.log(`Edition scraper scaffold -- targeting ${editionArg} Edition`);
console.log('');

if (editionArg === '11th') {
  console.log('11th Edition data is not yet available.');
  console.log('When 11th Edition launches (June 2026), update the wahapedia URLs and run this script.');
  console.log('');
  console.log('Planned pipeline:');
  console.log('  1. Scrape faction list from wahapedia');
  console.log('  2. For each faction, scrape datasheets, rules, detachments');
  console.log('  3. Output raw JSON to src/data/editions/11th/');
  console.log('  4. Run build-data.ts to generate type-safe TypeScript modules');
} else if (editionArg === '10th') {
  console.log('10th Edition data is already built.');
  console.log('See src/data/units.ts and src/data/rules.ts for existing data.');
  console.log('To rebuild, run: npx tsx scripts/build-data.ts');
} else {
  console.log(`Unknown edition: ${editionArg}`);
  console.log('Supported editions: 10th, 11th');
  process.exit(1);
}
