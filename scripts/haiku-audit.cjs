/**
 * Haiku Data Quality Audit
 *
 * Sends all rules, datasheets, codex data through Haiku to flag
 * anything that looks wrong, incomplete, or needs fixing.
 * Does NOT make changes — just reports.
 */

const Anthropic = require("@anthropic-ai/sdk");
const fs = require("fs");
const path = require("path");

const API_KEY = process.env.ANTHROPIC_API_KEY || "";
const MODEL = "claude-haiku-4-5-20251001";

const client = new Anthropic({ apiKey: API_KEY });

let totalInputTokens = 0;
let totalOutputTokens = 0;
let totalCalls = 0;
const allFindings = [];

const SYSTEM_PROMPT = `You are a quality auditor for a Warhammer 40,000 app. You review game data for errors, inconsistencies, and issues.

For each piece of data you review, flag ANY of these issues:
1. EMPTY/MISSING - Fields that are blank, null, or missing when they shouldn't be
2. GARBLED TEXT - Scrambled, truncated, or nonsensical text (e.g., "SUSTAINEDHITS1" instead of "Sustained Hits 1")
3. WRONG DATA - Stats, costs, or rules that look incorrect for Warhammer 40K 10th edition
4. FORMATTING - Bad formatting, raw HTML/JSON artifacts, stray brackets, duplicate text
5. INCOMPLETE - Rules or descriptions that are cut off mid-sentence or clearly missing content
6. DUPLICATES - Same content repeated unnecessarily
7. INCONSISTENT - Data that contradicts itself within the same entry

Return a JSON array of findings. Each finding:
{"severity": "high|medium|low", "type": "EMPTY|GARBLED|WRONG|FORMATTING|INCOMPLETE|DUPLICATES|INCONSISTENT", "location": "specific field or section", "issue": "what's wrong", "suggestion": "what to fix"}

If everything looks good, return an empty array: []
Return ONLY the JSON array. No markdown, no code fences, no explanation.`;

async function audit(name, data, context) {
  const dataStr = typeof data === 'string' ? data : JSON.stringify(data, null, 1);

  // Skip very small items
  if (dataStr.length < 30) return [];

  // Truncate very large items to avoid token limits
  const truncated = dataStr.length > 30000 ? dataStr.substring(0, 30000) + "\n...[TRUNCATED]" : dataStr;

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Context: ${context}\nSection: "${name}"\n\nDATA:\n${truncated}` }],
    });

    totalInputTokens += response.usage.input_tokens;
    totalOutputTokens += response.usage.output_tokens;
    totalCalls++;

    let result = response.content[0].text.trim();
    result = result.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();

    const parsed = JSON.parse(result);
    if (Array.isArray(parsed)) {
      return parsed.map(f => ({ ...f, context, section: name }));
    }
    return [];
  } catch (err) {
    if (err instanceof SyntaxError) {
      // Haiku sometimes returns non-JSON, skip
      return [];
    }
    console.error(`    ❌ ${err.message}`);
    return [];
  }
}

async function auditGeneralRules() {
  console.log("\n=== Auditing General Rules ===\n");
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, "general-rules-data.json"), "utf-8"));

  for (const section of data.core_rules.sections) {
    process.stdout.write(`  Core > ${section.name}... `);
    const findings = await audit(section.name, section, "Core Rules");
    if (findings.length > 0) {
      console.log(`⚠️  ${findings.length} issues`);
      allFindings.push(...findings);
    } else {
      console.log(`✅`);
    }
    await new Promise(r => setTimeout(r, 200));
  }

  for (const section of data.crusade_rules.sections) {
    process.stdout.write(`  Crusade > ${section.name}... `);
    const findings = await audit(section.name, section, "General Crusade Rules");
    if (findings.length > 0) {
      console.log(`⚠️  ${findings.length} issues`);
      allFindings.push(...findings);
    } else {
      console.log(`✅`);
    }
    await new Promise(r => setTimeout(r, 200));
  }
}

async function auditFactionRules() {
  console.log("\n=== Auditing Faction Rules ===\n");
  const datasheetsDir = "C:/Users/dshon/Projects/_backlog/Warhammer/datasheets";
  const factionDirs = fs.readdirSync(datasheetsDir).filter(d =>
    !d.startsWith("_") && fs.statSync(path.join(datasheetsDir, d)).isDirectory()
  );

  for (const slug of factionDirs) {
    const jsonFiles = fs.readdirSync(path.join(datasheetsDir, slug))
      .filter(f => f.startsWith("_") && f.endsWith("_rules.json"));
    if (jsonFiles.length === 0) continue;

    const srcData = JSON.parse(fs.readFileSync(path.join(datasheetsDir, slug, jsonFiles[0]), "utf-8"));
    const factionName = srcData.faction || slug;

    // Audit army rules
    if (srcData.army_rules && srcData.army_rules.length > 0) {
      process.stdout.write(`  ${factionName} > Army Rules... `);
      const findings = await audit("Army Rules", srcData.army_rules, factionName);
      if (findings.length > 0) {
        console.log(`⚠️  ${findings.length} issues`);
        allFindings.push(...findings);
      } else {
        console.log(`✅`);
      }
      await new Promise(r => setTimeout(r, 200));
    }

    // Audit detachments (sample first 3)
    if (srcData.detachments) {
      for (const det of srcData.detachments.slice(0, 3)) {
        process.stdout.write(`  ${factionName} > ${det.name}... `);
        const findings = await audit(det.name, det, `${factionName} Detachment`);
        if (findings.length > 0) {
          console.log(`⚠️  ${findings.length} issues`);
          allFindings.push(...findings);
        } else {
          console.log(`✅`);
        }
        await new Promise(r => setTimeout(r, 200));
      }
    }

    // Audit crusade rules
    if (srcData.crusade_rules && srcData.crusade_rules.length > 0) {
      process.stdout.write(`  ${factionName} > Crusade Rules... `);
      const findings = await audit("Crusade Rules", srcData.crusade_rules, factionName);
      if (findings.length > 0) {
        console.log(`⚠️  ${findings.length} issues`);
        allFindings.push(...findings);
      } else {
        console.log(`✅`);
      }
      await new Promise(r => setTimeout(r, 200));
    }

    // Audit boarding actions
    if (srcData.boarding_actions && srcData.boarding_actions.length > 0) {
      process.stdout.write(`  ${factionName} > Boarding Actions... `);
      const findings = await audit("Boarding Actions", srcData.boarding_actions, factionName);
      if (findings.length > 0) {
        console.log(`⚠️  ${findings.length} issues`);
        allFindings.push(...findings);
      } else {
        console.log(`✅`);
      }
      await new Promise(r => setTimeout(r, 200));
    }
  }
}

async function auditDatasheets() {
  console.log("\n=== Auditing Datasheets (sampling) ===\n");
  const datasheetsDir = "C:/Users/dshon/Projects/_backlog/Warhammer/datasheets";
  const factionDirs = fs.readdirSync(datasheetsDir).filter(d =>
    !d.startsWith("_") && fs.statSync(path.join(datasheetsDir, d)).isDirectory()
  );

  for (const slug of factionDirs) {
    const unitFiles = fs.readdirSync(path.join(datasheetsDir, slug))
      .filter(f => !f.startsWith("_") && f.endsWith(".json"));

    if (unitFiles.length === 0) continue;

    // Sample 3 random units per faction
    const sampled = unitFiles.sort(() => Math.random() - 0.5).slice(0, 3);
    const factionLabel = slug.replace(/-/g, ' ');

    for (const unitFile of sampled) {
      const unitData = JSON.parse(fs.readFileSync(path.join(datasheetsDir, slug, unitFile), "utf-8"));
      const unitName = unitData.name || unitFile.replace('.json', '');
      process.stdout.write(`  ${factionLabel} > ${unitName}... `);
      const findings = await audit(unitName, unitData, `${factionLabel} Datasheet`);
      if (findings.length > 0) {
        console.log(`⚠️  ${findings.length} issues`);
        allFindings.push(...findings);
      } else {
        console.log(`✅`);
      }
      await new Promise(r => setTimeout(r, 200));
    }
  }
}

async function main() {
  console.log("🔍 Haiku Data Quality Audit");
  console.log("===========================");
  console.log(`Model: ${MODEL}`);
  console.log("");

  const startTime = Date.now();

  await auditGeneralRules();
  await auditFactionRules();
  await auditDatasheets();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const inputCost = (totalInputTokens * 0.80) / 1000000;
  const outputCost = (totalOutputTokens * 4) / 1000000;

  // Group findings by severity
  const high = allFindings.filter(f => f.severity === 'high');
  const medium = allFindings.filter(f => f.severity === 'medium');
  const low = allFindings.filter(f => f.severity === 'low');

  console.log("\n===========================");
  console.log("📊 AUDIT RESULTS");
  console.log(`  API calls: ${totalCalls}`);
  console.log(`  Total findings: ${allFindings.length}`);
  console.log(`    🔴 High: ${high.length}`);
  console.log(`    🟡 Medium: ${medium.length}`);
  console.log(`    🟢 Low: ${low.length}`);
  console.log(`  Input tokens: ${totalInputTokens.toLocaleString()}`);
  console.log(`  Output tokens: ${totalOutputTokens.toLocaleString()}`);
  console.log(`  TOTAL COST: $${(inputCost + outputCost).toFixed(2)}`);
  console.log(`  Time: ${elapsed}s`);
  console.log("===========================\n");

  // Print findings grouped by severity
  if (high.length > 0) {
    console.log("🔴 HIGH SEVERITY:");
    high.forEach((f, i) => {
      console.log(`\n  ${i + 1}. [${f.type}] ${f.context} > ${f.section} > ${f.location}`);
      console.log(`     Issue: ${f.issue}`);
      console.log(`     Fix: ${f.suggestion}`);
    });
  }

  if (medium.length > 0) {
    console.log("\n🟡 MEDIUM SEVERITY:");
    medium.forEach((f, i) => {
      console.log(`\n  ${i + 1}. [${f.type}] ${f.context} > ${f.section} > ${f.location}`);
      console.log(`     Issue: ${f.issue}`);
      console.log(`     Fix: ${f.suggestion}`);
    });
  }

  if (low.length > 0) {
    console.log("\n🟢 LOW SEVERITY:");
    low.forEach((f, i) => {
      console.log(`\n  ${i + 1}. [${f.type}] ${f.context} > ${f.section} > ${f.location}`);
      console.log(`     Issue: ${f.issue}`);
      console.log(`     Fix: ${f.suggestion}`);
    });
  }

  // Save full report
  const reportPath = path.join(__dirname, "..", "haiku-audit-report.json");
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    stats: { total: allFindings.length, high: high.length, medium: medium.length, low: low.length, cost: `$${(inputCost + outputCost).toFixed(2)}`, api_calls: totalCalls },
    findings: allFindings
  }, null, 2), "utf-8");
  console.log(`\n📄 Full report saved to: haiku-audit-report.json`);
}

main().catch(console.error);
