import { subDays } from "date-fns";
import { currentStreak, longestStreak } from "./stats";
import { isFutureDay, toDateKey, weekDays } from "./dates";
import type { MealEntry, MealLogs, MealSlot } from "./types";

export const XP_PER_MEAL = 10;
export const FUEL_DAY_BONUS = 40;
export const FUEL_MEAL_TARGET = 3;
export const DEFAULT_CALORIE_TARGET = 2200;

export const MEAL_SLOTS: { id: MealSlot; label: string }[] = [
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
  { id: "snack", label: "Snack" },
];

export function mealsForDay(logs: MealLogs, dateKey: string): MealEntry[] {
  return logs[dateKey] ?? [];
}

export function dayCalories(logs: MealLogs, dateKey: string): number {
  return mealsForDay(logs, dateKey).reduce((sum, meal) => sum + meal.kcal, 0);
}

export function dayMealCount(logs: MealLogs, dateKey: string): number {
  return mealsForDay(logs, dateKey).length;
}

export function isFuelDay(logs: MealLogs, dateKey: string): boolean {
  return dayMealCount(logs, dateKey) >= FUEL_MEAL_TARGET;
}

export function mealXp(logs: MealLogs): number {
  let xp = 0;
  for (const [date, meals] of Object.entries(logs)) {
    if (!meals.length) continue;
    xp += meals.length * XP_PER_MEAL;
    if (isFuelDay(logs, date)) xp += FUEL_DAY_BONUS;
  }
  return xp;
}

export function fuelDaysMap(logs: MealLogs): Record<string, true> {
  const map: Record<string, true> = {};
  for (const date of Object.keys(logs)) {
    if (isFuelDay(logs, date)) map[date] = true;
  }
  return map;
}

export function fuelStreaks(logs: MealLogs, todayKey: string): { current: number; longest: number; days: number } {
  const map = fuelDaysMap(logs);
  return {
    current: currentStreak(map, todayKey),
    longest: longestStreak(map),
    days: Object.keys(map).length,
  };
}

export function weekFuel(
  logs: MealLogs,
  today: Date,
): { date: Date; key: string; kcal: number; fuelled: boolean; future: boolean }[] {
  return weekDays(today).map((date) => {
    const key = toDateKey(date);
    return {
      date,
      key,
      future: isFutureDay(date, today),
      kcal: dayCalories(logs, key),
      fuelled: isFuelDay(logs, key),
    };
  });
}

export function remainingKcal(consumed: number, target: number): number {
  return target - consumed;
}

export function createDemoMeals(): MealLogs {
  const today = new Date();
  const logs: MealLogs = {};

  const templates: { slot: MealSlot; name: string; kcal: number; foodId?: string }[][] = [
    [
      { slot: "breakfast", name: "Oatmeal", kcal: 150, foodId: "oatmeal" },
      { slot: "breakfast", name: "Banana", kcal: 105, foodId: "banana" },
      { slot: "lunch", name: "Chicken rice bowl", kcal: 520, foodId: "chicken-bowl" },
      { slot: "snack", name: "Greek yogurt", kcal: 100, foodId: "greek-yogurt" },
      { slot: "dinner", name: "Salmon", kcal: 230, foodId: "salmon" },
      { slot: "dinner", name: "Brown rice", kcal: 215, foodId: "brown-rice" },
    ],
    [
      { slot: "breakfast", name: "Eggs", kcal: 156, foodId: "eggs" },
      { slot: "breakfast", name: "Toast", kcal: 80, foodId: "toast" },
      { slot: "lunch", name: "Salad", kcal: 90, foodId: "salad" },
      { slot: "lunch", name: "Chicken breast", kcal: 165, foodId: "chicken-breast" },
      { slot: "dinner", name: "Pasta", kcal: 220, foodId: "pasta" },
      { slot: "snack", name: "Protein shake", kcal: 160, foodId: "protein-shake" },
    ],
    [
      { slot: "breakfast", name: "Overnight oats", kcal: 280, foodId: "overnight-oats" },
      { slot: "lunch", name: "Wrap", kcal: 420, foodId: "wrap" },
      { slot: "dinner", name: "Poke bowl", kcal: 490, foodId: "poke" },
      { slot: "snack", name: "Apple", kcal: 95, foodId: "apple" },
    ],
  ];

  for (let daysAgo = 0; daysAgo <= 12; daysAgo += 1) {
    if (daysAgo % 6 === 5) continue;
    const key = toDateKey(subDays(today, daysAgo));
    const template = templates[daysAgo % templates.length] ?? templates[0]!;
    const items = daysAgo === 0 ? template.slice(0, 2) : template;
    logs[key] = items.map((item, i) => ({
      id: `m_${key}_${i}`,
      name: item.name,
      slot: item.slot,
      kcal: item.kcal,
      servings: item.foodId === "eggs" && daysAgo !== 0 ? 2 : 1,
      foodId: item.foodId,
    }));
  }
  return logs;
}
