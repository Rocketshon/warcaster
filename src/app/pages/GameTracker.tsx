import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Trophy,
  StickyNote,
  Zap,
  Flag,
  Save,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RoundData {
  yourPrimary: number;
  yourSecondary: number;
  opponentPrimary: number;
  opponentSecondary: number;
  cp: number;
  notes: string;
}

interface GameState {
  currentRound: number;
  missionName: string;
  rounds: RoundData[];
  startedAt: string;
}

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'warcaster_active_game';

function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GameState;
  } catch {
    return null;
  }
}

function saveGame(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // silently ignore
  }
}

function clearGame(): void {
  localStorage.removeItem(STORAGE_KEY);
}

function makeDefaultRounds(): RoundData[] {
  return Array.from({ length: 5 }, () => ({
    yourPrimary: 0,
    yourSecondary: 0,
    opponentPrimary: 0,
    opponentSecondary: 0,
    cp: 0,
    notes: '',
  }));
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ScoreCounter({
  label,
  value,
  onChange,
  max = 50,
  accentClass = 'text-[#c9a84c]',
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  max?: number;
  accentClass?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-[#8a8690] uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#12121a] border border-[#2a2a35]
                     text-[#8a8690] hover:text-[#e8e4de] hover:border-[#c9a84c] transition-colors active:scale-95"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className={`text-2xl font-bold font-mono w-10 text-center ${accentClass}`}>{value}</span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#12121a] border border-[#2a2a35]
                     text-[#8a8690] hover:text-[#e8e4de] hover:border-[#c9a84c] transition-colors active:scale-95"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Common Missions
// ---------------------------------------------------------------------------

const COMMON_MISSIONS = [
  'Take and Hold',
  'The Ritual',
  'Supply Drop',
  'Scorched Earth',
  'Sites of Power',
  'Purge the Foe',
  'Deploy Servo-Skulls',
  'Terraform',
  'Vital Ground',
  'Search and Destroy',
  'Sweep and Clear',
  'Linchpin',
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function GameTracker() {
  const navigate = useNavigate();

  // Initialise from localStorage or fresh
  const [game, setGame] = useState<GameState>(() => {
    const saved = loadGame();
    if (saved) return saved;
    return {
      currentRound: 1,
      missionName: '',
      rounds: makeDefaultRounds(),
      startedAt: new Date().toISOString(),
    };
  });

  const [showMissionDropdown, setShowMissionDropdown] = useState(false);

  // Auto-save on every change
  useEffect(() => {
    saveGame(game);
  }, [game]);

  // Helpers
  const round = game.rounds[game.currentRound - 1];

  const updateRound = useCallback(
    (patch: Partial<RoundData>) => {
      setGame((prev) => {
        const newRounds = [...prev.rounds];
        newRounds[prev.currentRound - 1] = { ...newRounds[prev.currentRound - 1], ...patch };
        return { ...prev, rounds: newRounds };
      });
    },
    [],
  );

  const yourTotal = game.rounds.reduce((sum, r) => sum + r.yourPrimary + r.yourSecondary, 0);
  const opponentTotal = game.rounds.reduce((sum, r) => sum + r.opponentPrimary + r.opponentSecondary, 0);
  const totalCP = game.rounds.reduce((sum, r) => sum + r.cp, 0);

  // End battle
  const handleEndBattle = () => {
    const result = yourTotal > opponentTotal ? 'Victory' : yourTotal < opponentTotal ? 'Defeat' : 'Draw';
    // Save completed game to history
    const history = JSON.parse(localStorage.getItem('warcaster_battle_history') ?? '[]');
    history.push({
      id: crypto.randomUUID(),
      missionName: game.missionName || 'Unknown Mission',
      yourVP: yourTotal,
      opponentVP: opponentTotal,
      result,
      rounds: game.rounds,
      startedAt: game.startedAt,
      endedAt: new Date().toISOString(),
    });
    localStorage.setItem('warcaster_battle_history', JSON.stringify(history));
    clearGame();
    navigate('/army');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 pt-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-xl font-bold text-[#c9a84c] flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Battle Tracker
        </h1>
        <span className="text-sm text-[#8a8690]">
          Round <span className="text-[#e8e4de] font-bold">{game.currentRound}</span> / 5
        </span>
      </div>

      {/* Round Navigator */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={() => setGame((prev) => ({ ...prev, currentRound: Math.max(1, prev.currentRound - 1) }))}
          disabled={game.currentRound === 1}
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#1a1a24] border border-[#2a2a35]
                     text-[#8a8690] hover:text-[#e8e4de] hover:border-[#c9a84c] transition-colors
                     disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((r) => (
            <button
              key={r}
              onClick={() => setGame((prev) => ({ ...prev, currentRound: r }))}
              className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${
                r === game.currentRound
                  ? 'bg-[#c9a84c] text-[#0a0a0f]'
                  : r < game.currentRound
                  ? 'bg-[#1a1a24] text-[#c9a84c] border border-[#c9a84c]/30'
                  : 'bg-[#1a1a24] text-[#8a8690] border border-[#2a2a35]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <button
          onClick={() => setGame((prev) => ({ ...prev, currentRound: Math.min(5, prev.currentRound + 1) }))}
          disabled={game.currentRound === 5}
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#1a1a24] border border-[#2a2a35]
                     text-[#8a8690] hover:text-[#e8e4de] hover:border-[#c9a84c] transition-colors
                     disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Mission Name */}
      <div className="mb-6 relative">
        <label className="text-xs text-[#8a8690] uppercase tracking-wider mb-1 flex items-center gap-1">
          <Flag className="w-3 h-3" />
          Mission
        </label>
        <div className="relative">
          <input
            type="text"
            value={game.missionName}
            onChange={(e) => setGame((prev) => ({ ...prev, missionName: e.target.value }))}
            onFocus={() => setShowMissionDropdown(true)}
            onBlur={() => setTimeout(() => setShowMissionDropdown(false), 200)}
            placeholder="Enter mission name..."
            className="w-full px-4 py-2.5 bg-[#1a1a24] border border-[#2a2a35] rounded-lg text-[#e8e4de] text-sm
                       placeholder:text-[#555] focus:outline-none focus:border-[#c9a84c] transition-colors"
          />
          {showMissionDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a24] border border-[#2a2a35] rounded-lg
                            max-h-48 overflow-y-auto z-20 shadow-lg shadow-black/40">
              {COMMON_MISSIONS.filter((m) =>
                !game.missionName || m.toLowerCase().includes(game.missionName.toLowerCase()),
              ).map((m) => (
                <button
                  key={m}
                  onMouseDown={() => {
                    setGame((prev) => ({ ...prev, missionName: m }));
                    setShowMissionDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-[#e8e4de] hover:bg-[#22222e] transition-colors"
                >
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Score Section */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Your scores */}
        <div className="bg-[#1a1a24] border border-[#2a2a35] rounded-lg p-4 space-y-4">
          <h3 className="text-sm font-semibold text-[#c9a84c] text-center uppercase tracking-wider">You</h3>
          <ScoreCounter
            label="Primary VP"
            value={round.yourPrimary}
            onChange={(v) => updateRound({ yourPrimary: v })}
          />
          <ScoreCounter
            label="Secondary VP"
            value={round.yourSecondary}
            onChange={(v) => updateRound({ yourSecondary: v })}
          />
          <div className="text-center border-t border-[#2a2a35] pt-3">
            <span className="text-xs text-[#8a8690]">Total VP</span>
            <div className="text-xl font-bold text-[#c9a84c] font-mono">{yourTotal}</div>
          </div>
        </div>

        {/* Opponent scores */}
        <div className="bg-[#1a1a24] border border-[#2a2a35] rounded-lg p-4 space-y-4">
          <h3 className="text-sm font-semibold text-red-400 text-center uppercase tracking-wider">Opponent</h3>
          <ScoreCounter
            label="Primary VP"
            value={round.opponentPrimary}
            onChange={(v) => updateRound({ opponentPrimary: v })}
            accentClass="text-red-400"
          />
          <ScoreCounter
            label="Secondary VP"
            value={round.opponentSecondary}
            onChange={(v) => updateRound({ opponentSecondary: v })}
            accentClass="text-red-400"
          />
          <div className="text-center border-t border-[#2a2a35] pt-3">
            <span className="text-xs text-[#8a8690]">Total VP</span>
            <div className="text-xl font-bold text-red-400 font-mono">{opponentTotal}</div>
          </div>
        </div>
      </div>

      {/* Command Points */}
      <div className="bg-[#1a1a24] border border-[#2a2a35] rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#c9a84c]" />
            <span className="text-sm font-semibold text-[#e8e4de]">Command Points</span>
            <span className="text-xs text-[#8a8690]">(this round)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateRound({ cp: Math.max(-5, round.cp - 1) })}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#12121a] border border-[#2a2a35]
                         text-[#8a8690] hover:text-[#e8e4de] hover:border-[#c9a84c] transition-colors active:scale-95"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-xl font-bold font-mono text-[#c9a84c] w-8 text-center">{round.cp}</span>
            <button
              onClick={() => updateRound({ cp: Math.min(20, round.cp + 1) })}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#12121a] border border-[#2a2a35]
                         text-[#8a8690] hover:text-[#e8e4de] hover:border-[#c9a84c] transition-colors active:scale-95"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="mt-2 text-xs text-[#8a8690] text-right">
          Total CP across all rounds: <span className="text-[#c9a84c] font-semibold">{totalCP}</span>
        </div>
      </div>

      {/* Quick Notes */}
      <div className="mb-6">
        <label className="text-xs text-[#8a8690] uppercase tracking-wider mb-1 flex items-center gap-1">
          <StickyNote className="w-3 h-3" />
          Round {game.currentRound} Notes
        </label>
        <textarea
          value={round.notes}
          onChange={(e) => updateRound({ notes: e.target.value })}
          placeholder={`Turn ${game.currentRound}: What happened this round...`}
          rows={2}
          className="w-full px-4 py-2.5 bg-[#1a1a24] border border-[#2a2a35] rounded-lg text-[#e8e4de] text-sm
                     placeholder:text-[#555] focus:outline-none focus:border-[#c9a84c] transition-colors resize-none"
        />
      </div>

      {/* Battle Log */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-[#e8e4de] mb-3 flex items-center gap-2">
          <Save className="w-4 h-4 text-[#c9a84c]" />
          Battle Log
        </h3>
        <div className="space-y-2">
          {game.rounds.map((r, i) => {
            const rYour = r.yourPrimary + r.yourSecondary;
            const rOpp = r.opponentPrimary + r.opponentSecondary;
            const hasData = rYour > 0 || rOpp > 0 || r.notes.trim();
            if (!hasData) return null;
            return (
              <div
                key={i}
                className={`px-4 py-3 rounded-lg border transition-colors cursor-pointer ${
                  i + 1 === game.currentRound
                    ? 'bg-[#1a1a24] border-[#c9a84c]/40'
                    : 'bg-[#12121a] border-[#2a2a35]'
                }`}
                onClick={() => setGame((prev) => ({ ...prev, currentRound: i + 1 }))}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-[#c9a84c]">Round {i + 1}</span>
                  <span className="text-xs text-[#8a8690]">
                    You <span className="text-[#e8e4de] font-bold">{rYour}</span>
                    {' \u2014 '}
                    <span className="text-red-400 font-bold">{rOpp}</span> Opp
                  </span>
                </div>
                {r.notes.trim() && (
                  <p className="text-xs text-[#8a8690] truncate">{r.notes}</p>
                )}
              </div>
            );
          })}
          {game.rounds.every(
            (r) => r.yourPrimary + r.yourSecondary === 0 && r.opponentPrimary + r.opponentSecondary === 0 && !r.notes.trim(),
          ) && (
            <p className="text-xs text-[#555] text-center py-4">No data recorded yet. Start scoring!</p>
          )}
        </div>
      </div>

      {/* End Battle */}
      <button
        onClick={handleEndBattle}
        className="w-full py-3 bg-red-500/20 border border-red-500/40 rounded-lg text-red-400 font-semibold text-sm
                   hover:bg-red-500/30 transition-colors"
      >
        End Battle
      </button>
    </div>
  );
}
