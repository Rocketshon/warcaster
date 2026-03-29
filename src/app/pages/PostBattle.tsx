import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft, Trophy, Skull, Minus, Plus, Check, Zap,
} from 'lucide-react';
import { useArmy, type ArmyUnit } from '../../lib/ArmyContext';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BattleResult = 'win' | 'loss' | 'draw';

interface UnitResult {
  unitId: string;
  survived: boolean;
  kills: number;
  xpGained: number;
  markedForGreatness: boolean;
}

// ---------------------------------------------------------------------------
// Unit row
// ---------------------------------------------------------------------------

function UnitResultRow({
  unit,
  result,
  isMFG,
  onToggleMFG,
  onChange,
}: {
  unit: ArmyUnit;
  result: UnitResult;
  isMFG: boolean;
  onToggleMFG: () => void;
  onChange: (updates: Partial<UnitResult>) => void;
}) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-3">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
            {unit.custom_name || unit.datasheet_name}
          </p>
          {unit.custom_name && (
            <p className="text-[10px] text-[var(--text-secondary)]">{unit.datasheet_name}</p>
          )}
        </div>
        {/* MFG star */}
        <button
          onClick={onToggleMFG}
          title="Marked for Greatness (+3 XP)"
          className={`flex-shrink-0 w-7 h-7 rounded border flex items-center justify-center transition-colors ${
            isMFG
              ? 'border-[var(--accent-gold)] bg-[var(--accent-gold)]/20 text-[var(--accent-gold)]'
              : 'border-[var(--border-color)] text-[var(--text-secondary)]'
          }`}
        >
          ★
        </button>
      </div>

      <div className="flex items-center gap-3">
        {/* Survived toggle */}
        <button
          onClick={() => onChange({ survived: !result.survived })}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-xs font-medium transition-colors ${
            result.survived
              ? 'border-green-500/40 bg-green-500/10 text-green-400'
              : 'border-red-500/40 bg-red-500/10 text-red-400'
          }`}
        >
          {result.survived ? <Check className="w-3 h-3" /> : <Skull className="w-3 h-3" />}
          {result.survived ? 'Survived' : 'Destroyed'}
        </button>

        {/* Kills */}
        <div className="flex items-center gap-1.5 ml-auto">
          <Skull className="w-3 h-3 text-[var(--text-secondary)]" />
          <button
            onClick={() => onChange({ kills: Math.max(0, result.kills - 1) })}
            className="w-6 h-6 rounded border border-[var(--border-color)] text-[var(--text-secondary)] flex items-center justify-center text-sm font-bold"
          >−</button>
          <span className="w-5 text-center text-sm font-bold text-[var(--text-primary)]">{result.kills}</span>
          <button
            onClick={() => onChange({ kills: result.kills + 1 })}
            className="w-6 h-6 rounded border border-[var(--border-color)] text-[var(--text-secondary)] flex items-center justify-center text-sm font-bold"
          >+</button>
        </div>

        {/* XP */}
        <div className="flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-[var(--accent-gold)]" />
          <button
            onClick={() => onChange({ xpGained: Math.max(0, result.xpGained - 1) })}
            className="w-6 h-6 rounded border border-[var(--border-color)] text-[var(--text-secondary)] flex items-center justify-center text-sm font-bold"
          >−</button>
          <span className="w-5 text-center text-sm font-bold text-[var(--accent-gold)]">{result.xpGained}</span>
          <button
            onClick={() => onChange({ xpGained: result.xpGained + 1 })}
            className="w-6 h-6 rounded border border-[var(--border-color)] text-[var(--text-secondary)] flex items-center justify-center text-sm font-bold"
          >+</button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function PostBattle() {
  const navigate = useNavigate();
  const { army, crusade, recordBattle } = useArmy();

  const [battleResult, setBattleResult] = useState<BattleResult>('win');
  const [opponent, setOpponent] = useState('');
  const [missionName, setMissionName] = useState('');
  const [rpGained, setRpGained] = useState(1);
  const [mfgUnitId, setMfgUnitId] = useState<string | null>(null);

  // Only living (non-destroyed) units can be in the post-battle flow
  const activeUnits = army.filter(u => !u.is_destroyed);

  const [unitResults, setUnitResults] = useState<UnitResult[]>(() =>
    activeUnits.map(u => ({
      unitId: u.id,
      survived: true,
      kills: 0,
      xpGained: 1,
      markedForGreatness: false,
    }))
  );

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

  const updateUnitResult = (unitId: string, updates: Partial<UnitResult>) => {
    setUnitResults(prev => prev.map(r => r.unitId === unitId ? { ...r, ...updates } : r));
  };

  const handleSave = () => {
    recordBattle({
      result: battleResult,
      opponent: opponent.trim() || undefined,
      missionName: missionName.trim() || undefined,
      rpGained,
      unitResults: unitResults.map(r => ({
        ...r,
        markedForGreatness: r.unitId === mfgUnitId,
      })),
    });
    toast.success('Battle recorded!');
    navigate('/army');
  };

  const resultOptions: { value: BattleResult; label: string; icon: React.ReactNode; style: string }[] = [
    { value: 'win',  label: 'Victory', icon: <Trophy className="w-5 h-5" />, style: 'border-green-500/50 bg-green-500/10 text-green-400' },
    { value: 'draw', label: 'Draw',    icon: <Minus className="w-5 h-5" />,  style: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400' },
    { value: 'loss', label: 'Defeat',  icon: <Skull className="w-5 h-5" />,  style: 'border-red-500/50 bg-red-500/10 text-red-400' },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pb-10">
      {/* Header */}
      <div className="px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/army')} className="text-[var(--text-secondary)]">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Record Battle</h1>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* Battle result */}
        <div>
          <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">Result</p>
          <div className="grid grid-cols-3 gap-2">
            {resultOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setBattleResult(opt.value)}
                className={`flex flex-col items-center gap-1 py-3 rounded-lg border transition-colors ${
                  battleResult === opt.value ? opt.style : 'border-[var(--border-color)] text-[var(--text-secondary)]'
                }`}
              >
                {opt.icon}
                <span className="text-xs font-semibold">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Opponent + Mission */}
        <div className="space-y-3">
          <div>
            <label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">Opponent (optional)</label>
            <input
              type="text"
              value={opponent}
              onChange={e => setOpponent(e.target.value)}
              placeholder="Who did you fight?"
              className="mt-1 w-full px-3 py-2.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-gold)]"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">Mission (optional)</label>
            <input
              type="text"
              value={missionName}
              onChange={e => setMissionName(e.target.value)}
              placeholder="Mission name"
              className="mt-1 w-full px-3 py-2.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-gold)]"
            />
          </div>
        </div>

        {/* RP Gained */}
        <div>
          <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">Requisition Points Gained</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setRpGained(v => Math.max(0, v - 1))}
              className="w-8 h-8 rounded border border-[var(--border-color)] text-[var(--text-secondary)] flex items-center justify-center text-lg font-bold"
            >−</button>
            <span className="text-lg font-bold text-[var(--accent-gold)] w-6 text-center">{rpGained}</span>
            <button
              onClick={() => setRpGained(v => Math.min(10, v + 1))}
              className="w-8 h-8 rounded border border-[var(--border-color)] text-[var(--text-secondary)] flex items-center justify-center text-lg font-bold"
            >+</button>
            <span className="text-xs text-[var(--text-secondary)]">RP</span>
          </div>
        </div>

        {/* Unit results */}
        {activeUnits.length > 0 && (
          <div>
            <div className="flex items-end justify-between mb-2">
              <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">Units</p>
              <p className="text-[10px] text-[var(--text-secondary)]">★ = Marked for Greatness (+3 XP)</p>
            </div>
            <div className="space-y-2">
              {activeUnits.map(unit => {
                const result = unitResults.find(r => r.unitId === unit.id);
                if (!result) return null;
                return (
                  <UnitResultRow
                    key={unit.id}
                    unit={unit}
                    result={result}
                    isMFG={mfgUnitId === unit.id}
                    onToggleMFG={() => setMfgUnitId(prev => prev === unit.id ? null : unit.id)}
                    onChange={updates => updateUnitResult(unit.id, updates)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Save */}
        <button
          onClick={handleSave}
          className="w-full py-3 rounded-lg border border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] font-semibold text-sm flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4" />
          Save Battle Record
        </button>
      </div>
    </div>
  );
}
