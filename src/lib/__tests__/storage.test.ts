import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateId,
  generateJoinCode,
  saveCampaign,
  loadCampaign,
  saveUnits,
  loadUnits,
} from '../storage';
import type { Campaign, CrusadeUnit } from '../../types';

beforeEach(() => {
  localStorage.clear();
});

// ---------------------------------------------------------------------------
// generateId
// ---------------------------------------------------------------------------
describe('generateId', () => {
  it('returns a string', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
  });

  it('returns a UUID format (8-4-4-4-12)', () => {
    const id = generateId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });

  it('returns unique values', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateId()));
    expect(ids.size).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// generateJoinCode
// ---------------------------------------------------------------------------
describe('generateJoinCode', () => {
  it('returns a 6-character string', () => {
    const code = generateJoinCode();
    expect(code).toHaveLength(6);
  });

  it('contains only allowed characters (no I, O, 0, 1)', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateJoinCode();
      expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
    }
  });
});

// ---------------------------------------------------------------------------
// saveCampaign / loadCampaign
// ---------------------------------------------------------------------------
describe('saveCampaign / loadCampaign', () => {
  const campaign: Campaign = {
    id: 'test-123',
    name: 'Test Crusade',
    join_code: 'ABC123',
    supply_limit: 1000,
    starting_rp: 5,
    created_at: '2024-01-01',
    current_round: 1,
    owner_id: 'user-1',
  };

  it('round-trips a campaign through localStorage', () => {
    saveCampaign(campaign);
    const loaded = loadCampaign();
    expect(loaded).toEqual(campaign);
  });

  it('returns null when nothing is saved', () => {
    expect(loadCampaign()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// saveUnits / loadUnits
// ---------------------------------------------------------------------------
describe('saveUnits / loadUnits', () => {
  const unit: CrusadeUnit = {
    id: 'unit-1',
    player_id: 'player-1',
    datasheet_name: 'Intercessors',
    custom_name: 'Alpha Squad',
    points_cost: 80,
    rank: 'Battle-ready',
    experience_points: 0,
    crusade_points: 0,
    battles_played: 0,
    battles_survived: 0,
    equipment: 'Bolt rifles',
    battle_honours: [],
    battle_scars: [],
    notes: '',
    is_destroyed: false,
    is_warlord: false,
    status: 'ready',
    faction_legacy: {},
    created_at: '2024-01-01',
  };

  it('returns empty array when nothing is saved', () => {
    expect(loadUnits()).toEqual([]);
  });

  it('round-trips a non-empty array', () => {
    saveUnits([unit]);
    const loaded = loadUnits();
    expect(loaded).toEqual([unit]);
    expect(loaded).toHaveLength(1);
  });

  it('round-trips an empty array', () => {
    saveUnits([]);
    expect(loadUnits()).toEqual([]);
  });

  it('handles multiple units', () => {
    const unit2 = { ...unit, id: 'unit-2', custom_name: 'Beta Squad' };
    saveUnits([unit, unit2]);
    const loaded = loadUnits();
    expect(loaded).toHaveLength(2);
    expect(loaded[0].id).toBe('unit-1');
    expect(loaded[1].id).toBe('unit-2');
  });
});
