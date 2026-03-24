import { useState } from "react";
import DiceRoller from "../components/DiceRoller";
import CombatLog from "../components/CombatLog";
import FactionLegacy from "../components/FactionLegacy";
import ErrorBoundary from "../components/ErrorBoundary";
import type { CombatEngagement } from "../../types";

const SAMPLE_ENGAGEMENTS: CombatEngagement[] = [
  {
    id: "eng-1",
    turn: 1,
    phase: "shooting",
    attacker_unit_id: "u1",
    attacker_unit_name: "Intercessor Squad",
    attacker_weapon: "Bolt Rifle",
    defender_unit_id: "u2",
    defender_unit_name: "Ork Boyz",
    defender_player_id: "p2",
    attacks: 10,
    hits: 7,
    wounds: 4,
    failed_saves: 3,
    damage_dealt: 3,
    models_destroyed: 3,
    timestamp: new Date().toISOString(),
  },
  {
    id: "eng-2",
    turn: 1,
    phase: "melee",
    attacker_unit_id: "u3",
    attacker_unit_name: "Assault Terminators",
    attacker_weapon: "Thunder Hammer",
    defender_unit_id: "u4",
    defender_unit_name: "Chaos Chosen",
    defender_player_id: "p2",
    attacks: 6,
    hits: 4,
    wounds: 3,
    failed_saves: 2,
    damage_dealt: 6,
    models_destroyed: 2,
    timestamp: new Date(Date.now() - 300000).toISOString(),
  },
];

function Section({
  title,
  description,
  propsTable,
  children,
}: {
  title: string;
  description: string;
  propsTable: { name: string; type: string; required: boolean }[];
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10 border border-stone-700 rounded-lg overflow-hidden">
      <div className="bg-stone-800 px-5 py-4 border-b border-stone-700">
        <h2 className="text-lg font-bold text-amber-400 font-mono">{title}</h2>
        <p className="text-stone-400 text-sm mt-1">{description}</p>
      </div>
      <div className="px-5 py-4">
        <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
          Props
        </h3>
        <table className="w-full text-sm mb-4">
          <thead>
            <tr className="text-left text-stone-500">
              <th className="pb-1 pr-4">Name</th>
              <th className="pb-1 pr-4">Type</th>
              <th className="pb-1">Required</th>
            </tr>
          </thead>
          <tbody>
            {propsTable.map((p) => (
              <tr key={p.name} className="text-stone-300 border-t border-stone-800">
                <td className="py-1 pr-4 font-mono text-amber-300">{p.name}</td>
                <td className="py-1 pr-4 font-mono text-xs">{p.type}</td>
                <td className="py-1">{p.required ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
          Live Example
        </h3>
        <div className="bg-stone-900 rounded p-4 border border-stone-800">{children}</div>
      </div>
    </section>
  );
}

export default function ComponentCatalog() {
  const [diceResult, setDiceResult] = useState<number[]>([]);
  const [legacy, setLegacy] = useState<Record<string, unknown>>({});

  if (import.meta.env.PROD) {
    return (
      <div className="p-6 text-center text-stone-500">
        Component catalog is only available in development mode.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-amber-400 mb-1">Component Catalog</h1>
      <p className="text-stone-500 text-sm mb-6">
        Internal reference for reusable CrusadeCommand components. Dev mode only.
      </p>

      {/* DiceRoller */}
      <Section
        title="DiceRoller"
        description="Animated dice roller with digital and manual input modes. Used in the combat tracker for hit/wound/save rolls."
        propsTable={[
          { name: "count", type: "number", required: true },
          { name: "target", type: "number", required: true },
          { name: "label", type: "string", required: true },
          { name: "onComplete", type: "(rolls: number[]) => void", required: true },
          { name: "mode", type: '"digital" | "manual"', required: true },
        ]}
      >
        <DiceRoller
          count={5}
          target={3}
          label="Hit Roll (BS 3+)"
          onComplete={setDiceResult}
          mode="digital"
        />
        {diceResult.length > 0 && (
          <p className="text-stone-400 text-xs mt-2">
            Last result: [{diceResult.join(", ")}]
          </p>
        )}
      </Section>

      {/* CombatLog */}
      <Section
        title="CombatLog"
        description="Displays a scrollable list of combat engagements with phase icons, damage stats, and relative timestamps."
        propsTable={[
          { name: "engagements", type: "CombatEngagement[]", required: true },
        ]}
      >
        <CombatLog engagements={SAMPLE_ENGAGEMENTS} />
      </Section>

      {/* CombatLog (empty state) */}
      <Section
        title="CombatLog — Empty State"
        description="Rendered when no engagements have been logged yet."
        propsTable={[
          { name: "engagements", type: "CombatEngagement[]", required: true },
        ]}
      >
        <CombatLog engagements={[]} />
      </Section>

      {/* FactionLegacy */}
      <Section
        title="FactionLegacy"
        description="Faction-specific crusade trackers (e.g., Oath of Moment for Space Marines). Renders nothing if no config exists for the faction."
        propsTable={[
          { name: "factionId", type: "string", required: true },
          { name: "legacy", type: "Record<string, unknown>", required: true },
          { name: "onUpdate", type: "(key: string, value: unknown) => void", required: true },
        ]}
      >
        <FactionLegacy
          factionId="space_marines"
          legacy={legacy}
          onUpdate={(key, value) =>
            setLegacy((prev) => ({ ...prev, [key]: value }))
          }
        />
      </Section>

      {/* ErrorBoundary */}
      <Section
        title="ErrorBoundary"
        description="Catches uncaught React errors and renders a recovery UI with reload and clear-data options."
        propsTable={[
          { name: "children", type: "ReactNode", required: true },
        ]}
      >
        <ErrorBoundary>
          <p className="text-stone-300 text-sm">
            ErrorBoundary wraps children. If they throw, a fallback UI with reload/clear buttons
            is shown. (Cannot demo live without actually throwing.)
          </p>
        </ErrorBoundary>
      </Section>
    </div>
  );
}
