import { useNavigate } from 'react-router';
import { ArrowLeft, Trophy, Skull, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useCrusade } from '../../lib/CrusadeContext';
import { type CrusadeBattle } from '../../lib/CrusadeContext';
import { getAgendasForFaction } from '../../data/crusadeRules';

// ============================================================
// Result badge
// ============================================================

function ResultBadge({ result }: { result: CrusadeBattle['result'] }) {
  const styles = {
    victory: 'text-green-400 border-green-500/40 bg-green-500/10',
    defeat: 'text-red-400 border-red-500/40 bg-red-500/10',
    draw: 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10',
  };
  const icons = {
    victory: <Trophy className="w-3 h-3" />,
    defeat: <Skull className="w-3 h-3" />,
    draw: <Minus className="w-3 h-3" />,
  };
  return (
    <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded border font-semibold uppercase ${styles[result]}`}>
      {icons[result]}
      {result}
    </div>
  );
}

// ============================================================
// Battle card
// ============================================================

function BattleCard({ battle, factionId }: { battle: CrusadeBattle; factionId: string }) {
  const [expanded, setExpanded] = useState(false);
  const agendas = getAgendasForFaction(factionId);
  const usedAgendas = agendas.filter(a => battle.agendaIds.includes(a.id));
  const totalBonusXP = battle.xpEvents.reduce((sum, e) => sum + e.xpAmount, 0);

  return (
    <div className="rounded-sm border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-[var(--bg-card)]/80"
      >
        <div className="flex-shrink-0 text-center">
          <p className="text-xs text-[var(--text-secondary)]">Battle</p>
          <p className="text-xl font-bold font-mono text-[var(--accent-gold)]">{battle.battleNumber}</p>
        </div>

        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{battle.missionName}</p>
          <p className="text-xs text-[var(--text-secondary)] truncate">
            vs {battle.opponentFaction} · {battle.battleSize}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            {new Date(battle.date).toLocaleDateString()}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <ResultBadge result={battle.result} />
          <p className="text-xs font-mono text-[var(--text-secondary)]">
            {battle.yourVP} – {battle.opponentVP}
          </p>
        </div>

        {expanded
          ? <ChevronUp className="w-4 h-4 text-[var(--text-secondary)] flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-[var(--text-secondary)] flex-shrink-0" />
        }
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-[var(--border-color)] space-y-3 pt-3">
          {/* Agendas */}
          {usedAgendas.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Agendas</p>
              <div className="space-y-1">
                {usedAgendas.map(a => (
                  <p key={a.id} className="text-xs text-[var(--text-primary)]">• {a.name}</p>
                ))}
              </div>
            </div>
          )}

          {/* XP events */}
          {battle.xpEvents.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                XP Awarded ({totalBonusXP} bonus XP)
              </p>
              <div className="space-y-1">
                {battle.xpEvents.map((e, i) => (
                  <p key={i} className="text-xs text-[var(--text-secondary)]">
                    +{e.xpAmount} XP — {e.reason}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {battle.notes && (
            <div>
              <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Notes</p>
              <p className="text-xs text-[var(--text-secondary)]">{battle.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Main page
// ============================================================

export default function BattleHistory() {
  const navigate = useNavigate();
  const { campaign } = useCrusade();

  if (!campaign) { navigate('/crusade', { replace: true }); return null; }

  const battles = [...campaign.battles].reverse(); // newest first

  const wins = campaign.wins;
  const losses = campaign.losses;
  const draws = campaign.draws;
  const total = campaign.totalBattles;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] px-4 pt-6 pb-24">
      <div className="max-w-md mx-auto">

        {/* Header */}
        <button
          onClick={() => navigate('/crusade')}
          className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--accent-gold)] transition-colors mb-5"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Dashboard</span>
        </button>

        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1 tracking-wider">Battle History</h1>
        <p className="text-xs text-[var(--text-secondary)] mb-5">{campaign.name}</p>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {[
            { label: 'Total', value: total },
            { label: 'Wins', value: wins, color: 'text-green-400' },
            { label: 'Losses', value: losses, color: 'text-red-400' },
            { label: 'Draws', value: draws, color: 'text-yellow-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-sm border border-[var(--border-color)] bg-[var(--bg-card)] p-3 text-center">
              <p className={`text-2xl font-bold font-mono ${color ?? 'text-[var(--accent-gold)]'}`}>{value}</p>
              <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>

        {/* Battle list */}
        {battles.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-[var(--border-color)] rounded-sm">
            <Trophy className="w-8 h-8 text-[var(--text-secondary)] mx-auto mb-2" />
            <p className="text-sm text-[var(--text-secondary)]">No battles recorded yet</p>
            <button
              onClick={() => navigate('/crusade/post-battle')}
              className="mt-4 px-4 py-2 text-sm border border-[var(--accent-gold)]/40 text-[var(--accent-gold)] rounded hover:bg-[var(--accent-gold)]/10 transition-colors"
            >
              Record a Battle
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {battles.map(b => (
              <BattleCard key={b.id} battle={b} factionId={campaign.factionId} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
