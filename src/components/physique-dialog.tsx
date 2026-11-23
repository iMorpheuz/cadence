import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { bmiBand, bmiFrom, convertProfile, formatBmi } from "@/lib/habits/physique";
import type { BodyProfile, WeightUnit } from "@/lib/habits/types";

export function PhysiqueDialog({
  open,
  onClose,
  profile,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  profile: BodyProfile;
  onSave: (next: BodyProfile) => void;
}) {
  const [draft, setDraft] = useState<BodyProfile>(profile);

  useEffect(() => {
    if (open) setDraft(profile);
  }, [open, profile]);

  const previewBmi = bmiFrom(draft);

  function switchUnit(unit: WeightUnit) {
    setDraft((curr) => convertProfile(curr, unit));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(draft);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Physique & Burn Goal"
      subtitle="Calibrates BMI estimates and workout calorie burn."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex rounded-xl bg-raised p-1">
          {(["lb", "kg"] as const).map((unit) => (
            <button
              key={unit}
              type="button"
              onClick={() => switchUnit(unit)}
              className={`h-9 flex-1 rounded-lg text-xs font-semibold uppercase transition-colors ${
                draft.unit === unit ? "bg-ember text-ember-fg" : "text-muted hover:text-fg"
              }`}
            >
              {unit === "lb" ? "Imperial (lb / in)" : "Metric (kg / cm)"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="body-mass" className="block text-xs font-medium tracking-wider text-muted uppercase">
              Current ({draft.unit})
            </label>
            <input
              id="body-mass"
              type="number"
              step="0.5"
              value={draft.mass}
              onChange={(e) => setDraft({ ...draft, mass: Number(e.target.value) || 0 })}
              className="mt-1.5 h-11 w-full rounded-xl bg-raised px-3.5 text-sm tabular-nums text-fg ring-1 ring-line outline-none focus:ring-ember"
            />
          </div>
          <div>
            <label htmlFor="body-goal" className="block text-xs font-medium tracking-wider text-muted uppercase">
              Goal ({draft.unit})
            </label>
            <input
              id="body-goal"
              type="number"
              step="0.5"
              value={draft.goalMass}
              onChange={(e) => setDraft({ ...draft, goalMass: Number(e.target.value) || 0 })}
              className="mt-1.5 h-11 w-full rounded-xl bg-raised px-3.5 text-sm tabular-nums text-fg ring-1 ring-line outline-none focus:ring-ember"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="body-height" className="block text-xs font-medium tracking-wider text-muted uppercase">
              Height ({draft.unit === "kg" ? "cm" : "inches"})
            </label>
            <input
              id="body-height"
              type="number"
              value={draft.height}
              onChange={(e) => setDraft({ ...draft, height: Number(e.target.value) || 0 })}
              className="mt-1.5 h-11 w-full rounded-xl bg-raised px-3.5 text-sm tabular-nums text-fg ring-1 ring-line outline-none focus:ring-ember"
            />
          </div>
          <div>
            <label htmlFor="body-burn" className="block text-xs font-medium tracking-wider text-muted uppercase">
              Daily Burn Target
            </label>
            <input
              id="body-burn"
              type="number"
              step={10}
              value={draft.burnTarget}
              onChange={(e) => setDraft({ ...draft, burnTarget: Number(e.target.value) || 0 })}
              className="mt-1.5 h-11 w-full rounded-xl bg-raised px-3.5 text-sm tabular-nums text-fg ring-1 ring-line outline-none focus:ring-ember"
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-raised/60 px-3.5 py-2.5 text-xs">
          <span className="text-muted">Estimated BMI</span>
          <span className="font-semibold tabular-nums text-fg">
            {formatBmi(previewBmi)} · {bmiBand(previewBmi)}
          </span>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-xl bg-raised text-sm font-medium text-muted hover:text-fg"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="glow-ember h-11 flex-1 rounded-xl bg-ember text-sm font-semibold text-ember-fg"
          >
            Save profile
          </button>
        </div>
      </form>
    </Modal>
  );
}
