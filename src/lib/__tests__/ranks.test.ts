import { describe, it, expect } from 'vitest';
import {
  getRankFromXP,
  getRankColor,
  getRankBgColor,
  getXPThresholdForRank,
  getResultColor,
} from '../ranks';

// ---------------------------------------------------------------------------
// getRankFromXP
// ---------------------------------------------------------------------------
describe('getRankFromXP', () => {
  it('returns Battle-ready for 0 XP', () => {
    expect(getRankFromXP(0)).toBe('Battle-ready');
  });

  it('returns Battle-ready for 4 XP (just below Blooded)', () => {
    expect(getRankFromXP(4)).toBe('Battle-ready');
  });

  it('returns Blooded at 5 XP', () => {
    expect(getRankFromXP(5)).toBe('Blooded');
  });

  it('returns Blooded at 15 XP', () => {
    expect(getRankFromXP(15)).toBe('Blooded');
  });

  it('returns Battle-hardened at 16 XP', () => {
    expect(getRankFromXP(16)).toBe('Battle-hardened');
  });

  it('returns Battle-hardened at 30 XP', () => {
    expect(getRankFromXP(30)).toBe('Battle-hardened');
  });

  it('returns Heroic at 31 XP', () => {
    expect(getRankFromXP(31)).toBe('Heroic');
  });

  it('returns Heroic at 50 XP', () => {
    expect(getRankFromXP(50)).toBe('Heroic');
  });

  it('returns Legendary at 51 XP', () => {
    expect(getRankFromXP(51)).toBe('Legendary');
  });

  it('returns Legendary at 100 XP', () => {
    expect(getRankFromXP(100)).toBe('Legendary');
  });
});

// ---------------------------------------------------------------------------
// getXPThresholdForRank
// ---------------------------------------------------------------------------
describe('getXPThresholdForRank', () => {
  it('returns 0 for Battle-ready', () => {
    expect(getXPThresholdForRank('Battle-ready')).toBe(0);
  });

  it('returns 5 for Blooded', () => {
    expect(getXPThresholdForRank('Blooded')).toBe(5);
  });

  it('returns 16 for Battle-hardened', () => {
    expect(getXPThresholdForRank('Battle-hardened')).toBe(16);
  });

  it('returns 31 for Heroic', () => {
    expect(getXPThresholdForRank('Heroic')).toBe(31);
  });

  it('returns 51 for Legendary', () => {
    expect(getXPThresholdForRank('Legendary')).toBe(51);
  });
});

// ---------------------------------------------------------------------------
// getRankColor / getRankBgColor
// ---------------------------------------------------------------------------
describe('getRankColor', () => {
  it('returns a Tailwind text class for each rank', () => {
    expect(getRankColor('Battle-ready')).toContain('text-');
    expect(getRankColor('Blooded')).toContain('text-');
    expect(getRankColor('Battle-hardened')).toContain('text-');
    expect(getRankColor('Heroic')).toContain('text-');
    expect(getRankColor('Legendary')).toContain('text-');
  });
});

describe('getRankBgColor', () => {
  it('returns a Tailwind bg class for each rank', () => {
    expect(getRankBgColor('Battle-ready')).toContain('bg-');
    expect(getRankBgColor('Legendary')).toContain('bg-');
  });
});

// ---------------------------------------------------------------------------
// getResultColor
// ---------------------------------------------------------------------------
describe('getResultColor', () => {
  it('returns green for victory', () => {
    expect(getResultColor('victory')).toContain('emerald');
  });

  it('returns red for defeat', () => {
    expect(getResultColor('defeat')).toContain('red');
  });

  it('returns amber for draw', () => {
    expect(getResultColor('draw')).toContain('amber');
  });
});
