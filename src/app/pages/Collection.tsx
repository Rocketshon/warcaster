import { useState, useMemo } from 'react';
import { ArrowLeft, Plus, X, ChevronDown, ChevronUp, Search, Trash2 } from 'lucide-react';
import { useCollection, PAINTING_STAGES } from '../../lib/CollectionContext';
import { FACTIONS, FACTION_MAP, getDataFactionId } from '../../lib/factions';
import { getUnitsForFaction } from '../../data';
import type { PaintingStage, CollectionItem, FactionId } from '../../types';

// ---------------------------------------------------------------------------
// Stage display helpers
// ---------------------------------------------------------------------------

const STAGE_COLORS: Record<PaintingStage, string> = {
  unassembled: '#6b7280',
  assembled: '#92400e',
  primed: '#d1d5db',
  basecoated: '#3b82f6',
  painted: '#22c55e',
  based: '#eab308',
  complete: '#c9a84c',
};

const STAGE_LABELS: Record<PaintingStage, string> = {
  unassembled: 'Unassembled',
  assembled: 'Assembled',
  primed: 'Primed',
  basecoated: 'Basecoated',
  painted: 'Painted',
  based: 'Based',
  complete: 'Complete',
};

type FilterChip = 'all' | 'unassembled' | 'in_progress' | 'complete';
type SortKey = 'name' | 'faction' | 'stage' | 'date';

// ---------------------------------------------------------------------------
// Helper: get faction helper with fallback
// ---------------------------------------------------------------------------
function getFactionDisplay(factionId: string) {
  const f = FACTION_MAP.get(factionId as FactionId);
  return { name: f?.name ?? factionId, icon: f?.icon ?? '' };
}

// ---------------------------------------------------------------------------
// Completion Ring SVG
// ---------------------------------------------------------------------------
function CompletionRing({ percentage }: { percentage: number }) {
  const radius = 54;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={radius} fill="none" stroke="#2a2a35" strokeWidth={stroke} />
        <circle
          cx="64" cy="64" r={radius} fill="none"
          stroke="#c9a84c" strokeWidth={stroke}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-[#c9a84c]">{percentage}%</span>
        <span className="text-[10px] text-[#8a8690] uppercase tracking-widest">Complete</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stage Badge
// ---------------------------------------------------------------------------
function StageBadge({ stage, size = 'sm' }: { stage: PaintingStage; size?: 'sm' | 'md' }) {
  const color = STAGE_COLORS[stage];
  const label = STAGE_LABELS[stage];
  const cls = size === 'md' ? 'px-3 py-1 text-xs' : 'px-2 py-0.5 text-[10px]';
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${cls}`}
      style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}40` }}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Add Modal
// ---------------------------------------------------------------------------
function AddModal({ onClose }: { onClose: () => void }) {
  const { addItem } = useCollection();
  const [mode, setMode] = useState<'datasheet' | 'quick'>('datasheet');
  const [selectedFaction, setSelectedFaction] = useState<string | null>(null);
  const [unitSearch, setUnitSearch] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  // Quick add
  const [quickName, setQuickName] = useState('');
  const [quickQty, setQuickQty] = useState(1);

  const factionUnits = useMemo(() => {
    if (!selectedFaction) return [];
    const dataId = getDataFactionId(selectedFaction as FactionId);
    return getUnitsForFaction(dataId);
  }, [selectedFaction]);

  const filteredUnits = useMemo(() => {
    if (!unitSearch.trim()) return factionUnits;
    const q = unitSearch.toLowerCase();
    return factionUnits.filter(u => u.name.toLowerCase().includes(q));
  }, [factionUnits, unitSearch]);

  function handleDatasheetAdd() {
    if (!selectedFaction || !selectedUnit) return;
    addItem(selectedUnit, selectedFaction, selectedUnit, quantity);
    onClose();
  }

  function handleQuickAdd() {
    if (!quickName.trim()) return;
    addItem(quickName.trim(), '', '', quickQty);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg max-h-[85vh] bg-[#1a1a24] border border-[#2a2a35] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a35]">
          <h2 className="text-lg font-bold text-[#e8e4de]">Add to Collection</h2>
          <button onClick={onClose} className="p-1 text-[#8a8690] hover:text-[#e8e4de]"><X className="w-5 h-5" /></button>
        </div>

        {/* Mode tabs */}
        <div className="flex border-b border-[#2a2a35]">
          <button
            onClick={() => setMode('datasheet')}
            className={`flex-1 py-2 text-sm font-medium ${mode === 'datasheet' ? 'text-[#c9a84c] border-b-2 border-[#c9a84c]' : 'text-[#8a8690]'}`}
          >
            From Datasheet
          </button>
          <button
            onClick={() => setMode('quick')}
            className={`flex-1 py-2 text-sm font-medium ${mode === 'quick' ? 'text-[#c9a84c] border-b-2 border-[#c9a84c]' : 'text-[#8a8690]'}`}
          >
            Quick Add
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {mode === 'datasheet' ? (
            <>
              {/* Step 1: Faction */}
              {!selectedFaction ? (
                <div className="space-y-2">
                  <p className="text-xs text-[#8a8690] uppercase tracking-wider">Pick Faction</p>
                  <div className="grid grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto">
                    {FACTIONS.map(f => (
                      <button
                        key={f.id}
                        onClick={() => setSelectedFaction(f.id)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0a0a0f] border border-[#2a2a35] hover:border-[#c9a84c]/50 text-left text-sm text-[#e8e4de]"
                      >
                        <span>{f.icon}</span>
                        <span className="truncate">{f.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : !selectedUnit ? (
                <div className="space-y-2">
                  <button onClick={() => setSelectedFaction(null)} className="flex items-center gap-1 text-xs text-[#c9a84c]">
                    <ArrowLeft className="w-3 h-3" /> Change Faction
                  </button>
                  <p className="text-xs text-[#8a8690] uppercase tracking-wider">
                    {getFactionDisplay(selectedFaction).icon} {getFactionDisplay(selectedFaction).name} — Pick Unit
                  </p>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a8690]" />
                    <input
                      type="text"
                      value={unitSearch}
                      onChange={e => setUnitSearch(e.target.value)}
                      placeholder="Search units..."
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0a0a0f] border border-[#2a2a35] text-sm text-[#e8e4de] placeholder-[#8a8690] focus:border-[#c9a84c]/50 outline-none"
                    />
                  </div>
                  <div className="max-h-[40vh] overflow-y-auto space-y-1">
                    {filteredUnits.map(u => (
                      <button
                        key={u.name}
                        onClick={() => setSelectedUnit(u.name)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#0a0a0f] text-sm text-[#e8e4de] border border-transparent hover:border-[#2a2a35]"
                      >
                        {u.name}
                      </button>
                    ))}
                    {filteredUnits.length === 0 && (
                      <p className="text-center text-sm text-[#8a8690] py-4">No units found</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <button onClick={() => setSelectedUnit(null)} className="flex items-center gap-1 text-xs text-[#c9a84c]">
                    <ArrowLeft className="w-3 h-3" /> Change Unit
                  </button>
                  <div className="p-3 rounded-lg bg-[#0a0a0f] border border-[#2a2a35]">
                    <p className="text-sm font-medium text-[#e8e4de]">{selectedUnit}</p>
                    <p className="text-xs text-[#8a8690]">{getFactionDisplay(selectedFaction).name}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-[#8a8690] mb-1">Quantity</label>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-24 px-3 py-2 rounded-lg bg-[#0a0a0f] border border-[#2a2a35] text-sm text-[#e8e4de] focus:border-[#c9a84c]/50 outline-none"
                    />
                  </div>
                  <button
                    onClick={handleDatasheetAdd}
                    className="w-full py-3 rounded-lg bg-[#c9a84c] text-[#0a0a0f] font-bold text-sm hover:bg-[#d4b65c] transition-colors"
                  >
                    Add to Collection
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Quick Add */
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-[#8a8690] mb-1">Name</label>
                <input
                  type="text"
                  value={quickName}
                  onChange={e => setQuickName(e.target.value)}
                  placeholder="e.g., Terrain Piece, Extra Bases..."
                  className="w-full px-3 py-2 rounded-lg bg-[#0a0a0f] border border-[#2a2a35] text-sm text-[#e8e4de] placeholder-[#8a8690] focus:border-[#c9a84c]/50 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-[#8a8690] mb-1">Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={quickQty}
                  onChange={e => setQuickQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24 px-3 py-2 rounded-lg bg-[#0a0a0f] border border-[#2a2a35] text-sm text-[#e8e4de] focus:border-[#c9a84c]/50 outline-none"
                />
              </div>
              <button
                onClick={handleQuickAdd}
                disabled={!quickName.trim()}
                className="w-full py-3 rounded-lg bg-[#c9a84c] text-[#0a0a0f] font-bold text-sm hover:bg-[#d4b65c] transition-colors disabled:opacity-40"
              >
                Quick Add
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Item Card
// ---------------------------------------------------------------------------
function ItemCard({ item }: { item: CollectionItem }) {
  const [expanded, setExpanded] = useState(false);
  const { updateStage, updateItem, removeItem } = useCollection();
  const faction = getFactionDisplay(item.factionId);

  const stageIndex = PAINTING_STAGES.indexOf(item.stage);

  return (
    <div className="bg-[#1a1a24] border border-[#2a2a35] rounded-xl overflow-hidden">
      {/* Collapsed header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <span className="text-lg shrink-0">{faction.icon || '\u25A0'}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#e8e4de] truncate">{item.name}</p>
          {item.factionId && (
            <p className="text-[10px] text-[#8a8690]">{faction.name}</p>
          )}
        </div>
        <span className="text-xs text-[#8a8690] shrink-0">x{item.quantity}</span>
        <StageBadge stage={item.stage} />
        {expanded ? <ChevronUp className="w-4 h-4 text-[#8a8690] shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#8a8690] shrink-0" />}
      </button>

      {/* Expanded section */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 space-y-3 border-t border-[#2a2a35]">
          {/* Stage selector */}
          <div>
            <p className="text-xs text-[#8a8690] mb-2">Painting Stage</p>
            <div className="flex flex-wrap gap-1.5">
              {PAINTING_STAGES.map((s, idx) => (
                <button
                  key={s}
                  onClick={() => updateStage(item.id, s)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                    item.stage === s
                      ? 'ring-2 ring-offset-1 ring-offset-[#1a1a24]'
                      : idx <= stageIndex ? 'opacity-60' : 'opacity-40'
                  }`}
                  style={{
                    backgroundColor: `${STAGE_COLORS[s]}${item.stage === s ? '30' : '15'}`,
                    color: STAGE_COLORS[s],
                    ...(item.stage === s ? { '--tw-ring-color': STAGE_COLORS[s] } as React.CSSProperties : {}),
                  }}
                >
                  {STAGE_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs text-[#8a8690] mb-1">Notes</label>
            <textarea
              value={item.notes}
              onChange={e => updateItem(item.id, { notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-[#0a0a0f] border border-[#2a2a35] text-sm text-[#e8e4de] placeholder-[#8a8690] focus:border-[#c9a84c]/50 outline-none resize-none"
              placeholder="Add notes..."
            />
          </div>

          {/* Paint recipe */}
          <div>
            <label className="block text-xs text-[#8a8690] mb-1">Paint Recipe</label>
            <textarea
              value={item.paintRecipe ?? ''}
              onChange={e => updateItem(item.id, { paintRecipe: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-[#0a0a0f] border border-[#2a2a35] text-sm text-[#e8e4de] placeholder-[#8a8690] focus:border-[#c9a84c]/50 outline-none resize-none"
              placeholder="e.g., Base: Leadbelcher, Wash: Nuln Oil..."
            />
          </div>

          {/* Remove */}
          <button
            onClick={() => removeItem(item.id)}
            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Remove from collection
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Faction Breakdown
// ---------------------------------------------------------------------------
function FactionBreakdown() {
  const { statsByFaction } = useCollection();
  const [open, setOpen] = useState(false);

  if (statsByFaction.length === 0) return null;

  return (
    <div className="bg-[#1a1a24] border border-[#2a2a35] rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3">
        <h3 className="text-sm font-bold text-[#e8e4de]">Faction Breakdown</h3>
        {open ? <ChevronUp className="w-4 h-4 text-[#8a8690]" /> : <ChevronDown className="w-4 h-4 text-[#8a8690]" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3">
          {statsByFaction.map(fs => {
            const { name, icon } = getFactionDisplay(fs.factionId);
            return (
              <div key={fs.factionId} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#e8e4de]">{icon} {name}</span>
                  <span className="text-[10px] text-[#8a8690]">{fs.painted}/{fs.total} complete ({fs.completionPercentage}%)</span>
                </div>
                <div className="h-2 rounded-full bg-[#0a0a0f] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#c9a84c] transition-all duration-500"
                    style={{ width: `${fs.completionPercentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function Collection() {
  const {
    items, totalModels, paintedCount, completionPercentage, statsByStage,
  } = useCollection();

  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<FilterChip>('all');
  const [sort, setSort] = useState<SortKey>('date');

  // Filter items
  const filteredItems = useMemo(() => {
    let result = [...items];
    switch (filter) {
      case 'unassembled':
        result = result.filter(i => i.stage === 'unassembled');
        break;
      case 'in_progress':
        result = result.filter(i => i.stage !== 'unassembled' && i.stage !== 'complete');
        break;
      case 'complete':
        result = result.filter(i => i.stage === 'complete');
        break;
    }
    // Sort
    switch (sort) {
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'faction':
        result.sort((a, b) => a.factionId.localeCompare(b.factionId));
        break;
      case 'stage':
        result.sort((a, b) => PAINTING_STAGES.indexOf(a.stage) - PAINTING_STAGES.indexOf(b.stage));
        break;
      case 'date':
        result.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
        break;
    }
    return result;
  }, [items, filter, sort]);

  const unpainted = totalModels - paintedCount;
  const pileOfShame = statsByStage.find(s => s.stage === 'unassembled')?.count ?? 0;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e4de]">
      {/* Header */}
      <div className="px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
        <h1 className="text-xl font-bold tracking-tight">Collection Tracker</h1>
        <p className="text-xs text-[#8a8690]">Track your models and painting progress</p>
      </div>

      <div className="px-4 space-y-4 pb-8">
        {/* --- Progress Overview --- */}
        <div className="bg-[#1a1a24] border border-[#2a2a35] rounded-xl p-4 space-y-4">
          <CompletionRing percentage={completionPercentage} />

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: 'Total', value: totalModels },
              { label: 'Painted', value: paintedCount },
              { label: 'Unpainted', value: unpainted },
              { label: 'Pile of Shame', value: pileOfShame },
            ].map(s => (
              <div key={s.label}>
                <p className="text-lg font-bold text-[#e8e4de]">{s.value}</p>
                <p className="text-[9px] text-[#8a8690] uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Stage progress bars */}
          <div className="space-y-1.5">
            {statsByStage.map(({ stage, count }) => {
              const pct = totalModels === 0 ? 0 : Math.round((count / totalModels) * 100);
              return (
                <div key={stage} className="flex items-center gap-2">
                  <span className="w-20 text-[10px] text-[#8a8690] text-right">{STAGE_LABELS[stage]}</span>
                  <div className="flex-1 h-2 rounded-full bg-[#0a0a0f] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: STAGE_COLORS[stage] }}
                    />
                  </div>
                  <span className="w-8 text-[10px] text-[#8a8690] text-left">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* --- Faction Breakdown --- */}
        <FactionBreakdown />

        {/* --- Collection List --- */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-[#e8e4de]">Collection</h2>

          {/* Filter chips */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {([
              ['all', 'All'],
              ['unassembled', 'Unassembled'],
              ['in_progress', 'In Progress'],
              ['complete', 'Complete'],
            ] as [FilterChip, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filter === key
                    ? 'bg-[#c9a84c]/20 text-[#c9a84c] border border-[#c9a84c]/40'
                    : 'bg-[#1a1a24] text-[#8a8690] border border-[#2a2a35]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#8a8690] uppercase">Sort:</span>
            {([
              ['date', 'Date'],
              ['name', 'Name'],
              ['faction', 'Faction'],
              ['stage', 'Stage'],
            ] as [SortKey, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSort(key)}
                className={`text-[11px] px-2 py-0.5 rounded ${
                  sort === key ? 'text-[#c9a84c] bg-[#c9a84c]/10' : 'text-[#8a8690]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Items */}
          <div className="space-y-2">
            {filteredItems.map(item => (
              <ItemCard key={item.id} item={item} />
            ))}
            {filteredItems.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-sm text-[#8a8690]">
                  {items.length === 0 ? 'No models in your collection yet.' : 'No models match this filter.'}
                </p>
                {items.length === 0 && (
                  <button
                    onClick={() => setShowAdd(true)}
                    className="mt-3 px-4 py-2 rounded-lg bg-[#c9a84c]/20 text-[#c9a84c] text-sm font-medium"
                  >
                    Add your first model
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-[#c9a84c] text-[#0a0a0f] shadow-lg flex items-center justify-center hover:bg-[#d4b65c] active:scale-95 transition-all"
      >
        <Plus className="w-6 h-6" strokeWidth={2.5} />
      </button>

      {/* Add Modal */}
      {showAdd && <AddModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
