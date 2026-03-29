import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Trophy, Skull, Minus, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { useArmy, type CrusadeBattleRecord } from '../../lib/ArmyContext';

// ---------------------------------------------------------------------------
// Result badge
// ---------------------------------------------------------------------------

function ResultBadge({ result }: { result: CrusadeBattleRecord['result'] }) {
  const styles = {
    win:  'text-green-400 border-green-500/40 bg-green-500/10',
    loss: 'text-red-400 border-red-500/40 bg-red-500/10',
    draw: 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10',
  };
  const icons = {
    win:  <Trophy className="w-3 h-3" />,
    loss: <Skull className="w-3 h-3" />,
    draw: <Minus className="w-3 h-3" />,
  };
  const labels = { win: 'Victory', loss: 'Defeat', draw: 'Draw' };
  return (
    <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded border font-semibold uppercase ${styles[result]}`}>
      {icons[result]}
      {labels[result]}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Battle card
// ---------------------------------------------------------------------------

function BattleCard({ battle, army }: { battle: CrusadeBattleRecord; army: ReturnType<typeof useArmy>['army'] }) {
  const [expanded, setExpanded] = useState(false);

  const totalXP = battle.unitResults.reduce((s, r) => s + r.xpGained + (r.markedForGreatness ? 3 : 0), 0);
  const date = new Date(battle.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg overflow-hidden">
      {/* Header row */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-3 py-3 text-left"
      >
        <ResultBadge result={battle.result} />
        <div className="flex-1 min-w-0">
          {battle.opponent && (
            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">vs {battle.opponent}</p>
          )}
          {battle.missionName && (
            <p className="text-xs text-[var(--text-secondary)] truncate">{battle.missionName}</p>
          )}
          {!battle.opponent && !battle.missionName && (
            <p className="text-sm text-[var(--text-secondary)]">Battle</p>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <p className="text-[10px] text-[var(--text-secondary)]">{date}</p>
            {battle.rpGained > 0 && (
              <p className="text-xs text-[var(--accent-gold)] font-semibold">+{battle.rpGained} RP</p>
            )}
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-[var(--text-secondary)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />}
        </div>
      </button>

      {/* Expanded unit breakdown */}
      {expanded && battle.unitResults.length > 0 && (
        <div className="border-t border-[var(--border-color)] px-3 py-2 space-y-1.5">
          <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-1">Unit Results</p>
          {battle.unitResults.map(r => {
            const unit = army.find(u => u.id === r.unitId);
            const name = unit ? (unit.custom_name || unit.datasheet_name) : 'Unknown Unit';
            const xpTotal = r.xpGained + (r.markedForGreatness ? 3 : 0);
            return (
              <div key={r.unitId} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${r.survived ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className="text-[var(--text-primary)] truncate">{name}</span>
                  {r.markedForGreatness && <span className="text-[var(--accent-gold)] text-[10px]">★ MFG</span>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  {r.kills > 0 && (
                    <span className="flex items-center gap-0.5 text-[var(--text-secondary)]">
                      <Skull className="w-2.5 h-2.5" /> {r.kills}
                    </span>
                  )}
                  {xpTotal > 0 && (
                    <span className="flex items-center gap-0.5 text-[var(--accent-gold)] font-semibold">
                      <Zap className="w-2.5 h-2.5" /> +{xpTotal}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {totalXP > 0 && (
            <div className="border-t border-[var(--border-color)] pt-1.5 flex justify-end">
              <span className="text-xs text-[var(--accent-gold)] font-semibold flex items-center gap-1">
                <Zap className="w-3 h-3" /> {totalXP} total XP awarded
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function BattleHistory() {
  const navigate = useNavigate();
  const { crusade, army } = useArmy();

  if (!crusade) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-[var(--text-secondary)] mb-4">No active Crusade campaign.</p>
          <button onClick={() => navigate('/army')} className="text-[var(--accent-gold)] text-sm">
            ← Back to Army
          </button>
        </div>
      </div>
    );
  }

  const battles = crusade.battles ?? [];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pb-10">
      {/* Header */}
      <div className="px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/army')} className="text-[var(--text-secondary)]">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Battle History</h1>
            <p className="text-xs text-[var(--text-secondary)]">
              {crusade.wins}W / {crusade.losses}L / {crusade.draws}D · {battles.length} battles
            </p>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="px-4 pt-4 space-y-2">
        {battles.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="w-10 h-10 text-[var(--text-secondary)] mx-auto mb-3" />
            <p className="text-sm font-medium text-[var(--text-secondary)]">No battles recorded yet</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Use "Record Battle" after each game</p>
          </div>
        ) : (
          battles.map(battle => (
            <BattleCard key={battle.id} battle={battle} army={army} />
          ))
        )}
      </div>
    </div>
  );
}
