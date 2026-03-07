import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Calendar, Users, Star, Skull, Award, Zap, TrendingUp, FileText } from "lucide-react";
import { useCrusade } from "../../lib/CrusadeContext";
import { getRankFromXP } from "../../lib/ranks";
import { getResultLabel, getBattleSizeColor } from "../../lib/formatText";
import { getFactionIcon, FACTIONS } from "../../lib/factions";

export default function BattleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { battles, units } = useCrusade();

  // Find battle by id
  const battle = battles.find(b => b.id === id);

  if (!battle) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-stone-500 mb-4">Battle not found.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 rounded-lg font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 text-black"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Get fielded units from battle data mapped against roster
  const fieldedUnits = battle.units_fielded
    .map(unitId => units.find(u => u.id === unitId))
    .filter(Boolean) as typeof units;

  // Derive result label using the shared utility
  const resultLabel = getResultLabel(battle.result);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case "victory":
        return {
          text: "text-emerald-400",
          bg: "bg-emerald-500/10",
          border: "border-emerald-500/30",
          glow: "shadow-[0_0_20px_rgba(16,185,129,0.3)]",
        };
      case "defeat":
        return {
          text: "text-red-400",
          bg: "bg-red-500/10",
          border: "border-red-500/30",
          glow: "shadow-[0_0_20px_rgba(239,68,68,0.3)]",
        };
      case "draw":
        return {
          text: "text-amber-400",
          bg: "bg-amber-500/10",
          border: "border-amber-500/30",
          glow: "shadow-[0_0_20px_rgba(245,158,11,0.3)]",
        };
      default:
        return {
          text: "text-stone-400",
          bg: "bg-stone-800",
          border: "border-stone-700",
          glow: "",
        };
    }
  };

  const resultColors = getResultColor(battle.result);

  /**
   * Try to resolve opponent faction string to a faction icon.
   * Matches against FACTIONS by name (case-insensitive) or id.
   */
  const resolveOpponentFactionIcon = (factionStr: string): string | null => {
    if (!factionStr) return null;
    const lower = factionStr.toLowerCase();
    const match = FACTIONS.find(
      (f) => f.name.toLowerCase() === lower || f.id === lower
    );
    return match ? match.icon : null;
  };

  const opponentFactionIcon = resolveOpponentFactionIcon(battle.opponent_faction);

  // Battle size colored badge classes
  const battleSizeClasses = getBattleSizeColor(battle.battle_size);

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
      {/* Dark ambient glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col min-h-screen">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-emerald-500/20">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-stone-400 hover:text-emerald-500 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>

          <h1 className="text-2xl font-bold text-stone-100 tracking-wider drop-shadow-[0_0_10px_rgba(16,185,129,0.3)] mb-3">
            {battle.mission_name}
          </h1>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-stone-500 text-sm">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(battle.created_at)}</span>
            </div>
            {/* Battle size — colored badge */}
            <span className={`px-3 py-1 rounded-full border text-xs font-semibold ${battleSizeClasses}`}>
              {battle.battle_size}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Result Banner */}
          <div
            className={`rounded-lg border ${resultColors.border} ${resultColors.bg} p-6 text-center ${resultColors.glow}`}
          >
            <h2 className={`text-4xl font-bold ${resultColors.text} tracking-wider mb-4 uppercase`}>
              {resultLabel}
            </h2>
            <div className="flex items-center justify-center gap-4 text-sm">
              <div>
                <p className="text-stone-500 mb-1">Your Score</p>
                <p className="text-2xl font-bold text-stone-200">{battle.player_vp}</p>
              </div>
              <div className="text-stone-600 text-2xl">&mdash;</div>
              <div>
                <p className="text-stone-500 mb-1">Opponent Score</p>
                <p className="text-2xl font-bold text-stone-200">{battle.opponent_vp}</p>
              </div>
            </div>
          </div>

          {/* Opponent Section */}
          <div>
            <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
              Opponent
            </h3>
            <div className="rounded-lg border border-stone-700/50 bg-gradient-to-br from-stone-900 to-stone-950 p-4">
              <h4 className="text-lg font-bold text-stone-300 mb-2">
                {battle.opponent_name}
              </h4>
              <div className="flex items-center gap-2 text-sm text-stone-500">
                {opponentFactionIcon && (
                  <span className="text-base">{opponentFactionIcon}</span>
                )}
                <span>{battle.opponent_faction}</span>
              </div>
            </div>
          </div>

          {/* Units Fielded Section */}
          {fieldedUnits.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Units Fielded
              </h3>
              <div className="space-y-2">
                {fieldedUnits.map((unit) => {
                  const isMarked = battle.marked_for_greatness === unit.id;
                  return (
                    <div
                      key={unit.id}
                      onClick={() => navigate(`/unit/${unit.id}`)}
                      className="rounded-lg border border-stone-700/50 bg-gradient-to-br from-stone-900 to-stone-950 p-4 cursor-pointer hover:border-emerald-500/40 transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-stone-300">{unit.custom_name}</h4>
                        <div className="flex items-center gap-2">
                          {isMarked && (
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30">
                              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            </div>
                          )}
                          {unit.is_destroyed && (
                            <div className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-xs font-semibold">
                              Destroyed
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-stone-500">{unit.points_cost} pts</span>
                        <span className="px-2 py-0.5 rounded-full bg-stone-800 text-stone-400">
                          {unit.rank}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Battle Results Section */}
          <div>
            <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
              Battle Results
            </h3>

            {/* XP Awarded — show per fielded unit */}
            {fieldedUnits.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-stone-500 mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-500" />
                  Units in Battle
                </h4>
                <div className="space-y-2">
                  {fieldedUnits.map((unit) => (
                    <div
                      key={unit.id}
                      className="rounded-lg border border-emerald-500/20 bg-gradient-to-br from-emerald-950/10 to-stone-950 p-3 flex items-center justify-between"
                    >
                      <span className="text-sm text-stone-400">{unit.custom_name}</span>
                      <span className="font-bold text-emerald-400">{unit.experience_points} XP</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Battle Honors — from fielded units that have honours */}
            {fieldedUnits.some(u => u.battle_honours.length > 0) && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-stone-500 mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-400" />
                  Battle Honors
                </h4>
                <div className="space-y-2">
                  {fieldedUnits
                    .filter(u => u.battle_honours.length > 0)
                    .map((unit) =>
                      unit.battle_honours.map((honour) => (
                        <div
                          key={`${unit.id}-${honour.id}`}
                          className="rounded-lg border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 to-stone-950 p-3 flex items-center justify-between"
                        >
                          <span className="text-sm text-stone-400">{unit.custom_name}</span>
                          <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
                            {honour.name}
                          </span>
                        </div>
                      ))
                    )}
                </div>
              </div>
            )}

            {/* Battle Scars — from fielded units that have scars */}
            {fieldedUnits.some(u => u.battle_scars.length > 0) && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-stone-500 mb-2 flex items-center gap-2">
                  <Skull className="w-4 h-4 text-red-500" />
                  Battle Scars
                </h4>
                <div className="space-y-2">
                  {fieldedUnits
                    .filter(u => u.battle_scars.length > 0)
                    .map((unit) =>
                      unit.battle_scars.map((scar) => (
                        <div
                          key={`${unit.id}-${scar.id}`}
                          className="rounded-lg border border-red-500/30 bg-gradient-to-br from-red-950/20 to-stone-950 p-3 flex items-center justify-between"
                        >
                          <span className="text-sm text-stone-400">{unit.custom_name}</span>
                          <span className="px-2 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-semibold">
                            {scar.name}
                          </span>
                        </div>
                      ))
                    )}
                </div>
              </div>
            )}
          </div>

          {/* Notes Section — with whitespace-pre-line for user-entered line breaks */}
          {battle.notes && (
            <div>
              <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
                Battle Notes
              </h3>
              <div className="rounded-lg border border-stone-700/50 bg-gradient-to-br from-stone-900/80 to-stone-950 p-4">
                <div className="flex items-start gap-3">
                  <FileText className="w-4 h-4 text-stone-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-stone-400 italic leading-relaxed whitespace-pre-line">
                    {battle.notes}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
