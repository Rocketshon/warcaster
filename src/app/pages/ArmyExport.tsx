import { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Copy, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useArmy } from '../../lib/ArmyContext';
import { FACTIONS, getDataFactionId } from '../../lib/factions';
import { getUnitsForFaction } from '../../data';
import type { FactionId, Datasheet } from '../../types';

// Role keywords in display order
const ROLE_ORDER = [
  'CHARACTER',
  'EPIC HERO',
  'BATTLELINE',
  'DEDICATED TRANSPORT',
  'FAST ATTACK',
  'HEAVY SUPPORT',
  'ELITES',
  'LORD OF WAR',
  'FORTIFICATION',
] as const;

// Map a unit's keywords to a role category
function classifyRole(keywords: string[]): string {
  const upper = keywords.map(k => k.toUpperCase());
  for (const role of ROLE_ORDER) {
    if (upper.includes(role)) return role;
  }
  return 'OTHER';
}

// Friendly display name for role
function roleName(role: string): string {
  switch (role) {
    case 'CHARACTER': return 'HQ';
    case 'EPIC HERO': return 'Epic Heroes';
    case 'BATTLELINE': return 'Troops';
    case 'DEDICATED TRANSPORT': return 'Dedicated Transports';
    case 'FAST ATTACK': return 'Fast Attack';
    case 'HEAVY SUPPORT': return 'Heavy Support';
    case 'ELITES': return 'Elites';
    case 'LORD OF WAR': return 'Lord of War';
    case 'FORTIFICATION': return 'Fortifications';
    default: return 'Other';
  }
}

export default function ArmyExport() {
  const navigate = useNavigate();
  const { mode, factionId, detachmentName, pointsCap, supplyLimit, army } = useArmy();
  const textRef = useRef<HTMLPreElement>(null);

  const factionMeta = factionId ? FACTIONS.find(f => f.id === factionId) : null;
  const cap = mode === 'crusade' ? supplyLimit : pointsCap;
  const totalPoints = army.reduce((sum, u) => sum + u.points_cost, 0);

  // Look up datasheets for keyword / weapon info
  const datasheetMap = useMemo(() => {
    if (!factionId) return new Map<string, Datasheet>();
    const units = getUnitsForFaction(getDataFactionId(factionId as FactionId));
    const map = new Map<string, Datasheet>();
    for (const u of units) map.set(u.name, u);
    return map;
  }, [factionId]);

  // Group army units by role
  const groupedUnits = useMemo(() => {
    const groups = new Map<string, typeof army>();
    for (const unit of army) {
      const ds = datasheetMap.get(unit.datasheet_name);
      const role = ds ? classifyRole(ds.keywords) : 'OTHER';
      if (!groups.has(role)) groups.set(role, []);
      groups.get(role)!.push(unit);
    }
    return groups;
  }, [army, datasheetMap]);

  // Generate the text export
  const exportText = useMemo(() => {
    const lines: string[] = [];
    const armyName = factionMeta?.name ?? factionId ?? 'Unknown';
    const modeLabel = mode === 'crusade' ? 'Crusade' : 'Standard';

    lines.push(`++ Army: ${armyName} ${totalPoints}/${cap}pts ++`);
    lines.push(`++ Faction: ${factionMeta?.name ?? factionId ?? 'Unknown'} ++`);
    if (detachmentName) {
      lines.push(`++ Detachment: ${detachmentName} ++`);
    }
    lines.push(`++ Mode: ${modeLabel} ++`);
    lines.push('');

    // Output each role group in order
    const roleKeys = [...ROLE_ORDER, 'OTHER'];
    for (const role of roleKeys) {
      const units = groupedUnits.get(role);
      if (!units || units.length === 0) continue;

      lines.push(`= ${roleName(role)} =`);
      for (const unit of units) {
        const ds = datasheetMap.get(unit.datasheet_name);
        lines.push(`- ${unit.custom_name} ${unit.points_cost}pts`);

        // List weapons
        if (ds) {
          const weaponNames = [
            ...ds.ranged_weapons.map(w => w.name),
            ...ds.melee_weapons.map(w => w.name),
          ];
          if (weaponNames.length > 0) {
            lines.push(`  - ${weaponNames.join(', ')}`);
          }
        }
      }
      lines.push('');
    }

    lines.push(`++ Total: ${totalPoints}pts / ${cap}pts ++`);
    return lines.join('\n');
  }, [army, groupedUnits, datasheetMap, factionMeta, factionId, detachmentName, mode, totalPoints, cap]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportText);
      toast.success('Copied to clipboard!');
    } catch {
      // Fallback: select text
      if (textRef.current) {
        const range = document.createRange();
        range.selectNodeContents(textRef.current);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
      toast.info('Text selected — press Ctrl+C to copy');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${factionMeta?.name ?? 'Army'} List`,
          text: exportText,
        });
      } catch {
        // User cancelled or share failed — fall back to copy
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="min-h-screen bg-[#faf6f0] px-4 pt-6 pb-24">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[#8b7355] hover:text-[#b8860b] transition-colors mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm">Back</span>
      </button>

      {/* Header */}
      <h1 className="font-serif text-xl font-bold text-[#2c2416] mb-4">Export Army List</h1>

      {/* Action buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#b8860b] text-[#faf6f0] font-semibold rounded-lg hover:bg-[#9a7209] transition-colors"
        >
          <Copy className="w-4 h-4" />
          Copy to Clipboard
        </button>
        <button
          onClick={handleShare}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-[#f5efe6] border border-[#d4c5a9] text-[#2c2416] font-semibold rounded-lg hover:border-[#b8860b] transition-colors"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
      </div>

      {/* Export text preview */}
      <div className="bg-[#f5efe6] border border-[#d4c5a9] rounded-lg p-4 overflow-x-auto">
        <pre
          ref={textRef}
          className="text-xs text-[#2c2416] font-mono whitespace-pre-wrap leading-relaxed"
        >
          {exportText}
        </pre>
      </div>
    </div>
  );
}
