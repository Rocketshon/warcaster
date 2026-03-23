// Supabase Realtime subscriptions for live multiplayer updates

import { supabase, isSupabaseConfigured } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface CampaignRealtimeCallbacks {
  onPlayerChange: (payload: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    new: Record<string, unknown>;
    old: Record<string, unknown>;
  }) => void;
  onBattleChange: (payload: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    new: Record<string, unknown>;
    old: Record<string, unknown>;
  }) => void;
  onUnitChange: (payload: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    new: Record<string, unknown>;
    old: Record<string, unknown>;
  }) => void;
}

/**
 * Subscribe to live campaign changes.
 * Listens for INSERT/UPDATE/DELETE on players, battles, and units
 * scoped to a specific campaign_id.
 *
 * Returns the RealtimeChannel so the caller can unsubscribe on cleanup.
 */
export function subscribeToCampaign(
  campaignId: string,
  callbacks: CampaignRealtimeCallbacks,
): RealtimeChannel {
  const channel = supabase
    .channel(`campaign-${campaignId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'cc_campaign_players',
        filter: `campaign_id=eq.${campaignId}`,
      },
      (payload) => {
        callbacks.onPlayerChange({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: (payload.new ?? {}) as Record<string, unknown>,
          old: (payload.old ?? {}) as Record<string, unknown>,
        });
      },
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'cc_battles',
        filter: `campaign_id=eq.${campaignId}`,
      },
      (payload) => {
        callbacks.onBattleChange({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: (payload.new ?? {}) as Record<string, unknown>,
          old: (payload.old ?? {}) as Record<string, unknown>,
        });
      },
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'cc_crusade_units',
      },
      (payload) => {
        callbacks.onUnitChange({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: (payload.new ?? {}) as Record<string, unknown>,
          old: (payload.old ?? {}) as Record<string, unknown>,
        });
      },
    )
    .subscribe();

  return channel;
}

/**
 * Unsubscribe from a campaign realtime channel.
 */
export function unsubscribeFromCampaign(channel: RealtimeChannel): void {
  if (!isSupabaseConfigured()) return;
  supabase.removeChannel(channel);
}
