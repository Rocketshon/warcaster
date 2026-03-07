import type { UnitRank } from '../types';

export function getRankFromXP(xp: number): UnitRank {
  if (xp >= 51) return 'Legendary';
  if (xp >= 31) return 'Heroic';
  if (xp >= 16) return 'Battle-hardened';
  if (xp >= 5) return 'Blooded';
  return 'Battle-ready';
}

export function getRankColor(rank: UnitRank): string {
  switch (rank) {
    case 'Legendary': return 'text-amber-400';
    case 'Heroic': return 'text-purple-400';
    case 'Battle-hardened': return 'text-emerald-400';
    case 'Blooded': return 'text-blue-400';
    case 'Battle-ready': return 'text-stone-400';
  }
}

export function getRankBgColor(rank: UnitRank): string {
  switch (rank) {
    case 'Legendary': return 'bg-amber-500/20 border-amber-500/40';
    case 'Heroic': return 'bg-purple-500/20 border-purple-500/40';
    case 'Battle-hardened': return 'bg-emerald-500/20 border-emerald-500/40';
    case 'Blooded': return 'bg-blue-500/20 border-blue-500/40';
    case 'Battle-ready': return 'bg-stone-700/50 border-stone-600/50';
  }
}

export function getResultColor(result: 'victory' | 'defeat' | 'draw'): string {
  switch (result) {
    case 'victory': return 'text-emerald-400';
    case 'defeat': return 'text-red-400';
    case 'draw': return 'text-amber-400';
  }
}

export function getResultBgColor(result: 'victory' | 'defeat' | 'draw'): string {
  switch (result) {
    case 'victory': return 'bg-emerald-500/10 border-emerald-500/30';
    case 'defeat': return 'bg-red-500/10 border-red-500/30';
    case 'draw': return 'bg-amber-500/10 border-amber-500/30';
  }
}

export function getXPThresholdForRank(rank: UnitRank): number {
  switch (rank) {
    case 'Legendary': return 51;
    case 'Heroic': return 31;
    case 'Battle-hardened': return 16;
    case 'Blooded': return 5;
    case 'Battle-ready': return 0;
  }
}
