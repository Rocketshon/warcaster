/**
 * Simple feature flag system backed by localStorage.
 * Falls back to defaults when offline or storage unavailable.
 */

export interface FeatureFlags {
  BATTLE_NARRATOR: boolean;      // AI story generation
  COMBAT_TRACKER: boolean;       // Live combat tracker
  CAMPAIGN_MAP: boolean;         // Territory map
  FACTION_LEGACY: boolean;       // Faction-specific trackers
  HALL_OF_FAME: boolean;         // Leaderboards
  REQUISITION_STORE: boolean;    // RP spending
  DICE_ROLLER_ANIMATIONS: boolean; // 3D dice animations
  REALTIME_SYNC: boolean;        // Cross-device realtime
}

const DEFAULT_FLAGS: FeatureFlags = {
  BATTLE_NARRATOR: true,
  COMBAT_TRACKER: true,
  CAMPAIGN_MAP: true,
  FACTION_LEGACY: true,
  HALL_OF_FAME: true,
  REQUISITION_STORE: true,
  DICE_ROLLER_ANIMATIONS: true,
  REALTIME_SYNC: true,
};

const FLAGS_KEY = 'crusade_feature_flags';

let currentFlags: FeatureFlags = { ...DEFAULT_FLAGS };

export function initFeatureFlags(): void {
  try {
    const stored = localStorage.getItem(FLAGS_KEY);
    if (stored) {
      currentFlags = { ...DEFAULT_FLAGS, ...JSON.parse(stored) };
    }
  } catch {
    currentFlags = { ...DEFAULT_FLAGS };
  }
}

export function isFeatureEnabled(flag: keyof FeatureFlags): boolean {
  return currentFlags[flag] ?? false;
}

export function setFeatureFlag(flag: keyof FeatureFlags, enabled: boolean): void {
  currentFlags[flag] = enabled;
  try {
    localStorage.setItem(FLAGS_KEY, JSON.stringify(currentFlags));
  } catch {
    // Quota exceeded — flags still work in memory
  }
}

export function getAllFlags(): FeatureFlags {
  return { ...currentFlags };
}

// Initialize on module load
initFeatureFlags();
