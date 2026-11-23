import { differenceInCalendarDays } from "date-fns";
import { addDaysToKey, isFutureDay, toDateKey, weekDays } from "./dates";
import type { Completions, Habit } from "./types";

function hasDay(map: Record<string, true> | undefined, key: string): boolean {
  return Boolean(map?.[key]);
}

export function currentStreak(
  map: Record<string, true> | undefined,
  today: string,
): number {
  if (!map) return 0;
  let cursor = today;
  if (!hasDay(map, cursor)) {
    cursor = addDaysToKey(today, -1);
    if (!hasDay(map, cursor)) return 0;
  }
  let streak = 0;
  while (hasDay(map, cursor)) {
    streak += 1;
    cursor = addDaysToKey(cursor, -1);
  }
  return streak;
}

export function longestStreak(map: Record<string, true> | undefined): number {
  if (!map) return 0;
  const days = Object.keys(map).sort();
  if (days.length === 0) return 0;
  let best = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = days[i - 1];
    const cur = days[i];
    if (!prev || !cur) continue;
    const gap = differenceInCalendarDays(
      new Date(`${cur}T00:00:00`),
      new Date(`${prev}T00:00:00`),
    );
    if (gap === 1) {
      run += 1;
      if (run > best) best = run;
    } else {
      run = 1;
    }
  }
  return best;
}

export function percentLabel(done: number, total: number): string {
  if (total <= 0) return "—";
  return `${Math.round((done / total) * 100)}%`;
}

export function weekCells(habits: Habit[], completions: Completions, today: Date) {
  const days = weekDays(today);
  return days.map((day) => ({
    date: day,
    key: toDateKey(day),
    future: isFutureDay(day, today),
  }));
}
