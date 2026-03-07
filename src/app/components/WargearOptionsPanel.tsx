import { useState } from "react";
import { ChevronDown, ChevronUp, Wrench, ArrowRightLeft, PlusCircle } from "lucide-react";

interface WargearGroup {
  description: string;
  type: "replace" | "equip" | "standalone";
  choices: string[];
}

/**
 * Parses the flat wargear_options array from Wahapedia into structured groups.
 *
 * The data format is:
 * - A long line like "This model's X can be replaced with one of the following: 1 A 1 B 1 C" is a group header
 * - Short lines following it that start with "1 " are individual choices
 * - A standalone line like "This model can be equipped with 1 X." has no sub-choices
 */
function parseWargearOptions(options: string[]): WargearGroup[] {
  const groups: WargearGroup[] = [];
  let currentGroup: WargearGroup | null = null;

  for (const line of options) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Detect if this is a group header (contains "can be replaced" or "can be equipped" with "one of the following" or list patterns)
    const isReplace = trimmed.toLowerCase().includes("can be replaced");
    const isEquip = trimmed.toLowerCase().includes("can be equipped");
    const hasFollowing = trimmed.toLowerCase().includes("one of the following");
    const isHeader = (isReplace || isEquip) && (hasFollowing || trimmed.includes(":"));

    // Detect if this is a short choice line (starts with a digit)
    const isChoice = /^\d+\s/.test(trimmed) && trimmed.length < 80;

    if (isHeader) {
      // Start a new group
      currentGroup = {
        description: trimmed,
        type: isReplace ? "replace" : "equip",
        choices: [],
      };
      groups.push(currentGroup);
    } else if (isChoice && currentGroup) {
      // Add choice to current group
      currentGroup.choices.push(trimmed);
    } else if ((isReplace || isEquip) && !hasFollowing) {
      // Standalone option (no sub-choices expected)
      groups.push({
        description: trimmed,
        type: "standalone",
        choices: [],
      });
      currentGroup = null;
    } else if (isChoice && !currentGroup) {
      // Orphan choice without a group header — treat as standalone
      groups.push({
        description: trimmed,
        type: "standalone",
        choices: [],
      });
    } else {
      // Anything else — treat as standalone
      groups.push({
        description: trimmed,
        type: "standalone",
        choices: [],
      });
      currentGroup = null;
    }
  }

  return groups;
}

interface WargearOptionsPanelProps {
  options: string[];
  /** If true, renders as selectable checkboxes for roster building */
  selectable?: boolean;
  selectedOptions?: string[];
  onToggleOption?: (option: string) => void;
}

export default function WargearOptionsPanel({
  options,
  selectable = false,
  selectedOptions = [],
  onToggleOption,
}: WargearOptionsPanelProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const groups = parseWargearOptions(options);

  if (groups.length === 0) return null;

  const toggleGroup = (idx: number) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-stone-300 uppercase tracking-wider mb-3 flex items-center gap-2">
        <Wrench className="w-4 h-4 text-orange-500" />
        Wargear Options
        <span className="text-stone-600 text-xs font-normal normal-case ml-auto">
          {groups.length} {groups.length === 1 ? 'option' : 'options'}
        </span>
      </h2>

      <div className="space-y-2">
        {groups.map((group, idx) => {
          const isExpanded = expandedGroups.has(idx);
          const hasChoices = group.choices.length > 0;
          const TypeIcon = group.type === "replace" ? ArrowRightLeft : PlusCircle;

          return (
            <div
              key={idx}
              className="relative overflow-hidden rounded-lg border border-orange-500/20 bg-gradient-to-br from-stone-900 to-stone-950"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent" />

              {/* Group Header */}
              <button
                onClick={() => hasChoices && toggleGroup(idx)}
                className={`relative w-full text-left p-3 flex items-start gap-2.5 ${
                  hasChoices ? "cursor-pointer hover:bg-orange-500/5" : "cursor-default"
                } transition-colors`}
              >
                <TypeIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                  group.type === "replace" ? "text-orange-400" :
                  group.type === "equip" ? "text-sky-400" : "text-stone-500"
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-stone-300 leading-relaxed">
                    {group.description}
                  </p>
                  {hasChoices && !isExpanded && (
                    <p className="text-[10px] text-stone-600 mt-1">
                      {group.choices.length} {group.choices.length === 1 ? 'choice' : 'choices'} available
                    </p>
                  )}
                </div>
                {hasChoices && (
                  <div className="flex-shrink-0 mt-0.5">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-orange-500/50" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-orange-500/50" />
                    )}
                  </div>
                )}
              </button>

              {/* Expanded Choices */}
              {hasChoices && isExpanded && (
                <div className="relative border-t border-orange-500/10 px-3 pb-3 pt-2">
                  <div className="space-y-1">
                    {group.choices.map((choice, cidx) => {
                      const isSelected = selectedOptions.includes(choice);

                      if (selectable && onToggleOption) {
                        return (
                          <button
                            key={cidx}
                            onClick={() => onToggleOption(choice)}
                            className={`w-full text-left px-3 py-2 rounded-md border transition-all flex items-center gap-2.5 ${
                              isSelected
                                ? "border-emerald-500/50 bg-emerald-950/30"
                                : "border-stone-800 bg-stone-950/50 hover:border-orange-500/30 hover:bg-stone-900"
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                isSelected
                                  ? "border-emerald-500 bg-emerald-500"
                                  : "border-stone-600"
                              }`}
                            >
                              {isSelected && (
                                <svg className="w-2.5 h-2.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <span className={`text-xs ${isSelected ? "text-emerald-300" : "text-stone-400"}`}>
                              {choice}
                            </span>
                          </button>
                        );
                      }

                      return (
                        <div
                          key={cidx}
                          className="px-3 py-1.5 rounded-md bg-stone-950/50 border border-stone-800/50"
                        >
                          <span className="text-xs text-stone-400">• {choice}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface WargearAbilitiesPanelProps {
  abilities: (string | [string, string])[];
}

export function WargearAbilitiesPanel({ abilities }: WargearAbilitiesPanelProps) {
  if (abilities.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-stone-300 uppercase tracking-wider mb-3 flex items-center gap-2">
        <Wrench className="w-4 h-4 text-cyan-500" />
        Wargear Abilities
      </h2>
      <div className="space-y-2">
        {abilities.map((wa, idx) => {
          const isNamed = Array.isArray(wa);
          const name = isNamed ? wa[0] : null;
          const text = isNamed ? wa[1] : wa;

          return (
            <div
              key={idx}
              className="relative overflow-hidden rounded-lg border border-cyan-500/20 bg-gradient-to-br from-stone-900 to-stone-950 p-3"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent" />
              <div className="relative">
                {name && (
                  <h4 className="text-xs font-bold text-cyan-400 mb-1 uppercase tracking-wide">
                    {name}
                  </h4>
                )}
                <p className="text-xs text-stone-400 leading-relaxed">
                  {text}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { parseWargearOptions };
export type { WargearGroup };
