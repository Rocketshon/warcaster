// ---------------------------------------------------------------------------
// Warcaster Mobile — Data Layer (Swappable)
//
// All game data is loaded dynamically via GameDataContext. The bundled data
// files (units.ts, rules.ts, general.ts) serve as fallbacks when no external
// data is loaded. The setGameData() function replaces the active data.
// ---------------------------------------------------------------------------

import type { Datasheet, FactionRulesData, FactionId, GeneralRulesDocument } from '../types';

// Bundled fallback data (static imports)
import { UNITS as BUNDLED_UNITS } from './units';
import { FACTION_RULES as BUNDLED_RULES } from './rules';
import { CORE_RULES as BUNDLED_CORE_RULES, CRUSADE_RULES as BUNDLED_CRUSADE_RULES, RULES_COMMENTARY as BUNDLED_COMMENTARY } from './general';

// ---------------------------------------------------------------------------
// Mutable data store — starts with bundled data, replaced by setGameData()
// ---------------------------------------------------------------------------

let _units: Record<string, Datasheet[]> = BUNDLED_UNITS;
let _rules: Record<string, FactionRulesData> = BUNDLED_RULES;
let _coreRules: GeneralRulesDocument | null = BUNDLED_CORE_RULES;
let _crusadeRules: GeneralRulesDocument | null = BUNDLED_CRUSADE_RULES;
let _rulesCommentary: GeneralRulesDocument | null = BUNDLED_COMMENTARY;

// Track whether external data has been loaded
let _externalDataLoaded = false;

/** Replace the active game data (called by GameDataContext) */
export function setGameData(
  units: Record<string, Datasheet[]>,
  rules: Record<string, FactionRulesData>,
  coreRules: GeneralRulesDocument | null,
  crusadeRules: GeneralRulesDocument | null,
  rulesCommentary: GeneralRulesDocument | null,
): void {
  _units = units;
  _rules = rules;
  _coreRules = coreRules;
  _crusadeRules = crusadeRules;
  _rulesCommentary = rulesCommentary;
  _externalDataLoaded = true;
}

/** Reset to bundled fallback data */
export function clearGameData(): void {
  _units = BUNDLED_UNITS;
  _rules = BUNDLED_RULES;
  _coreRules = BUNDLED_CORE_RULES;
  _crusadeRules = BUNDLED_CRUSADE_RULES;
  _rulesCommentary = BUNDLED_COMMENTARY;
  _externalDataLoaded = false;
}

/** Whether external data has been loaded */
export function isExternalDataLoaded(): boolean {
  return _externalDataLoaded;
}

// ---------------------------------------------------------------------------
// Public API — same signatures as before, now reads from mutable store
// ---------------------------------------------------------------------------

// Getter functions — ES module re-exports of `let` vars don't track mutations,
// so all consumers must use these functions instead of named imports.
export function getUNITS(): Record<string, Datasheet[]> { return _units; }
export function getFACTION_RULES(): Record<string, FactionRulesData> { return _rules; }
export function getCORE_RULES(): GeneralRulesDocument | null { return _coreRules; }
export function getCRUSADE_RULES(): GeneralRulesDocument | null { return _crusadeRules; }
export function getRULES_COMMENTARY(): GeneralRulesDocument | null { return _rulesCommentary; }

export function getUnitsForFaction(factionId: FactionId): Datasheet[] {
  return _units[factionId] ?? [];
}

export function getRulesForFaction(factionId: FactionId): FactionRulesData | undefined {
  return _rules[factionId];
}

export function getAllFactionSlugs(): FactionId[] {
  return Object.keys(_units) as FactionId[];
}

export function searchUnits(query: string, factionId?: FactionId): Datasheet[] {
  const q = query.toLowerCase().trim();
  if (!q) return factionId ? getUnitsForFaction(factionId) : getAllUnits();
  const pool = factionId ? getUnitsForFaction(factionId) : getAllUnits();
  return pool.filter(
    (u) =>
      u.name.toLowerCase().includes(q) ||
      u.keywords.some((k) => k.toLowerCase().includes(q))
  );
}

export function getAllUnits(): Datasheet[] {
  const all: Datasheet[] = [];
  for (const factionId of getAllFactionSlugs()) {
    all.push(...getUnitsForFaction(factionId));
  }
  return all;
}
