import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { FOODS, type FoodItem } from "@/lib/habits/foods";
import { MEAL_SLOTS } from "@/lib/habits/meals";
import type { MealEntry, MealSlot } from "@/lib/habits/types";

export function MealDialog({
  open,
  onClose,
  initial,
  defaultSlot,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  initial: MealEntry | null;
  defaultSlot: MealSlot;
  onSave: (input: Omit<MealEntry, "id">) => void;
}) {
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [slot, setSlot] = useState<MealSlot>(defaultSlot);
  const [kcal, setKcal] = useState("250");
  const [servings, setServings] = useState(1);
  const [baseKcal, setBaseKcal] = useState<number | null>(null);
  const [foodId, setFoodId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    if (initial) {
      setName(initial.name);
      setSlot(initial.slot);
      setKcal(String(initial.kcal));
      setServings(initial.servings);
      setBaseKcal(initial.servings > 0 ? Math.round(initial.kcal / initial.servings) : initial.kcal);
      setFoodId(initial.foodId);
    } else {
      setName("");
      setSlot(defaultSlot);
      setKcal("250");
      setServings(1);
      setBaseKcal(null);
      setFoodId(undefined);
    }
  }, [open, initial, defaultSlot]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FOODS.slice(0, 8);
    return FOODS.filter((f) => f.name.toLowerCase().includes(q) || f.serving.toLowerCase().includes(q)).slice(0, 8);
  }, [query]);

  function pickFood(food: FoodItem) {
    setName(food.name);
    setFoodId(food.id);
    setServings(1);
    setBaseKcal(food.kcal);
    setKcal(String(food.kcal));
  }

  function changeServings(next: number) {
    const clamped = Math.max(0.5, Math.min(8, next));
    setServings(clamped);
    if (baseKcal !== null) {
      setKcal(String(Math.round(baseKcal * clamped)));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = Number(kcal);
    if (!name.trim() || !Number.isFinite(parsed) || parsed <= 0) return;
    onSave({
      name: name.trim(),
      slot,
      kcal: Math.round(parsed),
      servings,
      foodId,
    });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit Meal" : "Log Fuel"}
      subtitle="Search everyday foods or enter a custom meal."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {!initial ? (
          <div>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search chicken, oats, eggs, shake..."
                className="h-10 w-full rounded-xl bg-raised pr-3 pl-9 text-sm text-fg ring-1 ring-line outline-none focus:ring-amber"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {matches.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => pickFood(f)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                    foodId === f.id
                      ? "bg-amber text-amber-fg font-semibold"
                      : "bg-raised text-muted hover:text-fg"
                  }`}
                >
                  {f.name} · <span className="tabular-nums opacity-75">{f.kcal}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div>
          <label htmlFor="meal-name" className="block text-xs font-medium tracking-wider text-muted uppercase">
            Meal name
          </label>
          <input
            id="meal-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setFoodId(undefined);
            }}
            placeholder="e.g. Salmon & rice bowl"
            className="mt-1.5 h-11 w-full rounded-xl bg-raised px-3.5 text-sm text-fg ring-1 ring-line outline-none focus:ring-amber"
          />
        </div>

        <div>
          <span className="block text-xs font-medium tracking-wider text-muted uppercase">Slot</span>
          <div className="mt-1.5 grid grid-cols-4 gap-1.5">
            {MEAL_SLOTS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSlot(item.id)}
                className={`h-9 rounded-xl text-xs font-medium transition-colors ${
                  slot === item.id ? "bg-amber text-amber-fg font-semibold" : "bg-raised text-muted hover:text-fg"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="meal-kcal" className="block text-xs font-medium tracking-wider text-muted uppercase">
              Calories (kcal)
            </label>
            <input
              id="meal-kcal"
              type="number"
              min={1}
              max={5000}
              value={kcal}
              onChange={(e) => setKcal(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl bg-raised px-3.5 text-sm tabular-nums text-fg ring-1 ring-line outline-none focus:ring-amber"
            />
          </div>
          <div>
            <span className="block text-xs font-medium tracking-wider text-muted uppercase">Servings</span>
            <div className="mt-1.5 flex h-11 items-center justify-between rounded-xl bg-raised px-2 ring-1 ring-line">
              <button
                type="button"
                onClick={() => changeServings(servings - 0.5)}
                className="grid size-8 place-items-center rounded-lg bg-surface text-fg"
              >
                −
              </button>
              <span className="text-sm font-semibold tabular-nums text-fg">{servings}×</span>
              <button
                type="button"
                onClick={() => changeServings(servings + 0.5)}
                className="grid size-8 place-items-center rounded-lg bg-surface text-fg"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-xl bg-raised text-sm font-medium text-muted hover:text-fg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim() || !Number(kcal)}
            className="h-11 flex-1 rounded-xl bg-amber text-sm font-semibold text-amber-fg disabled:opacity-40"
          >
            {initial ? "Save meal" : "Log meal"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
