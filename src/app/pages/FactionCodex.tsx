import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, ChevronDown, ChevronRight, Search, Shield, Swords, BookOpen, Award, Zap } from "lucide-react";
import { getUnitsForFaction, getRulesForFaction } from '../../data';
import { getFaction, getDataFactionId } from '../../lib/factions';
import { FormattedRuleText, toTitleCase, getStratagemTypeColor } from '../../lib/formatText';
import type { FactionId, DetachmentData, Datasheet } from '../../types';

// Determine animation type based on faction id
function getAnimationType(factionId: string): string | null {
  if (factionId.includes('blood') || factionId === 'world_eaters') return 'blood';
  if (factionId === 'death_guard') return 'plague';
  if (factionId === 'thousand_sons' || factionId === 'grey_knights' || factionId === 'space_wolves') return 'frost';
  if (factionId === 'necrons') return 'dust';
  return null;
}

// Determine accent color class based on faction color
function getAccentColor(color: string): string {
  const map: Record<string, string> = {
    blue: 'bg-blue-500', cyan: 'bg-cyan-400', slate: 'bg-slate-400',
    red: 'bg-red-500', amber: 'bg-amber-500', orange: 'bg-orange-500',
    green: 'bg-green-600', yellow: 'bg-yellow-600', purple: 'bg-purple-500',
    zinc: 'bg-zinc-400', lime: 'bg-lime-500', rose: 'bg-rose-500',
    stone: 'bg-stone-400', emerald: 'bg-emerald-400', violet: 'bg-violet-400',
    sky: 'bg-sky-500', indigo: 'bg-indigo-400',
  };
  return map[color] ?? 'bg-emerald-500';
}

// Animation component for particle effects
const AnimatedBackground = ({ type }: { type: string }) => {
  if (type === "blood") {
    return (
      <>
        {/* Red blood drip particles */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute pointer-events-none"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${-20 + Math.random() * 20}%`,
              animation: `bloodDrip ${8 + Math.random() * 8}s linear infinite`,
              animationDelay: `${Math.random() * 8}s`,
            }}
          >
            <div className="w-1 h-3 bg-red-500/30 rounded-full blur-sm" />
          </div>
        ))}
      </>
    );
  }

  if (type === "plague") {
    return (
      <>
        {/* Green fog/gas clouds */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute pointer-events-none"
            style={{
              left: `${Math.random() * 100}%`,
              bottom: `${-10 + Math.random() * 20}%`,
              animation: `plagueFog ${15 + Math.random() * 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 10}s`,
            }}
          >
            <div
              className="bg-gradient-to-t from-green-500/20 via-green-400/10 to-transparent rounded-full blur-2xl"
              style={{
                width: `${150 + Math.random() * 150}px`,
                height: `${200 + Math.random() * 200}px`,
              }}
            />
          </div>
        ))}
      </>
    );
  }

  if (type === "frost") {
    return (
      <>
        {/* Blue frost/ice crystals */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute pointer-events-none"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `frostPulse ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 4}s`,
            }}
          >
            <div
              className="bg-blue-400/20 rounded-full blur-md"
              style={{
                width: `${10 + Math.random() * 20}px`,
                height: `${10 + Math.random() * 20}px`,
              }}
            />
          </div>
        ))}
        {/* Frost lines */}
        {[...Array(6)].map((_, i) => (
          <div
            key={`line-${i}`}
            className="absolute pointer-events-none"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: "2px",
              height: `${30 + Math.random() * 50}px`,
              background: "linear-gradient(180deg, rgba(96,165,250,0.3) 0%, transparent 100%)",
              animation: `frostLine ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        ))}
      </>
    );
  }

  if (type === "dust") {
    return (
      <>
        {/* Tan dust/sandstorm particles */}
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute pointer-events-none"
            style={{
              left: `${-10 + Math.random() * 120}%`,
              top: `${Math.random() * 100}%`,
              animation: `dustStorm ${10 + Math.random() * 15}s linear infinite`,
              animationDelay: `${Math.random() * 10}s`,
            }}
          >
            <div
              className="bg-yellow-700/20 rounded-full blur-sm"
              style={{
                width: `${3 + Math.random() * 8}px`,
                height: `${3 + Math.random() * 8}px`,
              }}
            />
          </div>
        ))}
        {/* Dust clouds */}
        {[...Array(5)].map((_, i) => (
          <div
            key={`cloud-${i}`}
            className="absolute pointer-events-none"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `dustCloud ${20 + Math.random() * 15}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 15}s`,
            }}
          >
            <div
              className="bg-gradient-to-r from-transparent via-amber-700/10 to-transparent rounded-full blur-2xl"
              style={{
                width: `${200 + Math.random() * 200}px`,
                height: `${100 + Math.random() * 100}px`,
              }}
            />
          </div>
        ))}
      </>
    );
  }

  return null;
};

export default function FactionCodex() {
  const { factionId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"army" | "detachments" | "datasheets" | "crusade">("army");
  const [expandedDetachments, setExpandedDetachments] = useState<string[]>([]);
  const [expandedEnhancements, setExpandedEnhancements] = useState<string[]>([]);
  const [expandedStratagems, setExpandedStratagems] = useState<string[]>([]);
  const [datasheetSearch, setDatasheetSearch] = useState("");

  // Load real data — use getDataFactionId to map chapters (e.g. space_wolves) to parent data (space_marines)
  const factionMeta = factionId ? getFaction(factionId as FactionId) : undefined;
  const dataFaction = factionId ? getDataFactionId(factionId as FactionId) : (factionId as FactionId);
  const rules = dataFaction ? getRulesForFaction(dataFaction) : undefined;
  const units = dataFaction ? getUnitsForFaction(dataFaction) : [];

  if (!factionMeta) {
    return (
      <div className="min-h-screen bg-black flex flex-col p-6 relative overflow-hidden">
        <div className="relative z-10 w-full max-w-md mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-stone-400 hover:text-emerald-500 transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>

          <div className="text-center">
            <BookOpen className="w-16 h-16 text-stone-500 mx-auto mb-4" strokeWidth={1.5} />
            <h1 className="text-xl font-bold text-stone-400 mb-2">
              Codex Not Found
            </h1>
          </div>
        </div>
      </div>
    );
  }

  const animationType = getAnimationType(factionId!);
  const accentColor = getAccentColor(factionMeta.color);

  // Expand first detachment by default (in useEffect to avoid setState during render)
  useEffect(() => {
    if (expandedDetachments.length === 0 && rules?.detachments && rules.detachments.length > 0) {
      setExpandedDetachments([rules.detachments[0].name]);
    }
  }, [rules?.detachments]);

  const toggleDetachment = (detachmentName: string) => {
    setExpandedDetachments((prev) =>
      prev.includes(detachmentName)
        ? prev.filter((n) => n !== detachmentName)
        : [...prev, detachmentName]
    );
  };

  const toggleEnhancements = (detachmentName: string) => {
    setExpandedEnhancements((prev) =>
      prev.includes(detachmentName)
        ? prev.filter((n) => n !== detachmentName)
        : [...prev, detachmentName]
    );
  };

  const toggleStratagems = (detachmentName: string) => {
    setExpandedStratagems((prev) =>
      prev.includes(detachmentName)
        ? prev.filter((n) => n !== detachmentName)
        : [...prev, detachmentName]
    );
  };

  const handleDatasheetClick = (unit: Datasheet) => {
    navigate(`/datasheet/${factionId}/${encodeURIComponent(unit.name)}`);
  };

  const filteredDatasheets = units.filter((ds) =>
    ds.name.toLowerCase().includes(datasheetSearch.toLowerCase()) ||
    ds.keywords.some((k) => k.toLowerCase().includes(datasheetSearch.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-black flex flex-col p-6 relative overflow-hidden pb-8">
      {/* Animated Background Effects */}
      {animationType && <AnimatedBackground type={animationType} />}


      <div className="relative z-10 w-full max-w-2xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-stone-400 hover:text-emerald-500 transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>

        {/* Faction Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-4xl">{factionMeta.icon}</div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-stone-100 tracking-wider drop-shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                {factionMeta.name}
              </h1>
              <p className="text-stone-400 text-sm">Codex: {rules?.faction ?? factionMeta.name}</p>
            </div>
          </div>
          <div className={`h-1 w-full ${accentColor} rounded-full shadow-[0_0_10px_rgba(239,68,68,0.4)]`} />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab("army")}
            className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
              activeTab === "army"
                ? "bg-gradient-to-r from-red-600 to-red-500 text-black"
                : "border border-stone-700/60 bg-stone-900 text-stone-300 hover:border-emerald-500/50"
            }`}
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Army Rule
            </div>
          </button>
          <button
            onClick={() => setActiveTab("detachments")}
            className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
              activeTab === "detachments"
                ? "bg-gradient-to-r from-red-600 to-red-500 text-black"
                : "border border-stone-700/60 bg-stone-900 text-stone-300 hover:border-emerald-500/50"
            }`}
          >
            <div className="flex items-center gap-2">
              <Swords className="w-4 h-4" />
              Detachments
            </div>
          </button>
          <button
            onClick={() => setActiveTab("datasheets")}
            className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
              activeTab === "datasheets"
                ? "bg-gradient-to-r from-red-600 to-red-500 text-black"
                : "border border-stone-700/60 bg-stone-900 text-stone-300 hover:border-emerald-500/50"
            }`}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Datasheets
            </div>
          </button>
          <button
            onClick={() => setActiveTab("crusade")}
            className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
              activeTab === "crusade"
                ? "bg-gradient-to-r from-red-600 to-red-500 text-black"
                : "border border-stone-700/60 bg-stone-900 text-stone-300 hover:border-emerald-500/50"
            }`}
          >
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              Crusade
            </div>
          </button>
        </div>

        {/* Army Rule Tab */}
        {activeTab === "army" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-stone-700/60 bg-stone-900 p-6">
                <h2 className="text-xl font-bold text-red-400 mb-4">Army Rules</h2>
                {rules?.army_rules && rules.army_rules.length > 0 ? (
                  rules.army_rules.map((rule, idx) => (
                    <div key={idx} className="mb-4 last:mb-0">
                      <FormattedRuleText text={rule} />
                    </div>
                  ))
                ) : (
                  <p className="text-stone-400 italic">No army rules available for this faction.</p>
                )}
            </div>
          </div>
        )}

        {/* Detachments Tab */}
        {activeTab === "detachments" && (
          <div className="space-y-4">
            {rules?.detachments && rules.detachments.length > 0 ? (
              rules.detachments.map((detachment: DetachmentData) => (
                <div
                  key={detachment.name}
                  className="rounded-xl border border-stone-700/60 bg-stone-900"
                >
                  {/* Detachment Header */}
                  <button
                    onClick={() => toggleDetachment(detachment.name)}
                    className="w-full p-4 flex items-center justify-between hover:bg-red-500/5 transition-all"
                  >
                    <h2 className="text-lg font-bold text-stone-100">{detachment.name}</h2>
                    {expandedDetachments.includes(detachment.name) ? (
                      <ChevronDown className="w-5 h-5 text-red-500" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-red-500" />
                    )}
                  </button>

                  {expandedDetachments.includes(detachment.name) && (
                    <div className="border-t border-red-500/10 p-4 space-y-4">
                      {/* Detachment Rule */}
                      <div>
                        <h3 className="text-sm font-semibold text-red-400 mb-2">{detachment.rule.name}</h3>
                        <FormattedRuleText text={detachment.rule.text} />
                      </div>

                      {/* Enhancements */}
                      {detachment.enhancements.length > 0 && (
                        <div>
                          <button
                            onClick={() => toggleEnhancements(detachment.name)}
                            className="flex items-center justify-between w-full mb-2"
                          >
                            <h3 className="text-sm font-semibold text-stone-300 uppercase tracking-wider">
                              Enhancements ({detachment.enhancements.length})
                            </h3>
                            {expandedEnhancements.includes(detachment.name) ? (
                              <ChevronDown className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-emerald-500" />
                            )}
                          </button>
                          {expandedEnhancements.includes(detachment.name) && (
                            <div className="space-y-2">
                              {detachment.enhancements.map((enh, idx) => (
                                <div
                                  key={idx}
                                  className="rounded-xl border border-stone-700/60 bg-stone-900 p-3"
                                >
                                  <div className="flex items-start justify-between gap-3 mb-1">
                                    <h4 className="text-sm font-semibold text-emerald-400">{enh.name}</h4>
                                    <span className="text-xs font-bold text-emerald-500 font-mono">{enh.cost} pts</span>
                                  </div>
                                  <FormattedRuleText text={enh.text} className="text-sm" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Stratagems */}
                      {detachment.stratagems.length > 0 && (
                        <div>
                          <button
                            onClick={() => toggleStratagems(detachment.name)}
                            className="flex items-center justify-between w-full mb-2"
                          >
                            <h3 className="text-sm font-semibold text-stone-300 uppercase tracking-wider">
                              Stratagems ({detachment.stratagems.length})
                            </h3>
                            {expandedStratagems.includes(detachment.name) ? (
                              <ChevronDown className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-emerald-500" />
                            )}
                          </button>
                          {expandedStratagems.includes(detachment.name) && (
                            <div className="space-y-2">
                              {detachment.stratagems.map((strat, idx) => (
                                <div
                                  key={idx}
                                  className="rounded-xl border border-stone-700/60 bg-stone-900 p-3"
                                >
                                  <div className="flex items-start justify-between gap-3 mb-1">
                                    <div className="flex items-center gap-2">
                                      <Zap className="w-3 h-3 text-purple-400" />
                                      <h4 className="text-sm font-semibold text-purple-400">{strat.name}</h4>
                                    </div>
                                    <span className="text-xs font-bold text-purple-500 font-mono">{strat.cp} CP</span>
                                  </div>
                                  <div className="mb-1">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getStratagemTypeColor(strat.type)}`}>{strat.type}</span>
                                  </div>
                                  {strat.when && (
                                    <div className="text-xs text-stone-400 leading-relaxed mb-1">
                                      <span className="font-semibold text-stone-300">When: </span>{strat.when}
                                    </div>
                                  )}
                                  {strat.target && (
                                    <div className="text-xs text-stone-400 leading-relaxed mb-1">
                                      <span className="font-semibold text-stone-300">Target: </span>{strat.target}
                                    </div>
                                  )}
                                  {strat.effect && (
                                    <div className="text-xs text-stone-400 leading-relaxed">
                                      <span className="font-semibold text-stone-300">Effect: </span>{strat.effect}
                                    </div>
                                  )}
                                  {strat.restrictions && (
                                    <div className="text-xs text-amber-400/70 leading-relaxed mt-1">
                                      <span className="font-semibold">Restrictions: </span>{strat.restrictions}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-stone-400 text-sm">
                No detachments available for this faction.
              </div>
            )}
          </div>
        )}

        {/* Datasheets Tab */}
        {activeTab === "datasheets" && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500/50" />
              <input
                type="text"
                value={datasheetSearch}
                onChange={(e) => setDatasheetSearch(e.target.value)}
                placeholder="Search datasheets..."
                className="w-full bg-stone-900 border border-stone-600 rounded-lg pl-11 pr-4 py-3 text-stone-100 placeholder:text-stone-500 focus:border-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>

            {/* Datasheet List */}
            <div className="space-y-2">
              {filteredDatasheets.map((unit) => (
                <button
                  key={unit.name}
                  onClick={() => handleDatasheetClick(unit)}
                  className="w-full rounded-xl border border-stone-700/60 bg-stone-900 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group"
                >
                  <div className="p-3 flex items-center justify-between gap-3">
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-stone-100">
                          {unit.name}
                        </h3>
                        {unit.legends && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                            Legends
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {unit.keywords.slice(0, 4).map((kw, kwIdx) => (
                          <span
                            key={kwIdx}
                            className="px-1.5 py-0.5 rounded bg-stone-800/80 text-[10px] text-stone-400 border border-stone-700/50"
                          >
                            {toTitleCase(kw)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {unit.points.length > 0 && (
                        <span className="text-sm font-bold text-emerald-500 font-mono">
                          {unit.points[0].cost} pts
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-stone-500 group-hover:text-emerald-500 transition-colors" />
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {filteredDatasheets.length === 0 && (
              <div className="text-center py-8 text-stone-400 text-sm">
                No datasheets found
              </div>
            )}
          </div>
        )}

        {/* Crusade Tab */}
        {activeTab === "crusade" && (
          <div className="space-y-4">
            {rules?.crusade_rules && rules.crusade_rules.length > 0 ? (
              <div className="rounded-xl border border-stone-700/60 bg-stone-900 p-6">
                <h2 className="text-xl font-bold text-amber-400 mb-4">Crusade Rules</h2>
                {rules.crusade_rules.map((cr, idx) => (
                  <div key={idx} className="mb-4 last:mb-0">
                    {cr.name && (
                      <h3 className="text-base font-semibold text-stone-200 mb-2">{cr.name}</h3>
                    )}
                    {cr.text && (
                      <FormattedRuleText text={cr.text} />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-stone-700/60 bg-stone-900 p-6">
                <div className="text-center py-4">
                  <p className="text-stone-400 italic">No crusade rules available for this faction.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
