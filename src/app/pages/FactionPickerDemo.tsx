import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Users } from "lucide-react";
import FactionPicker from "../components/FactionPicker";

export default function FactionPickerDemo() {
  const navigate = useNavigate();
  const [showFactionPicker, setShowFactionPicker] = useState(false);
  const [selectedFaction, setSelectedFaction] = useState<{
    id: string;
    name: string;
    icon: string;
  } | null>(null);

  const handleFactionSelect = (factionId: string, factionName: string, factionIcon: string) => {
    setSelectedFaction({ id: factionId, name: factionName, icon: factionIcon });
  };

  return (
    <div className="min-h-screen bg-black flex flex-col p-6 relative overflow-hidden">
      {/* Dark ambient glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-2xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-stone-400 hover:text-emerald-500 transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-100 tracking-wider drop-shadow-[0_0_10px_rgba(16,185,129,0.3)] mb-2">
            Faction Picker Demo
          </h1>
          <p className="text-stone-500 text-sm">
            Reusable modal for faction selection
          </p>
        </div>

        {/* Selected Faction Display */}
        {selectedFaction && (
          <div className="mb-6 relative overflow-hidden rounded-lg border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 to-stone-950 p-6">
            <div className="flex items-center gap-4">
              <span className="text-5xl">{selectedFaction.icon}</span>
              <div>
                <p className="text-xs text-stone-500 font-semibold uppercase tracking-wider mb-1">
                  Selected Faction
                </p>
                <h2 className="text-2xl font-bold text-emerald-400">
                  {selectedFaction.name}
                </h2>
              </div>
            </div>
          </div>
        )}

        {/* Open Picker Button */}
        <button
          onClick={() => setShowFactionPicker(true)}
          className="w-full py-4 rounded-lg border border-emerald-500/20 bg-gradient-to-br from-stone-900 to-stone-950 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all group"
        >
          <div className="flex items-center justify-center gap-3">
            <Users className="w-5 h-5 text-emerald-500" />
            <span className="text-stone-300 font-semibold">
              {selectedFaction ? "Change Faction" : "Select Faction"}
            </span>
          </div>
        </button>

        {/* Info */}
        <div className="mt-8 rounded-lg border border-stone-700/50 bg-gradient-to-br from-stone-900 to-stone-950 p-5">
          <h3 className="text-stone-300 font-semibold mb-3">Faction Picker Features:</h3>
          <ul className="space-y-2 text-sm text-stone-500">
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-1">•</span>
              <span>All 25 Warhammer 40K factions included</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-1">•</span>
              <span>Organized by category: Imperium, Chaos, Xenos</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-1">•</span>
              <span>Live search and filter functionality</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-1">•</span>
              <span>Visual selection with checkmark indicator</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-1">•</span>
              <span>Reusable across Create Campaign, Join Campaign, and Add Unit screens</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-1">•</span>
              <span>Mobile-friendly bottom sheet design</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Faction Picker Modal */}
      <FactionPicker
        isOpen={showFactionPicker}
        onClose={() => setShowFactionPicker(false)}
        onSelect={handleFactionSelect}
        selectedFactionId={selectedFaction?.id}
        title="Select Your Faction"
      />
    </div>
  );
}
