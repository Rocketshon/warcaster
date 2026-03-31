// ---------------------------------------------------------------------------
// Warcaster — Game Data Manager
// Fetches game data from external sources (Discord, GitHub, etc.)
// Caches in localStorage/IndexedDB for offline use.
// ---------------------------------------------------------------------------

import type { Datasheet, FactionRulesData, FactionId, GeneralRulesDocument } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GameManifestEntry {
  id: string;
  name: string;
  edition: string;
  icon: string;
  version: string;
  description: string;
  files: {
    units: string;
    rules: string;
    general: string;
  };
}

export interface GameManifest {
  version: string;
  updated: string;
  games: GameManifestEntry[];
}

export interface LoadedGameData {
  units: Record<string, Datasheet[]>;
  rules: Record<string, FactionRulesData>;
  general: {
    coreRules: GeneralRulesDocument | null;
    crusadeRules: GeneralRulesDocument | null;
    rulesCommentary: GeneralRulesDocument | null;
  };
}

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

const MANIFEST_CACHE_KEY = 'warcaster_game_manifest';
const ACTIVE_GAME_KEY = 'warcaster_active_game';
const DATA_CACHE_PREFIX = 'warcaster_game_data_';
const MANIFEST_TTL = 60 * 60 * 1000; // 1 hour

// ---------------------------------------------------------------------------
// Manifest management
// ---------------------------------------------------------------------------

/** Default manifest URL — can be overridden in Settings */
export function getManifestUrl(): string {
  try {
    const custom = localStorage.getItem('warcaster_api_manifestUrl');
    if (custom) return custom;
  } catch {}
  // Default: GitHub raw file (public, no auth needed)
  return 'https://raw.githubusercontent.com/Rocketshon/warcaster-data/main/manifest.json';
}

export async function fetchManifest(): Promise<GameManifest> {
  // Check cache
  try {
    const cached = localStorage.getItem(MANIFEST_CACHE_KEY);
    if (cached) {
      const { data, ts } = JSON.parse(cached);
      if (Date.now() - ts < MANIFEST_TTL) return data;
    }
  } catch {}

  const url = getManifestUrl();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch manifest: ${res.status}`);
  const manifest: GameManifest = await res.json();

  // Cache it
  try {
    localStorage.setItem(MANIFEST_CACHE_KEY, JSON.stringify({ data: manifest, ts: Date.now() }));
  } catch {}

  return manifest;
}

// ---------------------------------------------------------------------------
// Game data loading
// ---------------------------------------------------------------------------

export function getActiveGameId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_GAME_KEY);
  } catch { return null; }
}

export function setActiveGameId(gameId: string | null): void {
  try {
    if (gameId) localStorage.setItem(ACTIVE_GAME_KEY, gameId);
    else localStorage.removeItem(ACTIVE_GAME_KEY);
  } catch {}
}

/** Check if we have cached data for a game */
export function hasCachedGameData(gameId: string): boolean {
  try {
    return !!localStorage.getItem(`${DATA_CACHE_PREFIX}${gameId}_units`);
  } catch { return false; }
}

/** Get the cached version string for a game */
export function getCachedGameVersion(gameId: string): string | null {
  try {
    return localStorage.getItem(`${DATA_CACHE_PREFIX}${gameId}_version`);
  } catch { return null; }
}

/** Fetch and cache game data from the manifest entry */
export async function fetchGameData(game: GameManifestEntry): Promise<LoadedGameData> {
  // Check if we have cached data at this version
  const cachedVersion = getCachedGameVersion(game.id);
  if (cachedVersion === game.version) {
    const cached = loadCachedGameData(game.id);
    if (cached) return cached;
  }

  // Fetch all three data files in parallel
  const [unitsRes, rulesRes, generalRes] = await Promise.all([
    fetch(game.files.units),
    fetch(game.files.rules),
    fetch(game.files.general),
  ]);

  if (!unitsRes.ok) throw new Error(`Failed to fetch units: ${unitsRes.status}`);
  if (!rulesRes.ok) throw new Error(`Failed to fetch rules: ${rulesRes.status}`);
  if (!generalRes.ok) throw new Error(`Failed to fetch general: ${generalRes.status}`);

  const units = await unitsRes.json();
  const rules = await rulesRes.json();
  const general = await generalRes.json();

  const data: LoadedGameData = {
    units,
    rules,
    general: {
      coreRules: general.coreRules ?? general.CORE_RULES ?? null,
      crusadeRules: general.crusadeRules ?? general.CRUSADE_RULES ?? null,
      rulesCommentary: general.rulesCommentary ?? general.RULES_COMMENTARY ?? null,
    },
  };

  // Cache the data
  cacheGameData(game.id, game.version, data);

  return data;
}

function cacheGameData(gameId: string, version: string, data: LoadedGameData): void {
  try {
    localStorage.setItem(`${DATA_CACHE_PREFIX}${gameId}_version`, version);
    // Units and rules can be large — try to store, but don't crash on quota
    localStorage.setItem(`${DATA_CACHE_PREFIX}${gameId}_units`, JSON.stringify(data.units));
    localStorage.setItem(`${DATA_CACHE_PREFIX}${gameId}_rules`, JSON.stringify(data.rules));
    localStorage.setItem(`${DATA_CACHE_PREFIX}${gameId}_general`, JSON.stringify(data.general));
  } catch (e) {
    console.warn('Failed to cache game data (storage quota?):', e);
  }
}

function loadCachedGameData(gameId: string): LoadedGameData | null {
  try {
    const units = localStorage.getItem(`${DATA_CACHE_PREFIX}${gameId}_units`);
    const rules = localStorage.getItem(`${DATA_CACHE_PREFIX}${gameId}_rules`);
    const general = localStorage.getItem(`${DATA_CACHE_PREFIX}${gameId}_general`);
    if (!units || !rules || !general) return null;
    return {
      units: JSON.parse(units),
      rules: JSON.parse(rules),
      general: JSON.parse(general),
    };
  } catch { return null; }
}

/** Clear cached data for a specific game */
export function clearGameCache(gameId: string): void {
  try {
    localStorage.removeItem(`${DATA_CACHE_PREFIX}${gameId}_version`);
    localStorage.removeItem(`${DATA_CACHE_PREFIX}${gameId}_units`);
    localStorage.removeItem(`${DATA_CACHE_PREFIX}${gameId}_rules`);
    localStorage.removeItem(`${DATA_CACHE_PREFIX}${gameId}_general`);
  } catch {}
}

/** Clear all game data caches */
export function clearAllGameCaches(): void {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(DATA_CACHE_PREFIX));
    for (const key of keys) localStorage.removeItem(key);
    localStorage.removeItem(MANIFEST_CACHE_KEY);
    localStorage.removeItem(ACTIVE_GAME_KEY);
  } catch {}
}
