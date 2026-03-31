import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import {
  fetchManifest, fetchGameData, getActiveGameId, setActiveGameId,
  hasCachedGameData, clearGameCache, clearAllGameCaches,
  type GameManifest, type GameManifestEntry, type LoadedGameData,
} from '../lib/dataManager';
import { setGameData, clearGameData } from '../data';

interface GameDataState {
  /** The manifest of available games */
  manifest: GameManifest | null;
  /** Whether the manifest is loading */
  manifestLoading: boolean;
  /** Error from manifest fetch */
  manifestError: string | null;
  /** Currently active game ID */
  activeGameId: string | null;
  /** Currently active game metadata */
  activeGame: GameManifestEntry | null;
  /** Whether game data is loading */
  dataLoading: boolean;
  /** Error from data fetch */
  dataError: string | null;
  /** Whether any game data is loaded and ready */
  dataReady: boolean;
  /** Load the manifest */
  refreshManifest: () => Promise<void>;
  /** Select and load a game */
  selectGame: (gameId: string) => Promise<void>;
  /** Unload the current game */
  clearGame: () => void;
  /** Clear cached data for a game */
  clearCache: (gameId: string) => Promise<void>;
  /** Clear all caches */
  clearAllCaches: () => Promise<void>;
  /** Check if a game has cached data */
  isCached: (gameId: string) => Promise<boolean>;
}

const GameDataCtx = createContext<GameDataState | null>(null);

export function useGameData(): GameDataState {
  const ctx = useContext(GameDataCtx);
  if (!ctx) throw new Error('useGameData must be inside GameDataProvider');
  return ctx;
}

export function GameDataProvider({ children }: { children: ReactNode }) {
  const [manifest, setManifest] = useState<GameManifest | null>(null);
  const [manifestLoading, setManifestLoading] = useState(false);
  const [manifestError, setManifestError] = useState<string | null>(null);
  const [activeGameId, setActiveGameIdState] = useState<string | null>(null);
  const [activeGame, setActiveGame] = useState<GameManifestEntry | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [dataReady, setDataReady] = useState(false);

  const refreshManifest = useCallback(async () => {
    setManifestLoading(true);
    setManifestError(null);
    try {
      const m = await fetchManifest();
      setManifest(m);
    } catch (e) {
      setManifestError(e instanceof Error ? e.message : 'Failed to load game list');
    } finally {
      setManifestLoading(false);
    }
  }, []);

  const selectGame = useCallback(async (gameId: string) => {
    const game = manifest?.games.find(g => g.id === gameId);
    if (!game) {
      setDataError(`Game "${gameId}" not found in manifest`);
      return;
    }
    setDataLoading(true);
    setDataError(null);
    try {
      const data = await fetchGameData(game);
      // Push data into the synchronous data layer
      setGameData(data.units, data.rules, data.general.coreRules, data.general.crusadeRules, data.general.rulesCommentary);
      setActiveGameIdState(gameId);
      await setActiveGameId(gameId);
      setActiveGame(game);
      setDataReady(true);
    } catch (e) {
      setDataError(e instanceof Error ? e.message : 'Failed to load game data');
    } finally {
      setDataLoading(false);
    }
  }, [manifest]);

  const clearGame = useCallback(() => {
    clearGameData();
    setActiveGameIdState(null);
    setActiveGameId(null);
    setActiveGame(null);
    setDataReady(false);
  }, []);

  const clearCacheFn = useCallback(async (gameId: string) => {
    await clearGameCache(gameId);
  }, []);

  const clearAllCachesFn = useCallback(async () => {
    await clearAllGameCaches();
    clearGame();
  }, [clearGame]);

  const isCached = useCallback(async (gameId: string) => {
    return await hasCachedGameData(gameId);
  }, []);

  // On mount: fetch manifest, then auto-load previously selected game
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setManifestLoading(true);
      try {
        const m = await fetchManifest();
        if (cancelled) return;
        setManifest(m);

        // Auto-load previously selected game
        const savedId = await getActiveGameId();
        if (savedId) {
          setActiveGameIdState(savedId);
          const game = m.games.find(g => g.id === savedId);
          if (game) {
            setDataLoading(true);
            try {
              const data = await fetchGameData(game);
              if (cancelled) return;
              setGameData(data.units, data.rules, data.general.coreRules, data.general.crusadeRules, data.general.rulesCommentary);
              setActiveGame(game);
              setDataReady(true);
            } catch {
              // Silently fail — user can re-select
            } finally {
              if (!cancelled) setDataLoading(false);
            }
          }
        }
      } catch (e) {
        if (!cancelled) setManifestError(e instanceof Error ? e.message : 'Failed to load game list');
      } finally {
        if (!cancelled) setManifestLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <GameDataCtx.Provider value={{
      manifest, manifestLoading, manifestError,
      activeGameId, activeGame, dataLoading, dataError, dataReady,
      refreshManifest, selectGame, clearGame,
      clearCache: clearCacheFn, clearAllCaches: clearAllCachesFn, isCached,
    }}>
      {children}
    </GameDataCtx.Provider>
  );
}
