import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, TrendingUp, UserPlus, Wrench, RefreshCw, Gem, Crown, X } from "lucide-react";
import { toast } from "sonner";
import { useCrusade } from "../../lib/CrusadeContext";

interface Requisition {
  id: string;
  name: string;
  cost: number;
  description: string;
  icon: typeof TrendingUp;
}

const REQUISITIONS: Requisition[] = [
  {
    id: "increase-supply",
    name: "Increase Supply",
    cost: 1,
    description: "Increase your Supply Limit by 5 Power Level",
    icon: TrendingUp,
  },
  {
    id: "fresh-troops",
    name: "Fresh Troops",
    cost: 1,
    description: "Add a new unit to your Order of Battle",
    icon: UserPlus,
  },
  {
    id: "repair-recuperate",
    name: "Repair and Recuperate",
    cost: 1,
    description: "Remove one Battle Scar from a unit",
    icon: Wrench,
  },
  {
    id: "rearm-resupply",
    name: "Rearm and Resupply",
    cost: 1,
    description: "Change a unit's equipment loadout",
    icon: RefreshCw,
  },
  {
    id: "relic-requisition",
    name: "Relic Requisition",
    cost: 1,
    description: "Give a unit a Crusade Relic",
    icon: Gem,
  },
  {
    id: "warlord-trait",
    name: "Warlord Trait",
    cost: 1,
    description: "Assign a Warlord Trait to your warlord",
    icon: Crown,
  },
];

export default function RequisitionSpending() {
  const navigate = useNavigate();
  const { currentPlayer, units, spendRequisition, removeBattleScar } = useCrusade();

  const currentRP = currentPlayer?.requisition_points ?? 0;

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedRequisition, setSelectedRequisition] = useState<Requisition | null>(null);

  // Unit/Scar picker for Repair and Recuperate
  const [unitPickerOpen, setUnitPickerOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<{ id: string; name: string; scars: { id: string; name: string }[] } | null>(null);
  const [scarPickerOpen, setScarPickerOpen] = useState(false);

  // Get real units that have battle scars
  const unitsWithScars = useMemo(() => {
    return units
      .filter(u => u.battle_scars.length > 0 && !u.is_destroyed)
      .map(u => ({
        id: u.id,
        name: u.custom_name,
        scars: u.battle_scars.map(s => ({ id: s.id, name: s.name })),
      }));
  }, [units]);

  const handleCardClick = (requisition: Requisition) => {
    if (currentRP < requisition.cost) {
      return; // Card is disabled
    }

    setSelectedRequisition(requisition);
    setConfirmDialogOpen(true);
  };

  const handleConfirm = () => {
    if (!selectedRequisition) return;

    // Deduct RP via context
    const success = spendRequisition(selectedRequisition.cost);
    if (!success) {
      toast.error("Not enough RP");
      setConfirmDialogOpen(false);
      setSelectedRequisition(null);
      return;
    }

    // Close confirmation
    setConfirmDialogOpen(false);

    // Show toast
    toast.success(`${selectedRequisition.name} acquired`);

    // Handle specific requisition actions
    if (selectedRequisition.id === "fresh-troops") {
      // Navigate to add unit
      setTimeout(() => navigate("/add-unit"), 500);
    } else if (selectedRequisition.id === "repair-recuperate") {
      // Show unit picker for units with scars
      if (unitsWithScars.length > 0) {
        setTimeout(() => setUnitPickerOpen(true), 500);
      } else {
        toast.info("No units have battle scars to remove.");
      }
    }

    setSelectedRequisition(null);
  };

  const handleCancel = () => {
    setConfirmDialogOpen(false);
    setSelectedRequisition(null);
  };

  const handleSelectUnit = (unit: typeof unitsWithScars[0]) => {
    setSelectedUnit(unit);
    setUnitPickerOpen(false);
    setScarPickerOpen(true);
  };

  const handleSelectScar = (scarId: string, scarName: string) => {
    if (!selectedUnit) return;

    removeBattleScar(selectedUnit.id, scarId);
    toast.success(`Removed ${scarName} from ${selectedUnit.name}`);
    setScarPickerOpen(false);
    setSelectedUnit(null);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
      {/* Dark ambient glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col min-h-screen">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-emerald-500/20">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-stone-400 hover:text-emerald-500 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>

          <h1 className="text-2xl font-bold text-stone-100 tracking-wider drop-shadow-[0_0_10px_rgba(16,185,129,0.3)] mb-4">
            Requisitions
          </h1>

          {/* RP Balance */}
          <div className="rounded-lg border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 to-stone-950 p-5 text-center">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
              Available Points
            </p>
            <p className="text-5xl font-bold text-emerald-400 drop-shadow-[0_0_20px_rgba(16,185,129,0.6)]">
              {currentRP}
            </p>
            <p className="text-sm text-stone-500 mt-1">Requisition Points</p>
          </div>
        </div>

        {/* Requisition Cards */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {REQUISITIONS.map((requisition) => {
            const Icon = requisition.icon;
            const canAfford = currentRP >= requisition.cost;

            return (
              <button
                key={requisition.id}
                onClick={() => handleCardClick(requisition)}
                disabled={!canAfford}
                className={`w-full rounded-lg border transition-all p-5 text-left ${
                  canAfford
                    ? "border-emerald-500/20 bg-gradient-to-br from-stone-900 to-stone-950 hover:border-emerald-500/40 hover:shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                    : "border-stone-800 bg-gradient-to-br from-stone-950 to-black opacity-50 cursor-not-allowed"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${canAfford ? "bg-emerald-500/10" : "bg-stone-800"}`}>
                    <Icon className={`w-6 h-6 ${canAfford ? "text-emerald-500" : "text-stone-600"}`} />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`font-bold ${canAfford ? "text-stone-200" : "text-stone-600"}`}>
                        {requisition.name}
                      </h3>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                        canAfford
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-stone-800 text-stone-600"
                      }`}>
                        {requisition.cost} RP
                      </div>
                    </div>

                    <p className={`text-sm ${canAfford ? "text-stone-500" : "text-stone-700"}`}>
                      {requisition.description}
                    </p>

                    {!canAfford && (
                      <p className="text-xs text-red-500 mt-2 font-semibold">Not enough RP</p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmDialogOpen && selectedRequisition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-emerald-500/30 bg-gradient-to-br from-stone-900 to-stone-950 p-6 shadow-2xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 rounded-lg bg-emerald-500/10">
                <selectedRequisition.icon className="w-6 h-6 text-emerald-500" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-stone-100 mb-2">
                  Spend {selectedRequisition.cost} RP on {selectedRequisition.name}?
                </h2>
                <p className="text-sm text-stone-500">
                  {selectedRequisition.description}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 py-3 rounded-lg border border-emerald-500/20 bg-gradient-to-br from-stone-900 to-stone-950 text-stone-300 font-semibold hover:border-emerald-500/40 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-3 rounded-lg font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 text-black hover:from-emerald-500 hover:to-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unit Picker Dialog (for Repair and Recuperate) */}
      {unitPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-emerald-500/30 bg-gradient-to-br from-stone-900 to-stone-950 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-stone-800">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-stone-100">Select Unit</h2>
                <button
                  onClick={() => setUnitPickerOpen(false)}
                  className="text-stone-500 hover:text-stone-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-stone-500 mt-2">
                Choose a unit to remove a battle scar from
              </p>
            </div>

            <div className="max-h-96 overflow-y-auto p-6 space-y-3">
              {unitsWithScars.length === 0 && (
                <p className="text-stone-600 text-sm text-center py-4">No units have battle scars.</p>
              )}
              {unitsWithScars.map((unit) => (
                <button
                  key={unit.id}
                  onClick={() => handleSelectUnit(unit)}
                  className="w-full rounded-lg border border-emerald-500/20 bg-gradient-to-br from-stone-900 to-stone-950 p-4 text-left hover:border-emerald-500/40 transition-all"
                >
                  <h3 className="font-semibold text-stone-300 mb-2">{unit.name}</h3>
                  <div className="flex flex-wrap gap-2">
                    {unit.scars.map((scar) => (
                      <span
                        key={scar.id}
                        className="px-2 py-1 rounded-full bg-red-500/10 text-red-400 text-xs"
                      >
                        {scar.name}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Scar Picker Dialog */}
      {scarPickerOpen && selectedUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-emerald-500/30 bg-gradient-to-br from-stone-900 to-stone-950 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-stone-800">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-stone-100">Remove Scar</h2>
                <button
                  onClick={() => {
                    setScarPickerOpen(false);
                    setSelectedUnit(null);
                  }}
                  className="text-stone-500 hover:text-stone-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-stone-500 mt-2">
                Select which scar to remove from {selectedUnit.name}
              </p>
            </div>

            <div className="p-6 space-y-3">
              {selectedUnit.scars.map((scar) => (
                <button
                  key={scar.id}
                  onClick={() => handleSelectScar(scar.id, scar.name)}
                  className="w-full rounded-lg border border-red-500/30 bg-gradient-to-br from-red-950/20 to-stone-950 p-4 text-left hover:border-red-500/50 transition-all"
                >
                  <h3 className="font-semibold text-red-400">{scar.name}</h3>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
