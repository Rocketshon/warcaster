// ---------------------------------------------------------------------------
// Warcaster Mobile — Game Data Manager
// Fetches game data from external sources (Discord, GitHub, etc.)
// Caches in AsyncStorage for offline use.
// ---------------------------------------------------------------------------

import AsyncStorage from '@react-native-async-storage/async-storage';
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
export async function getManifestUrl(): Promise<string> {
  try {
    const custom = await AsyncStorage.getItem('warcaster_api_manifestUrl');
    if (custom) return custom;
  } catch {}
  // Default: GitHub raw file (public, no auth needed)
  return 'https://raw.githubusercontent.com/Rocketshon/warcaster-data/main/manifest.json';
}

export async function fetchManifest(): Promise<GameManifest> {
  // Check cache
  try {
    const cached = await AsyncStorage.getItem(MANIFEST_CACHE_KEY);
    if (cached) {
      const { data, ts } = JSON.parse(cached);
      if (Date.now() - ts < MANIFEST_TTL) return data;
    }
  } catch {}

  const url = await getManifestUrl();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch manifest: ${res.status}`);
  const manifest: GameManifest = await res.json();

  // Cache it
  try {
    await AsyncStorage.setItem(MANIFEST_CACHE_KEY, JSON.stringify({ data: manifest, ts: Date.now() }));
  } catch {}

  return manifest;
}

// ---------------------------------------------------------------------------
// Game data loading
// ---------------------------------------------------------------------------

export async function getActiveGameId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(ACTIVE_GAME_KEY);
  } catch { return null; }
}

export async function setActiveGameId(gameId: string | null): Promise<void> {
  try {
    if (gameId) await AsyncStorage.setItem(ACTIVE_GAME_KEY, gameId);
    else await AsyncStorage.removeItem(ACTIVE_GAME_KEY);
  } catch {}
}

/** Check if we have cached data for a game */
export async function hasCachedGameData(gameId: string): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(`${DATA_CACHE_PREFIX}${gameId}_units`);
    return !!val;
  } catch { return false; }
}

/** Get the cached version string for a game */
export async function getCachedGameVersion(gameId: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(`${DATA_CACHE_PREFIX}${gameId}_version`);
  } catch { return null; }
}

/** Fetch and cache game data from the manifest entry */
export async function fetchGameData(game: GameManifestEntry): Promise<LoadedGameData> {
  // Check if we have cached data at this version
  const cachedVersion = await getCachedGameVersion(game.id);
  if (cachedVersion === game.version) {
    const cached = await loadCachedGameData(game.id);
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
  await cacheGameData(game.id, game.version, data);

  return data;
}

async function cacheGameData(gameId: string, version: string, data: LoadedGameData): Promise<void> {
  try {
    await AsyncStorage.setItem(`${DATA_CACHE_PREFIX}${gameId}_version`, version);
    // Units and rules can be large — try to store, but don't crash on quota
    await AsyncStorage.setItem(`${DATA_CACHE_PREFIX}${gameId}_units`, JSON.stringify(data.units));
    await AsyncStorage.setItem(`${DATA_CACHE_PREFIX}${gameId}_rules`, JSON.stringify(data.rules));
    await AsyncStorage.setItem(`${DATA_CACHE_PREFIX}${gameId}_general`, JSON.stringify(data.general));
  } catch (e) {
    console.warn('Failed to cache game data (storage quota?):', e);
  }
}

async function loadCachedGameData(gameId: string): Promise<LoadedGameData | null> {
  try {
    const units = await AsyncStorage.getItem(`${DATA_CACHE_PREFIX}${gameId}_units`);
    const rules = await AsyncStorage.getItem(`${DATA_CACHE_PREFIX}${gameId}_rules`);
    const general = await AsyncStorage.getItem(`${DATA_CACHE_PREFIX}${gameId}_general`);
    if (!units || !rules || !general) return null;
    return {
      units: JSON.parse(units),
      rules: JSON.parse(rules),
      general: JSON.parse(general),
    };
  } catch { return null; }
}

/** Clear cached data for a specific game */
export async function clearGameCache(gameId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`${DATA_CACHE_PREFIX}${gameId}_version`);
    await AsyncStorage.removeItem(`${DATA_CACHE_PREFIX}${gameId}_units`);
    await AsyncStorage.removeItem(`${DATA_CACHE_PREFIX}${gameId}_rules`);
    await AsyncStorage.removeItem(`${DATA_CACHE_PREFIX}${gameId}_general`);
  } catch {}
}

/** Clear all game data caches */
export async function clearAllGameCaches(): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const dataKeys = allKeys.filter(k => k.startsWith(DATA_CACHE_PREFIX));
    for (const key of dataKeys) {
      await AsyncStorage.removeItem(key);
    }
    await AsyncStorage.removeItem(MANIFEST_CACHE_KEY);
    await AsyncStorage.removeItem(ACTIVE_GAME_KEY);
  } catch {}
}
