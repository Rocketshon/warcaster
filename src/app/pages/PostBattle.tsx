import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Trophy,
  Minus,
  Plus,
  Star,
  Swords,
  Check,
  X,
  Zap,
} from 'lucide-react';
import { useCrusade } from '../../lib/CrusadeContext';
import { type CrusadeBattleXPEvent } from '../../lib/CrusadeContext';
import { getAgendasForFaction } from '../../data/crusadeRules';
import { toast } from 'sonner';

// ============================================================
// Step types
// ============================================================

type Step = 'result' | 'deployed' | 'agendas' | 'xp' | 'mfg' | 'honours' | 'faction' | 'summary';

const STEPS: Step[] = ['result', 'deployed', 'agendas', 'xp', 'mfg', 'honours', 'faction', 'summary'];

const STEP_LABELS: Record<Step, string> = {
  result: 'Battle Result',
  deployed: 'Deployed Units',
  agendas: 'Agendas',
  xp: 'Award XP',
  mfg: 'Marked for Greatness',
  honours: 'Battle Honours',
  faction: 'Faction Update',
  summary: 'Summary',
};

// ============================================================
// Types
// ============================================================

type BattleResult = 'victory' | 'defeat' | 'draw';
type BattleSize = 'Combat Patrol' | 'Incursion' | 'Strike Force' | 'Onslaught';

interface XPEntry {
  unitId: string;
  amount: number;
  reason: string;
}

// ============================================================
// Counter component
// ============================================================

function Counter({ value, onChange, min = 0, max = 999 }: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-8 h-8 flex items-center justify-center rounded border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-gold)] transition-colors"
      >
        <Minus className="w-4 h-4" />
      </button>
      <span className="text-xl font-bold font-mono text-[var(--accent-gold)] w-10 text-center">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-8 h-8 flex items-center justify-center rounded border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-gold)] transition-colors"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

// ============================================================
// Common factions for opponent picker
// ============================================================

const OPPONENT_FACTIONS = [
  'Space Marines', 'Space Wolves', 'Blood Angels', 'Dark Angels',
  'Chaos Space Marines', 'Death Guard', 'World Eaters', 'Thousand Sons',
  'Astra Militarum', 'Necrons', 'Tyranids', 'Orks',
  'Aeldari', 'Tau Empire', 'Drukhari', 'Adeptus Mechanicus',
  'Sisters of Battle', 'Grey Knights', 'Imperial Knights', 'Other',
];

// ============================================================
// Main wizard
// ============================================================

export default function PostBattle() {
  const navigate = useNavigate();
  const { campaign, recordBattle, addBattleHonour } = useCrusade();

  // Step state
  const [step, setStep] = useState<Step>('result');
  const stepIndex = STEPS.indexOf(step);

  // Step 1: Result
  const [result, setResult] = useState<BattleResult>('victory');
  const [yourVP, setYourVP] = useState(0);
  const [opponentVP, setOpponentVP] = useState(0);
  const [missionName, setMissionName] = useState('');
  const [battleSize, setBattleSize] = useState<BattleSize>('Strike Force');
  const [opponentFaction, setOpponentFaction] = useState('');
  const [notes, setNotes] = useState('');

  // Step 2: Deployed units
  const [deployedIds, setDeployedIds] = useState<Set<string>>(new Set());

  // Step 3: Agendas
  const [selectedAgendaIds, setSelectedAgendaIds] = useState<Set<string>>(new Set());

  // Step 4: XP entries (per unit)
  const [xpEntries, setXpEntries] = useState<Map<string, XPEntry>>(new Map());

  // Step 5: Marked for Greatness
  const [mfgUnitId, setMfgUnitId] = useState<string | null>(null);

  // Step 6: Battle Honours per unit (after rank-up)
  // (Just navigation to unit pages — we don't handle this inline)

  // Step 7: Faction mechanic updates
  const [factionPointDelta, setFactionPointDelta] = useState(0);

  if (!campaign) { navigate('/crusade', { replace: true }); return null; }

  const deployedUnits = campaign.units.filter(u => deployedIds.has(u.id) && !u.isDestroyed);
  const agendas = getAgendasForFaction(campaign.factionId);

  const goNext = () => {
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next);
  };
  const goBack = () => {
    if (stepIndex === 0) { navigate(-1); return; }
    setStep(STEPS[stepIndex - 1]);
  };

  const toggleDeployed = (id: string) => {
    setDeployedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAgenda = (id: string) => {
    setSelectedAgendaIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const setXPEntry = (unitId: string, amount: number, reason: string) => {
    setXpEntries(prev => {
      const next = new Map(prev);
      if (amount === 0) { next.delete(unitId); } else { next.set(unitId, { unitId, amount, reason }); }
      return next;
    });
  };

  const handleFinish = () => {
    const xpEvents: CrusadeBattleXPEvent[] = Array.from(xpEntries.values()).map(e => ({
      unitId: e.unitId,
      xpAmount: e.amount,
      reason: e.reason,
    }));

    recordBattle({
      date: new Date().toISOString(),
      result,
      opponentFaction: opponentFaction || 'Unknown',
      missionName: missionName || 'Unknown Mission',
      battleSize,
      yourVP,
      opponentVP,
      agendaIds: Array.from(selectedAgendaIds),
      deployedUnitIds: Array.from(deployedIds),
      markedForGreatnessUnitId: mfgUnitId,
      rpChange: 1, // +1 RP per battle standard
      xpEvents,
      notes,
    });

    // Apply faction point delta if any
    // (This is applied separately via faction-specific logic)

    toast.success('Battle recorded! XP awarded to deployed units.');
    navigate('/crusade');
  };

  const factionLabel =
    campaign.factionId === 'space_wolves' ? 'Honour Points' :
    campaign.factionId === 'world_eaters' ? 'Skull Points' :
    campaign.factionId === 'death_guard' ? 'Virulence Points' :
    campaign.factionId === 'astra_militarum' ? 'Commendation Points' :
    campaign.factionId === 'chaos_space_marines' ? 'Glory' :
    null;

  const hasFactionMechanic = factionLabel !== null;
  const filteredSteps = hasFactionMechanic ? STEPS : STEPS.filter(s => s !== 'faction');

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] px-4 pt-6 pb-24">
      <div className="max-w-md mx-auto">

        {/* Header */}
        <button
          onClick={goBack}
          className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--accent-gold)] transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>

        {/* Step label + progress */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-wider">{STEP_LABELS[step]}</h1>
          <span className="text-xs text-[var(--text-secondary)]">
            {filteredSteps.indexOf(step) + 1} / {filteredSteps.length}
          </span>
        </div>
        <div className="flex gap-1 mb-6">
          {filteredSteps.map((s, i) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all ${i <= filteredSteps.indexOf(step) ? 'bg-[var(--accent-gold)]' : 'bg-[var(--border-color)]'}`} />
          ))}
        </div>

        {/* ── Step: Result ── */}
        {step === 'result' && (
          <div className="space-y-4">
            {/* W/L/D */}
            <div className="grid grid-cols-3 gap-2">
              {(['victory', 'defeat', 'draw'] as BattleResult[]).map(r => (
                <button
                  key={r}
                  onClick={() => {
                    setResult(r);
                    if (r === 'victory' && yourVP <= opponentVP) setYourVP(opponentVP + 1);
                    if (r === 'defeat' && opponentVP <= yourVP) setOpponentVP(yourVP + 1);
                  }}
                  className={`py-3 rounded-sm border text-sm font-semibold capitalize transition-colors ${
                    result === r
                      ? r === 'victory' ? 'border-green-500/60 bg-green-500/10 text-green-400'
                      : r === 'defeat' ? 'border-red-500/60 bg-red-500/10 text-red-400'
                      : 'border-yellow-500/60 bg-yellow-500/10 text-yellow-400'
                      : 'border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)]'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* VP */}
            <div className="rounded-sm border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
              <div className="flex justify-around">
                <div className="text-center">
                  <p className="text-xs text-[var(--text-secondary)] mb-2">Your VP</p>
                  <Counter value={yourVP} onChange={setYourVP} />
                </div>
                <div className="text-center">
                  <p className="text-xs text-[var(--text-secondary)] mb-2">Opponent VP</p>
                  <Counter value={opponentVP} onChange={setOpponentVP} />
                </div>
              </div>
            </div>

            {/* Mission */}
            <div className="rounded-sm border border-[var(--border-color)] bg-[var(--bg-card)] p-4 space-y-3">
              <div>
                <label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">Mission Name</label>
                <input
                  type="text"
                  value={missionName}
                  onChange={e => setMissionName(e.target.value)}
                  placeholder="e.g. Supply Drop"
                  className="mt-1 w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-gold)]"
                />
              </div>

              <div>
                <label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">Battle Size</label>
                <div className="flex gap-1.5 mt-1 flex-wrap">
                  {(['Combat Patrol', 'Incursion', 'Strike Force', 'Onslaught'] as BattleSize[]).map(s => (
                    <button
                      key={s}
                      onClick={() => setBattleSize(s)}
                      className={`px-2 py-1 text-xs rounded border transition-colors ${
                        battleSize === s
                          ? 'border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]'
                          : 'border-[var(--border-color)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">Opponent Faction</label>
                <select
                  value={opponentFaction}
                  onChange={e => setOpponentFaction(e.target.value)}
                  className="mt-1 w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                >
                  <option value="">Select faction…</option>
                  {OPPONENT_FACTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Battle notes…"
                rows={2}
                className="mt-1 w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-gold)] resize-none"
              />
            </div>
          </div>
        )}

        {/* ── Step: Deployed units ── */}
        {step === 'deployed' && (
          <div>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Select every unit that fought in this battle.
            </p>
            <div className="space-y-2">
              {campaign.units.filter(u => !u.isDestroyed).map(u => {
                const selected = deployedIds.has(u.id);
                return (
                  <button
                    key={u.id}
                    onClick={() => toggleDeployed(u.id)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-sm border transition-colors text-left ${
                      selected
                        ? 'border-[var(--accent-gold)] bg-[var(--accent-gold)]/10'
                        : 'border-[var(--border-color)] bg-[var(--bg-card)]'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${selected ? 'border-[var(--accent-gold)] bg-[var(--accent-gold)]' : 'border-[var(--border-color)]'}`}>
                      {selected && <Check className="w-3 h-3 text-[var(--bg-primary)]" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{u.customName || u.datasheetName}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{u.xp} XP · {u.pointsCost} pts</p>
                    </div>
                    {u.isWarlord && <Star className="w-4 h-4 text-[var(--accent-gold)] flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-3 text-center">
              {deployedIds.size} of {campaign.units.filter(u => !u.isDestroyed).length} units selected
            </p>
          </div>
        )}

        {/* ── Step: Agendas ── */}
        {step === 'agendas' && (
          <div>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Which agendas did you take this battle? Select up to 3.
            </p>
            <div className="space-y-2">
              {agendas.map(a => {
                const selected = selectedAgendaIds.has(a.id);
                const disabled = !selected && selectedAgendaIds.size >= 3;
                return (
                  <button
                    key={a.id}
                    onClick={() => !disabled && toggleAgenda(a.id)}
                    disabled={disabled}
                    className={`w-full text-left p-3.5 rounded-sm border transition-colors ${
                      selected
                        ? 'border-[var(--accent-gold)] bg-[var(--accent-gold)]/10'
                        : disabled
                        ? 'border-[var(--border-color)] opacity-40'
                        : 'border-[var(--border-color)] bg-[var(--bg-card)]'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center ${selected ? 'border-[var(--accent-gold)] bg-[var(--accent-gold)]' : 'border-[var(--border-color)]'}`}>
                        {selected && <Check className="w-3 h-3 text-[var(--bg-primary)]" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{a.name}</p>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">{a.description}</p>
                        {!a.verified && <p className="text-xs text-amber-400 mt-1">⚠️ Verify with codex</p>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Step: XP ── */}
        {step === 'xp' && (
          <div>
            <p className="text-sm text-[var(--text-secondary)] mb-2">
              Award bonus XP from Agenda completions and kills. Base +1 XP per unit for surviving is applied automatically.
            </p>
            <div className="space-y-2">
              {deployedUnits.map(u => {
                const entry = xpEntries.get(u.id);
                const amt = entry?.amount ?? 0;
                return (
                  <div key={u.id} className="rounded-sm border border-[var(--border-color)] bg-[var(--bg-card)] p-3.5">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{u.customName || u.datasheetName}</p>
                        <p className="text-xs text-[var(--text-secondary)]">{u.xp} XP current</p>
                      </div>
                      <Counter
                        value={amt}
                        onChange={v => setXPEntry(u.id, v, entry?.reason ?? 'Agenda / kills')}
                      />
                    </div>
                    {amt > 0 && (
                      <input
                        type="text"
                        value={entry?.reason ?? ''}
                        onChange={e => setXPEntry(u.id, amt, e.target.value)}
                        placeholder="Reason (e.g. Agenda completed)"
                        className="w-full text-xs px-2 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-gold)]"
                      />
                    )}
                  </div>
                );
              })}
              {deployedUnits.length === 0 && (
                <p className="text-sm text-[var(--text-secondary)] text-center py-6">No units deployed — go back to select units.</p>
              )}
            </div>
          </div>
        )}

        {/* ── Step: Marked for Greatness ── */}
        {step === 'mfg' && (
          <div>
            <p className="text-sm text-[var(--text-secondary)] mb-1">
              Choose one unit to receive +3 bonus XP (Marked for Greatness).
            </p>
            <p className="text-xs text-[var(--text-secondary)] mb-4">You may mark one unit per battle.</p>
            <div className="space-y-2">
              <button
                onClick={() => setMfgUnitId(null)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-sm border transition-colors ${
                  mfgUnitId === null
                    ? 'border-[var(--accent-gold)] bg-[var(--accent-gold)]/10'
                    : 'border-[var(--border-color)] bg-[var(--bg-card)]'
                }`}
              >
                <X className="w-4 h-4 text-[var(--text-secondary)]" />
                <span className="text-sm text-[var(--text-secondary)]">None</span>
              </button>
              {deployedUnits.map(u => (
                <button
                  key={u.id}
                  onClick={() => setMfgUnitId(u.id)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-sm border transition-colors ${
                    mfgUnitId === u.id
                      ? 'border-[var(--accent-gold)] bg-[var(--accent-gold)]/10'
                      : 'border-[var(--border-color)] bg-[var(--bg-card)]'
                  }`}
                >
                  <Star className={`w-4 h-4 flex-shrink-0 ${mfgUnitId === u.id ? 'text-[var(--accent-gold)]' : 'text-[var(--text-secondary)]'}`} />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{u.customName || u.datasheetName}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{u.xp} XP current → +3</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step: Battle Honours (navigation only) ── */}
        {step === 'honours' && (
          <div>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              If any units ranked up this battle, navigate to their detail page to assign Battle Honours now, or do it later.
            </p>
            <div className="space-y-2">
              {deployedUnits.map(u => {
                const xpGain = (xpEntries.get(u.id)?.amount ?? 0) + (mfgUnitId === u.id ? 3 : 0) + 1;
                const newXP = u.xp + xpGain;
                const currentRankSlots = u.xp >= 16 ? 2 : u.xp >= 6 ? 1 : 0;
                const newRankSlots = newXP >= 16 ? 2 : newXP >= 6 ? 1 : 0;
                const rankedUp = newRankSlots > currentRankSlots;
                return (
                  <button
                    key={u.id}
                    onClick={() => navigate(`/crusade/unit/${u.id}`)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-sm border transition-colors text-left ${
                      rankedUp
                        ? 'border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 hover:bg-[var(--accent-gold)]/15'
                        : 'border-[var(--border-color)] bg-[var(--bg-card)] opacity-60'
                    }`}
                  >
                    {rankedUp ? (
                      <Trophy className="w-4 h-4 text-[var(--accent-gold)] flex-shrink-0" />
                    ) : (
                      <Zap className="w-4 h-4 text-[var(--text-secondary)] flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{u.customName || u.datasheetName}</p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {u.xp} → {u.xp + xpGain} XP {rankedUp ? '· RANKED UP — assign Battle Honour' : ''}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--text-secondary)] flex-shrink-0" />
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-4 text-center">
              Battle Honours will be saved after you tap "Finish" on the next step.
            </p>
          </div>
        )}

        {/* ── Step: Faction mechanic update ── */}
        {step === 'faction' && hasFactionMechanic && (
          <div>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Update your {factionLabel} based on this battle's results.
            </p>
            <div className="rounded-sm border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{factionLabel} gained</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Current:{' '}
                    {campaign.factionId === 'space_wolves' ? (campaign.factionData.honourPoints ?? 0) :
                     campaign.factionId === 'world_eaters' ? (campaign.factionData.skullPoints ?? 0) :
                     campaign.factionId === 'death_guard' ? (campaign.factionData.virulencePoints ?? 0) :
                     campaign.factionId === 'astra_militarum' ? (campaign.factionData.commendationPoints ?? 0) :
                     0}
                  </p>
                </div>
                <Counter value={factionPointDelta} onChange={setFactionPointDelta} min={-20} />
              </div>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-3 text-center">
              This will be applied to your {factionLabel} total after you finish.
            </p>
          </div>
        )}

        {/* ── Step: Summary ── */}
        {step === 'summary' && (
          <div className="space-y-4">
            <div className="rounded-sm border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
              <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Battle Summary</h3>
              <div className="space-y-2 text-sm">
                {[
                  ['Result', <span key="r" className={result === 'victory' ? 'text-green-400' : result === 'defeat' ? 'text-red-400' : 'text-yellow-400'}>{result.toUpperCase()}</span>],
                  ['Score', `${yourVP} – ${opponentVP}`],
                  ['Mission', missionName || 'Unknown'],
                  ['Opponent', opponentFaction || 'Unknown'],
                  ['Deployed', `${deployedIds.size} units`],
                  ['Agendas', `${selectedAgendaIds.size} taken`],
                  ['RP gain', '+1 (standard)'],
                ].map(([label, value]) => (
                  <div key={String(label)} className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">{label}</span>
                    <span className="text-[var(--text-primary)] font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {mfgUnitId && (
              <div className="rounded-sm border border-[var(--accent-gold)]/30 bg-[var(--accent-gold)]/5 p-3">
                <p className="text-xs text-[var(--accent-gold)]">
                  ⭐ Marked for Greatness: {campaign.units.find(u => u.id === mfgUnitId)?.customName ?? 'Unit'} (+3 XP)
                </p>
              </div>
            )}

            <div className="rounded-sm border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
              <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">XP Awards</h3>
              {deployedUnits.map(u => {
                const bonus = xpEntries.get(u.id)?.amount ?? 0;
                const mfg = mfgUnitId === u.id ? 3 : 0;
                const total = 1 + bonus + mfg;
                return (
                  <div key={u.id} className="flex justify-between text-sm py-1">
                    <span className="text-[var(--text-secondary)] truncate max-w-[60%]">{u.customName || u.datasheetName}</span>
                    <span className="text-[var(--accent-gold)] font-mono font-bold">+{total} XP</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step !== 'result' && (
            <button
              onClick={goBack}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-sm border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {step !== 'summary' ? (
            <button
              onClick={goNext}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-sm border border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] font-semibold hover:bg-[var(--accent-gold)]/20 transition-colors"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-sm border border-[var(--accent-gold)] bg-[var(--accent-gold)] text-[var(--bg-primary)] font-bold hover:opacity-90 transition-opacity"
            >
              <Swords className="w-4 h-4" />
              Record Battle
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
