import { describe, it, expect } from 'vitest';
import {
  getUnitAttentionItems,
  getPlayerAttentionCount,
} from '../attention';
import type { CrusadeUnit } from '../../types';

function makeUnit(overrides: Partial<CrusadeUnit> = {}): CrusadeUnit {
  return {
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
    equipment: '',
    battle_honours: [],
    battle_scars: [],
    notes: '',
    is_destroyed: false,
    is_warlord: false,
    status: 'ready',
    faction_legacy: {},
    created_at: '2024-01-01',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// getUnitAttentionItems
// ---------------------------------------------------------------------------
describe('getUnitAttentionItems', () => {
  it('returns empty array for a fresh Battle-ready unit', () => {
    const unit = makeUnit();
    expect(getUnitAttentionItems(unit)).toEqual([]);
  });

  it('flags rank-up when XP crosses Blooded threshold but no honours', () => {
    const unit = makeUnit({
      experience_points: 10, // Blooded rank, max 1 honour
      battle_honours: [],    // 0 honours — should flag
    });
    const items = getUnitAttentionItems(unit);
    const rankUp = items.find(i => i.type === 'rank_up');
    expect(rankUp).toBeDefined();
    expect(rankUp!.message).toContain('Alpha Squad');
  });

  it('does not flag rank-up when honours are at max for rank', () => {
    const unit = makeUnit({
      experience_points: 10, // Blooded, max 1 honour
      battle_honours: [
        { id: 'h1', type: 'battle_trait', name: 'Fearless', description: 'Morale test auto-pass' },
      ],
    });
    const items = getUnitAttentionItems(unit);
    const rankUp = items.find(i => i.type === 'rank_up');
    expect(rankUp).toBeUndefined();
  });

  it('flags missing scar when unit is destroyed with no scars', () => {
    const unit = makeUnit({
      is_destroyed: true,
      battle_scars: [],
    });
    const items = getUnitAttentionItems(unit);
    const scar = items.find(i => i.type === 'missing_scar');
    expect(scar).toBeDefined();
    expect(scar!.message).toContain('destroyed');
  });

  it('does not flag missing scar when unit has a scar', () => {
    const unit = makeUnit({
      is_destroyed: true,
      battle_scars: [{ id: 's1', name: 'Disgraced', description: '-1 Ld' }],
    });
    const items = getUnitAttentionItems(unit);
    const scar = items.find(i => i.type === 'missing_scar');
    expect(scar).toBeUndefined();
  });

  it('flags missing warlord trait when warlord has no honours', () => {
    const unit = makeUnit({
      is_warlord: true,
      battle_honours: [],
    });
    const items = getUnitAttentionItems(unit);
    const warlord = items.find(i => i.type === 'missing_warlord_trait');
    expect(warlord).toBeDefined();
    expect(warlord!.message).toContain('Warlord');
  });

  it('does not flag warlord trait when unit has a battle_trait honour', () => {
    const unit = makeUnit({
      is_warlord: true,
      experience_points: 10, // Blooded so honours are valid
      battle_honours: [
        { id: 'h1', type: 'battle_trait', name: 'Inspiring Leader', description: 'Ld buff' },
      ],
    });
    const items = getUnitAttentionItems(unit);
    const warlord = items.find(i => i.type === 'missing_warlord_trait');
    expect(warlord).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// getPlayerAttentionCount
// ---------------------------------------------------------------------------
describe('getPlayerAttentionCount', () => {
  it('returns 0 for empty units array', () => {
    expect(getPlayerAttentionCount([])).toBe(0);
  });

  it('sums attention items across multiple units', () => {
    const units = [
      makeUnit({ id: 'u1', experience_points: 10, battle_honours: [] }), // rank_up
      makeUnit({ id: 'u2', is_destroyed: true, battle_scars: [] }),       // missing_scar
    ];
    const count = getPlayerAttentionCount(units);
    expect(count).toBeGreaterThanOrEqual(2);
  });

  it('returns 0 when no units need attention', () => {
    const units = [
      makeUnit({ id: 'u1' }),
      makeUnit({ id: 'u2' }),
    ];
    expect(getPlayerAttentionCount(units)).toBe(0);
  });
});
