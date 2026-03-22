import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Swords, ArrowRight } from "lucide-react";
import { Skull } from "lucide-react";
import { useCrusade } from "../../lib/CrusadeContext";
import { getFactionName, getFactionIcon } from "../../lib/factions";
import { SpaceMarineHelmet } from "../components/SpaceMarineHelmet";

// Weighted quote pools: 50% neutral lore, 40% faction jokes, 10% rare easter eggs
const LORE_QUOTES = [
  "The Emperor protects.",
  "Hope is not a strategy. Reloading is.",
  "Failure is heresy. Suspicion is a virtue.",
  "Appeasing the Machine Spirit\u2026",
  "Consulting the Omnissiah\u2026",
  "Rolling ones is part of the experience.",
];

const FACTION_QUOTES = [
  "Don't Pet The Space Wolves.",
  "Blood Angels request more red paint.",
  "The Ruinous Powers are watching.",
  "Please wash your hands. Mortarion will not.",
  "Dark Angels deny everything.",
];

const RARE_QUOTES = [
  "The Emperor noticed you.",
  "Hydra Dominatus.",
  "You are Alpharius.",
];

function pickWeightedQuote(lastQuote: string): string {
  const roll = Math.random();
  const pool = roll < 0.5 ? LORE_QUOTES : roll < 0.9 ? FACTION_QUOTES : RARE_QUOTES;
  let pick = pool[Math.floor(Math.random() * pool.length)];
  // Avoid repeating the same quote back-to-back
  while (pick === lastQuote && pool.length > 1) {
    pick = pool[Math.floor(Math.random() * pool.length)];
  }
  return pick;
}

export default function CampaignHub() {
  const navigate = useNavigate();
  const { user, campaign, currentPlayer } = useCrusade();
  const [quote, setQuote] = useState(() => pickWeightedQuote(""));
  const [fade, setFade] = useState(true);

  // Redirect to sign-in if no user is logged in
  useEffect(() => {
    if (!user) {
      navigate("/sign-in", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setQuote((prev) => pickWeightedQuote(prev));
        setFade(true);
      }, 400);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-between p-6 relative overflow-hidden">
      {/* Content container */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full max-w-md">
        {/* Logo/Title section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <SpaceMarineHelmet className="w-20 h-20 text-emerald-500/80" />
              <div className="absolute inset-0 blur-md">
                <SpaceMarineHelmet className="w-20 h-20 text-emerald-500/40" />
              </div>
            </div>
          </div>

          <h1 className="text-4xl font-bold mb-2 tracking-wider text-stone-100 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">
            CRUSADE
          </h1>
          <h2 className="text-xl tracking-[0.3em] text-emerald-500/70 uppercase font-light mb-4">
            Command
          </h2>

          <p className="text-stone-400 text-sm max-w-xs mx-auto leading-relaxed">
            Begin your path to glory or join your brothers in the endless war
          </p>
        </div>

        {/* Active Campaign Card (if exists) */}
        {campaign && currentPlayer && (
          <button
            onClick={() => navigate("/campaign/active")}
            className="group w-full relative overflow-hidden mb-4"
          >
            <div className="absolute inset-0 bg-stone-900 border border-stone-700/60 rounded-xl transition-all duration-300 group-hover:border-emerald-500/50 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]" style={{ borderLeftWidth: '4px', borderLeftColor: 'rgb(245, 158, 11)' }} />
            <div className="relative px-6 py-5 flex items-center justify-between">
              <div className="flex-1 text-left">
                <div className="text-xs text-emerald-500/70 uppercase tracking-wider mb-1">
                  Active Crusade
                </div>
                <h3 className="text-lg tracking-wide text-stone-100 font-semibold">
                  {campaign.name}
                </h3>
                <p className="text-stone-400 text-sm mt-1">
                  {getFactionIcon(currentPlayer.faction_id)} {getFactionName(currentPlayer.faction_id)} — {currentPlayer.name}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-emerald-500/70 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
          </button>
        )}

        {/* Action Cards */}
        <div className="w-full space-y-4">
          {/* Create Campaign Card */}
          <button
            onClick={() => navigate('/create-campaign')}
            className="group w-full relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-stone-900 border border-stone-700/60 rounded-xl transition-all duration-300 group-hover:border-emerald-500/50 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]" />
            <div className="relative px-6 py-6 flex items-center justify-between">
              <div className="flex-1 text-left">
                <div className="flex items-center gap-3 mb-1">
                  <Swords className="w-5 h-5 text-emerald-500/80" strokeWidth={1.5} />
                  <h3 className="text-lg tracking-wide text-stone-100 font-semibold">
                    {campaign ? 'New Campaign' : 'Create Campaign'}
                  </h3>
                </div>
                <p className="text-stone-400 text-sm ml-8">
                  Forge a new crusade and lead your forces
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-emerald-500/50" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
          </button>

          {/* Join Campaign Card */}
          <button
            onClick={() => navigate('/join-campaign')}
            className="group w-full relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-stone-900 border border-stone-700/60 rounded-xl transition-all duration-300 group-hover:border-emerald-500/50 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]" />
            <div className="relative px-6 py-6 flex items-center justify-between">
              <div className="flex-1 text-left">
                <div className="flex items-center gap-3 mb-1">
                  <Skull className="w-5 h-5 text-emerald-500/80" strokeWidth={1.5} />
                  <h3 className="text-lg tracking-wide text-stone-100 font-semibold">
                    Join Campaign
                  </h3>
                </div>
                <p className="text-stone-400 text-sm ml-8">
                  Answer the call and join an existing crusade
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-emerald-500/50" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
          </button>
        </div>
      </div>

      {/* Bottom rotating quote */}
      <div className="relative z-10 mt-8 text-center">
        <div className="flex items-center justify-center gap-2 text-stone-500 text-xs tracking-wider">
          <div className="w-8 h-px bg-gradient-to-r from-transparent to-stone-700" />
          <span
            className={`uppercase italic max-w-xs text-center transition-opacity duration-400 ${fade ? "opacity-100" : "opacity-0"}`}
          >
            {quote}
          </span>
          <div className="w-8 h-px bg-gradient-to-l from-transparent to-stone-700" />
        </div>
      </div>
    </div>
  );
}
