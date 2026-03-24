import { useEffect } from 'react';
import type { Campaign, CampaignPlayer, CrusadeUnit, Battle } from '../../types';
import * as storage from '../storage';
import * as sync from '../sync';
import { flushQueue } from '../offlineQueue';
import { isSupabaseConfigured } from '../supabase';
interface SimpleUser {
  id: string;
  username: string;
}

interface SyncSetters {
  setCampaign: React.Dispatch<React.SetStateAction<Campaign | null>>;
  setCurrentPlayer: React.Dispatch<React.SetStateAction<CampaignPlayer | null>>;
  setPlayers: React.Dispatch<React.SetStateAction<CampaignPlayer[]>>;
  setUnits: React.Dispatch<React.SetStateAction<CrusadeUnit[]>>;
  setBattles: React.Dispatch<React.SetStateAction<Battle[]>>;
}

/**
 * Manages cloud sync effects:
 * - Persists state to localStorage on change
 * - Pulls from cloud on auth change
 * - Debounced player sync to cloud
 */
export function useSyncEffect(
  campaign: Campaign | null,
  currentPlayer: CampaignPlayer | null,
  units: CrusadeUnit[],
  battles: Battle[],
  authUser: SimpleUser | null,
  setters: SyncSetters,
) {
  const { setCampaign, setCurrentPlayer, setPlayers, setUnits, setBattles } = setters;

  // Persist on change (localStorage cache)
  useEffect(() => { if (campaign) storage.saveCampaign(campaign); }, [campaign]);
  useEffect(() => { if (currentPlayer) storage.savePlayer(currentPlayer); }, [currentPlayer]);
  useEffect(() => { storage.saveUnits(units); }, [units]);
  useEffect(() => { storage.saveBattles(battles); }, [battles]);

  // Pull from cloud on auth change
  useEffect(() => {
    if (!authUser?.id || !isSupabaseConfigured()) return;
    let cancelled = false;

    (async () => {
      try {
        const cloudData = await sync.pullCampaignFromCloud(authUser.id);
        if (cancelled || !cloudData) return;
        if (cloudData.campaign) {
          setCampaign(cloudData.campaign);
          setCurrentPlayer(cloudData.player);
          setUnits(cloudData.units);
          setBattles(cloudData.battles);
          // Use players already fetched by pullCampaignFromCloud (no second round-trip)
          if (cloudData.players.length > 0 && !cancelled) {
            setPlayers(cloudData.players);
            storage.safeSetItem(storage.STORAGE_KEYS.ALL_PLAYERS, JSON.stringify(cloudData.players));
          }
        } else {
          // No cloud campaign — try to migrate local data
          const localCampaign = storage.loadCampaign();
          if (localCampaign) {
            await sync.migrateLocalData(authUser.id);
          }
        }
        // Flush any pending offline mutations
        await flushQueue();
      } catch (err) {
        console.warn('Cloud sync failed, using local data:', err);
      }
    })();

    return () => { cancelled = true; };
  }, [authUser?.id, setCampaign, setCurrentPlayer, setPlayers, setUnits, setBattles]);

  // Sync player to cloud whenever player state changes
  useEffect(() => {
    if (currentPlayer && isSupabaseConfigured()) {
      const timer = setTimeout(() => {
        sync.updatePlayerInCloud(currentPlayer).catch(console.warn);
      }, 1000); // Debounce 1s to avoid rapid-fire updates
      return () => clearTimeout(timer);
    }
  }, [currentPlayer]);
}
