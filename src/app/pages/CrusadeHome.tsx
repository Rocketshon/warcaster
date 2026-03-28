import { useNavigate } from 'react-router';
import {
  Plus,
  Swords,
  ScrollText,
  Trophy,
  Zap,
  ChevronRight,
  Shield,
  History,
  Settings2,
} from 'lucide-react';
import { useCrusade } from '../../lib/CrusadeContext';
import { getFactionById, getHonourSlots, getRank } from '../../data/crusadeRules';
import { SW_OATHSWORN_CAMPAIGNS } from '../../data/crusadeRules';

// ============================================================
// Stat tile
// ============================================================

function StatTile({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-sm border border-[var(--border-color)] bg-[var(--bg-card)] p-3 flex flex-col items-center">
      <span className={`text-2xl font-bold font-mono ${accent ? 'text-[var(--accent-gold)]' : 'text-[var(--text-primary)]'}`}>
        {value}
      </span>
      <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mt-0.5">{label}</span>
      {sub && <span className="text-[10px] text-[var(--text-secondary)]">{sub}</span>}
    </div>
  );
}

// ============================================================
// RP bar
// ============================================================

function RPBar({ rp }: { rp: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className={`flex-1 h-2.5 rounded-full transition-colors ${
            i < rp ? 'bg-[var(--accent-gold)]' : 'bg-[var(--border-color)]'
          }`}
        />
      ))}
    </div>
  );
}

// ============================================================
// Faction mechanic display
// ============================================================

function FactionMechanicPanel({ campaign }: { campaign: ReturnType<typeof useCrusade>['campaign'] }) {
  if (!campaign) return null;
  const fd = campaign.factionData;

  switch (campaign.factionId) {
    case 'space_wolves': {
      const saga = fd.oathswornCampaignId
        ? SW_OATHSWORN_CAMPAIGNS.find(s => s.id === fd.oathswornCampaignId)
        : null;
      return (
        <div className="rounded-sm border border-blue-400/30 bg-blue-400/5 p-4">
          <h3 className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-2">Space Wolves</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Honour Points</p>
              {saga && <p className="text-xs text-blue-300 mt-0.5">Saga: {saga.name}</p>}
            </div>
            <span className="text-3xl font-bold text-blue-300 font-mono">{fd.honourPoints ?? 0}</span>
          </div>
        </div>
      );
    }
    case 'world_eaters':
      return (
        <div className="rounded-sm border border-red-500/30 bg-red-500/5 p-4">
          <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">World Eaters</h3>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--text-secondary)]">Skull Points</p>
            <span className="text-3xl font-bold text-red-400 font-mono">{fd.skullPoints ?? 0}</span>
          </div>
        </div>
      );
    case 'death_guard':
      return (
        <div className="rounded-sm border border-green-700/30 bg-green-700/5 p-4">
          <h3 className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-2">Death Guard</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Virulence Points</p>
              {fd.plagueVector && <p className="text-xs text-green-400/70 mt-0.5">Vector: {fd.plagueVector}</p>}
            </div>
            <span className="text-3xl font-bold text-green-400 font-mono">{fd.virulencePoints ?? 0}</span>
          </div>
        </div>
      );
    case 'chaos_space_marines':
      return (
        <div className="rounded-sm border border-purple-500/30 bg-purple-500/5 p-4">
          <h3 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">Chaos Space Marines</h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'Personal', val: fd.personalGlory ?? 0 },
              { label: 'Dark God', val: fd.darkGodGlory ?? 0 },
              { label: 'Warfleet', val: fd.warfleetGlory ?? 0 },
            ].map(({ label, val }) => (
              <div key={label}>
                <div className="text-xl font-bold text-purple-400 font-mono">{val}</div>
                <div className="text-[10px] text-[var(--text-secondary)]">{label}</div>
              </div>
            ))}
          </div>
        </div>
      );
    case 'astra_militarum':
      return (
        <div className="rounded-sm border border-yellow-600/30 bg-yellow-600/5 p-4">
          <h3 className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-2">Astra Militarum</h3>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--text-secondary)]">Commendation Points</p>
            <span className="text-3xl font-bold text-yellow-400 font-mono">{fd.commendationPoints ?? 0}</span>
          </div>
        </div>
      );
    default:
      return null;
  }
}

// ============================================================
// No campaign state
// ============================================================

function NoCampaign() {
  const navigate = useNavigate();
  const { campaigns, switchCampaign } = useCrusade();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] px-4 pt-12 pb-24 flex flex-col items-center justify-center">
      <div className="max-w-sm w-full text-center">
        <Swords className="w-12 h-12 text-[var(--accent-gold)] mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2 tracking-wider">Crusade</h1>
        <p className="text-sm text-[var(--text-secondary)] mb-8">
          Track your Crusade campaign — Order of Battle, XP, Battle Honours, and faction mechanics.
        </p>

        {campaigns.length > 0 && (
          <div className="mb-6 space-y-2 text-left">
            <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">Your Campaigns</p>
            {campaigns.map(c => (
              <button
                key={c.id}
                onClick={() => switchCampaign(c.id)}
                className="w-full flex items-center gap-3 p-4 rounded-sm border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--accent-gold)]/40 transition-colors"
              >
                <Shield className="w-5 h-5 text-[var(--accent-gold)]" />
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{c.name}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{c.totalBattles} battles</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => navigate('/crusade/new')}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-sm border border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] font-semibold hover:bg-[var(--accent-gold)]/20 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Start New Campaign
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Main Dashboard
// ============================================================

export default function CrusadeHome() {
  const navigate = useNavigate();
  const { campaign, campaigns, switchCampaign } = useCrusade();

  if (!campaign) return <NoCampaign />;

  const factionData = getFactionById(campaign.factionId);
  const supplyUsed = campaign.units.reduce((sum, u) => sum + u.pointsCost, 0);
  const supplyPct = Math.min(100, Math.round((supplyUsed / campaign.supplyLimit) * 100));

  // Top 3 units by XP for quick view
  const topUnits = [...campaign.units]
    .filter(u => !u.isDestroyed)
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] px-4 pt-6 pb-24">
      <div className="max-w-md mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-wider truncate max-w-[200px]">
            {campaign.name}
          </h1>
          <div className="flex items-center gap-2">
            {campaigns.length > 1 && (
              <button
                onClick={() => {
                  // Cycle to next campaign
                  const idx = campaigns.findIndex(c => c.id === campaign.id);
                  const next = campaigns[(idx + 1) % campaigns.length];
                  switchCampaign(next.id);
                }}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent-gold)] px-2 py-1 border border-[var(--border-color)] rounded transition-colors"
              >
                Switch
              </button>
            )}
            <button
              onClick={() => navigate('/crusade/new')}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--accent-gold)] hover:border-[var(--accent-gold)]/40 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {factionData && (
          <p className="text-xs text-[var(--text-secondary)] mb-5">
            {factionData.name} · {campaign.detachmentName}
          </p>
        )}

        {/* W/L/D + RP */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <StatTile label="Wins" value={campaign.wins} accent />
          <StatTile label="Losses" value={campaign.losses} />
          <StatTile label="Draws" value={campaign.draws} />
          <StatTile label="Battles" value={campaign.totalBattles} />
        </div>

        {/* RP */}
        <div className="rounded-sm border border-[var(--border-color)] bg-[var(--bg-card)] p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[var(--accent-gold)]" />
              <span className="text-sm font-semibold text-[var(--text-primary)]">Requisition Points</span>
            </div>
            <span className="text-lg font-bold font-mono text-[var(--accent-gold)]">{campaign.requisitionPoints} / 10</span>
          </div>
          <RPBar rp={campaign.requisitionPoints} />
        </div>

        {/* Supply Limit */}
        <div className="rounded-sm border border-[var(--border-color)] bg-[var(--bg-card)] p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-[var(--text-primary)]">Supply Limit</span>
            <span className={`text-sm font-mono font-bold ${supplyUsed > campaign.supplyLimit ? 'text-red-400' : 'text-[var(--accent-gold)]'}`}>
              {supplyUsed} / {campaign.supplyLimit} pts
            </span>
          </div>
          <div className="h-2 bg-[var(--border-color)] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${supplyUsed > campaign.supplyLimit ? 'bg-red-400' : 'bg-[var(--accent-gold)]'}`}
              style={{ width: `${supplyPct}%` }}
            />
          </div>
        </div>

        {/* Faction mechanic panel */}
        <div className="mb-4">
          <FactionMechanicPanel campaign={campaign} />
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          <button
            onClick={() => navigate('/crusade/order-of-battle')}
            className="flex items-center gap-3 p-4 rounded-sm border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--accent-gold)]/40 transition-colors"
          >
            <ScrollText className="w-5 h-5 text-[var(--accent-gold)]" />
            <div className="text-left">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Order of Battle</p>
              <p className="text-xs text-[var(--text-secondary)]">{campaign.units.length} units</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/crusade/post-battle')}
            className="flex items-center gap-3 p-4 rounded-sm border border-[var(--accent-gold)]/40 bg-[var(--accent-gold)]/5 hover:bg-[var(--accent-gold)]/10 transition-colors"
          >
            <Swords className="w-5 h-5 text-[var(--accent-gold)]" />
            <div className="text-left">
              <p className="text-sm font-semibold text-[var(--accent-gold)]">Post-Battle</p>
              <p className="text-xs text-[var(--text-secondary)]">Record battle</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/crusade/history')}
            className="flex items-center gap-3 p-4 rounded-sm border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--accent-gold)]/40 transition-colors"
          >
            <History className="w-5 h-5 text-[var(--accent-gold)]" />
            <div className="text-left">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Battle History</p>
              <p className="text-xs text-[var(--text-secondary)]">{campaign.battles.length} recorded</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/crusade/settings')}
            className="flex items-center gap-3 p-4 rounded-sm border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--accent-gold)]/40 transition-colors"
          >
            <Settings2 className="w-5 h-5 text-[var(--accent-gold)]" />
            <div className="text-left">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Campaign Settings</p>
              <p className="text-xs text-[var(--text-secondary)]">RP, supply, detachment</p>
            </div>
          </button>
        </div>

        {/* Top units */}
        {topUnits.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Notable Warriors
              </h2>
              <button
                onClick={() => navigate('/crusade/order-of-battle')}
                className="text-xs text-[var(--accent-gold)] hover:underline"
              >
                View all
              </button>
            </div>
            <div className="space-y-2">
              {topUnits.map(unit => {
                const rank = getRank(unit.xp, unit.isCharacter, unit.legendaryVeterans);
                const slots = getHonourSlots(unit.xp, unit.isCharacter, unit.legendaryVeterans);
                return (
                  <button
                    key={unit.id}
                    onClick={() => navigate(`/crusade/unit/${unit.id}`)}
                    className="w-full flex items-center gap-3 p-3 rounded-sm border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--accent-gold)]/40 transition-colors"
                  >
                    <Trophy className="w-4 h-4 flex-shrink-0" style={{ color: rank.color }} />
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {unit.customName || unit.datasheetName}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {rank.name} · {unit.xp} XP · {unit.battleHonours.length}/{slots} honours
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--text-secondary)] flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state CTA */}
        {campaign.units.length === 0 && (
          <div className="text-center py-10 border border-dashed border-[var(--border-color)] rounded-sm">
            <ScrollText className="w-8 h-8 text-[var(--text-secondary)] mx-auto mb-2" />
            <p className="text-sm text-[var(--text-secondary)] mb-4">Your Order of Battle is empty</p>
            <button
              onClick={() => navigate('/crusade/order-of-battle')}
              className="px-4 py-2 text-sm text-[var(--accent-gold)] border border-[var(--accent-gold)]/40 rounded hover:bg-[var(--accent-gold)]/10 transition-colors"
            >
              Add Units
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
