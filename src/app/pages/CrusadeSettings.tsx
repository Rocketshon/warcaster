import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Trash2, AlertTriangle, Zap } from 'lucide-react';
import { useCrusade } from '../../lib/CrusadeContext';
import { CRUSADE_FACTIONS } from '../../data/crusadeRules';
import { toast } from 'sonner';

export default function CrusadeSettings() {
  const navigate = useNavigate();
  const {
    campaign, campaigns, updateCampaignDetachment, setSupplyLimit, gainRP, spendRP,
    updateFactionData, renameCampaign, deleteCampaign,
  } = useCrusade();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [rpDelta, setRpDelta] = useState(0);

  if (!campaign) { navigate('/crusade', { replace: true }); return null; }

  const factionData = CRUSADE_FACTIONS.find(f => f.id === campaign.factionId);

  const handleDeleteCampaign = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    deleteCampaign(campaign.id);
    toast.success('Campaign deleted');
    navigate('/crusade');
  };

  const handleRPAdjust = () => {
    if (rpDelta > 0) gainRP(rpDelta);
    else if (rpDelta < 0) spendRP(Math.abs(rpDelta));
    setRpDelta(0);
    toast.success(`RP ${rpDelta >= 0 ? 'gained' : 'spent'}`);
  };

  const factionLabel =
    campaign.factionId === 'space_wolves' ? 'Honour Points' :
    campaign.factionId === 'world_eaters' ? 'Skull Points' :
    campaign.factionId === 'death_guard' ? 'Virulence Points' :
    campaign.factionId === 'astra_militarum' ? 'Commendation Points' :
    null;

  const currentFactionPoints =
    campaign.factionId === 'space_wolves' ? (campaign.factionData.honourPoints ?? 0) :
    campaign.factionId === 'world_eaters' ? (campaign.factionData.skullPoints ?? 0) :
    campaign.factionId === 'death_guard' ? (campaign.factionData.virulencePoints ?? 0) :
    campaign.factionId === 'astra_militarum' ? (campaign.factionData.commendationPoints ?? 0) :
    null;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] px-4 pt-6 pb-24">
      <div className="max-w-md mx-auto">

        <button
          onClick={() => navigate('/crusade')}
          className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--accent-gold)] transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Dashboard</span>
        </button>

        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-8 tracking-wider">Campaign Settings</h1>

        {/* Supply Limit */}
        <section className="mb-6">
          <h2 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Supply Limit</h2>
          <div className="rounded-sm border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[var(--text-primary)]">Current limit</span>
              <span className="text-lg font-bold font-mono text-[var(--accent-gold)]">{campaign.supplyLimit} pts</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[200, 500, 750, 1000, 1250, 1500, 2000].map(v => (
                <button
                  key={v}
                  onClick={() => { setSupplyLimit(v); toast.success(`Supply limit set to ${v} pts`); }}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                    campaign.supplyLimit === v
                      ? 'border-[var(--accent-gold)] text-[var(--accent-gold)] bg-[var(--accent-gold)]/10'
                      : 'border-[var(--border-color)] text-[var(--text-secondary)]'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* RP manual adjust */}
        <section className="mb-6">
          <h2 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Requisition Points</h2>
          <div className="rounded-sm border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[var(--accent-gold)]" />
                <span className="text-sm text-[var(--text-primary)]">Current RP</span>
              </div>
              <span className="text-lg font-bold font-mono text-[var(--accent-gold)]">{campaign.requisitionPoints} / 10</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 flex-1">
                <button onClick={() => setRpDelta(d => d - 1)} className="w-8 h-8 flex items-center justify-center border border-[var(--border-color)] rounded text-[var(--text-secondary)] hover:text-red-400 transition-colors">−</button>
                <span className={`flex-1 text-center font-mono font-bold ${rpDelta > 0 ? 'text-green-400' : rpDelta < 0 ? 'text-red-400' : 'text-[var(--text-secondary)]'}`}>{rpDelta > 0 ? `+${rpDelta}` : rpDelta}</span>
                <button onClick={() => setRpDelta(d => d + 1)} className="w-8 h-8 flex items-center justify-center border border-[var(--border-color)] rounded text-[var(--text-secondary)] hover:text-green-400 transition-colors">+</button>
              </div>
              <button
                onClick={handleRPAdjust}
                disabled={rpDelta === 0}
                className="px-3 py-2 text-sm border border-[var(--accent-gold)]/40 text-[var(--accent-gold)] rounded hover:bg-[var(--accent-gold)]/10 transition-colors disabled:opacity-40"
              >
                Apply
              </button>
            </div>
          </div>
        </section>

        {/* Detachment */}
        {factionData && (
          <section className="mb-6">
            <h2 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Detachment</h2>
            <div className="rounded-sm border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
              <p className="text-xs text-[var(--text-secondary)] mb-2">Current: <span className="text-[var(--text-primary)]">{campaign.detachmentName}</span></p>
              <div className="space-y-1">
                {factionData.detachments.map(d => (
                  <button
                    key={d}
                    onClick={() => { updateCampaignDetachment(d); toast.success('Detachment updated'); }}
                    className={`w-full text-left text-xs px-3 py-2 rounded border transition-colors ${
                      campaign.detachmentName === d
                        ? 'border-[var(--accent-gold)] text-[var(--accent-gold)] bg-[var(--accent-gold)]/10'
                        : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Faction points manual adjust */}
        {factionLabel !== null && currentFactionPoints !== null && (
          <section className="mb-6">
            <h2 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">{factionLabel}</h2>
            <div className="rounded-sm border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-primary)]">Current</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const key =
                        campaign.factionId === 'space_wolves' ? 'honourPoints' :
                        campaign.factionId === 'world_eaters' ? 'skullPoints' :
                        campaign.factionId === 'death_guard' ? 'virulencePoints' : 'commendationPoints';
                      updateFactionData({ [key]: Math.max(0, currentFactionPoints - 1) });
                    }}
                    className="w-8 h-8 flex items-center justify-center border border-[var(--border-color)] rounded text-[var(--text-secondary)] hover:text-red-400 transition-colors"
                  >
                    −
                  </button>
                  <span className="text-xl font-bold font-mono text-[var(--accent-gold)] w-10 text-center">{currentFactionPoints}</span>
                  <button
                    onClick={() => {
                      const key =
                        campaign.factionId === 'space_wolves' ? 'honourPoints' :
                        campaign.factionId === 'world_eaters' ? 'skullPoints' :
                        campaign.factionId === 'death_guard' ? 'virulencePoints' : 'commendationPoints';
                      updateFactionData({ [key]: currentFactionPoints + 1 });
                    }}
                    className="w-8 h-8 flex items-center justify-center border border-[var(--border-color)] rounded text-[var(--text-secondary)] hover:text-green-400 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Danger zone */}
        <section className="mb-6">
          <h2 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Danger Zone</h2>
          <button
            onClick={handleDeleteCampaign}
            className={`w-full flex items-center gap-3 p-4 rounded-sm border transition-colors ${
              confirmDelete
                ? 'border-red-500/50 bg-red-500/10 text-red-400'
                : 'border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)]'
            }`}
          >
            {confirmDelete ? <AlertTriangle className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
            <div className="text-left">
              <p className="text-sm font-medium">
                {confirmDelete ? 'Tap again to permanently delete' : 'Delete Campaign'}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                {campaign.name} · {campaign.totalBattles} battles · {campaign.units.length} units
              </p>
            </div>
          </button>
        </section>

      </div>
    </div>
  );
}
