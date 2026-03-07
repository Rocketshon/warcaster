import { useNavigate } from "react-router";
import { ArrowLeft, ChevronRight, BookOpen } from "lucide-react";
import { FACTIONS } from '../../lib/factions';
import { getUnitsForFaction, getRulesForFaction } from '../../data';
import type { FactionId } from '../../types';

// Color mappings for faction display
const COLOR_MAP: Record<string, { color: string; bgGlow: string }> = {
  blue: { color: 'text-blue-500', bgGlow: 'from-blue-500/10' },
  cyan: { color: 'text-cyan-400', bgGlow: 'from-cyan-400/10' },
  slate: { color: 'text-slate-400', bgGlow: 'from-slate-400/10' },
  red: { color: 'text-red-500', bgGlow: 'from-red-500/10' },
  amber: { color: 'text-amber-500', bgGlow: 'from-amber-500/10' },
  orange: { color: 'text-orange-500', bgGlow: 'from-orange-500/10' },
  green: { color: 'text-green-600', bgGlow: 'from-green-600/10' },
  yellow: { color: 'text-yellow-600', bgGlow: 'from-yellow-600/10' },
  purple: { color: 'text-purple-500', bgGlow: 'from-purple-500/10' },
  zinc: { color: 'text-zinc-400', bgGlow: 'from-zinc-400/10' },
  lime: { color: 'text-lime-500', bgGlow: 'from-lime-500/10' },
  rose: { color: 'text-rose-500', bgGlow: 'from-rose-500/10' },
  stone: { color: 'text-stone-400', bgGlow: 'from-stone-400/10' },
  emerald: { color: 'text-emerald-400', bgGlow: 'from-emerald-400/10' },
  violet: { color: 'text-violet-400', bgGlow: 'from-violet-400/10' },
  sky: { color: 'text-sky-500', bgGlow: 'from-sky-500/10' },
  indigo: { color: 'text-indigo-400', bgGlow: 'from-indigo-400/10' },
};

function getFactionColors(colorKey: string) {
  return COLOR_MAP[colorKey] ?? { color: 'text-stone-400', bgGlow: 'from-stone-400/10' };
}

export default function CodexHome() {
  const navigate = useNavigate();

  // Build faction list dynamically from real data
  const factionList = FACTIONS.map((f) => {
    const colors = getFactionColors(f.color);
    const datasheets = getUnitsForFaction(f.id).length;
    const detachments = getRulesForFaction(f.id)?.detachments.length ?? 0;
    return {
      id: f.id,
      name: f.name,
      icon: f.icon,
      category: f.category,
      hasChapters: f.hasChapters ?? false,
      datasheets,
      detachments,
      ...colors,
    };
  });

  const handleFactionClick = (faction: (typeof factionList)[0]) => {
    if (faction.hasChapters) {
      navigate("/space-marines-chapters");
    } else {
      navigate(`/codex/${faction.id}`);
    }
  };

  // Group factions
  const imperiumFactions = factionList.filter((f) => f.category === "imperium");
  const chaosFactions = factionList.filter((f) => f.category === "chaos");
  const xenosFactions = factionList.filter((f) => f.category === "xenos");

  return (
    <div className="min-h-screen bg-black flex flex-col p-6 relative overflow-hidden pb-8">
      {/* Dark ambient glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-orange-600/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-stone-400 hover:text-emerald-500 transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-3">
            <div className="relative">
              <BookOpen className="w-12 h-12 text-emerald-500/80" strokeWidth={1.5} />
              <div className="absolute inset-0 blur-md">
                <BookOpen className="w-12 h-12 text-emerald-500/40" strokeWidth={1.5} />
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-stone-100 mb-2 tracking-wider drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">
            Codex Library
          </h1>
          <p className="text-stone-500 text-sm">
            Browse all faction codexes
          </p>
        </div>

        {/* Imperium */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="text-amber-500">⚜️</span>
            Imperium
          </h2>
          <div className="space-y-3">
            {imperiumFactions.map((faction) => (
              <button
                key={faction.id}
                onClick={() => handleFactionClick(faction)}
                className="w-full relative overflow-hidden rounded-lg border border-emerald-500/20 bg-gradient-to-br from-stone-900 to-stone-950 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all group"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${faction.bgGlow} to-transparent opacity-50`} />
                <div className="relative p-4 flex items-center gap-4">
                  <div className="text-3xl">{faction.icon}</div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-stone-100">
                        {faction.name}
                      </h3>
                      {faction.hasChapters && (
                        <span className="text-xs text-emerald-500/70 italic">
                          View Chapters
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-stone-500">
                      <span>{faction.datasheets} datasheets</span>
                      <span>•</span>
                      <span>{faction.detachments} detachments</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-stone-600 group-hover:text-emerald-500 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chaos */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="text-red-500">🔥</span>
            Chaos
          </h2>
          <div className="space-y-3">
            {chaosFactions.map((faction) => (
              <button
                key={faction.id}
                onClick={() => handleFactionClick(faction)}
                className="w-full relative overflow-hidden rounded-lg border border-emerald-500/20 bg-gradient-to-br from-stone-900 to-stone-950 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all group"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${faction.bgGlow} to-transparent opacity-50`} />
                <div className="relative p-4 flex items-center gap-4">
                  <div className="text-3xl">{faction.icon}</div>
                  <div className="flex-1 text-left">
                    <h3 className="text-base font-semibold text-stone-100 mb-1">
                      {faction.name}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-stone-500">
                      <span>{faction.datasheets} datasheets</span>
                      <span>•</span>
                      <span>{faction.detachments} detachments</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-stone-600 group-hover:text-emerald-500 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Xenos */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="text-purple-500">👽</span>
            Xenos
          </h2>
          <div className="space-y-3">
            {xenosFactions.map((faction) => (
              <button
                key={faction.id}
                onClick={() => handleFactionClick(faction)}
                className="w-full relative overflow-hidden rounded-lg border border-emerald-500/20 bg-gradient-to-br from-stone-900 to-stone-950 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all group"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${faction.bgGlow} to-transparent opacity-50`} />
                <div className="relative p-4 flex items-center gap-4">
                  <div className="text-3xl">{faction.icon}</div>
                  <div className="flex-1 text-left">
                    <h3 className="text-base font-semibold text-stone-100 mb-1">
                      {faction.name}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-stone-500">
                      <span>{faction.datasheets} datasheets</span>
                      <span>•</span>
                      <span>{faction.detachments} detachments</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-stone-600 group-hover:text-emerald-500 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
