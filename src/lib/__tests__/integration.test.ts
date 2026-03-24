import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateId,
  generateJoinCode,
  saveCampaign,
  loadCampaign,
  saveUnits,
  loadUnits,
  updateUnit,
  saveBattles,
  loadBattles,
  savePlayer,
  loadPlayer,
} from '../storage';
import {
  queueMutation,
  getPendingMutations,
  clearMutation,
} from '../offlineQueue';
import type { Campaign, CampaignPlayer, CrusadeUnit, Battle } from '../../types';

beforeEach(() => {
  localStorage.clear();
});

// ---------------------------------------------------------------------------
// Helper factories
// ---------------------------------------------------------------------------

function makeCampaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: generateId(),
    name: 'Test Crusade',
    join_code: generateJoinCode(),
    supply_limit: 1000,
    starting_rp: 5,
    created_at: '2024-01-01T00:00:00.000Z',
    current_round: 1,
    owner_id: 'owner-1',
    ...overrides,
  };
}

function makePlayer(overrides: Partial<CampaignPlayer> = {}): CampaignPlayer {
  return {
    id: generateId(),
    campaign_id: 'campaign-1',
    user_id: 'user-1',
    name: 'Commander Test',
    faction_id: 'space_marines',
    supply_used: 0,
    requisition_points: 5,
    battles_played: 0,
    battles_won: 0,
    battles_lost: 0,
    battles_drawn: 0,
    created_at: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeUnit(overrides: Partial<CrusadeUnit> = {}): CrusadeUnit {
  return {
    id: generateId(),
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
    created_at: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeBattle(overrides: Partial<Battle> = {}): Battle {
  return {
    id: generateId(),
    campaign_id: 'campaign-1',
    player_id: 'player-1',
    opponent_id: 'opponent-1',
    opponent_name: 'Enemy Commander',
    opponent_faction: 'orks',
    mission_name: 'Supply Drop',
    battle_size: 'Strike Force',
    player_vp: 45,
    opponent_vp: 30,
    result: 'victory',
    units_fielded: ['unit-1', 'unit-2'],
    marked_for_greatness: 'unit-1',
    agendas: ['Secure Ground', 'Thin Their Ranks'],
    combat_log: [],
    notes: 'Hard-fought victory',
    created_at: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Campaign creation flow
// ---------------------------------------------------------------------------
describe('Campaign creation flow', () => {
  it('creates a campaign with generated ID and join code, saves and reloads', () => {
    const id = generateId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);

    const joinCode = generateJoinCode();
    expect(joinCode).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);

    const campaign = makeCampaign({ id, join_code: joinCode });
    saveCampaign(campaign);

    const loaded = loadCampaign();
    expect(loaded).not.toBeNull();
    expect(loaded!.id).toBe(id);
    expect(loaded!.join_code).toBe(joinCode);
    expect(loaded!.name).toBe('Test Crusade');
    expect(loaded!.supply_limit).toBe(1000);
    expect(loaded!.starting_rp).toBe(5);
    expect(loaded!.current_round).toBe(1);
    expect(loaded!.owner_id).toBe('owner-1');
    expect(loaded!.created_at).toBe('2024-01-01T00:00:00.000Z');
  });

  it('overwrites a previous campaign', () => {
    const first = makeCampaign({ name: 'First' });
    const second = makeCampaign({ name: 'Second' });

    saveCampaign(first);
    saveCampaign(second);

    const loaded = loadCampaign();
    expect(loaded!.name).toBe('Second');
  });
});

// ---------------------------------------------------------------------------
// Unit lifecycle
// ---------------------------------------------------------------------------
describe('Unit lifecycle', () => {
  it('saves a unit, loads it back, updates XP, and verifies change', () => {
    const unit = makeUnit({ id: 'unit-lifecycle-1' });
    saveUnits([unit]);

    let loaded = loadUnits();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].experience_points).toBe(0);
    expect(loaded[0].custom_name).toBe('Alpha Squad');

    // Update XP
    updateUnit('unit-lifecycle-1', { experience_points: 10 });

    loaded = loadUnits();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].experience_points).toBe(10);
    // Other fields should remain unchanged
    expect(loaded[0].custom_name).toBe('Alpha Squad');
    expect(loaded[0].datasheet_name).toBe('Intercessors');
  });

  it('handles multiple units with independent updates', () => {
    const unit1 = makeUnit({ id: 'u1', custom_name: 'Alpha' });
    const unit2 = makeUnit({ id: 'u2', custom_name: 'Beta' });
    saveUnits([unit1, unit2]);

    updateUnit('u1', { experience_points: 5, rank: 'Blooded' });

    const loaded = loadUnits();
    const alpha = loaded.find(u => u.id === 'u1')!;
    const beta = loaded.find(u => u.id === 'u2')!;

    expect(alpha.experience_points).toBe(5);
    expect(alpha.rank).toBe('Blooded');
    expect(beta.experience_points).toBe(0);
    expect(beta.rank).toBe('Battle-ready');
  });
});

// ---------------------------------------------------------------------------
// Battle logging flow
// ---------------------------------------------------------------------------
describe('Battle logging flow', () => {
  it('creates a battle, saves and loads it', () => {
    const battle = makeBattle();
    saveBattles([battle]);

    const loaded = loadBattles();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe(battle.id);
    expect(loaded[0].mission_name).toBe('Supply Drop');
    expect(loaded[0].result).toBe('victory');
    expect(loaded[0].player_vp).toBe(45);
    expect(loaded[0].opponent_vp).toBe(30);
    expect(loaded[0].units_fielded).toEqual(['unit-1', 'unit-2']);
    expect(loaded[0].agendas).toEqual(['Secure Ground', 'Thin Their Ranks']);
    expect(loaded[0].combat_log).toEqual([]);
  });

  it('stores multiple battles', () => {
    const b1 = makeBattle({ mission_name: 'Mission A', result: 'victory' });
    const b2 = makeBattle({ mission_name: 'Mission B', result: 'defeat' });
    const b3 = makeBattle({ mission_name: 'Mission C', result: 'draw' });

    saveBattles([b1, b2, b3]);

    const loaded = loadBattles();
    expect(loaded).toHaveLength(3);
    expect(loaded.map(b => b.mission_name)).toEqual(['Mission A', 'Mission B', 'Mission C']);
  });
});

// ---------------------------------------------------------------------------
// Offline queue flow
// ---------------------------------------------------------------------------
describe('Offline queue flow', () => {
  it('queues mutations, reads them in order, clears individually', () => {
    queueMutation({ type: 'unit', action: 'create', data: { id: 'u1' } });
    queueMutation({ type: 'battle', action: 'create', data: { id: 'b1' } });
    queueMutation({ type: 'player', action: 'update', data: { id: 'p1' } });

    const pending = getPendingMutations();
    expect(pending).toHaveLength(3);

    // Verify ordering by timestamp
    for (let i = 1; i < pending.length; i++) {
      expect(pending[i].timestamp).toBeGreaterThanOrEqual(pending[i - 1].timestamp);
    }

    // Clear the first mutation
    const firstId = pending[0].id;
    clearMutation(firstId);

    const remaining = getPendingMutations();
    expect(remaining).toHaveLength(2);
    expect(remaining.find(m => m.id === firstId)).toBeUndefined();
  });

  it('assigns unique IDs and timestamps to each mutation', () => {
    queueMutation({ type: 'unit', action: 'create', data: { id: 'u1' } });
    queueMutation({ type: 'unit', action: 'create', data: { id: 'u2' } });

    const pending = getPendingMutations();
    expect(pending[0].id).not.toBe(pending[1].id);
    expect(typeof pending[0].timestamp).toBe('number');
    expect(typeof pending[1].timestamp).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// Full campaign flow — end to end with localStorage
// ---------------------------------------------------------------------------
describe('Full campaign flow', () => {
  it('creates campaign → player → 3 units → battle → verifies state consistency', () => {
    // 1. Create and save campaign
    const campaign = makeCampaign({ id: 'camp-full' });
    saveCampaign(campaign);

    // 2. Create and save player
    const player = makePlayer({
      id: 'player-full',
      campaign_id: 'camp-full',
    });
    savePlayer(player);

    // 3. Add 3 units
    const units = [
      makeUnit({ id: 'u1', player_id: 'player-full', custom_name: 'Alpha' }),
      makeUnit({ id: 'u2', player_id: 'player-full', custom_name: 'Beta', datasheet_name: 'Hellblasters' }),
      makeUnit({ id: 'u3', player_id: 'player-full', custom_name: 'Gamma', datasheet_name: 'Aggressors' }),
    ];
    saveUnits(units);

    // 4. Log a battle
    const battle = makeBattle({
      campaign_id: 'camp-full',
      player_id: 'player-full',
      units_fielded: ['u1', 'u2', 'u3'],
      marked_for_greatness: 'u2',
    });
    saveBattles([battle]);

    // 5. Verify state consistency
    const loadedCampaign = loadCampaign();
    expect(loadedCampaign).not.toBeNull();
    expect(loadedCampaign!.id).toBe('camp-full');

    const loadedPlayer = loadPlayer();
    expect(loadedPlayer).not.toBeNull();
    expect(loadedPlayer!.id).toBe('player-full');
    expect(loadedPlayer!.campaign_id).toBe('camp-full');

    const loadedUnits = loadUnits();
    expect(loadedUnits).toHaveLength(3);
    expect(loadedUnits.map(u => u.custom_name).sort()).toEqual(['Alpha', 'Beta', 'Gamma']);

    const loadedBattles = loadBattles();
    expect(loadedBattles).toHaveLength(1);
    expect(loadedBattles[0].campaign_id).toBe('camp-full');
    expect(loadedBattles[0].player_id).toBe('player-full');
    expect(loadedBattles[0].units_fielded).toEqual(['u1', 'u2', 'u3']);
    expect(loadedBattles[0].marked_for_greatness).toBe('u2');

    // Cross-reference: all units_fielded IDs exist in saved units
    for (const fieldedId of loadedBattles[0].units_fielded) {
      expect(loadedUnits.find(u => u.id === fieldedId)).toBeDefined();
    }
  });
});
