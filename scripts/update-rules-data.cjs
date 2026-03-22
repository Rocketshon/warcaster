#!/usr/bin/env node
/**
 * Updates boarding_actions and crusade_rules in src/data/rules.ts
 * from freshly re-scraped source JSON files.
 */
const fs = require('fs');
const path = require('path');

const DATASHEETS = 'C:/Users/dshon/Projects/_backlog/Warhammer/datasheets';
const RULES_TS = 'C:/Users/dshon/Projects/CrusadeCommand/src/data/rules.ts';

const SLUG_TO_ID = {
  'emperor-s-children': 'emperors_children',
  't-au-empire': 'tau_empire',
};

function slugToId(slug) {
  return SLUG_TO_ID[slug] || slug.replace(/-/g, '_');
}

/**
 * Find the end of a JSON array/object starting at `start` in `text`.
 * `text[start]` must be '[' or '{'.
 * Returns the index of the matching closing bracket (inclusive).
 */
function findMatchingBracket(text, start) {
  const open = text[start];
  const close = open === '[' ? ']' : '}';
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (ch === '\\' && inString) {
      escaped = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * Replace a specific field's array value within a faction block in the TS source.
 * Returns the new content string, or null if field not found in the block.
 */
function replaceFieldInBlock(content, factionId, fieldName, newValue) {
  // Find the faction key in the content
  const factionKeyPattern = `"${factionId}": {`;
  const factionStart = content.indexOf(factionKeyPattern);
  if (factionStart === -1) {
    console.warn(`  WARNING: Faction "${factionId}" not found in rules.ts`);
    return null;
  }

  // Find the end of this faction's block
  const factionBlockStart = content.indexOf('{', factionStart + factionKeyPattern.length - 1);
  const factionBlockEnd = findMatchingBracket(content, factionBlockStart);
  if (factionBlockEnd === -1) {
    console.warn(`  WARNING: Could not find end of faction block for "${factionId}"`);
    return null;
  }

  // Within the faction block, find the field
  const factionBlock = content.substring(factionBlockStart, factionBlockEnd + 1);
  const fieldPattern = `"${fieldName}": [`;
  const fieldRelStart = factionBlock.indexOf(fieldPattern);
  if (fieldRelStart === -1) {
    console.warn(`  WARNING: Field "${fieldName}" not found in faction "${factionId}"`);
    return null;
  }

  // Find the array start (the '[' in '"fieldName": [')
  const arrayRelStart = fieldRelStart + `"${fieldName}": `.length;
  const arrayAbsStart = factionBlockStart + arrayRelStart;

  // Find the matching ']'
  const arrayAbsEnd = findMatchingBracket(content, arrayAbsStart);
  if (arrayAbsEnd === -1) {
    console.warn(`  WARNING: Could not find end of array for "${fieldName}" in faction "${factionId}"`);
    return null;
  }

  // Serialize the new value with proper indentation
  const serialized = JSON.stringify(newValue, null, 2);

  // Replace the old array with the new one
  return content.substring(0, arrayAbsStart) + serialized + content.substring(arrayAbsEnd + 1);
}

// Read directories
const factionDirs = fs.readdirSync(DATASHEETS).filter(d => {
  const fullPath = path.join(DATASHEETS, d);
  return !d.startsWith('_') && fs.statSync(fullPath).isDirectory();
});

// Read current rules.ts
let content = fs.readFileSync(RULES_TS, 'utf-8');

let updatedCount = 0;
let skippedCount = 0;
const results = [];

for (const slug of factionDirs) {
  const id = slugToId(slug);
  const rulesDir = path.join(DATASHEETS, slug);
  const jsonFiles = fs.readdirSync(rulesDir).filter(f => f.startsWith('_') && f.endsWith('_rules.json'));

  if (jsonFiles.length === 0) {
    results.push(`  SKIP: ${slug} - no rules JSON found`);
    skippedCount++;
    continue;
  }

  const sourceData = JSON.parse(fs.readFileSync(path.join(rulesDir, jsonFiles[0]), 'utf-8'));
  const newBA = sourceData.boarding_actions || [];
  const newCR = sourceData.crusade_rules || [];

  // Replace crusade_rules
  let newContent = replaceFieldInBlock(content, id, 'crusade_rules', newCR);
  if (newContent === null) {
    results.push(`  SKIP: ${slug} (${id}) - crusade_rules not found in rules.ts`);
    skippedCount++;
    continue;
  }
  content = newContent;

  // Replace boarding_actions
  newContent = replaceFieldInBlock(content, id, 'boarding_actions', newBA);
  if (newContent === null) {
    results.push(`  SKIP: ${slug} (${id}) - boarding_actions not found in rules.ts`);
    skippedCount++;
    continue;
  }
  content = newContent;

  results.push(`  OK: ${slug} -> ${id} (CR: ${newCR.length} items, BA: ${newBA.length} items)`);
  updatedCount++;
}

// Write updated rules.ts
fs.writeFileSync(RULES_TS, content, 'utf-8');

console.log('=== Update Rules Data ===');
console.log(`Updated: ${updatedCount} factions`);
console.log(`Skipped: ${skippedCount} factions`);
console.log('');
results.forEach(r => console.log(r));

// Sanity check: search for garbled text
const garbledMatches = (content.match(/Your , just after/g) || []).length;
console.log('');
console.log(`Sanity check - "Your , just after" occurrences: ${garbledMatches}`);
