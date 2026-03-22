// Local storage helpers for offline-first approach

import type { Campaign, CampaignPlayer, CrusadeUnit, Battle } from '../types';

const STORAGE_KEYS = {
  CAMPAIGN: 'crusade_campaign',
  PLAYER: 'crusade_player',
  UNITS: 'crusade_units',
  BATTLES: 'crusade_battles',
  CAMPAIGN_HISTORY: 'crusade_history',
  USER: 'crusade_user',
} as const;

/** Safely write to localStorage with quota error handling */
function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.error(`[Storage] Failed to write "${key}":`, e);
    // QuotaExceededError — notify the user
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      // Dispatch a custom event so the app can show a toast
      window.dispatchEvent(new CustomEvent('crusade:storage-full'));
    }
  }
}

/** Safely read and parse JSON from localStorage, returning fallback on any error */
function safeGetItem<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    if (data === null) return fallback;
    return JSON.parse(data) as T;
  } catch (e) {
    console.error(`[Storage] Failed to read/parse "${key}":`, e);
    return fallback;
  }
}

// --- Campaign ---
export function saveCampaign(campaign: Campaign): void {
  safeSetItem(STORAGE_KEYS.CAMPAIGN, JSON.stringify(campaign));
}

export function loadCampaign(): Campaign | null {
  return safeGetItem<Campaign | null>(STORAGE_KEYS.CAMPAIGN, null);
}

export function clearCampaign(): void {
  localStorage.removeItem(STORAGE_KEYS.CAMPAIGN);
  localStorage.removeItem(STORAGE_KEYS.PLAYER);
  localStorage.removeItem(STORAGE_KEYS.UNITS);
  localStorage.removeItem(STORAGE_KEYS.BATTLES);
}

// --- Player ---
export function savePlayer(player: CampaignPlayer): void {
  safeSetItem(STORAGE_KEYS.PLAYER, JSON.stringify(player));
}

export function loadPlayer(): CampaignPlayer | null {
  return safeGetItem<CampaignPlayer | null>(STORAGE_KEYS.PLAYER, null);
}

// --- Units (Order of Battle) ---
export function saveUnits(units: CrusadeUnit[]): void {
  safeSetItem(STORAGE_KEYS.UNITS, JSON.stringify(units));
}

export function loadUnits(): CrusadeUnit[] {
  return safeGetItem<CrusadeUnit[]>(STORAGE_KEYS.UNITS, []);
}

export function addUnit(unit: CrusadeUnit): void {
  const units = loadUnits();
  units.push(unit);
  saveUnits(units);
}

export function updateUnit(unitId: string, updates: Partial<CrusadeUnit>): void {
  const units = loadUnits();
  const idx = units.findIndex(u => u.id === unitId);
  if (idx >= 0) {
    units[idx] = { ...units[idx], ...updates };
    saveUnits(units);
  }
}

export function removeUnit(unitId: string): void {
  const units = loadUnits().filter(u => u.id !== unitId);
  saveUnits(units);
}

// --- Battles ---
export function saveBattles(battles: Battle[]): void {
  safeSetItem(STORAGE_KEYS.BATTLES, JSON.stringify(battles));
}

export function loadBattles(): Battle[] {
  return safeGetItem<Battle[]>(STORAGE_KEYS.BATTLES, []);
}

export function addBattle(battle: Battle): void {
  const battles = loadBattles();
  battles.unshift(battle); // newest first
  saveBattles(battles);
}

// --- Campaign History ---
export interface ArchivedCampaign {
  id: string;
  name: string;
  faction_id: string;
  faction_name: string;
  faction_icon: string;
  start_date: string;
  end_date: string;
  wins: number;
  losses: number;
  draws: number;
  total_battles: number;
}

export function saveCampaignHistory(history: ArchivedCampaign[]): void {
  safeSetItem(STORAGE_KEYS.CAMPAIGN_HISTORY, JSON.stringify(history));
}

export function loadCampaignHistory(): ArchivedCampaign[] {
  return safeGetItem<ArchivedCampaign[]>(STORAGE_KEYS.CAMPAIGN_HISTORY, []);
}

export function archiveCampaign(archive: ArchivedCampaign): void {
  const history = loadCampaignHistory();
  history.unshift(archive);
  saveCampaignHistory(history);
}

// --- User session ---
export interface UserSession {
  id: string;
  email: string;
  display_name: string;
}

export function saveUser(user: UserSession): void {
  safeSetItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

export function loadUser(): UserSession | null {
  return safeGetItem<UserSession | null>(STORAGE_KEYS.USER, null);
}

export function clearUser(): void {
  localStorage.removeItem(STORAGE_KEYS.USER);
}

// --- Auth credentials (local-only password verification) ---
const CREDENTIALS_KEY = 'crusade_credentials';

interface StoredCredential {
  email: string;
  passwordHash: string;
  userId: string;
}

/** Hash a password using SHA-256 via Web Crypto API */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function saveCredential(cred: StoredCredential): void {
  const creds = loadCredentials();
  // Replace existing credential for the same email
  const idx = creds.findIndex(c => c.email === cred.email);
  if (idx >= 0) {
    creds[idx] = cred;
  } else {
    creds.push(cred);
  }
  safeSetItem(CREDENTIALS_KEY, JSON.stringify(creds));
}

export function loadCredentials(): StoredCredential[] {
  return safeGetItem<StoredCredential[]>(CREDENTIALS_KEY, []);
}

export function findCredential(email: string): StoredCredential | undefined {
  return loadCredentials().find(c => c.email === email.toLowerCase().trim());
}

// --- Utilities ---
export function generateId(): string {
  return crypto.randomUUID();
}

export function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 for readability
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
