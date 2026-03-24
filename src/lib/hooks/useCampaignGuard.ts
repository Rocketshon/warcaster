import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useCrusade } from '../CrusadeContext';
import type { Campaign, CampaignPlayer } from '../../types';

type GuardResult =
  | { ready: false; campaign: Campaign | null; currentPlayer: CampaignPlayer | null }
  | { ready: true; campaign: Campaign; currentPlayer: CampaignPlayer };

/**
 * Navigation guard hook for pages that require an active campaign.
 * Redirects to /home if no campaign is loaded.
 *
 * Usage:
 *   const guard = useCampaignGuard();
 *   if (!guard.ready) return null;
 *   // guard.campaign and guard.currentPlayer are now non-null
 */
export function useCampaignGuard(): GuardResult {
  const { campaign, currentPlayer } = useCrusade();
  const navigate = useNavigate();

  useEffect(() => {
    if (!campaign) {
      // Delay redirect to allow cloud pull to complete
      const timer = setTimeout(() => {
        if (!campaign) navigate('/home', { replace: true });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [campaign, navigate]);

  if (campaign && currentPlayer) {
    return { ready: true, campaign, currentPlayer };
  }
  return { ready: false, campaign, currentPlayer };
}
