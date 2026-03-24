import { describe, it, expect, vi } from 'vitest';
import {
  getWoundTarget,
  getEffectiveSave,
  parseDiceString,
  parseStatTarget,
  resolveCombat,
  getCombatSummary,
  type CombatInput,
  type CombatResult,
} from '../combatEngine';

// ---------------------------------------------------------------------------
// getWoundTarget
// ---------------------------------------------------------------------------
describe('getWoundTarget', () => {
  it('returns 2+ when strength >= 2x toughness', () => {
    expect(getWoundTarget(8, 4)).toBe(2);
    expect(getWoundTarget(10, 5)).toBe(2);
    expect(getWoundTarget(12, 3)).toBe(2);
  });

  it('returns 3+ when strength > toughness (but less than 2x)', () => {
    expect(getWoundTarget(5, 4)).toBe(3);
    expect(getWoundTarget(6, 4)).toBe(3);
    expect(getWoundTarget(7, 4)).toBe(3);
  });

  it('returns 4+ when strength equals toughness', () => {
    expect(getWoundTarget(4, 4)).toBe(4);
    expect(getWoundTarget(3, 3)).toBe(4);
  });

  it('returns 5+ when strength < toughness (but more than half)', () => {
    expect(getWoundTarget(3, 4)).toBe(5);
    expect(getWoundTarget(3, 5)).toBe(5);
  });

  it('returns 6+ when strength <= half toughness', () => {
    expect(getWoundTarget(2, 4)).toBe(6);
    expect(getWoundTarget(2, 5)).toBe(6);
    expect(getWoundTarget(3, 6)).toBe(6);
    expect(getWoundTarget(1, 4)).toBe(6);
  });
});

// ---------------------------------------------------------------------------
// getEffectiveSave
// ---------------------------------------------------------------------------
describe('getEffectiveSave', () => {
  it('modifies save by AP', () => {
    // 3+ save, AP -2 => 5+
    expect(getEffectiveSave('3+', '-2', null)).toBe(5);
  });

  it('returns unmodified save when AP is 0', () => {
    expect(getEffectiveSave('3+', '0', null)).toBe(3);
  });

  it('uses invuln when it is better than modified save', () => {
    // 3+ save, AP -3 => modified 6+, but 4++ invuln is better
    expect(getEffectiveSave('3+', '-3', '4+')).toBe(4);
  });

  it('uses modified save when it is better than invuln', () => {
    // 2+ save, AP -1 => modified 3+, which is better than 4++
    expect(getEffectiveSave('2+', '-1', '4+')).toBe(3);
  });

  it('returns 7 (impossible) when save is "-"', () => {
    expect(getEffectiveSave('-', '0', null)).toBe(7);
  });

  it('handles no AP and no invuln', () => {
    expect(getEffectiveSave('4+', '0', null)).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// parseDiceString
// ---------------------------------------------------------------------------
describe('parseDiceString', () => {
  it('parses plain numbers', () => {
    expect(parseDiceString('1')).toBe(1);
    expect(parseDiceString('3')).toBe(3);
    expect(parseDiceString('10')).toBe(10);
  });

  it('returns 0 for empty, dash, or N/A', () => {
    expect(parseDiceString('')).toBe(0);
    expect(parseDiceString('-')).toBe(0);
    expect(parseDiceString('N/A')).toBe(0);
  });

  it('parses D6 as a number between 1 and 6', () => {
    for (let i = 0; i < 20; i++) {
      const result = parseDiceString('D6');
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(6);
    }
  });

  it('parses D3 as a number between 1 and 3', () => {
    for (let i = 0; i < 20; i++) {
      const result = parseDiceString('D3');
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(3);
    }
  });

  it('parses 2D6 as a number between 2 and 12', () => {
    for (let i = 0; i < 20; i++) {
      const result = parseDiceString('2D6');
      expect(result).toBeGreaterThanOrEqual(2);
      expect(result).toBeLessThanOrEqual(12);
    }
  });

  it('parses D6+1 as a number between 2 and 7', () => {
    for (let i = 0; i < 20; i++) {
      const result = parseDiceString('D6+1');
      expect(result).toBeGreaterThanOrEqual(2);
      expect(result).toBeLessThanOrEqual(7);
    }
  });

  it('parses 2D6+1 as a number between 3 and 13', () => {
    for (let i = 0; i < 20; i++) {
      const result = parseDiceString('2D6+1');
      expect(result).toBeGreaterThanOrEqual(3);
      expect(result).toBeLessThanOrEqual(13);
    }
  });

  it('is case-insensitive', () => {
    const result = parseDiceString('d6');
    expect(result).toBeGreaterThanOrEqual(1);
    expect(result).toBeLessThanOrEqual(6);
  });
});

// ---------------------------------------------------------------------------
// parseStatTarget
// ---------------------------------------------------------------------------
describe('parseStatTarget', () => {
  it('parses "3+" to 3', () => {
    expect(parseStatTarget('3+')).toBe(3);
  });

  it('parses "4+" to 4', () => {
    expect(parseStatTarget('4+')).toBe(4);
  });

  it('parses plain number "5" to 5', () => {
    expect(parseStatTarget('5')).toBe(5);
  });

  it('returns 7 for "-" or "N/A"', () => {
    expect(parseStatTarget('-')).toBe(7);
    expect(parseStatTarget('N/A')).toBe(7);
  });
});

// ---------------------------------------------------------------------------
// resolveCombat
// ---------------------------------------------------------------------------
describe('resolveCombat', () => {
  const baseInput: CombatInput = {
    attackerBS: '3+',
    weapon: {
      name: 'Bolt Rifle',
      range: '24"',
      A: '2',
      skill: '3+',
      S: '4',
      AP: '-1',
      D: '1',
      traits: [],
    },
    phase: 'shooting',
    defenderT: '4',
    defenderSv: '3+',
    defenderInvuln: null,
    defenderW: '2',
  };

  it('produces consistent hit/wound/save cascade with known rolls', () => {
    // All hits (rolls of 4,5), all wound (rolls of 4,6), all fail saves (rolls of 1,2)
    const result = resolveCombat({
      ...baseInput,
      manualHitRolls: [4, 5],
      manualWoundRolls: [4, 6],
      manualSaveRolls: [1, 2],
    });

    expect(result.totalAttacks).toBe(2);
    expect(result.hits).toBe(2);
    expect(result.wounds).toBe(2);
    expect(result.failedSaves).toBe(2);
    expect(result.totalDamage).toBe(2); // D=1 per failed save
  });

  it('hits <= totalAttacks, wounds <= hits, failedSaves <= wounds', () => {
    const result = resolveCombat(baseInput);
    expect(result.hits).toBeLessThanOrEqual(result.totalAttacks);
    expect(result.wounds).toBeLessThanOrEqual(result.hits);
    expect(result.failedSaves).toBeLessThanOrEqual(result.wounds);
  });

  it('unmodified 1 always misses', () => {
    const result = resolveCombat({
      ...baseInput,
      weapon: { ...baseInput.weapon, A: '3' },
      manualHitRolls: [1, 1, 1],
    });
    expect(result.hits).toBe(0);
  });

  it('unmodified 6 always hits (critical)', () => {
    const result = resolveCombat({
      ...baseInput,
      weapon: { ...baseInput.weapon, A: '2' },
      manualHitRolls: [6, 6],
    });
    expect(result.hits).toBe(2);
    expect(result.criticalHits).toBe(2);
  });

  it('calculates models destroyed from total damage / wounds per model', () => {
    const result = resolveCombat({
      ...baseInput,
      weapon: { ...baseInput.weapon, A: '4', D: '2' },
      defenderW: '2',
      manualHitRolls: [4, 5, 6, 3],
      manualWoundRolls: [4, 5, 6],
      manualSaveRolls: [1, 1, 1],
    });
    // 3 hits (4,5,6 hit at 3+), 3 wounds (4,5,6 wound at 4+ S4 vs T4), 3 failed saves (rolls of 1)
    // damage = 3 * 2 = 6, models destroyed = 6 / 2 = 3
    expect(result.totalDamage).toBe(6);
    expect(result.modelsDestroyed).toBe(3);
  });

  it('applies hit and wound targets correctly', () => {
    const result = resolveCombat({
      ...baseInput,
      manualHitRolls: [3, 3],
      manualWoundRolls: [4, 4],
      manualSaveRolls: [1, 1],
    });
    expect(result.hitTarget).toBe(3); // BS 3+
    expect(result.woundTarget).toBe(4); // S4 vs T4
  });
});

// ---------------------------------------------------------------------------
// getCombatSummary
// ---------------------------------------------------------------------------
describe('getCombatSummary', () => {
  it('returns a readable summary string', () => {
    const result: CombatResult = {
      totalAttacks: 4,
      hitRolls: [3, 4, 5, 6],
      hits: 3,
      criticalHits: 1,
      woundRolls: [4, 5, 6],
      wounds: 3,
      saveRolls: [1, 2, 5],
      failedSaves: 2,
      damagePerFailedSave: [1, 1],
      totalDamage: 2,
      modelsDestroyed: 1,
      hitTarget: 3,
      woundTarget: 4,
      saveTarget: 4,
    };

    const summary = getCombatSummary('Intercessors', 'Bolt Rifle', 'Ork Boyz', result);
    expect(summary).toContain('Intercessors');
    expect(summary).toContain('Bolt Rifle');
    expect(summary).toContain('Ork Boyz');
    expect(summary).toContain('4 attacks');
    expect(summary).toContain('3 hits');
    expect(summary).toContain('2 damage dealt');
    expect(summary).toContain('1 model destroyed');
  });

  it('says "No damage dealt" when totalDamage is 0', () => {
    const result: CombatResult = {
      totalAttacks: 2,
      hitRolls: [1, 2],
      hits: 0,
      criticalHits: 0,
      woundRolls: [],
      wounds: 0,
      saveRolls: [],
      failedSaves: 0,
      damagePerFailedSave: [],
      totalDamage: 0,
      modelsDestroyed: 0,
      hitTarget: 3,
      woundTarget: 4,
      saveTarget: 4,
    };

    const summary = getCombatSummary('Marines', 'Bolter', 'Necrons', result);
    expect(summary).toContain('No damage dealt');
  });
});
