/**
 * Sonnet Text Cleanup Pipeline
 *
 * Sends all rule text blocks through Claude Sonnet to:
 * 1. Add section headers where logical breaks exist
 * 2. Clean up formatting
 * 3. Convert walls of text into structured, readable content
 *
 * Uses [Section Name] markers that the app already renders as styled headers.
 */

const Anthropic = require("@anthropic-ai/sdk");
const fs = require("fs");
const path = require("path");

const API_KEY = process.env.ANTHROPIC_API_KEY || "";
const MODEL = "claude-sonnet-4-20250514";

const client = new Anthropic({ apiKey: API_KEY });

let totalInputTokens = 0;
let totalOutputTokens = 0;
let totalCalls = 0;
let totalSkipped = 0;

const SYSTEM_PROMPT = `You are a Warhammer 40,000 rules formatter. Your job is to take raw rules text and add section headers and improve readability WITHOUT changing any game rules content.

Rules:
1. Add [Section Name] markers to create logical section breaks in long text. Place them on their own line.
2. Keep ALL original rules text exactly as-is. Do not rephrase, summarize, or remove any rules content.
3. Use [Section Name] format for headers (square brackets). The app renders these as styled headers.
4. Break long paragraphs into shorter ones where natural breaks exist.
5. Keep bullet points that start with "- " as they are.
6. If the text already has [Section Headers], keep them and add more where needed.
7. If the text is already well-structured or very short (under 100 words), return it unchanged.
8. Do NOT add any content that isn't in the original. No explanations, no summaries, no commentary.
9. Return ONLY the formatted text. No preamble, no "Here is the formatted text:", nothing extra.`;

async function processText(name, text, context) {
  // Skip very short or empty texts
  if (!text || text.trim().length < 150) {
    return null; // No change needed
  }

  // Skip texts that are mostly tables
  if ((text.match(/\[TABLE:/g) || []).length > 2 && text.length < 500) {
    return null;
  }

  const userPrompt = `Context: This is from the "${context}" section, specifically "${name}".

Format this rules text by adding [Section Name] headers where logical breaks exist. Keep all content exactly as-is.

TEXT:
${text}`;

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    totalInputTokens += response.usage.input_tokens;
    totalOutputTokens += response.usage.output_tokens;
    totalCalls++;

    const result = response.content[0].text;

    // Sanity check: result should be roughly similar length (not drastically shorter)
    if (result.length < text.length * 0.5) {
      console.log(`    ⚠️  Result too short (${result.length} vs ${text.length}), keeping original`);
      return null;
    }

    return result;
  } catch (err) {
    console.error(`    ❌ API error: ${err.message}`);
    return null;
  }
}

async function processGeneralRules() {
  console.log("\n=== Processing General Rules (general.ts) ===\n");

  const generalPath = path.join(__dirname, "..", "src", "data", "general.ts");
  let generalTs = fs.readFileSync(generalPath, "utf-8");

  // Parse out the CORE_RULES sections
  const coreMatch = generalTs.match(
    /export const CORE_RULES[^=]*=\s*(\{[\s\S]*?\});?\s*\n\s*export const CRUSADE_RULES/
  );
  const crusadeMatch = generalTs.match(
    /export const CRUSADE_RULES[^=]*=\s*(\{[\s\S]*?\});?\s*\n\s*export const RULES_COMMENTARY/
  );

  // Process using JSON data file instead (cleaner)
  const dataPath = path.join(__dirname, "general-rules-data.json");
  if (!fs.existsSync(dataPath)) {
    console.log("  general-rules-data.json not found, skipping general rules");
    return;
  }

  const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  let modified = false;

  // Process core rules sections
  for (const section of data.core_rules.sections) {
    if (!section.text || section.text.length < 150) {
      totalSkipped++;
      continue;
    }
    process.stdout.write(`  Core > ${section.name} (${section.text.length} chars)... `);
    const result = await processText(section.name, section.text, "Core Rules");
    if (result) {
      section.text = result;
      modified = true;
      console.log(`✅ formatted`);
    } else {
      totalSkipped++;
      console.log(`⏭️  skipped`);
    }
    // Small delay to avoid rate limits
    await new Promise((r) => setTimeout(r, 500));
  }

  // Process crusade rules sections
  for (const section of data.crusade_rules.sections) {
    if (!section.text || section.text.length < 150) {
      totalSkipped++;
      continue;
    }
    process.stdout.write(`  Crusade > ${section.name} (${section.text.length} chars)... `);
    const result = await processText(section.name, section.text, "Crusade Rules");
    if (result) {
      section.text = result;
      modified = true;
      console.log(`✅ formatted`);
    } else {
      totalSkipped++;
      console.log(`⏭️  skipped`);
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  if (modified) {
    // Write back to general-rules-data.json
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf-8");

    // Also update general.ts directly
    const coreData = JSON.stringify(data.core_rules, null, 2);
    const crusadeData = JSON.stringify(data.crusade_rules, null, 2);

    const coreStart = generalTs.indexOf("export const CORE_RULES");
    const crusadeStart = generalTs.indexOf("export const CRUSADE_RULES");
    const commentaryStart = generalTs.indexOf("export const RULES_COMMENTARY");

    const header = generalTs.slice(0, coreStart);
    const commentarySection = generalTs.slice(commentaryStart);

    const newGeneralTs =
      header +
      "export const CORE_RULES: GeneralRulesDocument | null = " +
      coreData +
      ";\n\n" +
      "export const CRUSADE_RULES: GeneralRulesDocument | null = " +
      crusadeData +
      ";\n\n" +
      commentarySection;

    fs.writeFileSync(generalPath, newGeneralTs, "utf-8");
    console.log("  ✅ general.ts updated");
  }
}

async function processFactionRules() {
  console.log("\n=== Processing Faction Rules (rules.ts) ===\n");

  const rulesPath = path.join(__dirname, "..", "src", "data", "rules.ts");
  let rulesTs = fs.readFileSync(rulesPath, "utf-8");

  // We need to process crusade_rules and boarding_actions text fields
  // Strategy: find each faction's crusade_rules array entries and process their text

  // Use the source JSON files for easier parsing
  const datasheetsDir = "C:/Users/dshon/Projects/_backlog/Warhammer/datasheets";
  const factionDirs = fs
    .readdirSync(datasheetsDir)
    .filter(
      (d) =>
        !d.startsWith("_") &&
        fs.statSync(path.join(datasheetsDir, d)).isDirectory()
    );

  const SLUG_TO_ID = {
    "emperor-s-children": "emperors_children",
    "t-au-empire": "tau_empire",
  };

  for (const slug of factionDirs) {
    const factionId = SLUG_TO_ID[slug] || slug.replace(/-/g, "_");
    const jsonFiles = fs
      .readdirSync(path.join(datasheetsDir, slug))
      .filter((f) => f.startsWith("_") && f.endsWith("_rules.json"));
    if (jsonFiles.length === 0) continue;

    const srcPath = path.join(datasheetsDir, slug, jsonFiles[0]);
    const srcData = JSON.parse(fs.readFileSync(srcPath, "utf-8"));

    let factionModified = false;

    // Process crusade_rules
    if (srcData.crusade_rules && Array.isArray(srcData.crusade_rules)) {
      for (const rule of srcData.crusade_rules) {
        if (!rule.text || rule.text.length < 200) {
          totalSkipped++;
          continue;
        }
        const factionName = srcData.faction || slug;
        process.stdout.write(
          `  ${factionName} > Crusade > ${rule.name} (${rule.text.length} chars)... `
        );
        const result = await processText(
          rule.name,
          rule.text,
          `${factionName} Crusade Rules`
        );
        if (result) {
          rule.text = result;
          factionModified = true;
          console.log(`✅ formatted`);
        } else {
          totalSkipped++;
          console.log(`⏭️  skipped`);
        }
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    // Process boarding_actions text
    if (srcData.boarding_actions && Array.isArray(srcData.boarding_actions)) {
      for (const ba of srcData.boarding_actions) {
        if (!ba.text || ba.text.length < 200) {
          totalSkipped++;
          continue;
        }
        const factionName = srcData.faction || slug;
        process.stdout.write(
          `  ${factionName} > BA > ${ba.name} (${ba.text.length} chars)... `
        );
        const result = await processText(
          ba.name,
          ba.text,
          `${factionName} Boarding Actions`
        );
        if (result) {
          ba.text = result;
          factionModified = true;
          console.log(`✅ formatted`);
        } else {
          totalSkipped++;
          console.log(`⏭️  skipped`);
        }
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    if (factionModified) {
      // Save back to source JSON
      fs.writeFileSync(srcPath, JSON.stringify(srcData, null, 2), "utf-8");
    }
  }

  // Now rebuild rules.ts from the updated source JSONs
  console.log("\n  Rebuilding rules.ts from updated source data...");
  // Use the existing update script
  const updateScript = path.join(__dirname, "update-rules-data.cjs");
  if (fs.existsSync(updateScript)) {
    require(updateScript);
    console.log("  ✅ rules.ts rebuilt");
  } else {
    console.log("  ⚠️  update-rules-data.cjs not found, manual rebuild needed");
  }
}

async function main() {
  console.log("🚀 Sonnet Text Cleanup Pipeline");
  console.log("================================");
  console.log(`Model: ${MODEL}`);
  console.log(`Estimated cost: ~$4.59`);
  console.log("");

  const startTime = Date.now();

  await processGeneralRules();
  await processFactionRules();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log("\n================================");
  console.log("📊 FINAL STATS");
  console.log(`  API calls: ${totalCalls}`);
  console.log(`  Skipped: ${totalSkipped} (too short or already clean)`);
  console.log(`  Input tokens: ${totalInputTokens.toLocaleString()}`);
  console.log(`  Output tokens: ${totalOutputTokens.toLocaleString()}`);

  const inputCost = (totalInputTokens * 3) / 1000000;
  const outputCost = (totalOutputTokens * 15) / 1000000;
  const totalCost = inputCost + outputCost;

  console.log(`  Input cost: $${inputCost.toFixed(2)}`);
  console.log(`  Output cost: $${outputCost.toFixed(2)}`);
  console.log(`  TOTAL COST: $${totalCost.toFixed(2)}`);
  console.log(`  Time: ${elapsed}s`);
  console.log("================================");
}

main().catch(console.error);
