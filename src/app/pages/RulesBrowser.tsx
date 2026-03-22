import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Search, BookOpen, ChevronDown, ChevronRight, Shield } from "lucide-react";
import { CORE_RULES, CRUSADE_RULES } from '../../data/general';
import { getRulesForFaction } from '../../data';
import { useCrusade } from '../../lib/CrusadeContext';
import { getFactionName, getDataFactionId } from '../../lib/factions';
import type { RulesSection, FactionId } from '../../types';

/** Strip leading "N. " numbering from section names (e.g. "1. Command" -> "Command") */
function stripSectionNumber(name: string): string {
  return name.replace(/^\d+\.\s+/, '');
}

// Build rule items from a rules document's sections
function buildRuleItems(sections: RulesSection[], category: string) {
  return sections.map((section, idx) => ({
    id: `${category}-${idx}`,
    title: stripSectionNumber(section.name),
    subtitle: section.subsections.length > 0 ? `${section.subsections.length} subsections` : undefined,
    category,
  }));
}

export default function RulesBrowser() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const { currentPlayer } = useCrusade();

  // Build rules from real data
  const coreRuleItems = CORE_RULES ? buildRuleItems(CORE_RULES.sections, "core") : [];
  const crusadeRuleItems = CRUSADE_RULES ? buildRuleItems(CRUSADE_RULES.sections, "crusade") : [];

  // Build faction rules if the player has an active campaign
  const factionRulesData = currentPlayer ? getRulesForFaction(getDataFactionId(currentPlayer.faction_id)) : undefined;
  const factionRuleItems: { id: string; title: string; subtitle?: string; category: string }[] = [];
  if (factionRulesData) {
    // Army rules as a single entry
    if (factionRulesData.army_rules.length > 0) {
      factionRuleItems.push({
        id: 'faction-army-rules',
        title: 'Army Rules',
        subtitle: `${factionRulesData.army_rules.length} rules`,
        category: 'faction',
      });
    }
    // Each detachment as an entry
    factionRulesData.detachments.forEach((det, idx) => {
      factionRuleItems.push({
        id: `faction-det-${idx}`,
        title: det.name,
        subtitle: 'Detachment',
        category: 'faction',
      });
    });
    // Crusade rules if present
    if (factionRulesData.crusade_rules && factionRulesData.crusade_rules.length > 0) {
      factionRuleItems.push({
        id: 'faction-crusade',
        title: 'Faction Crusade Rules',
        subtitle: `${factionRulesData.crusade_rules.length} sections`,
        category: 'faction',
      });
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  // Filter rules based on search
  const filterRules = (rules: { id: string; title: string; subtitle?: string; category: string }[]) => {
    if (!searchQuery.trim()) return rules;
    return rules.filter((rule) =>
      rule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filteredCoreRules = filterRules(coreRuleItems);
  const filteredCrusadeRules = filterRules(crusadeRuleItems);
  const filteredFactionRules = filterRules(factionRuleItems);

  const handleRuleClick = (ruleId: string) => {
    navigate(`/rule/${ruleId}`);
  };

  const factionName = currentPlayer ? getFactionName(currentPlayer.faction_id) : null;

  return (
    <div className="min-h-screen bg-black flex flex-col p-6 relative overflow-hidden pb-8">
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
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-3">
            <div className="relative">
              <BookOpen className="w-12 h-12 text-emerald-500/80" strokeWidth={1.5} />
              <div className="absolute inset-0 blur-md">
                <BookOpen className="w-12 h-12 text-emerald-500/40" strokeWidth={1.5} />
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-stone-100 mb-2 tracking-wider drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">
            Rules Browser
          </h1>
          <p className="text-stone-400 text-sm">
            Quick reference for all game rules
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rules..."
              className="w-full bg-stone-900 border border-stone-600 rounded-lg pl-11 pr-4 py-3 text-stone-100 placeholder:text-stone-500 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>
        </div>

        {/* Rules Sections */}
        <div className="space-y-4">
          {/* Core Rules Section */}
          <div className="relative overflow-hidden rounded-xl border border-stone-700/60 bg-stone-900">
            <button
              onClick={() => toggleSection("core")}
              className="w-full p-4 flex items-center justify-between hover:bg-emerald-500/5 transition-all"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-emerald-500" strokeWidth={2} />
                <div className="text-left">
                  <h2 className="text-base font-semibold text-stone-100">
                    Core Rules
                  </h2>
                  <p className="text-xs text-stone-500">
                    {filteredCoreRules.length} sections
                  </p>
                </div>
              </div>
              {expandedSections.includes("core") ? (
                <ChevronDown className="w-5 h-5 text-emerald-500" />
              ) : (
                <ChevronRight className="w-5 h-5 text-emerald-500" />
              )}
            </button>

            {expandedSections.includes("core") && (
              <div className="border-t border-emerald-500/10">
                {filteredCoreRules.map((rule, idx) => (
                  <button
                    key={rule.id}
                    onClick={() => handleRuleClick(rule.id)}
                    className={`w-full p-3 text-left hover:bg-emerald-500/5 transition-all ${
                      idx !== filteredCoreRules.length - 1 ? "border-b border-emerald-500/10" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-stone-200">
                        {rule.title}
                      </span>
                      <ChevronRight className="w-4 h-4 text-stone-500" />
                    </div>
                  </button>
                ))}
                {filteredCoreRules.length === 0 && (
                  <div className="p-4 text-center text-sm text-stone-400">
                    No rules found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Crusade Rules Section */}
          <div className="relative overflow-hidden rounded-xl border border-stone-700/60 bg-stone-900">
            <button
              onClick={() => toggleSection("crusade")}
              className="w-full p-4 flex items-center justify-between hover:bg-emerald-500/5 transition-all"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-amber-500" strokeWidth={2} />
                <div className="text-left">
                  <h2 className="text-base font-semibold text-stone-100">
                    Crusade Rules
                  </h2>
                  <p className="text-xs text-stone-500">
                    {filteredCrusadeRules.length} sections
                  </p>
                </div>
              </div>
              {expandedSections.includes("crusade") ? (
                <ChevronDown className="w-5 h-5 text-amber-500" />
              ) : (
                <ChevronRight className="w-5 h-5 text-amber-500" />
              )}
            </button>

            {expandedSections.includes("crusade") && (
              <div className="border-t border-emerald-500/10">
                {filteredCrusadeRules.map((rule, idx) => (
                  <button
                    key={rule.id}
                    onClick={() => handleRuleClick(rule.id)}
                    className={`w-full p-3 text-left hover:bg-emerald-500/5 transition-all ${
                      idx !== filteredCrusadeRules.length - 1 ? "border-b border-emerald-500/10" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-stone-200">
                        {rule.title}
                      </span>
                      <ChevronRight className="w-4 h-4 text-stone-500" />
                    </div>
                  </button>
                ))}
                {filteredCrusadeRules.length === 0 && (
                  <div className="p-4 text-center text-sm text-stone-400">
                    No rules found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Faction Rules Section */}
          {factionRuleItems.length > 0 && (
            <div className="relative overflow-hidden rounded-xl border border-stone-700/60 bg-stone-900">
              <button
                onClick={() => toggleSection("faction")}
                className="w-full p-4 flex items-center justify-between hover:bg-emerald-500/5 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-blue-500" strokeWidth={2} />
                  <div className="text-left">
                    <h2 className="text-base font-semibold text-stone-100">
                      Your Faction Rules
                    </h2>
                    <p className="text-xs text-stone-500">
                      {factionName} — {filteredFactionRules.length} sections
                    </p>
                  </div>
                </div>
                {expandedSections.includes("faction") ? (
                  <ChevronDown className="w-5 h-5 text-blue-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-blue-500" />
                )}
              </button>

              {expandedSections.includes("faction") && (
                <div className="border-t border-emerald-500/10">
                  {filteredFactionRules.map((rule, idx) => (
                    <button
                      key={rule.id}
                      onClick={() => handleRuleClick(rule.id)}
                      className={`w-full p-3 text-left hover:bg-emerald-500/5 transition-all ${
                        idx !== filteredFactionRules.length - 1 ? "border-b border-emerald-500/10" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="text-sm text-stone-200 font-medium mb-0.5">
                            {rule.title}
                          </div>
                          {rule.subtitle && (
                            <div className="text-xs text-stone-500">
                              {rule.subtitle}
                            </div>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-stone-500" />
                      </div>
                    </button>
                  ))}
                  {filteredFactionRules.length === 0 && (
                    <div className="p-4 text-center text-sm text-stone-400">
                      No rules found
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Empty state when all filtered out */}
        {filteredCoreRules.length === 0 &&
          filteredCrusadeRules.length === 0 &&
          filteredFactionRules.length === 0 &&
          searchQuery.trim() && (
            <div className="text-center py-12 mt-6">
              <BookOpen className="w-16 h-16 text-emerald-500/30 mx-auto mb-4" strokeWidth={1} />
              <p className="text-stone-400 text-sm">
                No rules found matching "{searchQuery}"
              </p>
            </div>
          )}
      </div>
    </div>
  );
}
