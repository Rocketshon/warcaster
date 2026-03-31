/**
 * discord-populate.cjs
 * Populates a Discord server with formatted Warhammer 40K faction data.
 * Uses only built-in Node.js modules (fs, https).
 *
 * Idempotent: deletes previously created faction/rules channels before recreating.
 */

const fs = require('fs');
const https = require('https');

// ─── Config ──────────────────────────────────────────────────────────────────

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID || '1488399332163063979';
if (!BOT_TOKEN) { console.error('Set DISCORD_BOT_TOKEN env var'); process.exit(1); }
const EXISTING_CHANNEL_ID = '1488402248685064275'; // #wh40k-10e -> #app-data
const EXISTING_CATEGORY_ID = '1488401805061787669'; // Game Data -> App Data (Hidden)

const DATA_DIR = 'C:/Users/dshon/Projects/CrusadeCommand/dist-data/wh40k-10e';

const FACTION_COLORS = {
  space_marines: 0x3B82F6,
  grey_knights: 0x94A3B8,
  adepta_sororitas: 0xEF4444,
  adeptus_custodes: 0xF59E0B,
  astra_militarum: 0x16A34A,
  imperial_knights: 0xCA8A04,
  chaos_space_marines: 0xEF4444,
  death_guard: 0x84CC16,
  thousand_sons: 0x3B82F6,
  world_eaters: 0xEF4444,
  chaos_daemons: 0xF43F5E,
  aeldari: 0x10B981,
  necrons: 0x10B981,
  orks: 0x16A34A,
  tau_empire: 0x0EA5E9,
  tyranids: 0xA855F7,
  drukhari: 0x8B5CF6,
};

const FACTION_EMOJIS = {
  space_marines: '\u{1F6E1}\u{FE0F}',
  grey_knights: '\u{2694}\u{FE0F}',
  adepta_sororitas: '\u{1F525}',
  adeptus_custodes: '\u{1F451}',
  astra_militarum: '\u{1F3D6}\u{FE0F}',
  imperial_knights: '\u{1F916}',
  chaos_space_marines: '\u{1F480}',
  death_guard: '\u{2620}\u{FE0F}',
  thousand_sons: '\u{1F52E}',
  world_eaters: '\u{1FA78}',
  chaos_daemons: '\u{1F47F}',
  aeldari: '\u{2728}',
  necrons: '\u{1F4A0}',
  orks: '\u{1F4A5}',
  tau_empire: '\u{1F52D}',
  tyranids: '\u{1F41B}',
  drukhari: '\u{1F5E1}\u{FE0F}',
};

const CATEGORIES = {
  IMPERIUM: [
    'space-marines', 'grey-knights', 'adepta-sororitas',
    'adeptus-custodes', 'astra-militarum', 'imperial-knights',
  ],
  CHAOS: [
    'chaos-space-marines', 'death-guard', 'thousand-sons',
    'world-eaters', 'chaos-daemons',
  ],
  XENOS: [
    'aeldari', 'necrons', 'orks', 'tau-empire', 'tyranids', 'drukhari',
  ],
};

// All channel names we manage (for cleanup)
const ALL_MANAGED_CHANNELS = [
  ...CATEGORIES.IMPERIUM, ...CATEGORIES.CHAOS, ...CATEGORIES.XENOS,
  'core-rules',
];
const ALL_MANAGED_CATEGORIES = ['IMPERIUM', 'CHAOS', 'XENOS', 'RULES'];

function channelToFactionId(channel) {
  return channel.replace(/-/g, '_');
}

function factionDisplayName(factionId) {
  return factionId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ─── Discord API helpers ────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function discordRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'discord.com',
      port: 443,
      path: `/api/v10${path}`,
      method,
      headers: {
        'Authorization': `Bot ${BOT_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'WarcasterBot (https://github.com/rocketshon/crusade-command, 1.0)',
      },
    };
    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => { responseData += chunk; });
      res.on('end', () => {
        if (res.statusCode === 429) {
          let retryAfter = 2;
          try {
            const parsed = JSON.parse(responseData);
            retryAfter = (parsed.retry_after || 2) + 0.5;
          } catch (e) { /* use default */ }
          console.log(`  [RATE LIMITED] Waiting ${retryAfter}s...`);
          sleep(retryAfter * 1000).then(() => discordRequest(method, path, body).then(resolve, reject));
          return;
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(responseData ? JSON.parse(responseData) : {});
          } catch (e) {
            resolve({});
          }
        } else {
          reject(new Error(`Discord API ${method} ${path} => ${res.statusCode}: ${responseData}`));
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function apiCall(method, path, body) {
  await sleep(1100); // Rate limit: ~1s between calls
  return discordRequest(method, path, body);
}

// ─── Channel management ─────────────────────────────────────────────────────

async function getGuildChannels() {
  return apiCall('GET', `/guilds/${GUILD_ID}/channels`);
}

async function deleteChannel(channelId) {
  return apiCall('DELETE', `/channels/${channelId}`);
}

async function renameChannel(channelId, newName) {
  console.log(`  Renaming channel ${channelId} -> #${newName}`);
  return apiCall('PATCH', `/channels/${channelId}`, { name: newName });
}

async function createCategory(name) {
  console.log(`  Creating category: ${name}`);
  return apiCall('POST', `/guilds/${GUILD_ID}/channels`, { name, type: 4 });
}

async function createTextChannel(name, parentId) {
  console.log(`  Creating channel: #${name}`);
  return apiCall('POST', `/guilds/${GUILD_ID}/channels`, {
    name,
    type: 0,
    parent_id: parentId,
  });
}

async function sendMessage(channelId, embeds) {
  // Safety: ensure each embed is under limit
  for (let i = 0; i < embeds.length; i++) {
    embeds[i] = safeEmbed(embeds[i]);
  }
  return apiCall('POST', `/channels/${channelId}/messages`, { embeds });
}

// ─── Text helpers ───────────────────────────────────────────────────────────

function trunc(text, max) {
  if (!text) return '*(No data)*';
  const s = String(text);
  if (s.length <= max) return s;
  return s.substring(0, max - 3) + '...';
}

function strip(text) {
  if (!text) return '';
  return String(text).replace(/\s+/g, ' ').trim();
}

/**
 * Measure total embed character count (Discord counts title + description +
 * footer.text + author.name + all field names + all field values).
 */
function embedCharCount(embed) {
  let total = 0;
  if (embed.title) total += embed.title.length;
  if (embed.description) total += embed.description.length;
  if (embed.footer && embed.footer.text) total += embed.footer.text.length;
  if (embed.author && embed.author.name) total += embed.author.name.length;
  if (embed.fields) {
    for (const f of embed.fields) {
      total += (f.name || '').length + (f.value || '').length;
    }
  }
  return total;
}

/**
 * Ensure an embed is under 6000 chars by truncating description if needed.
 * Also validates individual field limits.
 */
function safeEmbed(embed) {
  // Enforce individual limits first
  if (embed.title && embed.title.length > 256) {
    embed.title = embed.title.substring(0, 253) + '...';
  }
  if (embed.description && embed.description.length > 4096) {
    embed.description = embed.description.substring(0, 4093) + '...';
  }
  if (embed.fields) {
    for (const f of embed.fields) {
      if (f.name && f.name.length > 256) f.name = f.name.substring(0, 253) + '...';
      if (f.value && f.value.length > 1024) f.value = f.value.substring(0, 1021) + '...';
    }
  }

  // Now check total
  let count = embedCharCount(embed);
  while (count > 5900 && embed.description && embed.description.length > 200) {
    // Aggressively trim description
    embed.description = embed.description.substring(0, embed.description.length - 500) + '...';
    count = embedCharCount(embed);
  }
  // If still too big and we have fields, drop the last fields
  while (count > 5900 && embed.fields && embed.fields.length > 0) {
    embed.fields.pop();
    count = embedCharCount(embed);
  }
  return embed;
}

// ─── Embed builders ─────────────────────────────────────────────────────────

function buildFactionOverviewEmbed(factionId, rules) {
  const emoji = FACTION_EMOJIS[factionId] || '';
  const displayName = factionDisplayName(factionId);
  const color = FACTION_COLORS[factionId] || 0x808080;

  let armyRuleText = '*(No army rule data)*';
  if (rules && rules.army_rules) {
    if (Array.isArray(rules.army_rules)) {
      armyRuleText = rules.army_rules.join('\n\n');
    } else if (typeof rules.army_rules === 'string') {
      armyRuleText = rules.army_rules;
    } else if (typeof rules.army_rules === 'object' && rules.army_rules.text) {
      armyRuleText = rules.army_rules.text;
    }
  }

  return safeEmbed({
    color,
    title: `${emoji} ${displayName}`,
    description: trunc(strip(armyRuleText), 4000),
    footer: { text: 'Warcaster Data Hub' },
    timestamp: new Date().toISOString(),
  });
}

function buildDetachmentEmbeds(factionId, detachments) {
  if (!detachments || !Array.isArray(detachments)) return [];
  const color = FACTION_COLORS[factionId] || 0x808080;
  const embeds = [];

  for (const det of detachments) {
    const fields = [];

    // Detachment rule
    if (det.rule) {
      const ruleText = typeof det.rule === 'string' ? det.rule :
        (det.rule.text || JSON.stringify(det.rule));
      fields.push({
        name: det.rule.name || 'Rule',
        value: trunc(strip(ruleText), 1024),
        inline: false,
      });
    }

    // Enhancements
    if (det.enhancements && Array.isArray(det.enhancements)) {
      for (const enh of det.enhancements) {
        fields.push({
          name: trunc(`${enh.name} (${enh.cost || '?'}pts)`, 256),
          value: trunc(strip(enh.text || ''), 1024),
          inline: false,
        });
      }
    }

    // Stratagems
    if (det.stratagems && Array.isArray(det.stratagems)) {
      for (const strat of det.stratagems) {
        let body = '';
        if (strat.when) body += `**When:** ${strat.when}\n`;
        if (strat.target) body += `**Target:** ${strat.target}\n`;
        if (strat.effect) body += `**Effect:** ${strat.effect}`;
        fields.push({
          name: trunc(`${strat.name} [${strat.cp || '?'}]`, 256),
          value: trunc(strip(body || '*(No details)*'), 1024),
          inline: false,
        });
      }
    }

    // Split fields into chunks that fit in a single embed (<6000 chars, <=25 fields)
    const fieldChunks = [];
    let currentChunk = [];
    let currentSize = 0;
    const baseTitleLen = det.name.length + 20; // room for "(N/M)" suffix
    const footerLen = 18; // "Warcaster Data Hub"

    for (const field of fields) {
      const fieldSize = field.name.length + field.value.length;
      if (currentChunk.length >= 25 || (currentSize + fieldSize + baseTitleLen + footerLen) > 5800) {
        if (currentChunk.length > 0) fieldChunks.push(currentChunk);
        currentChunk = [];
        currentSize = 0;
      }
      currentChunk.push(field);
      currentSize += fieldSize;
    }
    if (currentChunk.length > 0) fieldChunks.push(currentChunk);
    if (fieldChunks.length === 0) fieldChunks.push([]);

    for (let i = 0; i < fieldChunks.length; i++) {
      embeds.push(safeEmbed({
        color,
        title: fieldChunks.length > 1 ? `${det.name} (${i + 1}/${fieldChunks.length})` : det.name,
        fields: fieldChunks[i],
        footer: { text: 'Warcaster Data Hub' },
      }));
    }
  }

  return embeds;
}

function buildUnitListEmbeds(factionId, units) {
  if (!units || !Array.isArray(units) || units.length === 0) return [];
  const color = FACTION_COLORS[factionId] || 0x808080;

  const activeUnits = units.filter(u => !u.legends);
  const embeds = [];
  const BATCH_SIZE = 20;

  for (let i = 0; i < activeUnits.length; i += BATCH_SIZE) {
    const batch = activeUnits.slice(i, i + BATCH_SIZE);
    const start = i + 1;
    const end = Math.min(i + BATCH_SIZE, activeUnits.length);

    const fields = batch.map(unit => {
      const s = unit.stats || {};
      const pts = unit.points && unit.points.length > 0 ? unit.points[0].cost : '?';
      const statLine = `M:${s.M || '?'} T:${s.T || '?'} Sv:${s.Sv || '?'} W:${s.W || '?'} | ${pts}pts`;
      return {
        name: trunc(unit.name, 256),
        value: statLine,
        inline: true,
      };
    });

    embeds.push(safeEmbed({
      color,
      title: `Datasheets (${start}-${end} of ${activeUnits.length})`,
      fields,
      footer: { text: 'Warcaster Data Hub' },
    }));
  }

  return embeds;
}

function buildCoreRuleEmbeds(sections) {
  if (!sections || !Array.isArray(sections)) return [];
  const embeds = [];

  for (const section of sections) {
    embeds.push(safeEmbed({
      color: 0xD4AF37,
      title: section.name || 'Core Rules',
      description: trunc(strip(section.text || ''), 4000),
      footer: { text: 'Warcaster Data Hub' },
    }));
  }

  return embeds;
}

// ─── Send embeds in batches respecting 6000 total char limit per message ────

async function sendEmbedsToChannel(channelId, embeds, label) {
  let sent = 0;
  let batch = [];
  let batchChars = 0;

  for (const embed of embeds) {
    const ec = embedCharCount(embed);
    // If adding this embed would exceed 6000 total or 10 embeds, flush current batch
    if (batch.length > 0 && (batchChars + ec > 5900 || batch.length >= 10)) {
      await sendMessage(channelId, batch);
      sent += batch.length;
      batch = [];
      batchChars = 0;
    }
    // If a single embed is over 5900, send it alone
    if (ec > 5900) {
      if (batch.length > 0) {
        await sendMessage(channelId, batch);
        sent += batch.length;
        batch = [];
        batchChars = 0;
      }
      await sendMessage(channelId, [safeEmbed(embed)]);
      sent++;
    } else {
      batch.push(embed);
      batchChars += ec;
    }
  }
  if (batch.length > 0) {
    await sendMessage(channelId, batch);
    sent += batch.length;
  }
  if (embeds.length > 0) console.log(`    [${label}] Sent ${sent}/${embeds.length} embeds`);
}

// ─── Cleanup previous run ───────────────────────────────────────────────────

async function cleanupPreviousRun() {
  console.log('Fetching existing guild channels for cleanup...');
  const channels = await getGuildChannels();

  const managedChannelNames = new Set(ALL_MANAGED_CHANNELS);
  const managedCategoryNames = new Set(ALL_MANAGED_CATEGORIES.map(n => n.toLowerCase()));

  // Find channels/categories to delete (from previous runs)
  const toDelete = [];
  for (const ch of channels) {
    // type 0 = text, type 4 = category
    if (ch.type === 0 && managedChannelNames.has(ch.name)) {
      toDelete.push(ch);
    }
    if (ch.type === 4 && managedCategoryNames.has(ch.name.toLowerCase())) {
      toDelete.push(ch);
    }
  }

  if (toDelete.length > 0) {
    console.log(`  Deleting ${toDelete.length} channels/categories from previous run...`);
    for (const ch of toDelete) {
      console.log(`    Deleting ${ch.type === 4 ? 'category' : 'channel'}: ${ch.name} (${ch.id})`);
      await deleteChannel(ch.id);
    }
  } else {
    console.log('  No previous channels to clean up.');
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Warcaster Discord Data Hub Population ===\n');

  // Load data files
  console.log('Loading data files...');
  const unitsData = JSON.parse(fs.readFileSync(`${DATA_DIR}/units.json`, 'utf8'));
  const rulesData = JSON.parse(fs.readFileSync(`${DATA_DIR}/rules.json`, 'utf8'));
  const generalData = JSON.parse(fs.readFileSync(`${DATA_DIR}/general.json`, 'utf8'));
  console.log('Data loaded.\n');

  // Step 0: Cleanup previous run
  console.log('--- Step 0: Cleanup previous run ---');
  await cleanupPreviousRun();

  // Step 1: Rename existing channel and category
  console.log('\n--- Step 1: Rename existing channels ---');
  try {
    await renameChannel(EXISTING_CHANNEL_ID, 'app-data');
  } catch (e) {
    console.log('  (Channel may already be renamed or missing, continuing)');
  }
  try {
    await renameChannel(EXISTING_CATEGORY_ID, 'App Data (Hidden)');
  } catch (e) {
    console.log('  (Category may already be renamed or missing, continuing)');
  }

  // Step 2: Create categories
  console.log('\n--- Step 2: Create categories ---');
  const categoryIds = {};
  for (const catName of ALL_MANAGED_CATEGORIES) {
    const cat = await createCategory(catName);
    categoryIds[catName] = cat.id;
  }

  // Step 3: Create faction channels and populate
  console.log('\n--- Step 3: Create faction channels and populate ---');

  for (const [category, channels] of Object.entries(CATEGORIES)) {
    console.log(`\n[${category}]`);
    for (const channelName of channels) {
      const factionId = channelToFactionId(channelName);
      const channel = await createTextChannel(channelName, categoryIds[category]);
      const channelId = channel.id;

      const rules = rulesData[factionId];
      const units = unitsData[factionId];

      // Message 1: Faction overview
      console.log(`    Posting data for ${factionDisplayName(factionId)}...`);
      const overviewEmbed = buildFactionOverviewEmbed(factionId, rules);
      await sendMessage(channelId, [overviewEmbed]);

      // Messages 2-N: Detachment embeds
      if (rules && rules.detachments) {
        const detEmbeds = buildDetachmentEmbeds(factionId, rules.detachments);
        await sendEmbedsToChannel(channelId, detEmbeds, 'Detachments');
      }

      // Messages N+: Unit list embeds
      if (units) {
        const unitEmbeds = buildUnitListEmbeds(factionId, units);
        await sendEmbedsToChannel(channelId, unitEmbeds, 'Units');
      }
    }
  }

  // Step 4: Core rules channel
  console.log('\n--- Step 4: Core Rules ---');
  const coreRulesChannel = await createTextChannel('core-rules', categoryIds.RULES);
  if (generalData.coreRules && generalData.coreRules.sections) {
    const coreEmbeds = buildCoreRuleEmbeds(generalData.coreRules.sections);
    await sendEmbedsToChannel(coreRulesChannel.id, coreEmbeds, 'Core Rules');
  }

  console.log('\n=== Done! Discord server populated. ===');
}

main().catch(err => {
  console.error('FATAL ERROR:', err);
  process.exit(1);
});
