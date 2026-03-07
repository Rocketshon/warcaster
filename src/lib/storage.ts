// Local storage helpers for offline-first approach
// All campaign/roster data is persisted locally and synced to Supabase when available

import type { Campaign, CampaignPlayer, CrusadeUnit, Battle } from '../types';

const STORAGE_KEYS = {
  CAMPAIGN: 'crusade_campaign',
  PLAYER: 'crusade_player',
  UNITS: 'crusade_units',
  BATTLES: 'crusade_battles',
  CAMPAIGN_HISTORY: 'crusade_history',
  USER: 'crusade_user',
} as const;

// --- Campaign ---
export function saveCampaign(campaign: Campaign): void {
  localStorage.setItem(STORAGE_KEYS.CAMPAIGN, JSON.stringify(campaign));
}

export function loadCampaign(): Campaign | null {
  const data = localStorage.getItem(STORAGE_KEYS.CAMPAIGN);
  return data ? JSON.parse(data) : null;
}

export function clearCampaign(): void {
  localStorage.removeItem(STORAGE_KEYS.CAMPAIGN);
}

// --- Player ---
export function savePlayer(player: CampaignPlayer): void {
  localStorage.setItem(STORAGE_KEYS.PLAYER, JSON.stringify(player));
}

export function loadPlayer(): CampaignPlayer | null {
  const data = localStorage.getItem(STORAGE_KEYS.PLAYER);
  return data ? JSON.parse(data) : null;
}

// --- Units (Order of Battle) ---
export function saveUnits(units: CrusadeUnit[]): void {
  localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(units));
}

export function loadUnits(): CrusadeUnit[] {
  const data = localStorage.getItem(STORAGE_KEYS.UNITS);
  return data ? JSON.parse(data) : [];
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
  localStorage.setItem(STORAGE_KEYS.BATTLES, JSON.stringify(battles));
}

export function loadBattles(): Battle[] {
  const data = localStorage.getItem(STORAGE_KEYS.BATTLES);
  return data ? JSON.parse(data) : [];
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
  localStorage.setItem(STORAGE_KEYS.CAMPAIGN_HISTORY, JSON.stringify(history));
}

export function loadCampaignHistory(): ArchivedCampaign[] {
  const data = localStorage.getItem(STORAGE_KEYS.CAMPAIGN_HISTORY);
  return data ? JSON.parse(data) : [];
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
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

export function loadUser(): UserSession | null {
  const data = localStorage.getItem(STORAGE_KEYS.USER);
  return data ? JSON.parse(data) : null;
}

export function clearUser(): void {
  localStorage.removeItem(STORAGE_KEYS.USER);
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
