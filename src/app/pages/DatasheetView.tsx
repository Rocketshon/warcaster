import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, Plus, Shield, Zap } from "lucide-react";
import { getUnitsForFaction } from '../../data';
import { getFaction, getDataFactionId } from '../../lib/factions';
import { useArmy } from '../../lib/ArmyContext';
import { toTitleCase, FormattedRuleText } from '../../lib/formatText';
import type { FactionId, Datasheet } from '../../types';
import WeaponStatTable from '../components/WeaponStatTable';

export default function DatasheetView() {
  const { factionId, datasheetName } = useParams<{ factionId: string; datasheetName: string }>();
  const navigate = useNavigate();
  const [showAddSuccess, setShowAddSuccess] = useState(false);
  const { addUnit, mode } = useArmy();

  const units = factionId ? getUnitsForFaction(getDataFactionId(factionId as FactionId)) : [];
  const datasheet: Datasheet | undefined = datasheetName
    ? units.find((u) => u.name === decodeURIComponent(datasheetName))
    : undefined;
  const factionMeta = factionId ? getFaction(factionId as FactionId) : undefined;

  if (!datasheet) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col p-6 relative overflow-hidden">
        <div className="relative z-10 w-full max-w-md mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#8a8690] hover:text-[#c9a84c] transition-colors mb-6">
            <ArrowLeft className="w-5 h-5" /><span className="text-sm">Back</span>
          </button>
          <div className="text-center"><h1 className="text-xl font-bold text-[#8a8690] mb-2">Datasheet Not Found</h1></div>
        </div>
      </div>
    );
  }

  const handleAddToArmy = () => {
    if (!mode) { toast.error("Start building an army first"); return; }
    if (datasheet) {
      const pointsCost = datasheet.points.length > 0 ? parseInt(datasheet.points[0].cost, 10) || 0 : 0;
      const role = datasheet.keywords.length > 0 ? datasheet.keywords[0] : '';
      addUnit(datasheet.name, pointsCost, role);
      setShowAddSuccess(true);
      toast.success(`${datasheet.name} added to army (${pointsCost} pts)`);
      setTimeout(() => setShowAddSuccess(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col p-6 relative overflow-hidden pb-24">
      <div className="relative z-10 w-full max-w-2xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#8a8690] hover:text-[#c9a84c] transition-colors mb-6">
          <ArrowLeft className="w-5 h-5" /><span className="text-sm">Back to Codex</span>
        </button>

        {/* Unit Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#e8e4de] tracking-wider mb-2">{datasheet.name}</h1>
          <p className="text-[#c9a84c] text-sm mb-3">{datasheet.faction}</p>

          {/* Points Costs */}
          {datasheet.points.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {datasheet.points.map((tier, idx) => (
                <div key={idx} className="px-3 py-1.5 rounded-lg border border-[#2a2a35] bg-[#1a1a24]">
                  <span className="text-[#8a8690] text-xs">{tier.models} models:</span>
                  <span className="text-[#c9a84c] text-sm font-bold ml-2 font-mono">{tier.cost} pts</span>
                </div>
              ))}
            </div>
          )}

          {/* Stats - gold header row */}
          {datasheet.stats && Object.keys(datasheet.stats).length > 0 && (
            <div className="rounded-lg border border-[#c9a84c]/30 overflow-hidden mb-2">
              <div className="grid gap-px bg-[#c9a84c]/20" style={{ gridTemplateColumns: `repeat(${Object.keys(datasheet.stats).length}, 1fr)` }}>
                {Object.entries(datasheet.stats).map(([stat, value]) => (
                  <div key={stat} className="bg-[#1a1a24]">
                    <div className="text-center px-2 py-1 bg-[#c9a84c]/10 border-b border-[#c9a84c]/20">
                      <div className="text-[10px] text-[#c9a84c] font-semibold uppercase">{stat}</div>
                    </div>
                    <div className="text-center px-2 py-2">
                      <div className="text-lg font-bold text-[#e8e4de]">{value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invulnerable Save */}
          {datasheet.invuln && (
            <div className="flex items-center gap-2 mt-2">
              <Shield className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-[#8a8690]">Invulnerable Save:</span>
              <span className="text-base font-bold text-blue-400">{datasheet.invuln}</span>
            </div>
          )}
        </div>

        {datasheet.ranged_weapons.length > 0 && <div className="mb-6"><WeaponStatTable weapons={datasheet.ranged_weapons} type="ranged" /></div>}
        {datasheet.melee_weapons.length > 0 && <div className="mb-6"><WeaponStatTable weapons={datasheet.melee_weapons} type="melee" /></div>}

        {/* Abilities */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-[#e8e4de] mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />Abilities
          </h2>

          {datasheet.abilities.core.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-[#8a8690] mb-2 uppercase tracking-wider">Core</h3>
              <div className="flex flex-wrap gap-2">
                {datasheet.abilities.core.map((ability: string, idx: number) => (
                  <span key={idx} className="px-3 py-1 rounded-full border border-[#c9a84c]/30 bg-[#c9a84c]/10 text-[#c9a84c] text-xs font-semibold">{ability}</span>
                ))}
              </div>
            </div>
          )}

          {datasheet.abilities.faction.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-[#8a8690] mb-2 uppercase tracking-wider">Faction</h3>
              <div className="flex flex-wrap gap-2">
                {datasheet.abilities.faction.map((factionAbility: string, idx: number) => (
                  <span key={idx} className="px-3 py-1 rounded-full border border-[#2a2a35] bg-[#1a1a24] text-[#c9a84c] text-xs font-semibold">{factionAbility}</span>
                ))}
              </div>
            </div>
          )}

          {datasheet.abilities.other.map((ability: [string, string], idx: number) => (
            <div key={idx} className="mb-3 rounded-lg border border-[#2a2a35] bg-[#1a1a24] p-4">
              <h3 className="text-sm font-bold text-[#c9a84c] mb-2">{ability[0]}</h3>
              <FormattedRuleText text={ability[1]} className="text-xs" />
            </div>
          ))}
        </div>

        {datasheet.unit_composition && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-[#e8e4de] mb-3">Unit Composition</h2>
            <div className="rounded-lg border border-[#2a2a35] bg-[#1a1a24] p-4">
              <p className="text-sm text-[#a09ca6] whitespace-pre-line">{datasheet.unit_composition}</p>
            </div>
          </div>
        )}

        {datasheet.wargear_options.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-[#e8e4de] mb-3">Wargear Options</h2>
            <div className="rounded-lg border border-[#2a2a35] bg-[#1a1a24] p-4">
              <ul className="list-disc list-inside space-y-1 text-sm text-[#a09ca6]">
                {datasheet.wargear_options.map((opt: string, idx: number) => <li key={idx}>{opt}</li>)}
              </ul>
            </div>
          </div>
        )}

        {datasheet.wargear_abilities.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-[#e8e4de] mb-3">Wargear Abilities</h2>
            <div className="space-y-2">
              {datasheet.wargear_abilities.map((ability, idx: number) => {
                if (typeof ability === 'string') return <p key={idx} className="text-xs text-[#a09ca6]">{ability}</p>;
                return (
                  <div key={idx} className="rounded-lg border border-[#2a2a35] bg-[#1a1a24] p-3">
                    <h3 className="text-sm font-bold text-[#c9a84c] mb-1">{ability[0]}</h3>
                    <p className="text-xs text-[#a09ca6]">{ability[1]}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {datasheet.damaged && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-[#e8e4de] mb-3">Damaged Profile</h2>
            <div className="rounded-lg border border-[#2a2a35] bg-[#1a1a24] p-4">
              <FormattedRuleText text={datasheet.damaged} className="text-sm text-amber-400" />
            </div>
          </div>
        )}

        {/* Keywords */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-[#e8e4de] mb-3">Keywords</h2>
          <div className="flex flex-wrap gap-2">
            {datasheet.keywords.map((keyword: string, idx: number) => (
              <span key={idx} className="px-3 py-1.5 rounded-lg border border-[#2a2a35] bg-[#1a1a24] text-[#a09ca6] text-xs font-semibold">{toTitleCase(keyword)}</span>
            ))}
          </div>
          {datasheet.faction_keywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {datasheet.faction_keywords.map((keyword: string, idx: number) => (
                <span key={idx} className="px-3 py-1.5 rounded-lg border border-[#c9a84c]/20 bg-[#c9a84c]/5 text-[#c9a84c] text-xs font-semibold">{toTitleCase(keyword)}</span>
              ))}
            </div>
          )}
        </div>

        {datasheet.leader && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-[#e8e4de] mb-3">Leader</h2>
            <div className="rounded-lg border border-[#2a2a35] bg-[#1a1a24] p-4">
              <FormattedRuleText text={datasheet.leader} className="text-sm text-purple-400" />
            </div>
          </div>
        )}
      </div>

      {/* Add to Army Button */}
      <div className="relative z-10 w-full max-w-2xl mx-auto mt-6">
        <button
          onClick={handleAddToArmy}
          disabled={showAddSuccess || !mode}
          className={`w-full py-4 rounded-lg font-bold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            showAddSuccess
              ? "bg-[#c9a84c] text-[#0a0a0f]"
              : "bg-gradient-to-r from-[#c9a84c] to-[#d4a017] text-[#0a0a0f] hover:from-[#d4a017] hover:to-[#c9a84c]"
          }`}
        >
          {showAddSuccess ? (
            <span className="flex items-center justify-center gap-2">Added to Army</span>
          ) : (
            <span className="flex items-center justify-center gap-2"><Plus className="w-5 h-5" />Add to Army</span>
          )}
        </button>
      </div>
    </div>
  );
}
