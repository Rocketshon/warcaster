import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { CollectionItem, PaintingStage } from '../types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const STORAGE_KEY = 'warcaster_collection';

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StageStats {
  stage: PaintingStage;
  count: number;
}

export interface FactionStats {
  factionId: string;
  total: number;
  painted: number;
  completionPercentage: number;
}

interface CollectionContextType {
  items: CollectionItem[];
  // Actions
  addItem: (name: string, factionId: string, datasheetName: string, quantity: number) => void;
  updateItem: (id: string, updates: Partial<CollectionItem>) => void;
  removeItem: (id: string) => void;
  updateStage: (id: string, stage: PaintingStage) => void;
  // Derived
  totalModels: number;
  paintedCount: number;
  completionPercentage: number;
  statsByFaction: FactionStats[];
  statsByStage: StageStats[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadItems(): CollectionItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveItems(items: CollectionItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

const PAINTING_STAGES: PaintingStage[] = [
  'unassembled', 'assembled', 'primed', 'basecoated', 'painted', 'based', 'complete',
];

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const CollectionContext = createContext<CollectionContextType | null>(null);

export function CollectionProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CollectionItem[]>(loadItems);

  const persist = useCallback((next: CollectionItem[]) => {
    setItems(next);
    saveItems(next);
  }, []);

  // --- Actions ---

  const addItem = useCallback((name: string, factionId: string, datasheetName: string, quantity: number) => {
    const newItem: CollectionItem = {
      id: generateId(),
      name,
      factionId,
      datasheetName,
      quantity: Math.max(1, quantity),
      stage: 'unassembled',
      notes: '',
      addedAt: new Date().toISOString(),
    };
    persist([...items, newItem]);
  }, [items, persist]);

  const updateItem = useCallback((id: string, updates: Partial<CollectionItem>) => {
    persist(items.map(item => item.id === id ? { ...item, ...updates } : item));
  }, [items, persist]);

  const removeItem = useCallback((id: string) => {
    persist(items.filter(item => item.id !== id));
  }, [items, persist]);

  const updateStage = useCallback((id: string, stage: PaintingStage) => {
    persist(items.map(item => item.id === id ? { ...item, stage } : item));
  }, [items, persist]);

  // --- Derived ---

  const totalModels = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  const paintedCount = useMemo(
    () => items.filter(i => i.stage === 'painted' || i.stage === 'based' || i.stage === 'complete')
      .reduce((sum, i) => sum + i.quantity, 0),
    [items],
  );

  const completionPercentage = useMemo(
    () => (totalModels === 0 ? 0 : Math.round((items.filter(i => i.stage === 'complete').reduce((s, i) => s + i.quantity, 0) / totalModels) * 100)),
    [items, totalModels],
  );

  const statsByFaction = useMemo<FactionStats[]>(() => {
    const map = new Map<string, { total: number; painted: number }>();
    for (const item of items) {
      const entry = map.get(item.factionId) ?? { total: 0, painted: 0 };
      entry.total += item.quantity;
      if (item.stage === 'complete') entry.painted += item.quantity;
      map.set(item.factionId, entry);
    }
    return Array.from(map.entries()).map(([factionId, { total, painted }]) => ({
      factionId,
      total,
      painted,
      completionPercentage: total === 0 ? 0 : Math.round((painted / total) * 100),
    }));
  }, [items]);

  const statsByStage = useMemo<StageStats[]>(() => {
    const counts = new Map<PaintingStage, number>();
    for (const s of PAINTING_STAGES) counts.set(s, 0);
    for (const item of items) {
      counts.set(item.stage, (counts.get(item.stage) ?? 0) + item.quantity);
    }
    return PAINTING_STAGES.map(stage => ({ stage, count: counts.get(stage) ?? 0 }));
  }, [items]);

  const value = useMemo<CollectionContextType>(() => ({
    items,
    addItem,
    updateItem,
    removeItem,
    updateStage,
    totalModels,
    paintedCount,
    completionPercentage,
    statsByFaction,
    statsByStage,
  }), [items, addItem, updateItem, removeItem, updateStage, totalModels, paintedCount, completionPercentage, statsByFaction, statsByStage]);

  return (
    <CollectionContext.Provider value={value}>
      {children}
    </CollectionContext.Provider>
  );
}

export function useCollection(): CollectionContextType {
  const ctx = useContext(CollectionContext);
  if (!ctx) throw new Error('useCollection must be used within a CollectionProvider');
  return ctx;
}

export { PAINTING_STAGES };
