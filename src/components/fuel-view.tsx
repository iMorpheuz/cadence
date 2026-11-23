import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { weekdayLabel } from "@/lib/habits/dates";
import { QUICK_FOODS, foodById } from "@/lib/habits/foods";
import {
  FUEL_MEAL_TARGET,
  MEAL_SLOTS,
  XP_PER_MEAL,
  dayCalories,
  mealsForDay,
  remainingKcal,
  weekFuel,
} from "@/lib/habits/meals";
import type { MealEntry, MealLogs, MealSlot } from "@/lib/habits/types";

export function FuelView({
  meals,
  calorieTarget,
  dayKey,
  onSelectDay,
  onAddMeal,
  onEditMeal,
  onDeleteMeal,
  onQuickLog,
  onSaveTarget,
}: {
  meals: MealLogs;
  calorieTarget: number;
  dayKey: string;
  onSelectDay: (key: string) => void;
  onAddMeal: (slot?: MealSlot) => void;
  onEditMeal: (meal: MealEntry) => void;
  onDeleteMeal: (meal: MealEntry) => void;
  onQuickLog: (foodId: string) => void;
  onSaveTarget: (kcal: number) => void;
}) {
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState(String(calorieTarget));

  const today = new Date();
  const week = weekFuel(meals, today);
  const dayMeals = mealsForDay(meals, dayKey);
  const consumed = dayCalories(meals, dayKey);
  const rem = remainingKcal(consumed, calorieTarget);
  const pct = calorieTarget > 0 ? Math.min(100, Math.round((consumed / calorieTarget) * 100)) : 0;

  return (
    <div className="space-y-5">
      {/* Calorie Summary Card */}
      <section className="card rounded-2xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-xs font-semibold tracking-[0.18em] text-amber uppercase">
              Daily Fuel Intake
            </p>
            <p className="mt-1 font-display text-4xl leading-none text-fg tabular-nums">
              {consumed.toLocaleString()}
              <span className="text-xl text-faint"> / {calorieTarget.toLocaleString()} kcal</span>
            </p>
            <p className="mt-1.5 text-xs text-muted">
              {rem >= 0
                ? `${rem.toLocaleString()} kcal remaining · ${dayMeals.length}/${FUEL_MEAL_TARGET} meals for daily bonus`
                : `${Math.abs(rem).toLocaleString()} kcal over target · ${dayMeals.length} meals logged`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setTargetInput(String(calorieTarget));
              setEditingTarget((v) => !v);
            }}
            className="h-9 rounded-xl bg-raised px-3 text-xs font-semibold text-muted hover:text-fg"
          >
            Target
          </button>
        </div>

        <div className="mt-3.5 h-2 overflow-hidden rounded-full bg-raised">
          <div
            className={`h-full rounded-full transition-[width] duration-500 ${
              rem < 0 ? "bg-ember" : "bg-amber"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {editingTarget ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const val = Number(targetInput);
              if (Number.isFinite(val) && val >= 800) {
                onSaveTarget(val);
                setEditingTarget(false);
              }
            }}
            className="mt-3 flex items-center gap-2"
          >
            <input
              type="number"
              min={800}
              max={8000}
              step={50}
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              className="h-9 flex-1 rounded-xl bg-raised px-3 text-sm tabular-nums text-fg ring-1 ring-line outline-none focus:ring-amber"
            />
            <button
              type="submit"
              className="h-9 rounded-xl bg-amber px-4 text-xs font-semibold text-amber-fg"
            >
              Save
            </button>
          </form>
        ) : null}
      </section>

      {/* Week Day Strip */}
      <div className="card rounded-2xl p-2.5">
        <div className="grid grid-cols-7 gap-1">
          {week.map((item) => {
            const active = dayKey === item.key;
            return (
              <button
                key={item.key}
                type="button"
                disabled={item.future}
                onClick={() => onSelectDay(item.key)}
                className={`flex h-14 flex-col items-center justify-center rounded-xl transition-colors disabled:opacity-30 ${
                  active ? "bg-raised text-amber ring-1 ring-amber/40" : "text-muted hover:bg-raised/50"
                }`}
              >
                <span className="font-display text-xs font-semibold tracking-wider uppercase">
                  {weekdayLabel(item.date, true)}
                </span>
                <span
                  className={`mt-1.5 size-2 rounded-full ${
                    item.fuelled ? "bg-amber" : item.kcal > 0 ? "bg-amber/40" : "bg-line"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Log Bar */}
      <section>
        <div className="mb-2 flex items-center justify-between px-0.5">
          <p className="text-xs font-medium tracking-wider text-muted uppercase">
            Quick log (+{XP_PER_MEAL} XP each)
          </p>
          <button
            type="button"
            onClick={() => onAddMeal()}
            className="flex items-center gap-1 text-xs font-semibold text-amber hover:underline"
          >
            <Plus className="size-3.5" />
            Custom meal
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_FOODS.map((id) => {
            const food = foodById(id);
            if (!food) return null;
            return (
              <button
                key={food.id}
                type="button"
                onClick={() => onQuickLog(food.id)}
                className="card-interactive rounded-xl px-3 py-2 text-xs text-fg hover:bg-raised active:scale-95"
              >
                {food.name} <span className="text-faint tabular-nums">· {food.kcal}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Meal Slots */}
      <div className="space-y-3">
        {MEAL_SLOTS.map((slot) => {
          const entries = dayMeals.filter((m) => m.slot === slot.id);
          const slotKcal = entries.reduce((sum, m) => sum + m.kcal, 0);

          return (
            <section key={slot.id} className="card rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-xl font-semibold tracking-wide text-fg uppercase">
                    {slot.label}
                  </h3>
                  <p className="text-xs text-muted tabular-nums">
                    {entries.length > 0 ? `${slotKcal.toLocaleString()} kcal` : "Nothing logged"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onAddMeal(slot.id)}
                  aria-label={`Add ${slot.label}`}
                  className="grid size-8 place-items-center rounded-xl bg-raised text-muted hover:bg-amber hover:text-amber-fg"
                >
                  <Plus className="size-4" />
                </button>
              </div>

              {entries.length > 0 ? (
                <ul className="mt-3 divide-y divide-line/60">
                  {entries.map((meal) => (
                    <li key={meal.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-fg">{meal.name}</p>
                        <p className="text-xs text-muted tabular-nums">
                          {meal.servings !== 1 ? `${meal.servings}× · ` : ""}
                          {meal.kcal} kcal
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEditMeal(meal)}
                          aria-label={`Edit ${meal.name}`}
                          className="grid size-8 place-items-center rounded-lg text-faint hover:bg-raised hover:text-fg"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteMeal(meal)}
                          aria-label={`Delete ${meal.name}`}
                          className="grid size-8 place-items-center rounded-lg text-faint hover:bg-raised hover:text-danger"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}
