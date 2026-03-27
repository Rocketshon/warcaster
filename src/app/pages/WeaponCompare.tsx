import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { useArmy } from '../../lib/ArmyContext';
import { getUnitsForFaction } from '../../data';
import { getDataFactionId } from '../../lib/factions';
import type { FactionId, WeaponProfile, Datasheet } from '../../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface WeaponOption {
  unitName: string;
  weapon: WeaponProfile;
  type: 'ranged' | 'melee';
}

/** Parse a stat value for numeric comparison. Handles dice notation, "N+", "Melee", "N\"", etc. */
function parseStatValue(stat: string): number | null {
  if (!stat || stat === '-' || stat === 'N/A') return null;
  // "Melee" range
  if (stat.toLowerCase() === 'melee') return 0;
  // Remove trailing quote (range like 24")
  const cleaned = stat.replace(/"/g, '').replace(/\+/g, '');
  // Dice notation: "D6", "2D6", "D3+3"
  const diceMatch = cleaned.match(/^(\d*)D(\d+)(?:\+(\d+))?$/i);
  if (diceMatch) {
    const count = parseInt(diceMatch[1] || '1', 10);
    const sides = parseInt(diceMatch[2], 10);
    const bonus = parseInt(diceMatch[3] || '0', 10);
    return count * ((sides + 1) / 2) + bonus; // average
  }
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

type CompareResult = 'better' | 'worse' | 'equal' | 'unknown';

/** Compare two stat values. "better" means slot 1 wins. For BS/WS and AP, lower is better. */
function compareStat(key: string, val1: string, val2: string): CompareResult {
  const n1 = parseStatValue(val1);
  const n2 = parseStatValue(val2);
  if (n1 === null || n2 === null) return 'unknown';
  if (n1 === n2) return 'equal';
  // For BS/WS (skill): lower is better (e.g. 2+ beats 4+)
  // For AP: more negative is better (AP -2 > AP -1), but stored as "-2", so lower numeric is better
  const lowerIsBetter = key === 'skill' || key === 'AP';
  if (lowerIsBetter) {
    return n1 < n2 ? 'better' : 'worse';
  }
  // For Range, A, S, D: higher is better
  return n1 > n2 ? 'better' : 'worse';
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function WeaponPicker({
  label,
  weapons,
  selected,
  onSelect,
}: {
  label: string;
  weapons: WeaponOption[];
  selected: WeaponOption | null;
  onSelect: (w: WeaponOption) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-[#8b7355] uppercase tracking-wider mb-1">{label}</p>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-1 px-3 py-2 bg-[#f5efe6] border border-[#d4c5a9] rounded-lg
                   text-left text-sm text-[#2c2416] hover:border-[#b8860b] transition-colors truncate"
      >
        <span className="truncate">
          {selected ? selected.weapon.name : 'Select Weapon'}
        </span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-[#8b7355] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="mt-1 max-h-64 overflow-y-auto bg-[#faf6f0] border border-[#d4c5a9] rounded-lg shadow-lg z-10 relative">
          {weapons.length === 0 && (
            <p className="px-3 py-2 text-xs text-[#8b7355]">No weapons available</p>
          )}
          {weapons.map((w, i) => (
            <button
              key={`${w.unitName}-${w.weapon.name}-${w.type}-${i}`}
              onClick={() => { onSelect(w); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-[#e8dfd3] transition-colors border-b border-[#d4c5a9]/50 last:border-b-0
                ${selected?.weapon.name === w.weapon.name && selected?.unitName === w.unitName ? 'bg-[#e8dfd3] font-semibold' : ''}`}
            >
              <span className="text-[#2c2416]">{w.weapon.name}</span>
              <span className="ml-2 text-xs text-[#8b7355]">({w.unitName})</span>
              <span className={`ml-1 text-xs ${w.type === 'ranged' ? 'text-blue-700' : 'text-red-700'}`}>
                {w.type === 'ranged' ? 'Ranged' : 'Melee'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const STAT_ROWS: { key: keyof WeaponProfile; label: string }[] = [
  { key: 'range', label: 'Range' },
  { key: 'A', label: 'A (Attacks)' },
  { key: 'skill', label: 'BS/WS' },
  { key: 'S', label: 'S (Strength)' },
  { key: 'AP', label: 'AP' },
  { key: 'D', label: 'D (Damage)' },
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function WeaponCompare() {
  const navigate = useNavigate();
  const { factionId, army } = useArmy();
  const [weapon1, setWeapon1] = useState<WeaponOption | null>(null);
  const [weapon2, setWeapon2] = useState<WeaponOption | null>(null);

  // Build weapon list from army units
  const allWeapons = useMemo(() => {
    if (!factionId) return [];
    const dataFactionId = getDataFactionId(factionId as FactionId);
    const factionUnits = getUnitsForFaction(dataFactionId);
    const datasheetMap = new Map<string, Datasheet>();
    for (const u of factionUnits) datasheetMap.set(u.name, u);

    const weapons: WeaponOption[] = [];
    const seen = new Set<string>();

    for (const unit of army) {
      const ds = datasheetMap.get(unit.datasheet_name);
      if (!ds) continue;
      for (const w of ds.ranged_weapons) {
        const key = `${unit.datasheet_name}::ranged::${w.name}`;
        if (seen.has(key)) continue;
        seen.add(key);
        weapons.push({ unitName: unit.datasheet_name, weapon: w, type: 'ranged' });
      }
      for (const w of ds.melee_weapons) {
        const key = `${unit.datasheet_name}::melee::${w.name}`;
        if (seen.has(key)) continue;
        seen.add(key);
        weapons.push({ unitName: unit.datasheet_name, weapon: w, type: 'melee' });
      }
    }
    return weapons;
  }, [factionId, army]);

  const bothSelected = weapon1 !== null && weapon2 !== null;

  return (
    <div className="min-h-screen bg-[#faf6f0] px-4 pt-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-[#8b7355] hover:text-[#5c4a32] transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-serif text-xl font-bold text-[#2c2416]">Compare Weapons</h1>
      </div>

      {/* Weapon pickers */}
      <div className="flex gap-3 mb-6">
        <WeaponPicker
          label="Weapon 1"
          weapons={allWeapons}
          selected={weapon1}
          onSelect={setWeapon1}
        />
        <WeaponPicker
          label="Weapon 2"
          weapons={allWeapons}
          selected={weapon2}
          onSelect={setWeapon2}
        />
      </div>

      {/* Comparison table */}
      {bothSelected && (
        <div className="border border-[#d4c5a9] rounded-lg overflow-hidden">
          {/* Column headers */}
          <div className="grid grid-cols-3 bg-[#e8dfd3]">
            <div className="px-3 py-2 text-xs font-semibold text-[#8b7355] uppercase">Stat</div>
            <div className="px-3 py-2 text-xs font-semibold text-[#2c2416] truncate text-center">{weapon1.weapon.name}</div>
            <div className="px-3 py-2 text-xs font-semibold text-[#2c2416] truncate text-center">{weapon2.weapon.name}</div>
          </div>

          {/* Stat rows */}
          {STAT_ROWS.map(({ key, label }) => {
            const val1 = String(weapon1.weapon[key] ?? '-');
            const val2 = String(weapon2.weapon[key] ?? '-');
            const result = compareStat(key, val1, val2);

            const bg1 = result === 'better' ? 'bg-[#b8860b]/15' : '';
            const bg2 = result === 'worse' ? 'bg-[#b8860b]/15' : '';
            const fw1 = result === 'better' ? 'font-bold text-[#b8860b]' : 'text-[#2c2416]';
            const fw2 = result === 'worse' ? 'font-bold text-[#b8860b]' : 'text-[#2c2416]';

            return (
              <div key={key} className="grid grid-cols-3 border-t border-[#d4c5a9]/60">
                <div className="px-3 py-2 text-xs font-medium text-[#8b7355]">{label}</div>
                <div className={`px-3 py-2 text-sm text-center ${bg1} ${fw1}`}>{val1}</div>
                <div className={`px-3 py-2 text-sm text-center ${bg2} ${fw2}`}>{val2}</div>
              </div>
            );
          })}

          {/* Traits row */}
          <div className="grid grid-cols-3 border-t border-[#d4c5a9]">
            <div className="px-3 py-2 text-xs font-medium text-[#8b7355]">Traits</div>
            <div className="px-3 py-2">
              <div className="flex flex-wrap gap-1">
                {weapon1.weapon.traits.length > 0 ? weapon1.weapon.traits.map((t, i) => (
                  <span key={i} className="text-xs px-1.5 py-0.5 bg-[#b8860b]/10 text-[#b8860b] rounded">{t}</span>
                )) : <span className="text-xs text-[#8b7355]">None</span>}
              </div>
            </div>
            <div className="px-3 py-2">
              <div className="flex flex-wrap gap-1">
                {weapon2.weapon.traits.length > 0 ? weapon2.weapon.traits.map((t, i) => (
                  <span key={i} className="text-xs px-1.5 py-0.5 bg-[#b8860b]/10 text-[#b8860b] rounded">{t}</span>
                )) : <span className="text-xs text-[#8b7355]">None</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {!bothSelected && (
        <div className="text-center py-12">
          <p className="text-[#8b7355] text-sm">Select two weapons above to compare their profiles side by side.</p>
        </div>
      )}
    </div>
  );
}
