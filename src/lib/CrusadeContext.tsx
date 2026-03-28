import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { getRank } from '../data/crusadeRules';

// ============================================================
// Types
// ============================================================

export interface CrusadeBattleHonour {
  id: string;
  type: 'battle_trait' | 'weapon_enhancement' | 'crusade_relic';
  name: string;
  description: string;
  gainedAtBattle?: number;
}

export interface CrusadeBattleScar {
  id: string;
  name: string;
  description: string;
  gainedAtBattle?: number;
}

export interface CrusadeUnit {
  id: string;
  datasheetName: string;
  customName: string;
  keywords: string[];         // e.g. ['CHARACTER', 'INFANTRY', 'SPACE WOLVES']
  isCharacter: boolean;
  isBattleline: boolean;
  pointsCost: number;
  xp: number;
  battleHonours: CrusadeBattleHonour[];
  battleScars: CrusadeBattleScar[];
  // Space Wolves only
  deedsOfMaking: string[];    // deed IDs from SW_DEEDS_OF_MAKING
  // Progress tracking
  battlesPlayed: number;
  battlesSurvived: number;
  isWarlord: boolean;
  isDestroyed: boolean;
  legendaryVeterans: boolean; // 3 RP requisition purchased
  notes: string;
  addedAt: string;
}

export interface CrusadeBattleXPEvent {
  unitId: string;
  xpAmount: number;
  reason: string;
}

export interface CrusadeBattle {
  id: string;
  battleNumber: number;
  date: string;
  result: 'victory' | 'defeat' | 'draw';
  opponentFaction: string;
  missionName: string;
  battleSize: 'Combat Patrol' | 'Incursion' | 'Strike Force' | 'Onslaught';
  yourVP: number;
  opponentVP: number;
  agendaIds: string[];
  deployedUnitIds: string[];
  markedForGreatnessUnitId: string | null;
  rpChange: number;           // net RP change this battle (usually +1)
  xpEvents: CrusadeBattleXPEvent[];
  notes: string;
}

// Faction-specific data — all optional, only relevant fields used per faction
export interface CrusadeFactionData {
  // Space Wolves + Space Marines
  honourPoints?: number;
  oathswornCampaignId?: string;
  // Chaos Space Marines
  personalGlory?: number;
  darkGodGlory?: number;
  warfleetGlory?: number;
  // Death Guard
  virulencePoints?: number;
  plagueVector?: string;
  plagueInfection?: string;
  plagueTerm?: string;
  // World Eaters
  skullPoints?: number;
  // Astra Militarum
  commendationPoints?: number;
}

export interface CrusadeCampaign {
  id: string;
  name: string;
  factionId: string;
  detachmentName: string;
  supplyLimit: number;
  requisitionPoints: number;
  wins: number;
  losses: number;
  draws: number;
  totalBattles: number;
  units: CrusadeUnit[];
  battles: CrusadeBattle[];
  factionData: CrusadeFactionData;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Context interface
// ============================================================

interface CrusadeState {
  campaigns: CrusadeCampaign[];
  activeCampaignId: string | null;
  campaign: CrusadeCampaign | null;  // derived: active campaign shorthand

  // Campaign management
  createCampaign: (opts: {
    name: string;
    factionId: string;
    detachmentName: string;
    supplyLimit?: number;
    startingRP?: number;
    oathswornCampaignId?: string;
  }) => string;
  deleteCampaign: (id: string) => void;
  switchCampaign: (id: string) => void;
  renameCampaign: (id: string, name: string) => void;
  updateCampaignDetachment: (detachmentName: string) => void;
  updateFactionData: (data: Partial<CrusadeFactionData>) => void;

  // Supply & RP
  setSupplyLimit: (limit: number) => void;
  spendRP: (amount: number) => void;
  gainRP: (amount: number) => void;

  // Order of Battle
  addUnit: (unit: Omit<CrusadeUnit, 'id' | 'xp' | 'battleHonours' | 'battleScars' | 'deedsOfMaking' | 'battlesPlayed' | 'battlesSurvived' | 'isWarlord' | 'isDestroyed' | 'legendaryVeterans' | 'notes' | 'addedAt'>) => void;
  updateUnit: (unitId: string, updates: Partial<CrusadeUnit>) => void;
  removeUnit: (unitId: string) => void;
  setWarlord: (unitId: string) => void;
  markUnitDestroyed: (unitId: string) => void;
  restoreUnit: (unitId: string) => void;

  // XP & ranks
  awardXP: (unitId: string, xp: number) => void;

  // Battle Honours & Scars
  addBattleHonour: (unitId: string, honour: Omit<CrusadeBattleHonour, 'id'>) => void;
  removeBattleHonour: (unitId: string, honourId: string) => void;
  addBattleScar: (unitId: string, scar: Omit<CrusadeBattleScar, 'id'>) => void;
  removeBattleScar: (unitId: string, scarId: string) => void;
  buyLegendaryVeterans: (unitId: string) => void;  // costs 3 RP

  // Space Wolves
  addDeedOfMaking: (unitId: string, deedId: string) => void;
  removeDeedOfMaking: (unitId: string, deedId: string) => void;

  // Battle recording (post-battle wizard final step)
  recordBattle: (battle: Omit<CrusadeBattle, 'id' | 'battleNumber'>) => void;
}

// ============================================================
// localStorage helpers
// ============================================================

const STORAGE_KEY = 'warcaster_crusade';
const ACTIVE_KEY = 'warcaster_crusade_active';

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full — silently ignore
  }
}

// ============================================================
// Helpers
// ============================================================

function stamp(campaign: CrusadeCampaign): CrusadeCampaign {
  return { ...campaign, updatedAt: new Date().toISOString() };
}

function updateCampaignInList(
  list: CrusadeCampaign[],
  id: string | null,
  fn: (c: CrusadeCampaign) => CrusadeCampaign,
): CrusadeCampaign[] {
  if (!id) return list;
  return list.map(c => (c.id === id ? stamp(fn(c)) : c));
}

// ============================================================
// Context
// ============================================================

const CrusadeContext = createContext<CrusadeState | null>(null);

export function CrusadeProvider({ children }: { children: ReactNode }) {
  const [campaigns, setCampaigns] = useState<CrusadeCampaign[]>(() =>
    loadJSON<CrusadeCampaign[]>(STORAGE_KEY, []),
  );
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(() =>
    loadJSON<string | null>(ACTIVE_KEY, null),
  );

  // Persist on change
  useEffect(() => { saveJSON(STORAGE_KEY, campaigns); }, [campaigns]);
  useEffect(() => { saveJSON(ACTIVE_KEY, activeCampaignId); }, [activeCampaignId]);

  const campaign = useMemo(
    () => campaigns.find(c => c.id === activeCampaignId) ?? null,
    [campaigns, activeCampaignId],
  );

  // Helper: mutate active campaign
  const mutateActive = useCallback(
    (fn: (c: CrusadeCampaign) => CrusadeCampaign) => {
      setCampaigns(prev => updateCampaignInList(prev, activeCampaignId, fn));
    },
    [activeCampaignId],
  );

  // -----------------------------------------------------------------------
  // Campaign management
  // -----------------------------------------------------------------------

  const createCampaign = useCallback((opts: {
    name: string;
    factionId: string;
    detachmentName: string;
    supplyLimit?: number;
    startingRP?: number;
    oathswornCampaignId?: string;
  }): string => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const factionData: CrusadeFactionData = {};
    if (opts.oathswornCampaignId) {
      factionData.oathswornCampaignId = opts.oathswornCampaignId;
    }
    const newCampaign: CrusadeCampaign = {
      id,
      name: opts.name,
      factionId: opts.factionId,
      detachmentName: opts.detachmentName,
      supplyLimit: opts.supplyLimit ?? 1000,
      requisitionPoints: opts.startingRP ?? 5,
      wins: 0,
      losses: 0,
      draws: 0,
      totalBattles: 0,
      units: [],
      battles: [],
      factionData,
      createdAt: now,
      updatedAt: now,
    };
    setCampaigns(prev => [...prev, newCampaign]);
    setActiveCampaignId(id);
    return id;
  }, []);

  const deleteCampaign = useCallback((id: string) => {
    setCampaigns(prev => {
      const remaining = prev.filter(c => c.id !== id);
      if (id === activeCampaignId) {
        setActiveCampaignId(remaining.length > 0 ? remaining[0].id : null);
      }
      return remaining;
    });
  }, [activeCampaignId]);

  const switchCampaign = useCallback((id: string) => {
    setActiveCampaignId(id);
  }, []);

  const renameCampaign = useCallback((id: string, name: string) => {
    setCampaigns(prev => prev.map(c =>
      c.id === id ? stamp({ ...c, name }) : c,
    ));
  }, []);

  const updateCampaignDetachment = useCallback((detachmentName: string) => {
    mutateActive(c => ({ ...c, detachmentName }));
  }, [mutateActive]);

  const updateFactionData = useCallback((data: Partial<CrusadeFactionData>) => {
    mutateActive(c => ({ ...c, factionData: { ...c.factionData, ...data } }));
  }, [mutateActive]);

  // -----------------------------------------------------------------------
  // Supply & RP
  // -----------------------------------------------------------------------

  const setSupplyLimit = useCallback((limit: number) => {
    mutateActive(c => ({ ...c, supplyLimit: limit }));
  }, [mutateActive]);

  const spendRP = useCallback((amount: number) => {
    mutateActive(c => ({ ...c, requisitionPoints: Math.max(0, c.requisitionPoints - amount) }));
  }, [mutateActive]);

  const gainRP = useCallback((amount: number) => {
    mutateActive(c => ({ ...c, requisitionPoints: Math.min(10, c.requisitionPoints + amount) }));
  }, [mutateActive]);

  // -----------------------------------------------------------------------
  // Order of Battle
  // -----------------------------------------------------------------------

  const addUnit = useCallback((
    unit: Omit<CrusadeUnit, 'id' | 'xp' | 'battleHonours' | 'battleScars' | 'deedsOfMaking' | 'battlesPlayed' | 'battlesSurvived' | 'isWarlord' | 'isDestroyed' | 'legendaryVeterans' | 'notes' | 'addedAt'>,
  ) => {
    const newUnit: CrusadeUnit = {
      ...unit,
      id: crypto.randomUUID(),
      xp: 0,
      battleHonours: [],
      battleScars: [],
      deedsOfMaking: [],
      battlesPlayed: 0,
      battlesSurvived: 0,
      isWarlord: false,
      isDestroyed: false,
      legendaryVeterans: false,
      notes: '',
      addedAt: new Date().toISOString(),
    };
    mutateActive(c => ({ ...c, units: [...c.units, newUnit] }));
  }, [mutateActive]);

  const updateUnit = useCallback((unitId: string, updates: Partial<CrusadeUnit>) => {
    mutateActive(c => ({
      ...c,
      units: c.units.map(u => (u.id === unitId ? { ...u, ...updates } : u)),
    }));
  }, [mutateActive]);

  const removeUnit = useCallback((unitId: string) => {
    mutateActive(c => ({ ...c, units: c.units.filter(u => u.id !== unitId) }));
  }, [mutateActive]);

  const setWarlord = useCallback((unitId: string) => {
    mutateActive(c => ({
      ...c,
      units: c.units.map(u => ({ ...u, isWarlord: u.id === unitId })),
    }));
  }, [mutateActive]);

  const markUnitDestroyed = useCallback((unitId: string) => {
    mutateActive(c => ({
      ...c,
      units: c.units.map(u => (u.id === unitId ? { ...u, isDestroyed: true } : u)),
    }));
  }, [mutateActive]);

  const restoreUnit = useCallback((unitId: string) => {
    mutateActive(c => ({
      ...c,
      units: c.units.map(u => (u.id === unitId ? { ...u, isDestroyed: false } : u)),
    }));
  }, [mutateActive]);

  // -----------------------------------------------------------------------
  // XP & ranks
  // -----------------------------------------------------------------------

  const awardXP = useCallback((unitId: string, xp: number) => {
    mutateActive(c => ({
      ...c,
      units: c.units.map(u => {
        if (u.id !== unitId) return u;
        const newXP = u.xp + xp;
        // getRank is for display only; we store raw xp and derive rank dynamically
        return { ...u, xp: newXP };
      }),
    }));
  }, [mutateActive]);

  // -----------------------------------------------------------------------
  // Battle Honours & Scars
  // -----------------------------------------------------------------------

  const addBattleHonour = useCallback((unitId: string, honour: Omit<CrusadeBattleHonour, 'id'>) => {
    mutateActive(c => ({
      ...c,
      units: c.units.map(u => {
        if (u.id !== unitId) return u;
        const rank = getRank(u.xp, u.isCharacter, u.legendaryVeterans);
        // Enforce honour slot cap
        if (u.battleHonours.length >= rank.honourSlotsTotal) return u;
        return {
          ...u,
          battleHonours: [...u.battleHonours, { id: crypto.randomUUID(), ...honour }],
        };
      }),
    }));
  }, [mutateActive]);

  const removeBattleHonour = useCallback((unitId: string, honourId: string) => {
    mutateActive(c => ({
      ...c,
      units: c.units.map(u =>
        u.id === unitId
          ? { ...u, battleHonours: u.battleHonours.filter(h => h.id !== honourId) }
          : u,
      ),
    }));
  }, [mutateActive]);

  const addBattleScar = useCallback((unitId: string, scar: Omit<CrusadeBattleScar, 'id'>) => {
    mutateActive(c => ({
      ...c,
      units: c.units.map(u =>
        u.id === unitId
          ? { ...u, battleScars: [...u.battleScars, { id: crypto.randomUUID(), ...scar }] }
          : u,
      ),
    }));
  }, [mutateActive]);

  const removeBattleScar = useCallback((unitId: string, scarId: string) => {
    mutateActive(c => ({
      ...c,
      units: c.units.map(u =>
        u.id === unitId
          ? { ...u, battleScars: u.battleScars.filter(s => s.id !== scarId) }
          : u,
      ),
    }));
  }, [mutateActive]);

  const buyLegendaryVeterans = useCallback((unitId: string) => {
    mutateActive(c => ({
      ...c,
      requisitionPoints: Math.max(0, c.requisitionPoints - 3),
      units: c.units.map(u =>
        u.id === unitId ? { ...u, legendaryVeterans: true } : u,
      ),
    }));
  }, [mutateActive]);

  // -----------------------------------------------------------------------
  // Space Wolves: Deeds of Making
  // -----------------------------------------------------------------------

  const addDeedOfMaking = useCallback((unitId: string, deedId: string) => {
    mutateActive(c => ({
      ...c,
      units: c.units.map(u =>
        u.id === unitId && !u.deedsOfMaking.includes(deedId)
          ? { ...u, deedsOfMaking: [...u.deedsOfMaking, deedId] }
          : u,
      ),
    }));
  }, [mutateActive]);

  const removeDeedOfMaking = useCallback((unitId: string, deedId: string) => {
    mutateActive(c => ({
      ...c,
      units: c.units.map(u =>
        u.id === unitId
          ? { ...u, deedsOfMaking: u.deedsOfMaking.filter(d => d !== deedId) }
          : u,
      ),
    }));
  }, [mutateActive]);

  // -----------------------------------------------------------------------
  // Battle recording
  // -----------------------------------------------------------------------

  const recordBattle = useCallback((battle: Omit<CrusadeBattle, 'id' | 'battleNumber'>) => {
    mutateActive(c => {
      const battleNumber = c.totalBattles + 1;
      const newBattle: CrusadeBattle = {
        ...battle,
        id: crypto.randomUUID(),
        battleNumber,
      };

      // Apply XP to deployed units + mark battles played/survived
      let units = c.units.map(u => {
        if (!battle.deployedUnitIds.includes(u.id)) return u;
        const xpGain = battle.xpEvents
          .filter(e => e.unitId === u.id)
          .reduce((sum, e) => sum + e.xpAmount, 0);
        // Marked for Greatness +3 XP
        const mfgBonus = battle.markedForGreatnessUnitId === u.id ? 3 : 0;
        // Base +1 XP for surviving (only non-destroyed units)
        const survived = !u.isDestroyed;
        const baseXP = 1;
        const totalXP = xpGain + mfgBonus + (survived ? baseXP : 0);
        return {
          ...u,
          xp: u.xp + totalXP,
          battlesPlayed: u.battlesPlayed + 1,
          battlesSurvived: survived ? u.battlesSurvived + 1 : u.battlesSurvived,
        };
      });

      // Update W/L/D, RP
      const wins = battle.result === 'victory' ? c.wins + 1 : c.wins;
      const losses = battle.result === 'defeat' ? c.losses + 1 : c.losses;
      const draws = battle.result === 'draw' ? c.draws + 1 : c.draws;
      const rpAfter = Math.min(10, Math.max(0, c.requisitionPoints + battle.rpChange));

      return {
        ...c,
        wins,
        losses,
        draws,
        totalBattles: battleNumber,
        requisitionPoints: rpAfter,
        units,
        battles: [...c.battles, newBattle],
      };
    });
  }, [mutateActive]);

  // -----------------------------------------------------------------------
  // Value
  // -----------------------------------------------------------------------

  const value = useMemo<CrusadeState>(() => ({
    campaigns,
    activeCampaignId,
    campaign,
    createCampaign,
    deleteCampaign,
    switchCampaign,
    renameCampaign,
    updateCampaignDetachment,
    updateFactionData,
    setSupplyLimit,
    spendRP,
    gainRP,
    addUnit,
    updateUnit,
    removeUnit,
    setWarlord,
    markUnitDestroyed,
    restoreUnit,
    awardXP,
    addBattleHonour,
    removeBattleHonour,
    addBattleScar,
    removeBattleScar,
    buyLegendaryVeterans,
    addDeedOfMaking,
    removeDeedOfMaking,
    recordBattle,
  }), [
    campaigns, activeCampaignId, campaign,
    createCampaign, deleteCampaign, switchCampaign, renameCampaign,
    updateCampaignDetachment, updateFactionData,
    setSupplyLimit, spendRP, gainRP,
    addUnit, updateUnit, removeUnit, setWarlord, markUnitDestroyed, restoreUnit,
    awardXP,
    addBattleHonour, removeBattleHonour, addBattleScar, removeBattleScar, buyLegendaryVeterans,
    addDeedOfMaking, removeDeedOfMaking,
    recordBattle,
  ]);

  return (
    <CrusadeContext.Provider value={value}>
      {children}
    </CrusadeContext.Provider>
  );
}

export function useCrusade(): CrusadeState {
  const ctx = useContext(CrusadeContext);
  if (!ctx) throw new Error('useCrusade must be used within CrusadeProvider');
  return ctx;
}
