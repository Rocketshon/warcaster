import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Zap, Shield, Swords, ChevronDown, ChevronRight } from "lucide-react";
import { useCrusade } from "../../lib/CrusadeContext";
import { getFactionName, getDataFactionId } from "../../lib/factions";
import { getRulesForFaction } from "../../data";
import {
  buildCheatSheet,
  PHASE_ORDER,
  type GamePhase,
  type CheatSheetEntry,
  type PhaseSection,
} from "../../lib/phaseParser";

const PHASE_ICONS: Record<GamePhase, string> = {
  command: '📋',
  movement: '🏃',
  shooting: '🎯',
  charge: '⚡',
  fight: '⚔️',
};

const PHASE_COLORS: Record<GamePhase, string> = {
  command: 'text-blue-400 border-blue-500/30 bg-blue-500/5',
  movement: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/5',
  shooting: 'text-orange-400 border-orange-500/30 bg-orange-500/5',
  charge: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/5',
  fight: 'text-red-400 border-red-500/30 bg-red-500/5',
};

const PHASE_ACCENT: Record<GamePhase, string> = {
  command: 'border-blue-500/40',
  movement: 'border-cyan-500/40',
  shooting: 'border-orange-500/40',
  charge: 'border-yellow-500/40',
  fight: 'border-red-500/40',
};

export default function TacticalCheatSheet() {
  const navigate = useNavigate();
  const { campaign, currentPlayer, units } = useCrusade();
  const [activePhase, setActivePhase] = useState<GamePhase>('command');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!campaign || !currentPlayer) {
      navigate("/home", { replace: true });
    }
  }, [campaign, currentPlayer, navigate]);

  const cheatSheet = useMemo(() => {
    if (!currentPlayer) return [];
    return buildCheatSheet(
      currentPlayer.faction_id,
      currentPlayer.detachment_id,
      units
    );
  }, [currentPlayer, units]);

  if (!campaign || !currentPlayer) return null;

  const factionName = getFactionName(currentPlayer.faction_id);
  const dataFactionId = getDataFactionId(currentPlayer.faction_id);
  const factionRules = getRulesForFaction(dataFactionId);
  const detachment = factionRules?.detachments?.find(d => d.name === currentPlayer.detachment_id) ?? null;

  const currentSection = cheatSheet.find(s => s.phase === activePhase);
  const totalEntries = (s: PhaseSection) =>
    s.yourTurn.length + s.opponentTurn.length + s.either.length;

  const toggleCard = (key: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden pb-24">
      <div className="relative z-10 w-full max-w-md mx-auto p-6">
        {/* Header */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-stone-400 hover:text-emerald-500 transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back to Roster</span>
        </button>

        <div className="mb-6">
          <h1 className="text-xl font-bold text-stone-100 tracking-wider mb-1">
            Tactical Cheat Sheet
          </h1>
          <p className="text-stone-400 text-xs">
            {factionName} — {detachment?.name ?? 'No Detachment'}
          </p>
          <p className="text-stone-500 text-[10px] mt-1 italic">
            Non-prescriptive — these are available options, not instructions
          </p>
        </div>

        {/* Phase Tab Bar */}
        <div className="flex gap-1 mb-6 overflow-x-auto scrollbar-hide">
          {PHASE_ORDER.map(phase => {
            const section = cheatSheet.find(s => s.phase === phase);
            const count = section ? totalEntries(section) : 0;
            const isActive = activePhase === phase;

            return (
              <button
                key={phase}
                onClick={() => setActivePhase(phase)}
                className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg border transition-all text-xs ${
                  isActive
                    ? PHASE_COLORS[phase] + ' border-opacity-60'
                    : 'text-stone-400 border-stone-800/50 bg-stone-950/50 hover:border-stone-700'
                }`}
              >
                <span className="text-sm">{PHASE_ICONS[phase]}</span>
                <span className="font-medium capitalize">{phase}</span>
                {count > 0 && (
                  <span className={`text-[10px] font-mono ${isActive ? '' : 'text-stone-500'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Phase Content */}
        {currentSection && (
          <div className="space-y-6">
            {/* Your Turn */}
            {currentSection.yourTurn.length > 0 && (
              <TimingSection
                title="Your Turn"
                icon={<Swords className="w-4 h-4 text-emerald-400" />}
                entries={currentSection.yourTurn}
                phase={activePhase}
                expandedCards={expandedCards}
                onToggle={toggleCard}
                prefix="yt"
              />
            )}

            {/* Opponent's Turn */}
            {currentSection.opponentTurn.length > 0 && (
              <TimingSection
                title="Opponent's Turn"
                icon={<Shield className="w-4 h-4 text-red-400" />}
                entries={currentSection.opponentTurn}
                phase={activePhase}
                expandedCards={expandedCards}
                onToggle={toggleCard}
                prefix="ot"
              />
            )}

            {/* Either Turn */}
            {currentSection.either.length > 0 && (
              <TimingSection
                title="Either Turn"
                icon={<Zap className="w-4 h-4 text-amber-400" />}
                entries={currentSection.either}
                phase={activePhase}
                expandedCards={expandedCards}
                onToggle={toggleCard}
                prefix="et"
              />
            )}

            {/* Empty state */}
            {totalEntries(currentSection) === 0 && (
              <div className="text-center py-12">
                <p className="text-stone-500 text-sm">
                  No triggers available for this phase
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Timing Section Component
// ---------------------------------------------------------------------------

function TimingSection({
  title,
  icon,
  entries,
  phase,
  expandedCards,
  onToggle,
  prefix,
}: {
  title: string;
  icon: React.ReactNode;
  entries: CheatSheetEntry[];
  phase: GamePhase;
  expandedCards: Set<string>;
  onToggle: (key: string) => void;
  prefix: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
          {title}
        </h2>
        <span className="text-[10px] text-stone-500 font-mono">({entries.length})</span>
      </div>
      <div className="space-y-2">
        {entries.map((entry, i) => (
          <EntryCard
            key={`${prefix}-${i}`}
            entry={entry}
            phase={phase}
            isExpanded={expandedCards.has(`${prefix}-${i}`)}
            onToggle={() => onToggle(`${prefix}-${i}`)}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Entry Card Component
// ---------------------------------------------------------------------------

function EntryCard({
  entry,
  phase,
  isExpanded,
  onToggle,
}: {
  entry: CheatSheetEntry;
  phase: GamePhase;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const typeLabel = entry.type === 'stratagem'
    ? 'Stratagem'
    : entry.type === 'detachment_rule'
    ? 'Detachment Rule'
    : entry.type === 'core_ability'
    ? 'Core Ability'
    : 'Ability';

  const typeBadgeColor = entry.type === 'stratagem'
    ? 'bg-purple-500/15 text-purple-400 border-purple-500/20'
    : entry.type === 'detachment_rule'
    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
    : 'bg-stone-500/15 text-stone-400 border-stone-500/20';

  return (
    <div
      className={`rounded-sm border bg-stone-900 overflow-hidden transition-all ${PHASE_ACCENT[phase]}`}
    >
      {/* Header - always visible */}
      <button
        onClick={onToggle}
        className="w-full text-left p-3 flex items-start gap-2"
      >
        <div className="mt-0.5">
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-semibold text-stone-100">
              {entry.name}
            </span>
            {entry.cp && (
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/20">
                {entry.cp} CP
              </span>
            )}
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${typeBadgeColor}`}>
              {typeLabel}
            </span>
          </div>

          {/* Source units */}
          {entry.sourceUnits && entry.sourceUnits.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {entry.sourceUnits.slice(0, 3).map((unit, i) => (
                <span key={i} className="text-[10px] text-emerald-500/80 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  {unit}
                </span>
              ))}
              {entry.sourceUnits.length > 3 && (
                <span className="text-[10px] text-stone-500">
                  +{entry.sourceUnits.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-0 ml-6 space-y-2 border-t border-stone-800/50">
          <div className="pt-2" />

          {entry.when && (
            <DetailRow label="When" value={entry.when} />
          )}
          {entry.target && (
            <DetailRow label="Target" value={entry.target} />
          )}
          {entry.effect && (
            <DetailRow label="Effect" value={entry.effect} />
          )}
          {entry.restrictions && (
            <DetailRow label="Restrictions" value={entry.restrictions} />
          )}
          {entry.description && entry.type !== 'stratagem' && (
            <DetailRow label="Details" value={entry.description} />
          )}
          {entry.detachment && (
            <p className="text-[10px] text-stone-500 italic">
              Source: {entry.detachment}
            </p>
          )}
          {entry.stratagemType && (
            <p className="text-[10px] text-stone-500 italic">
              Type: {entry.stratagemType}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  // Break long text into readable chunks
  const formatted = value.length > 120
    ? value.split(/[.!]\s+/).filter(Boolean).map(s => s.trim()).filter(s => s.length > 0)
    : null;

  return (
    <div>
      <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block mb-0.5">
        {label}
      </span>
      {formatted ? (
        <ul className="space-y-1">
          {formatted.map((line, i) => (
            <li key={i} className="text-xs text-stone-300 leading-relaxed">
              {line}{!line.endsWith('.') && !line.endsWith('!') ? '.' : ''}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-stone-300 leading-relaxed">{value}</p>
      )}
    </div>
  );
}
