import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  Star,
  Shield,
  Plus,
  Trash2,
  Skull,
  Award,
  Zap,
  ChevronDown,
  ChevronUp,
  Edit2,
  Check,
  X,
} from 'lucide-react';
import { useCrusade } from '../../lib/CrusadeContext';
import { type CrusadeUnit, type CrusadeBattleHonour, type CrusadeBattleScar } from '../../lib/CrusadeContext';
import {
  getRank,
  getHonourSlots,
  getNextRankXP,
  getXPProgress,
  SW_DEEDS_OF_MAKING,
  BATTLE_HONOUR_TYPES,
} from '../../data/crusadeRules';

// ============================================================
// XP bar with rank label
// ============================================================

function XPSection({ unit }: { unit: CrusadeUnit }) {
  const rank = getRank(unit.xp, unit.isCharacter, unit.legendaryVeterans);
  const nextXP = getNextRankXP(unit.xp, unit.isCharacter, unit.legendaryVeterans);
  const progress = getXPProgress(unit.xp, unit.isCharacter, unit.legendaryVeterans);

  return (
    <div className="rounded-sm border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold" style={{ color: rank.color }}>{rank.name}</span>
        <span className="text-sm font-mono text-[var(--accent-gold)]">{unit.xp} XP</span>
      </div>
      <div className="h-2 bg-[var(--border-color)] rounded-full overflow-hidden mb-1">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.round(progress * 100)}%`, backgroundColor: rank.color }}
        />
      </div>
      <p className="text-xs text-[var(--text-secondary)]">
        {nextXP !== null ? `${nextXP - unit.xp} XP to next rank` : 'Maximum rank reached'}
        {' · '}{unit.battlesPlayed} battles played
      </p>
    </div>
  );
}

// ============================================================
// Award XP panel
// ============================================================

function AwardXPPanel({ unit }: { unit: CrusadeUnit }) {
  const { awardXP } = useCrusade();
  const [amount, setAmount] = useState(1);

  return (
    <div className="rounded-sm border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
      <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Award XP</p>
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map(v => (
          <button
            key={v}
            onClick={() => setAmount(v)}
            className={`flex-1 py-1.5 text-sm rounded border transition-colors ${
              amount === v
                ? 'border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] font-bold'
                : 'border-[var(--border-color)] text-[var(--text-secondary)]'
            }`}
          >
            +{v}
          </button>
        ))}
      </div>
      <button
        onClick={() => awardXP(unit.id, amount)}
        className="w-full mt-3 py-2.5 rounded border border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] text-sm font-semibold hover:bg-[var(--accent-gold)]/20 transition-colors flex items-center justify-center gap-2"
      >
        <Zap className="w-4 h-4" />
        Award {amount} XP
      </button>
    </div>
  );
}

// ============================================================
// Add Battle Honour Modal
// ============================================================

function AddHonourModal({ unit, onClose }: { unit: CrusadeUnit; onClose: () => void }) {
  const { addBattleHonour } = useCrusade();
  const [type, setType] = useState<CrusadeBattleHonour['type']>('battle_trait');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const slots = getHonourSlots(unit.xp, unit.isCharacter, unit.legendaryVeterans);
  const canAdd = unit.battleHonours.length < slots && name.trim().length > 0;

  const handleAdd = () => {
    addBattleHonour(unit.id, { type, name: name.trim(), description: description.trim() });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end">
      <div className="w-full bg-[var(--bg-primary)] rounded-t-xl border-t border-[var(--border-color)] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-[var(--text-primary)]">Add Battle Honour</h2>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {unit.battleHonours.length >= slots && (
          <div className="mb-3 p-3 rounded border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs">
            All honour slots are filled ({slots}/{slots}). Gain more XP to unlock additional slots.
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">Type</label>
            <div className="flex gap-2 mt-1">
              {BATTLE_HONOUR_TYPES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setType(t.id)}
                  className={`flex-1 py-1.5 text-xs rounded border transition-colors ${
                    type === t.id
                      ? 'border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] font-bold'
                      : 'border-[var(--border-color)] text-[var(--text-secondary)]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Slayer of Monsters"
              className="mt-1 w-full px-3 py-2.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-gold)]"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Effect…"
              rows={2}
              className="mt-1 w-full px-3 py-2.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-gold)] resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm border border-[var(--border-color)] text-[var(--text-secondary)] rounded">Cancel</button>
          <button
            onClick={handleAdd}
            disabled={!canAdd}
            className="flex-1 py-2.5 text-sm border border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] font-semibold rounded disabled:opacity-40"
          >
            Add Honour
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Add Battle Scar Modal
// ============================================================

function AddScarModal({ unit, onClose }: { unit: CrusadeUnit; onClose: () => void }) {
  const { addBattleScar } = useCrusade();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleAdd = () => {
    addBattleScar(unit.id, { name: name.trim(), description: description.trim() });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end">
      <div className="w-full bg-[var(--bg-primary)] rounded-t-xl border-t border-[var(--border-color)] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-[var(--text-primary)]">Add Battle Scar</h2>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">Scar Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Battered and Bruised"
              className="mt-1 w-full px-3 py-2.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-gold)]"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">Effect</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Penalty…"
              rows={2}
              className="mt-1 w-full px-3 py-2.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-gold)] resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm border border-[var(--border-color)] text-[var(--text-secondary)] rounded">Cancel</button>
          <button
            onClick={handleAdd}
            disabled={name.trim().length === 0}
            className="flex-1 py-2.5 text-sm border border-red-500/50 bg-red-500/10 text-red-400 font-semibold rounded disabled:opacity-40"
          >
            Add Scar
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Accordion section
// ============================================================

function AccordionSection({ title, count, badge, badgeColor, children, defaultOpen = false }: {
  title: string;
  count?: number;
  badge?: string;
  badgeColor?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-sm border border-[var(--border-color)] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[var(--bg-card)] hover:bg-[var(--bg-card)]/80"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--text-primary)]">{title}</span>
          {count !== undefined && (
            <span className="text-xs text-[var(--text-secondary)]">({count})</span>
          )}
          {badge && (
            <span className="text-xs px-1.5 py-0.5 rounded border" style={{ borderColor: badgeColor, color: badgeColor }}>
              {badge}
            </span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-[var(--text-secondary)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />}
      </button>
      {open && <div className="px-4 py-3 border-t border-[var(--border-color)] bg-[var(--bg-primary)]">{children}</div>}
    </div>
  );
}

// ============================================================
// Main Page
// ============================================================

export default function CrusadeUnitDetail() {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const { campaign, updateUnit, removeUnit, setWarlord, markUnitDestroyed, restoreUnit,
    removeBattleHonour, removeBattleScar, addDeedOfMaking, removeDeedOfMaking, buyLegendaryVeterans, spendRP } = useCrusade();

  const [showAddHonour, setShowAddHonour] = useState(false);
  const [showAddScar, setShowAddScar] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');

  if (!campaign) { navigate('/crusade', { replace: true }); return null; }
  const unit = campaign.units.find(u => u.id === unitId);
  if (!unit) { navigate('/crusade/order-of-battle', { replace: true }); return null; }

  const rank = getRank(unit.xp, unit.isCharacter, unit.legendaryVeterans);
  const slots = getHonourSlots(unit.xp, unit.isCharacter, unit.legendaryVeterans);
  const isSW = campaign.factionId === 'space_wolves';

  const honourTypeLabel = (type: CrusadeBattleHonour['type']) =>
    BATTLE_HONOUR_TYPES.find(t => t.id === type)?.label ?? type;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] px-4 pt-6 pb-24">
      <div className="max-w-md mx-auto">

        {/* Back */}
        <button
          onClick={() => navigate('/crusade/order-of-battle')}
          className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--accent-gold)] transition-colors mb-5"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Order of Battle</span>
        </button>

        {/* Unit header */}
        <div className="flex items-start gap-3 mb-5">
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  className="flex-1 text-xl font-bold bg-transparent border-b border-[var(--accent-gold)] text-[var(--text-primary)] focus:outline-none"
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') { updateUnit(unit.id, { customName: nameInput }); setEditingName(false); }
                    if (e.key === 'Escape') setEditingName(false);
                  }}
                />
                <button onClick={() => { updateUnit(unit.id, { customName: nameInput }); setEditingName(false); }}>
                  <Check className="w-4 h-4 text-[var(--accent-gold)]" />
                </button>
                <button onClick={() => setEditingName(false)}>
                  <X className="w-4 h-4 text-[var(--text-secondary)]" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-wide">
                  {unit.customName || unit.datasheetName}
                </h1>
                <button
                  onClick={() => { setNameInput(unit.customName || unit.datasheetName); setEditingName(true); }}
                  className="text-[var(--text-secondary)] hover:text-[var(--accent-gold)]"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">{unit.datasheetName} · {unit.pointsCost} pts</p>
          </div>

          {/* Tags */}
          <div className="flex flex-col items-end gap-1.5">
            {unit.isWarlord && (
              <div className="flex items-center gap-1 text-xs text-[var(--accent-gold)] border border-[var(--accent-gold)]/40 rounded px-1.5 py-0.5">
                <Star className="w-3 h-3" />
                Warlord
              </div>
            )}
            {unit.isCharacter && (
              <div className="flex items-center gap-1 text-xs text-blue-400 border border-blue-400/30 rounded px-1.5 py-0.5">
                <Shield className="w-3 h-3" />
                Character
              </div>
            )}
          </div>
        </div>

        {/* XP section */}
        <div className="mb-4">
          <XPSection unit={unit} />
        </div>

        {/* Award XP */}
        <div className="mb-4">
          <AwardXPPanel unit={unit} />
        </div>

        {/* Battle Honours */}
        <div className="mb-3">
          <AccordionSection
            title="Battle Honours"
            count={unit.battleHonours.length}
            badge={`${unit.battleHonours.length}/${slots} slots`}
            badgeColor="var(--accent-gold)"
            defaultOpen={true}
          >
            {unit.battleHonours.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)] text-center py-3">No honours yet</p>
            ) : (
              <div className="space-y-2 mb-3">
                {unit.battleHonours.map(h => (
                  <div key={h.id} className="flex items-start gap-2 p-2.5 rounded border border-[var(--accent-gold)]/20 bg-[var(--accent-gold)]/5">
                    <Award className="w-4 h-4 text-[var(--accent-gold)] flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{h.name}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{honourTypeLabel(h.type)}</p>
                      {h.description && <p className="text-xs text-[var(--text-secondary)] mt-0.5">{h.description}</p>}
                    </div>
                    <button
                      onClick={() => removeBattleHonour(unit.id, h.id)}
                      className="text-[var(--text-secondary)] hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowAddHonour(true)}
              disabled={unit.battleHonours.length >= slots}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm border border-[var(--accent-gold)]/40 text-[var(--accent-gold)] rounded hover:bg-[var(--accent-gold)]/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Add Battle Honour
            </button>
          </AccordionSection>
        </div>

        {/* Battle Scars */}
        <div className="mb-3">
          <AccordionSection
            title="Battle Scars"
            count={unit.battleScars.length}
            badge={unit.battleScars.length > 0 ? 'Scarred' : undefined}
            badgeColor="#ef4444"
            defaultOpen={unit.battleScars.length > 0}
          >
            {unit.battleScars.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)] text-center py-3">No scars yet</p>
            ) : (
              <div className="space-y-2 mb-3">
                {unit.battleScars.map(s => (
                  <div key={s.id} className="flex items-start gap-2 p-2.5 rounded border border-red-500/20 bg-red-500/5">
                    <Skull className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{s.name}</p>
                      {s.description && <p className="text-xs text-[var(--text-secondary)] mt-0.5">{s.description}</p>}
                    </div>
                    <button
                      onClick={() => removeBattleScar(unit.id, s.id)}
                      className="text-[var(--text-secondary)] hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowAddScar(true)}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm border border-red-500/30 text-red-400 rounded hover:bg-red-500/10 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Battle Scar
            </button>
          </AccordionSection>
        </div>

        {/* Space Wolves: Deeds of Making */}
        {isSW && unit.isCharacter && (
          <div className="mb-3">
            <AccordionSection title="Deeds of Making" count={unit.deedsOfMaking.length}>
              <div className="space-y-2 mb-3">
                {SW_DEEDS_OF_MAKING.map(deed => {
                  const owned = unit.deedsOfMaking.includes(deed.id);
                  return (
                    <div key={deed.id} className={`flex items-start gap-3 p-2.5 rounded border ${owned ? 'border-blue-400/30 bg-blue-400/5' : 'border-[var(--border-color)]'}`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-[var(--text-primary)]">{deed.name}</p>
                          <span className="text-xs text-blue-300">{deed.honourPointCost} HP</span>
                          {!deed.verified && <span className="text-xs text-amber-400">⚠️</span>}
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">{deed.description}</p>
                      </div>
                      <button
                        onClick={() => owned ? removeDeedOfMaking(unit.id, deed.id) : addDeedOfMaking(unit.id, deed.id)}
                        className={`text-xs px-2 py-1 rounded border flex-shrink-0 transition-colors ${
                          owned
                            ? 'border-blue-400/40 text-blue-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30'
                            : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:text-blue-300 hover:border-blue-400/30'
                        }`}
                      >
                        {owned ? 'Remove' : 'Claim'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </AccordionSection>
          </div>
        )}

        {/* Legendary Veterans */}
        {!unit.isCharacter && !unit.legendaryVeterans && (
          <div className="mb-3 rounded-sm border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
            <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">Legendary Veterans</p>
            <p className="text-xs text-[var(--text-secondary)] mb-3">
              Spend 3 RP to allow this non-Character unit to advance to Heroic and Legendary ranks (costs {campaign.requisitionPoints < 3 ? 'insufficient RP' : '3 RP'}).
            </p>
            <button
              onClick={() => buyLegendaryVeterans(unit.id)}
              disabled={campaign.requisitionPoints < 3}
              className="w-full py-2 text-sm border border-purple-500/40 bg-purple-500/10 text-purple-400 rounded font-semibold hover:bg-purple-500/20 transition-colors disabled:opacity-40"
            >
              Purchase (3 RP)
            </button>
          </div>
        )}
        {unit.legendaryVeterans && (
          <div className="mb-3 px-4 py-2 rounded border border-purple-500/30 bg-purple-500/5">
            <p className="text-xs text-purple-400">✓ Legendary Veterans — can reach Heroic & Legendary ranks</p>
          </div>
        )}

        {/* Actions */}
        <div className="mb-3 rounded-sm border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Actions</p>
          <div className="space-y-2">
            {!unit.isWarlord && (
              <button
                onClick={() => setWarlord(unit.id)}
                className="w-full flex items-center gap-2 py-2.5 px-3 text-sm border border-[var(--accent-gold)]/30 text-[var(--accent-gold)] rounded hover:bg-[var(--accent-gold)]/10 transition-colors"
              >
                <Star className="w-4 h-4" />
                Set as Warlord
              </button>
            )}
            {!unit.isDestroyed ? (
              <button
                onClick={() => markUnitDestroyed(unit.id)}
                className="w-full flex items-center gap-2 py-2.5 px-3 text-sm border border-red-500/30 text-red-400 rounded hover:bg-red-500/10 transition-colors"
              >
                <Skull className="w-4 h-4" />
                Mark as Destroyed
              </button>
            ) : (
              <button
                onClick={() => restoreUnit(unit.id)}
                className="w-full flex items-center gap-2 py-2.5 px-3 text-sm border border-[var(--border-color)] text-[var(--text-secondary)] rounded hover:text-[var(--text-primary)] transition-colors"
              >
                Restore Unit
              </button>
            )}
            <button
              onClick={() => { if (confirm(`Remove ${unit.customName || unit.datasheetName} from Order of Battle?`)) { removeUnit(unit.id); navigate('/crusade/order-of-battle'); } }}
              className="w-full flex items-center gap-2 py-2.5 px-3 text-sm border border-red-500/20 text-red-500/70 rounded hover:bg-red-500/10 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Remove from Order of Battle
            </button>
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-sm border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Notes</p>
          <textarea
            value={unit.notes}
            onChange={e => updateUnit(unit.id, { notes: e.target.value })}
            placeholder="Wargear, special rules, campaign notes…"
            rows={3}
            className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none resize-none"
          />
        </div>

      </div>

      {showAddHonour && <AddHonourModal unit={unit} onClose={() => setShowAddHonour(false)} />}
      {showAddScar && <AddScarModal unit={unit} onClose={() => setShowAddScar(false)} />}
    </div>
  );
}
