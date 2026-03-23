/**
 * Sonnet Fix-All Pipeline
 *
 * Sends each faction's data + relevant Haiku findings through Sonnet
 * to fix ALL 1,188 issues: formatting, garbled text, incomplete data,
 * inconsistencies, duplicates, wrong data, and empty fields.
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

const SYSTEM_PROMPT = `You are a Warhammer 40,000 10th Edition data fixer. You receive game data (JSON) and a list of issues found by an audit. Fix ALL issues and return the corrected JSON.

RULES:
1. Fix ALL formatting issues: remove extra spaces before punctuation ("phase ." → "phase."), fix spacing around commas
2. Fix ALL garbled/concatenated text: "HERETICASTARTES" → "HERETIC ASTARTES", "T'AUEMPIRE" → "T'AU EMPIRE", etc.
3. Fix keywords: split concatenated keywords, add missing spaces. Keywords should be UPPERCASE with proper spacing
4. Remove duplicate content — if the same text appears in multiple fields, keep it in the most appropriate place only
5. Fix incomplete/truncated text — if a sentence ends mid-word or trails off with "You can find out more about...", complete it logically or trim to the last complete sentence
6. Fix empty fields:
   - "damaged" fields: if empty string for a model that wouldn't have a damaged profile (INFANTRY, CHARACTERS without vehicles), set to null
   - "leader" fields: if empty string and unit isn't a leader, set to null
   - "base_size" fields: leave as-is if empty (we can't know the physical base size)
   - "wargear_abilities" / "wargear_options": if empty array and unit has no options, leave as empty array
7. Fix stat inconsistencies: Ld (Leadership) in 10th edition should be a number with + (like "6+", "7+"). This IS valid 10th ed format.
8. Fix ability text: "Benefitof Cover" → "Benefit of Cover", "Normalmove" → "Normal move", "Chargemove" → "Charge move", "Chargerolls" → "Charge rolls"
9. Fix faction_keywords: ensure proper spacing in ALL faction keywords
10. Preserve ALL game rules content exactly — only fix formatting/structure, never change actual rules
11. Return ONLY valid JSON. No markdown, no code fences, no explanation.
12. The returned JSON must have the exact same structure/keys as the input.`;

async function fixData(name, data, findings, context) {
  const dataStr = JSON.stringify(data, null, 1);

  // Build findings summary
  const findingsSummary = findings.length > 0
    ? "\n\nAUDIT FINDINGS TO FIX:\n" + findings.map((f, i) =>
        `${i + 1}. [${f.severity}/${f.type}] ${f.location}: ${f.issue} → ${f.suggestion}`
      ).join("\n")
    : "\n\nNo specific findings, but apply all formatting rules above.";

  // Truncate if too large (Sonnet has 200K context)
  let inputData = dataStr;
  if (dataStr.length > 120000) {
    // For very large files, we need to process in chunks
    // but most faction files are under 100K
    inputData = dataStr.substring(0, 120000) + "\n/* TRUNCATED — fix what you can see */";
  }

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Context: ${context}\nSection: "${name}"\n${findingsSummary}\n\nDATA TO FIX:\n${inputData}` }],
    });

    totalInputTokens += response.usage.input_tokens;
    totalOutputTokens += response.usage.output_tokens;
    totalCalls++;

    let result = response.content[0].text.trim();
    result = result.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();

    const parsed = JSON.parse(result);
    return parsed;
  } catch (err) {
    if (err instanceof SyntaxError) {
      console.log(`    ⚠️  JSON parse error, keeping original`);
    } else {
      console.error(`    ❌ API error: ${err.message}`);
    }
    return null;
  }
}

async function processGeneralRules() {
  console.log("\n=== Fixing General Rules ===\n");

  const report = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "haiku-audit-report.json"), "utf-8"));
  const dataPath = path.join(__dirname, "general-rules-data.json");
  const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

  // Fix core rules sections
  for (const section of data.core_rules.sections) {
    const findings = report.findings.filter(f =>
      f.context === "Core Rules" && f.section === section.name
    );
    if (findings.length === 0 && (!section.text || section.text.length < 100)) {
      process.stdout.write(`  Core > ${section.name}... ⏭️  clean\n`);
      continue;
    }
    process.stdout.write(`  Core > ${section.name} (${findings.length} findings)... `);
    const fixed = await fixData(section.name, section, findings, "Core Rules");
    if (fixed) {
      Object.assign(section, fixed);
      console.log(`✅`);
    } else {
      console.log(`⚠️  kept original`);
    }
    await new Promise(r => setTimeout(r, 500));
  }

  // Fix crusade rules sections
  for (const section of data.crusade_rules.sections) {
    const findings = report.findings.filter(f =>
      f.context === "General Crusade Rules" && f.section === section.name
    );
    if (findings.length === 0 && (!section.text || section.text.length < 100)) {
      process.stdout.write(`  Crusade > ${section.name}... ⏭️  clean\n`);
      continue;
    }
    process.stdout.write(`  Crusade > ${section.name} (${findings.length} findings)... `);
    const fixed = await fixData(section.name, section, findings, "General Crusade Rules");
    if (fixed) {
      Object.assign(section, fixed);
      console.log(`✅`);
    } else {
      console.log(`⚠️  kept original`);
    }
    await new Promise(r => setTimeout(r, 500));
  }

  // Save
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf-8");

  // Update general.ts
  const generalPath = path.join(__dirname, "..", "src", "data", "general.ts");
  let generalTs = fs.readFileSync(generalPath, "utf-8");
  const coreStart = generalTs.indexOf("export const CORE_RULES");
  const crusadeStart = generalTs.indexOf("export const CRUSADE_RULES");
  const commentaryStart = generalTs.indexOf("export const RULES_COMMENTARY");
  const header = generalTs.slice(0, coreStart);
  const commentarySection = generalTs.slice(commentaryStart);
  generalTs = header +
    "export const CORE_RULES: GeneralRulesDocument | null = " + JSON.stringify(data.core_rules, null, 2) + ";\n\n" +
    "export const CRUSADE_RULES: GeneralRulesDocument | null = " + JSON.stringify(data.crusade_rules, null, 2) + ";\n\n" +
    commentarySection;
  fs.writeFileSync(generalPath, generalTs, "utf-8");
  console.log("  ✅ general.ts updated");
}

async function processFactionRules() {
  console.log("\n=== Fixing Faction Rules ===\n");

  const report = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "haiku-audit-report.json"), "utf-8"));
  const datasheetsDir = "C:/Users/dshon/Projects/_backlog/Warhammer/datasheets";
  const factionDirs = fs.readdirSync(datasheetsDir).filter(d =>
    !d.startsWith("_") && fs.statSync(path.join(datasheetsDir, d)).isDirectory()
  );

  for (const slug of factionDirs) {
    const jsonFiles = fs.readdirSync(path.join(datasheetsDir, slug))
      .filter(f => f.startsWith("_") && f.endsWith("_rules.json"));
    if (jsonFiles.length === 0) continue;

    const srcPath = path.join(datasheetsDir, slug, jsonFiles[0]);
    const srcData = JSON.parse(fs.readFileSync(srcPath, "utf-8"));
    const factionName = srcData.faction || slug;

    // Get all findings for this faction
    const factionFindings = report.findings.filter(f =>
      f.context && f.context.includes(factionName)
    );

    if (factionFindings.length === 0) {
      console.log(`  ${factionName}... ⏭️  clean`);
      continue;
    }

    // Fix detachments (they have the most issues)
    if (srcData.detachments && srcData.detachments.length > 0) {
      for (let i = 0; i < srcData.detachments.length; i++) {
        const det = srcData.detachments[i];
        const detFindings = factionFindings.filter(f =>
          f.section === det.name || (f.location && f.location.includes(det.name))
        );
        if (detFindings.length === 0) continue;

        process.stdout.write(`  ${factionName} > ${det.name} (${detFindings.length} findings)... `);
        const fixed = await fixData(det.name, det, detFindings, `${factionName} Detachment`);
        if (fixed) {
          srcData.detachments[i] = fixed;
          console.log(`✅`);
        } else {
          console.log(`⚠️  kept original`);
        }
        await new Promise(r => setTimeout(r, 500));
      }
    }

    // Fix crusade rules
    if (srcData.crusade_rules && srcData.crusade_rules.length > 0) {
      const crFindings = factionFindings.filter(f =>
        f.section === "Crusade Rules" || (f.context && f.context.includes("Crusade"))
      );
      if (crFindings.length > 0) {
        process.stdout.write(`  ${factionName} > Crusade Rules (${crFindings.length} findings)... `);
        const fixed = await fixData("Crusade Rules", srcData.crusade_rules, crFindings, `${factionName} Crusade Rules`);
        if (fixed && Array.isArray(fixed)) {
          srcData.crusade_rules = fixed;
          console.log(`✅`);
        } else {
          console.log(`⚠️  kept original`);
        }
        await new Promise(r => setTimeout(r, 500));
      }
    }

    // Fix boarding actions
    if (srcData.boarding_actions && srcData.boarding_actions.length > 0) {
      const baFindings = factionFindings.filter(f =>
        f.section === "Boarding Actions" || (f.context && f.context.includes("Boarding"))
      );
      if (baFindings.length > 0) {
        process.stdout.write(`  ${factionName} > Boarding Actions (${baFindings.length} findings)... `);
        const fixed = await fixData("Boarding Actions", srcData.boarding_actions, baFindings, `${factionName} Boarding Actions`);
        if (fixed && Array.isArray(fixed)) {
          srcData.boarding_actions = fixed;
          console.log(`✅`);
        } else {
          console.log(`⚠️  kept original`);
        }
        await new Promise(r => setTimeout(r, 500));
      }
    }

    // Fix army rules
    if (srcData.army_rules) {
      const arFindings = factionFindings.filter(f => f.section === "Army Rules");
      if (arFindings.length > 0) {
        process.stdout.write(`  ${factionName} > Army Rules (${arFindings.length} findings)... `);
        const fixed = await fixData("Army Rules", srcData.army_rules, arFindings, `${factionName} Army Rules`);
        if (fixed) {
          srcData.army_rules = fixed;
          console.log(`✅`);
        } else {
          console.log(`⚠️  kept original`);
        }
        await new Promise(r => setTimeout(r, 500));
      }
    }

    // Save back
    fs.writeFileSync(srcPath, JSON.stringify(srcData, null, 2), "utf-8");
  }

  // Rebuild rules.ts
  console.log("\n  Rebuilding rules.ts from fixed source data...");
  const updateScript = path.join(__dirname, "update-rules-data.cjs");
  if (fs.existsSync(updateScript)) {
    require(updateScript);
    console.log("  ✅ rules.ts rebuilt");
  }
}

async function processDatasheets() {
  console.log("\n=== Fixing Datasheets ===\n");

  const report = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "haiku-audit-report.json"), "utf-8"));
  const datasheetsDir = "C:/Users/dshon/Projects/_backlog/Warhammer/datasheets";
  const factionDirs = fs.readdirSync(datasheetsDir).filter(d =>
    !d.startsWith("_") && fs.statSync(path.join(datasheetsDir, d)).isDirectory()
  );

  // Only fix datasheets that Haiku flagged (the sampled ones)
  const datasheetFindings = report.findings.filter(f => f.context && f.context.includes("Datasheet"));

  // Group by faction + unit
  const grouped = {};
  datasheetFindings.forEach(f => {
    const key = `${f.context}|${f.section}`;
    if (!grouped[key]) grouped[key] = { context: f.context, section: f.section, findings: [] };
    grouped[key].findings.push(f);
  });

  for (const [key, group] of Object.entries(grouped)) {
    const factionSlug = group.context.replace(' Datasheet', '').replace(/ /g, '-');
    const unitName = group.section;

    // Find the unit file
    const factionDir = path.join(datasheetsDir, factionSlug);
    if (!fs.existsSync(factionDir)) continue;

    const unitFile = fs.readdirSync(factionDir).find(f => {
      const nameFromFile = f.replace('.json', '').replace(/_/g, ' ');
      return nameFromFile.toLowerCase() === unitName.toLowerCase() ||
             f.replace('.json', '') === unitName.replace(/ /g, '_');
    });

    if (!unitFile) continue;

    const unitPath = path.join(factionDir, unitFile);
    const unitData = JSON.parse(fs.readFileSync(unitPath, "utf-8"));

    process.stdout.write(`  ${group.context} > ${unitName} (${group.findings.length} findings)... `);
    const fixed = await fixData(unitName, unitData, group.findings, group.context);
    if (fixed) {
      fs.writeFileSync(unitPath, JSON.stringify(fixed, null, 2), "utf-8");
      console.log(`✅`);
    } else {
      console.log(`⚠️  kept original`);
    }
    await new Promise(r => setTimeout(r, 500));
  }
}

async function main() {
  console.log("🔧 Sonnet Fix-All Pipeline");
  console.log("==========================");
  console.log(`Model: ${MODEL}`);
  console.log(`Target: ALL 1,188 issues from Haiku audit`);
  console.log("");

  const startTime = Date.now();

  await processGeneralRules();
  await processFactionRules();
  await processDatasheets();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const inputCost = (totalInputTokens * 3) / 1000000;
  const outputCost = (totalOutputTokens * 15) / 1000000;

  console.log("\n==========================");
  console.log("📊 FINAL STATS");
  console.log(`  API calls: ${totalCalls}`);
  console.log(`  Input tokens: ${totalInputTokens.toLocaleString()}`);
  console.log(`  Output tokens: ${totalOutputTokens.toLocaleString()}`);
  console.log(`  Input cost: $${inputCost.toFixed(2)}`);
  console.log(`  Output cost: $${outputCost.toFixed(2)}`);
  console.log(`  TOTAL COST: $${(inputCost + outputCost).toFixed(2)}`);
  console.log(`  Time: ${elapsed}s`);
  console.log("==========================");
}

main().catch(console.error);
