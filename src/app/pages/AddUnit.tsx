import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Search, Plus, X, Users } from "lucide-react";
import { toast } from "sonner";
import { useArmy } from "../../lib/ArmyContext";
import { getFactionName, getDataFactionId } from "../../lib/factions";
import { getUnitsForFaction } from "../../data";
import { toTitleCase } from "../../lib/formatText";
import type { Datasheet, FactionId } from "../../types";
import WeaponStatTable from "../components/WeaponStatTable";

export default function AddUnit() {
  const navigate = useNavigate();
  const { addUnit, factionId: armyFactionId, army, mode, pointsCap, supplyLimit } = useArmy();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUnit, setSelectedUnit] = useState<Datasheet | null>(null);
  const [customName, setCustomName] = useState("");
  const [customPoints, setCustomPoints] = useState(0);
  const [selectedModelTier, setSelectedModelTier] = useState(0);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);

  const factionId: FactionId | null = (armyFactionId as FactionId) ?? null;

  useEffect(() => {
    if (!factionId) navigate('/army');
  }, [factionId, navigate]);

  const allFactionUnits = useMemo(() => {
    if (!factionId) return [];
    return getUnitsForFaction(getDataFactionId(factionId as FactionId));
  }, [factionId]);

  const filteredUnits = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return allFactionUnits;
    return allFactionUnits.filter(unit => unit.name.toLowerCase().includes(q) || unit.keywords.some(kw => kw.toLowerCase().includes(q)));
  }, [allFactionUnits, searchQuery]);

  const factionName = factionId ? getFactionName(factionId) : 'Select a faction';

  const handleUnitSelect = (unit: Datasheet) => {
    setSelectedUnit(unit);
    setCustomName(unit.name);
    setSelectedModelTier(0);
    const baseCost = unit.points[0]?.cost ? parseInt(unit.points[0].cost, 10) : 0;
    setCustomPoints(baseCost);
    setSelectedEquipment([]);
  };

  const handleModelTierChange = (tierIndex: number) => {
    if (!selectedUnit) return;
    setSelectedModelTier(tierIndex);
    const cost = parseInt(selectedUnit.points[tierIndex]?.cost ?? '0', 10);
    setCustomPoints(cost);
  };

  const handleEquipmentToggle = (option: string) => {
    setSelectedEquipment(prev => prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]);
  };

  const handleSubmit = () => {
    if (!selectedUnit) { toast.error("Please select a unit"); return; }
    if (!customName.trim()) { toast.error("Please enter a unit name"); return; }
    const role = selectedUnit.keywords.length > 0 ? selectedUnit.keywords[0] : '';
    const cap = mode === 'crusade' ? supplyLimit : pointsCap;
    const currentTotal = army.reduce((sum, u) => sum + u.points_cost, 0);
    const newTotal = currentTotal + customPoints;
    addUnit(selectedUnit.name, customPoints, role);
    if (newTotal > cap && cap > 0) {
      toast.warning(`Adding this unit puts you ${(newTotal - cap).toLocaleString()} pts over budget`, { duration: 4000 });
    } else {
      toast.success(`${customName} added to army!`, { duration: 3000 });
    }
    navigate("/army");
  };

  const handleCancel = () => {
    setSelectedUnit(null);
    setCustomName("");
    setCustomPoints(0);
    setSelectedEquipment([]);
  };

  const wargearOptions = selectedUnit?.wargear_options ?? [];

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col p-6 relative overflow-hidden pb-24">
      <div className="relative z-10 w-full max-w-md mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#8a8690] hover:text-[#c9a84c] transition-colors mb-6">
          <ArrowLeft className="w-5 h-5" /><span className="text-sm">Back to Army</span>
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#e8e4de] tracking-wider mb-1">Add Unit</h1>
          <p className="text-[#8a8690] text-sm">{factionName}</p>
        </div>

        {!selectedUnit ? (
          <>
            <div className="mb-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#c9a84c]/50" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search units or keywords..."
                  className="w-full bg-[#1a1a24] border border-[#2a2a35] rounded-lg pl-11 pr-4 py-3 text-[#e8e4de] placeholder:text-[#8a8690] focus:border-[#c9a84c]/40 focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/20 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-thin">
              {filteredUnits.map((unit, idx) => {
                const baseCost = unit.points[0]?.cost ? parseInt(unit.points[0].cost, 10) : 0;
                const displayKeywords = unit.keywords.filter(k => !["IMPERIUM", "CHAOS", "XENOS"].includes(k.toUpperCase())).slice(0, 4);
                return (
                  <button
                    key={`${unit.name}-${idx}`}
                    onClick={() => handleUnitSelect(unit)}
                    className="w-full text-left relative overflow-hidden rounded-lg border border-[#2a2a35] bg-[#1a1a24] hover:border-[#c9a84c] transition-all group"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-[#e8e4de] mb-1 group-hover:text-[#c9a84c] transition-colors">{unit.name}</h3>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {displayKeywords.map((kw, kidx) => (
                              <span key={kidx} className="text-xs text-[#8a8690] bg-[#12121a] px-2 py-0.5 rounded">{toTitleCase(kw)}</span>
                            ))}
                          </div>
                        </div>
                        <div className="text-sm font-bold text-[#c9a84c] font-mono">{baseCost} pts</div>
                      </div>
                    </div>
                  </button>
                );
              })}
              {filteredUnits.length === 0 && <div className="text-center py-12"><p className="text-[#8a8690] text-sm">No units found</p></div>}
            </div>
          </>
        ) : (
          <div className="space-y-5">
            <div className="relative overflow-hidden rounded-lg border border-[#2a2a35] bg-[#1a1a24] p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h3 className="text-base font-semibold text-[#e8e4de] mb-1">{selectedUnit.name}</h3>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {selectedUnit.keywords.filter(k => !["IMPERIUM", "CHAOS", "XENOS"].includes(k.toUpperCase())).slice(0, 4).map((kw, idx) => (
                      <span key={idx} className="text-xs text-[#8a8690] bg-[#12121a] px-2 py-0.5 rounded">{toTitleCase(kw)}</span>
                    ))}
                  </div>
                </div>
                <button onClick={handleCancel} aria-label="Deselect unit" className="text-[#8a8690] hover:text-[#e8e4de] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <WeaponStatTable weapons={selectedUnit.ranged_weapons} type="ranged" compact />
            <WeaponStatTable weapons={selectedUnit.melee_weapons} type="melee" compact />

            {selectedUnit.unit_composition && (
              <div className="rounded-lg border border-[#2a2a35]/40 bg-[#1a1a24] p-3">
                <h4 className="text-xs font-semibold text-[#8a8690] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#8a8690]" />Unit Composition
                </h4>
                <p className="text-xs text-[#a09ca6] leading-relaxed">{selectedUnit.unit_composition}</p>
              </div>
            )}

            {selectedUnit.points.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-[#a09ca6] mb-2 tracking-wide flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#c9a84c]/70" />Unit Size
                </label>
                <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(selectedUnit.points.length, 3)}, 1fr)` }}>
                  {selectedUnit.points.map((tier, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleModelTierChange(idx)}
                      className={`relative overflow-hidden rounded-lg border p-3 text-center transition-all ${
                        selectedModelTier === idx
                          ? "border-[#c9a84c]/50 bg-[#c9a84c]/10"
                          : "border-[#2a2a35] bg-[#1a1a24] hover:border-[#c9a84c]"
                      }`}
                    >
                      <div className="text-sm font-bold text-[#e8e4de] font-mono mb-0.5">{tier.models}</div>
                      <div className={`text-xs font-mono ${selectedModelTier === idx ? "text-[#c9a84c]" : "text-[#8a8690]"}`}>{tier.cost} pts</div>
                      {selectedModelTier === idx && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#c9a84c]" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[#a09ca6] mb-2 tracking-wide">Custom Name</label>
              <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Enter custom unit name"
                className="w-full bg-[#1a1a24] border border-[#2a2a35] rounded-lg px-4 py-3 text-[#e8e4de] placeholder:text-[#8a8690] focus:border-[#c9a84c]/40 focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/20 transition-all" />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#a09ca6] mb-2 tracking-wide">Base Points</label>
              <input type="number" inputMode="numeric" value={customPoints} onChange={(e) => setCustomPoints(Number(e.target.value))} min="0"
                className="w-full bg-[#1a1a24] border border-[#2a2a35] rounded-lg px-4 py-3 text-[#e8e4de] placeholder:text-[#8a8690] focus:border-[#c9a84c]/40 focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/20 transition-all" />
            </div>

            {wargearOptions.length > 0 && (
              <div className="rounded-lg border border-[#2a2a35] bg-[#1a1a24] p-3">
                <h4 className="text-xs font-semibold text-[#8a8690] uppercase tracking-wider mb-2">Wargear Options</h4>
                <ul className="space-y-1">
                  {wargearOptions.map((opt: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <input type="checkbox" checked={selectedEquipment.includes(opt)} onChange={() => handleEquipmentToggle(opt)} className="mt-1" />
                      <span className="text-xs text-[#a09ca6]">{opt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedUnit.wargear_abilities.length > 0 && (
              <div className="rounded-lg border border-[#2a2a35] bg-[#1a1a24] p-3">
                <h4 className="text-xs font-semibold text-[#8a8690] uppercase tracking-wider mb-2">Wargear Abilities</h4>
                <div className="space-y-2">
                  {selectedUnit.wargear_abilities.map((ability, idx: number) => {
                    if (typeof ability === 'string') return <p key={idx} className="text-xs text-[#a09ca6]">{ability}</p>;
                    return (
                      <div key={idx}>
                        <span className="text-xs font-bold text-[#c9a84c]">{ability[0]}: </span>
                        <span className="text-xs text-[#a09ca6]">{ability[1]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="relative overflow-hidden rounded-lg border border-[#c9a84c]/30 bg-[#1a1a24] p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#a09ca6] uppercase tracking-wider">Total Points</span>
                <span className="text-2xl font-bold text-[#c9a84c] font-mono">{customPoints}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 py-2">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#c9a84c]/20 to-transparent" />
            </div>

            <div className="flex gap-3">
              <button onClick={handleCancel} className="flex-1 px-6 py-3 rounded-lg border border-[#2a2a35] bg-[#1a1a24] text-[#a09ca6] font-semibold hover:border-[#c9a84c] transition-all">Cancel</button>
              <button onClick={handleSubmit} className="flex-1 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-[#c9a84c] to-[#d4a017] rounded-lg transition-all duration-300 group-hover:shadow-[0_0_25px_rgba(201,168,76,0.4)]" />
                <div className="relative px-6 py-3 flex items-center justify-center gap-2">
                  <Plus className="w-5 h-5 text-[#0a0a0f]" strokeWidth={2.5} />
                  <span className="text-base font-bold text-[#0a0a0f] tracking-wide">Add to Army</span>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: rgba(42, 42, 53, 0.3); border-radius: 2px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(201, 168, 76, 0.3); border-radius: 2px; }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: rgba(201, 168, 76, 0.5); }
      `}</style>
    </div>
  );
}
