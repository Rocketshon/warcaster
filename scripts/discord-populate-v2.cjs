/**
 * discord-populate-v2.cjs
 * Populates the Warcaster Discord server with Forum channels for browsing game data.
 * Uses only built-in Node.js modules (fs, https). No npm packages.
 *
 * Usage:  node scripts/discord-populate-v2.cjs
 * Budget: ~2.5 hours for 1682 units at 1.5s per API call
 */

const fs = require('fs');
const https = require('https');

// ─── Config ──────────────────────────────────────────────────────────────────

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID || '1488399332163063979';
if (!BOT_TOKEN) { console.error('Set DISCORD_BOT_TOKEN env var'); process.exit(1); }
const KEEP_CHANNEL_ID = '1488402248685064275';   // #app-data
const KEEP_CATEGORY_ID = '1488401805061787669';   // App Data (Hidden) category

const DATA_DIR = 'C:/Users/dshon/Projects/CrusadeCommand/dist-data/wh40k-10e';

const API_DELAY_MS = 1500;

// ─── Faction constants ───────────────────────────────────────────────────────

const FACTION_COLORS = {
  space_marines: 0x3B82F6, grey_knights: 0x94A3B8, adepta_sororitas: 0xEF4444,
  adeptus_custodes: 0xF59E0B, adeptus_mechanicus: 0xEA580C, astra_militarum: 0x16A34A,
  imperial_knights: 0xCA8A04, imperial_agents: 0xA855F7, adeptus_titanicus: 0x71717A,
  chaos_space_marines: 0xEF4444, death_guard: 0x84CC16, thousand_sons: 0x3B82F6,
  world_eaters: 0xDC2626, emperors_children: 0xA855F7, chaos_daemons: 0xF43F5E, chaos_knights: 0x78716C,
  aeldari: 0x10B981, drukhari: 0x8B5CF6, necrons: 0x10B981, orks: 0x16A34A,
  tau_empire: 0x0EA5E9, tyranids: 0xA855F7, genestealer_cults: 0x6366F1,
  leagues_of_votann: 0xEA580C, unaligned_forces: 0x71717A,
};

const FACTION_NAMES = {
  space_marines: 'Space Marines', grey_knights: 'Grey Knights', adepta_sororitas: 'Adepta Sororitas',
  adeptus_custodes: 'Adeptus Custodes', adeptus_mechanicus: 'Adeptus Mechanicus',
  astra_militarum: 'Astra Militarum', imperial_knights: 'Imperial Knights',
  imperial_agents: 'Imperial Agents', adeptus_titanicus: 'Adeptus Titanicus',
  chaos_space_marines: 'Chaos Space Marines', death_guard: 'Death Guard',
  thousand_sons: 'Thousand Sons', world_eaters: 'World Eaters',
  emperors_children: "Emperor's Children", chaos_daemons: 'Chaos Daemons', chaos_knights: 'Chaos Knights',
  aeldari: 'Aeldari', drukhari: 'Drukhari', necrons: 'Necrons', orks: 'Orks',
  tau_empire: "T'au Empire", tyranids: 'Tyranids', genestealer_cults: 'Genestealer Cults',
  leagues_of_votann: 'Leagues of Votann', unaligned_forces: 'Unaligned Forces',
};

const ALLEGIANCE = {
  imperium: ['space_marines', 'grey_knights', 'adepta_sororitas', 'adeptus_custodes',
    'adeptus_mechanicus', 'astra_militarum', 'imperial_knights', 'imperial_agents', 'adeptus_titanicus'],
  chaos: ['chaos_space_marines', 'death_guard', 'thousand_sons', 'world_eaters',
    'emperors_children', 'chaos_daemons', 'chaos_knights'],
  xenos: ['aeldari', 'drukhari', 'necrons', 'orks', 'tau_empire', 'tyranids',
    'genestealer_cults', 'leagues_of_votann', 'unaligned_forces'],
};

const GOLD = 0xD4A843;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function truncate(str, max) {
  if (!str) return '';
  str = String(str);
  if (str.length <= max) return str;
  return str.slice(0, max - 3) + '...';
}

/** Make an HTTPS request to the Discord API. Returns parsed JSON. */
function discord(method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'discord.com',
      path: `/api/v10${path}`,
      method,
      headers: {
        'Authorization': `Bot ${BOT_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'WarcasterBot (https://github.com/rocketshon/crusade-command, 1.0)',
      },
    };
    if (payload) {
      options.headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        // 204 No Content
        if (res.statusCode === 204) return resolve(null);
        let parsed;
        try { parsed = JSON.parse(data); } catch { parsed = data; }

        // Rate limited
        if (res.statusCode === 429) {
          const retryAfter = (parsed && parsed.retry_after) || 5;
          console.log(`  [429] Rate limited, waiting ${retryAfter}s...`);
          sleep(retryAfter * 1000 + 500).then(() => {
            discord(method, path, body).then(resolve).catch(reject);
          });
          return;
        }

        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(parsed);
        } else {
          reject(new Error(`Discord API ${method} ${path} — ${res.statusCode}: ${JSON.stringify(parsed)}`));
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

/** Throttled Discord call with delay */
async function discordThrottled(method, path, body) {
  await sleep(API_DELAY_MS);
  return discord(method, path, body);
}

// ─── Step 1: Clean up old channels ──────────────────────────────────────────

const DEFAULT_NAMES_TEXT = ['general'];
const DEFAULT_NAMES_VOICE = ['General'];

async function cleanupOldChannels() {
  console.log('\n=== Step 1: Cleaning up old channels ===\n');
  const channels = await discord('GET', `/guilds/${GUILD_ID}/channels`);

  let deleted = 0;
  for (const ch of channels) {
    // Keep default text #general
    if (DEFAULT_NAMES_TEXT.includes(ch.name) && ch.type === 0) continue;
    // Keep default voice General
    if (DEFAULT_NAMES_VOICE.includes(ch.name) && ch.type === 2) continue;
    // Keep #app-data
    if (ch.id === KEEP_CHANNEL_ID) continue;
    // Keep App Data (Hidden) category
    if (ch.id === KEEP_CATEGORY_ID) continue;

    console.log(`  Deleting: #${ch.name} (${ch.id}, type ${ch.type})`);
    try {
      await discordThrottled('DELETE', `/channels/${ch.id}`);
      deleted++;
    } catch (err) {
      console.error(`  Failed to delete #${ch.name}: ${err.message}`);
    }
  }
  console.log(`  Deleted ${deleted} channels.\n`);
}

// ─── Step 2: Core Rules ──────────────────────────────────────────────────────

async function createCoreRules() {
  console.log('=== Step 2: Creating CORE RULES category + channel ===\n');

  // Create category
  const category = await discordThrottled('POST', `/guilds/${GUILD_ID}/channels`, {
    name: 'CORE RULES',
    type: 4, // category
  });
  console.log(`  Created category: ${category.name} (${category.id})`);

  // Create text channel
  const channel = await discordThrottled('POST', `/guilds/${GUILD_ID}/channels`, {
    name: 'core-rules',
    type: 0, // text
    parent_id: category.id,
    topic: 'Warhammer 40K 10th Edition Core Rules reference',
  });
  console.log(`  Created channel: #${channel.name} (${channel.id})`);

  // Load core rules
  const general = JSON.parse(fs.readFileSync(`${DATA_DIR}/general.json`, 'utf8'));
  const sections = general.coreRules.sections;

  console.log(`  Posting ${sections.length} core rules sections as embeds...\n`);

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const sectionText = buildSectionText(section);

    const embed = {
      title: truncate(section.name, 256),
      description: truncate(sectionText, 4096),
      color: GOLD,
      footer: { text: `Section ${i + 1} of ${sections.length}` },
    };

    console.log(`  [${i + 1}/${sections.length}] ${section.name}`);
    await discordThrottled('POST', `/channels/${channel.id}/messages`, { embeds: [embed] });
  }

  console.log('\n  Core rules posted.\n');
  return category.id;
}

/** Build readable text from a core rules section */
function buildSectionText(section) {
  let text = '';

  // Main text (strip [TABLE: ...] blocks for embed readability)
  if (section.text) {
    let cleaned = section.text
      .replace(/\[TABLE:\s*\[[\s\S]*?\]\]/g, '[See table in app]')
      .trim();
    text += cleaned;
  }

  // Accordion items
  if (section.accordion && section.accordion.length > 0) {
    for (const item of section.accordion) {
      text += `\n\n**${item.title}**\n${item.text || ''}`;
    }
  }

  return text || 'No content available.';
}

// ─── Step 3 & 4: Datasheet Forums ────────────────────────────────────────────

async function createDatasheetForums() {
  console.log('=== Step 3: Creating DATASHEETS category + forum channels ===\n');

  // Create category
  const category = await discordThrottled('POST', `/guilds/${GUILD_ID}/channels`, {
    name: 'DATASHEETS',
    type: 4,
  });
  console.log(`  Created category: ${category.name} (${category.id})`);

  // Create 3 forum channels
  const forums = {};
  for (const allegiance of ['imperium', 'chaos', 'xenos']) {
    const forum = await discordThrottled('POST', `/guilds/${GUILD_ID}/channels`, {
      name: `${allegiance}-datasheets`,
      type: 15, // Forum
      parent_id: category.id,
      topic: `Warhammer 40K 10th Edition ${allegiance.charAt(0).toUpperCase() + allegiance.slice(1)} unit datasheets`,
    });
    forums[allegiance] = forum;
    console.log(`  Created forum: #${forum.name} (${forum.id})`);
  }

  // Load units
  const allUnits = JSON.parse(fs.readFileSync(`${DATA_DIR}/units.json`, 'utf8'));

  // Build flat list with allegiance
  const unitList = [];
  for (const [factionId, units] of Object.entries(allUnits)) {
    const allegiance = getAllegiance(factionId);
    if (!allegiance) {
      console.log(`  Warning: No allegiance for faction ${factionId}, skipping.`);
      continue;
    }
    for (const unit of units) {
      unitList.push({ unit, factionId, allegiance });
    }
  }

  console.log(`\n=== Step 4: Populating ${unitList.length} unit datasheet threads ===\n`);

  for (let i = 0; i < unitList.length; i++) {
    const { unit, factionId, allegiance } = unitList[i];
    const factionName = FACTION_NAMES[factionId] || factionId;
    const forumId = forums[allegiance].id;

    const threadName = truncate(`${unit.name} (${factionName})`, 100);
    const embed = buildUnitEmbed(unit, factionId, factionName);

    console.log(`  [${i + 1}/${unitList.length}] ${factionName} — ${unit.name}`);

    try {
      await discordThrottled('POST', `/channels/${forumId}/threads`, {
        name: threadName,
        message: { embeds: [embed] },
      });
    } catch (err) {
      console.error(`  ERROR creating thread for ${unit.name}: ${err.message}`);
    }
  }

  console.log('\n  All datasheet threads posted.\n');
}

function getAllegiance(factionId) {
  for (const [alleg, factions] of Object.entries(ALLEGIANCE)) {
    if (factions.includes(factionId)) return alleg;
  }
  return null;
}

function buildUnitEmbed(unit, factionId, factionName) {
  const color = FACTION_COLORS[factionId] || 0x71717A;
  const fields = [];

  // Stats
  if (unit.stats) {
    const s = unit.stats;
    fields.push({
      name: 'Stats',
      value: truncate(`M: ${s.M} | T: ${s.T} | Sv: ${s.Sv} | W: ${s.W} | Ld: ${s.Ld} | OC: ${s.OC}`, 1024),
      inline: false,
    });
  }

  // Invuln
  if (unit.invuln) {
    fields.push({ name: 'Invulnerable Save', value: String(unit.invuln), inline: true });
  }

  // Points
  if (unit.points && unit.points.length > 0) {
    const ptLines = unit.points.map(p => `${p.models}: ${p.cost} pts`).join('\n');
    fields.push({ name: 'Points', value: truncate(ptLines, 1024), inline: false });
  }

  // Ranged Weapons
  if (unit.ranged_weapons && unit.ranged_weapons.length > 0) {
    const lines = unit.ranged_weapons.map(w => {
      let line = `**${w.name}** — ${w.range} A:${w.A} ${w.skill} S:${w.S} AP:${w.AP} D:${w.D}`;
      if (w.traits && w.traits.length > 0) line += ` [${w.traits.join(', ')}]`;
      return line;
    });
    fields.push({ name: 'Ranged Weapons', value: truncate(lines.join('\n'), 1024), inline: false });
  }

  // Melee Weapons
  if (unit.melee_weapons && unit.melee_weapons.length > 0) {
    const lines = unit.melee_weapons.map(w => {
      let line = `**${w.name}** — ${w.range} A:${w.A} ${w.skill} S:${w.S} AP:${w.AP} D:${w.D}`;
      if (w.traits && w.traits.length > 0) line += ` [${w.traits.join(', ')}]`;
      return line;
    });
    fields.push({ name: 'Melee Weapons', value: truncate(lines.join('\n'), 1024), inline: false });
  }

  // Abilities
  if (unit.abilities) {
    let abilText = '';
    if (unit.abilities.core && unit.abilities.core.length > 0) {
      abilText += `**Core:** ${unit.abilities.core.join(', ')}\n`;
    }
    if (unit.abilities.faction) {
      const factionAbils = Array.isArray(unit.abilities.faction)
        ? unit.abilities.faction.join(', ')
        : String(unit.abilities.faction);
      if (factionAbils) abilText += `**Faction:** ${factionAbils}\n`;
    }
    if (unit.abilities.other && unit.abilities.other.length > 0) {
      for (const abil of unit.abilities.other) {
        // abilities.other is array of [name, text] tuples
        if (Array.isArray(abil) && abil.length >= 2) {
          abilText += `**${abil[0]}:** ${abil[1]}\n`;
        } else if (typeof abil === 'string') {
          abilText += `${abil}\n`;
        }
      }
    }
    if (abilText) {
      fields.push({ name: 'Abilities', value: truncate(abilText.trim(), 1024), inline: false });
    }
  }

  // Leader
  if (unit.leader) {
    fields.push({ name: 'Leader', value: truncate(unit.leader, 1024), inline: false });
  }

  // Unit Composition
  if (unit.unit_composition) {
    fields.push({ name: 'Unit Composition', value: truncate(unit.unit_composition, 1024), inline: false });
  }

  // Keywords
  if (unit.keywords && unit.keywords.length > 0) {
    fields.push({ name: 'Keywords', value: truncate(unit.keywords.join(', '), 1024), inline: false });
  }

  // Description
  let description = factionName;
  if (unit.keywords && unit.keywords.length > 0) {
    description += `\n*${truncate(unit.keywords.join(', '), 200)}*`;
  }

  // Enforce embed total char limit of 6000
  const embed = {
    title: truncate(unit.name, 256),
    description: truncate(description, 4096),
    color,
    fields: trimFieldsToFit(fields, 6000 - (unit.name.length + description.length + 100)),
  };

  return embed;
}

/** Trim fields array to fit within a total character budget */
function trimFieldsToFit(fields, budget) {
  const result = [];
  let used = 0;
  for (const f of fields) {
    const fieldSize = (f.name || '').length + (f.value || '').length;
    if (used + fieldSize > budget) {
      // Try truncating value to fit
      const remaining = budget - used - (f.name || '').length - 10;
      if (remaining > 50) {
        result.push({ ...f, value: truncate(f.value, Math.min(remaining, 1024)) });
      }
      break;
    }
    result.push(f);
    used += fieldSize;
  }
  return result;
}

// ─── Step 5: Faction Rules Forum ─────────────────────────────────────────────

async function createFactionRulesForum() {
  console.log('=== Step 5: Creating FACTION RULES category + forum ===\n');

  // Create category
  const category = await discordThrottled('POST', `/guilds/${GUILD_ID}/channels`, {
    name: 'FACTION RULES',
    type: 4,
  });
  console.log(`  Created category: ${category.name} (${category.id})`);

  // Create forum channel
  const forum = await discordThrottled('POST', `/guilds/${GUILD_ID}/channels`, {
    name: 'faction-rules',
    type: 15,
    parent_id: category.id,
    topic: 'Warhammer 40K 10th Edition faction detachments, enhancements, and stratagems',
  });
  console.log(`  Created forum: #${forum.name} (${forum.id})`);

  // Load rules
  const allRules = JSON.parse(fs.readFileSync(`${DATA_DIR}/rules.json`, 'utf8'));

  // Count total detachments
  let totalDets = 0;
  for (const factionId of Object.keys(allRules)) {
    const data = allRules[factionId];
    if (data.detachments) totalDets += data.detachments.length;
  }

  console.log(`\n  Populating ${totalDets} detachment threads...\n`);

  let idx = 0;
  for (const [factionId, data] of Object.entries(allRules)) {
    const factionName = FACTION_NAMES[factionId] || factionId;
    if (!data.detachments) continue;

    for (const det of data.detachments) {
      idx++;
      const threadName = truncate(`${det.name} (${factionName})`, 100);
      const embed = buildDetachmentEmbed(det, factionId, factionName);

      console.log(`  [${idx}/${totalDets}] ${factionName} — ${det.name}`);

      try {
        await discordThrottled('POST', `/channels/${forum.id}/threads`, {
          name: threadName,
          message: { embeds: [embed] },
        });
      } catch (err) {
        console.error(`  ERROR creating thread for ${det.name}: ${err.message}`);
      }
    }
  }

  console.log('\n  All faction rules threads posted.\n');
}

function buildDetachmentEmbed(det, factionId, factionName) {
  const color = FACTION_COLORS[factionId] || 0x71717A;
  const fields = [];

  // Enhancements
  if (det.enhancements && det.enhancements.length > 0) {
    for (const enh of det.enhancements) {
      fields.push({
        name: truncate(`${enh.name} (${enh.cost} pts)`, 256),
        value: truncate(enh.text || 'No description.', 1024),
        inline: false,
      });
    }
  }

  // Stratagems
  if (det.stratagems && det.stratagems.length > 0) {
    for (const strat of det.stratagems) {
      let stratValue = '';
      if (strat.when) stratValue += `**When:** ${strat.when}\n`;
      if (strat.target) stratValue += `**Target:** ${strat.target}\n`;
      if (strat.effect) stratValue += `**Effect:** ${strat.effect}`;
      if (strat.restrictions) stratValue += `\n**Restrictions:** ${strat.restrictions}`;

      fields.push({
        name: truncate(`${strat.name} (${strat.cp}, ${strat.type || 'Stratagem'})`, 256),
        value: truncate(stratValue || 'No description.', 1024),
        inline: false,
      });
    }
  }

  // Rule description
  let description = '';
  if (det.rule) {
    if (det.rule.name) description += `**${det.rule.name}**\n`;
    if (det.rule.text) description += det.rule.text;
  }

  // Enforce embed limits
  const embed = {
    title: truncate(det.name, 256),
    description: truncate(description, 4096),
    color,
    footer: { text: factionName },
    fields: trimFieldsToFit(fields, 6000 - Math.min(description.length, 4096) - (det.name || '').length - 100),
  };

  return embed;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const startTime = Date.now();
  console.log('============================================');
  console.log('  Warcaster Discord Populate v2');
  console.log('  Forum channels for browsing game data');
  console.log('============================================\n');

  try {
    await cleanupOldChannels();
    await createCoreRules();
    await createDatasheetForums();
    await createFactionRulesForum();

    const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    console.log('============================================');
    console.log(`  DONE! Completed in ${elapsed} minutes.`);
    console.log('============================================');
  } catch (err) {
    console.error('\nFATAL ERROR:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

main();
