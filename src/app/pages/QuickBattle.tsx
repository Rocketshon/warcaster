import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, BookOpen, ScrollText, Dices, Target, ChevronRight } from "lucide-react";
import FactionPicker from "../components/FactionPicker";
import { getFactionName, getFactionIcon } from "../../lib/factions";
import type { FactionId } from "../../types";

const STORAGE_KEY = "crusade_quick_faction";

function loadSavedFaction(): { id: FactionId; name: string; icon: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function saveFaction(id: FactionId, name: string, icon: string) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ id, name, icon }));
}

export default function QuickBattle() {
  const navigate = useNavigate();
  const [faction, setFaction] = useState<{ id: FactionId; name: string; icon: string } | null>(
    () => loadSavedFaction()
  );
  const [showFactionPicker, setShowFactionPicker] = useState(false);

  const handleFactionSelect = (factionId: string, factionName: string, factionIcon: string) => {
    const selected = { id: factionId as FactionId, name: factionName, icon: factionIcon };
    setFaction(selected);
    saveFaction(selected.id, selected.name, selected.icon);
  };

  const actions = [
    {
      label: "Datasheets",
      description: "Browse your faction's unit datasheets",
      icon: BookOpen,
      path: `/codex/${faction?.id}`,
      disabled: !faction,
    },
    {
      label: "Rules",
      description: "Core rules, stratagems, and detachments",
      icon: ScrollText,
      path: "/rules",
      disabled: false,
    },
    {
      label: "Dice Roller",
      description: "Quick dice rolls with pass/fail tracking",
      icon: Dices,
      path: "/quick-dice",
      disabled: false,
    },
    {
      label: "Battle Tracker",
      description: "Track VP, CP, and rounds during a game",
      icon: Target,
      path: "/tracker",
      disabled: false,
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-stone-950/90 backdrop-blur-sm border-b border-amber-500/20">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate("/home")}
            className="p-1.5 rounded-lg hover:bg-stone-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-stone-400" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-stone-100 tracking-wide">Quick Battle Mode</h1>
            <p className="text-xs text-amber-500/70">No campaign required</p>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto space-y-6">
        {/* Faction Picker */}
        <div>
          <label className="block text-xs text-stone-500 uppercase tracking-wider mb-2">
            Your Faction
          </label>
          <button
            onClick={() => setShowFactionPicker(true)}
            className="w-full bg-stone-900 border border-amber-500/30 rounded-sm px-4 py-4 flex items-center justify-between hover:border-amber-500/50 transition-colors"
          >
            {faction ? (
              <div className="flex items-center gap-3">
                <span className="text-2xl">{faction.icon}</span>
                <span className="text-stone-100 font-semibold">{faction.name}</span>
              </div>
            ) : (
              <span className="text-stone-500">Tap to select a faction...</span>
            )}
            <ChevronRight className="w-5 h-5 text-amber-500/50" />
          </button>
        </div>

        {/* Action Cards */}
        {faction && (
          <div className="space-y-3">
            <label className="block text-xs text-stone-500 uppercase tracking-wider">
              Tools
            </label>
            {actions.map((action) => (
              <button
                key={action.label}
                onClick={() => !action.disabled && navigate(action.path)}
                disabled={action.disabled}
                className="group w-full relative overflow-hidden disabled:opacity-40"
              >
                <div className="absolute inset-0 bg-stone-900 border border-stone-700/60 rounded-sm transition-all duration-300 group-hover:border-amber-500/40 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.1)] group-disabled:hover:border-stone-700/60 group-disabled:hover:shadow-none" />
                <div className="relative px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <action.icon className="w-5 h-5 text-amber-500/70" strokeWidth={1.5} />
                    <div className="text-left">
                      <h3 className="text-sm font-semibold text-stone-100">{action.label}</h3>
                      <p className="text-xs text-stone-500 mt-0.5">{action.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-600" />
                </div>
              </button>
            ))}
          </div>
        )}

        {!faction && (
          <div className="text-center py-8">
            <p className="text-stone-600 text-sm">Pick a faction above to get started.</p>
          </div>
        )}
      </div>

      <FactionPicker
        isOpen={showFactionPicker}
        onClose={() => setShowFactionPicker(false)}
        onSelect={handleFactionSelect}
        selectedFactionId={faction?.id}
        title="Select Your Faction"
      />
    </div>
  );
}
