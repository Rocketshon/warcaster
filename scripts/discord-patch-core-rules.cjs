#!/usr/bin/env node
/**
 * Patch script: re-post the 7 core rule sections that failed due to embed size limits.
 * Uses the fixed buildCoreRuleSectionEmbeds from discord-populate-v2.cjs.
 */

const fs = require('fs');
const https = require('https');

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID || '1488399332163063979';
if (!BOT_TOKEN) { console.error('Set DISCORD_BOT_TOKEN env var'); process.exit(1); }
const API_DELAY = 1500;

const FAILED_SECTIONS = ['Books', 'Missions', 'Determining Visibility', 'Sequencing', 'Transports', 'Example Battlefields', 'Muster Your Army'];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function discordApi(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'discord.com',
      path: `/api/v10${path}`,
      method,
      headers: {
        'Authorization': `Bot ${BOT_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'WarcasterBot/2.0',
      },
    };
    if (data) options.headers['Content-Length'] = Buffer.byteLength(data);
    const req = https.request(options, (res) => {
      let chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString();
        if (res.statusCode === 204) return resolve(null);
        let json;
        try { json = JSON.parse(raw); } catch { json = raw; }
        resolve({ status: res.statusCode, data: json, headers: res.headers });
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function api(method, path, body) {
  let resp = await discordApi(method, path, body);
  while (resp && resp.status === 429) {
    const retryAfter = (resp.data && resp.data.retry_after) || 5;
    console.log(`  Rate limited! Waiting ${retryAfter + 0.5}s...`);
    await sleep((retryAfter + 0.5) * 1000);
    resp = await discordApi(method, path, body);
  }
  if (resp && resp.status >= 400) {
    console.error(`  API error ${resp.status}: ${JSON.stringify(resp.data).slice(0, 500)}`);
    return null;
  }
  await sleep(API_DELAY);
  return resp ? resp.data : null;
}

function trunc(str, max) {
  if (!str) return '';
  if (str.length <= max) return str;
  return str.slice(0, max - 3) + '...';
}

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

function buildCoreRuleSectionEmbeds(section) {
  const embeds = [];
  const descText = trunc(section.text || '', 3500);

  if (!section.accordion || section.accordion.length === 0) {
    embeds.push({
      title: section.name,
      description: descText || 'No content available.',
      color: 0xD4A017,
    });
    return embeds;
  }

  const firstEmbed = {
    title: section.name,
    description: descText || 'See sections below.',
    color: 0xD4A017,
    fields: [],
  };

  let remaining = [];
  for (const a of section.accordion) {
    const field = {
      name: trunc(a.title || 'Rule', 256),
      value: trunc(a.text || 'No text', 1024),
      inline: false,
    };
    firstEmbed.fields.push(field);
    if (embedCharCount(firstEmbed) > 5800 || firstEmbed.fields.length > 25) {
      firstEmbed.fields.pop();
      remaining.push(field);
    }
  }
  if (embedCharCount(firstEmbed) > 5800) {
    firstEmbed.description = trunc(firstEmbed.description, 2000);
    firstEmbed.fields = [];
    remaining = section.accordion.map(a => ({
      name: trunc(a.title || 'Rule', 256),
      value: trunc(a.text || 'No text', 1024),
      inline: false,
    }));
  }
  embeds.push(firstEmbed);

  while (remaining.length > 0 && embeds.length < 10) {
    const extra = {
      title: `${section.name} (cont.)`,
      color: 0xD4A017,
      fields: [],
    };
    while (remaining.length > 0 && extra.fields.length < 25) {
      extra.fields.push(remaining[0]);
      if (embedCharCount(extra) > 5800) {
        extra.fields.pop();
        break;
      }
      remaining.shift();
    }
    if (extra.fields.length > 0) embeds.push(extra);
    else { remaining.shift(); } // skip oversized single field
  }

  return embeds;
}

async function main() {
  console.log('=== Patching failed core rule sections ===\n');

  // Find the core-rules forum channel
  const channels = await api('GET', `/guilds/${GUILD_ID}/channels`);
  const coreRulesForum = channels.find(ch => ch.name === 'core-rules' && ch.type === 15);
  if (!coreRulesForum) {
    console.error('Could not find core-rules forum channel!');
    process.exit(1);
  }
  console.log(`Found core-rules forum: ${coreRulesForum.id}`);

  // Get the tag ID for "Core Rule"
  const coreTagId = coreRulesForum.available_tags?.find(t => t.name === 'Core Rule')?.id;

  // Load general data
  const general = JSON.parse(fs.readFileSync(__dirname + '/../dist-data/wh40k-10e/general.json', 'utf8'));
  const sections = general.coreRules.sections;

  for (const sectionName of FAILED_SECTIONS) {
    const section = sections.find(s => s.name === sectionName);
    if (!section) {
      console.log(`  Section "${sectionName}" not found, skipping`);
      continue;
    }

    // Discord total embed character limit is 6000 across ALL embeds in a message.
    // So we must post a single small embed, then follow up with additional messages.

    // First: create thread with a single concise embed
    const descText = section.text ? trunc(section.text, 4000) : 'See below for details.';
    const firstEmbed = {
      title: section.name,
      description: descText,
      color: 0xD4A017,
    };

    // If description alone is too big, truncate more
    if (embedCharCount(firstEmbed) > 5800) {
      firstEmbed.description = trunc(descText, 3000);
    }

    const totalChars = embedCharCount(firstEmbed);
    console.log(`  Posting: ${sectionName} (first embed: ${totalChars} chars)`);

    const body = {
      name: trunc(sectionName, 100),
      message: { embeds: [firstEmbed] },
    };
    if (coreTagId) body.applied_tags = [coreTagId];

    const result = await api('POST', `/channels/${coreRulesForum.id}/threads`, body);
    if (!result) {
      console.log(`  FAILED to create thread for: ${sectionName}`);
      continue;
    }
    console.log(`  Created thread: ${sectionName} (id: ${result.id})`);

    // Now post accordion items as follow-up messages in the thread
    if (section.accordion && section.accordion.length > 0) {
      // Batch accordion items into messages, each with a single embed under 6000 chars
      let currentFields = [];
      let currentSize = 50; // base overhead for title etc.

      for (const a of section.accordion) {
        const field = {
          name: trunc(a.title || 'Rule', 256),
          value: trunc(a.text || 'No text', 1024),
          inline: false,
        };
        const fieldSize = field.name.length + field.value.length;

        if (currentSize + fieldSize > 5500 || currentFields.length >= 25) {
          // Post what we have
          if (currentFields.length > 0) {
            const embed = {
              color: 0xD4A017,
              fields: currentFields,
            };
            console.log(`    Follow-up message: ${currentFields.length} fields, ~${embedCharCount(embed)} chars`);
            await api('POST', `/channels/${result.id}/messages`, { embeds: [embed] });
          }
          currentFields = [];
          currentSize = 50;
        }
        currentFields.push(field);
        currentSize += fieldSize;
      }

      // Post remaining
      if (currentFields.length > 0) {
        const embed = {
          color: 0xD4A017,
          fields: currentFields,
        };
        console.log(`    Follow-up message: ${currentFields.length} fields, ~${embedCharCount(embed)} chars`);
        await api('POST', `/channels/${result.id}/messages`, { embeds: [embed] });
      }
    }

    console.log(`  Done: ${sectionName}`);
  }

  console.log('\n=== Patch complete ===');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
