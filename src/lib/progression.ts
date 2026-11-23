import { isFutureDay, monthDays, toDateKey, weekDays } from "@/lib/habits/dates";
import { dayCalories, dayMealCount, fuelStreaks, mealXp } from "@/lib/habits/meals";
import { massToKg } from "@/lib/habits/physique";
import { emptyStatMap, progressFromXp, rankFromLevel, xpForQuest } from "@/lib/habits/progress";
import { currentStreak, longestStreak } from "@/lib/habits/stats";
import type { BodyProfile, Completions, Habit, LadderState, MealLogs, RankId, StatId } from "@/lib/habits/types";
import { EXERCISES, type Exercise } from "@/lib/workout/exercises";
import { prescription, type Rx } from "@/lib/workout/ladder";

export const XP_PER_WORKOUT_SET = 12;
export const XP_WORKOUT_SHEET_BONUS = 100;
export const DAILY_QUEST_CLEAR_BONUS = 50;
export const WEEKLY_CONSISTENCY_BONUS = 100;

export type Achievement = {
  id: string;
  name: string;
  detail: string;
  unlocked: boolean;
};

export type CadenceSnapshot = {
  totalXp: number;
  level: number;
  xpCurrent: number;
  xpNeed: number;
  xpRatio: number;
  rank: RankId;
  rankTitle: string;
  stats: Record<StatId, number>;
  dailyDone: number;
  dailyTotal: number;
  dailyAllClear: boolean;
  weekRate: number;
  bestCurrentStreak: number;
  longestAnyStreak: number;
  ladderDoneToday: number;
  ladderTotal: number;
  ladderClearedToday: boolean;
  ladderStreak: number;
  ladderDaysTotal: number;
  kcalToday: number;
  kcalTarget: number;
  mealsToday: number;
  fuelStreak: number;
  burnTodayKcal: number;
  achievements: Achievement[];
};

export function rxFor(ladder: LadderState, ex: Exercise): Rx {
  return prescription(ex, ladder.offsets[ex.id] ?? 0, ladder.bonuses[ex.id] ?? 0);
}

export function isExerciseMet(ladder: LadderState, ex: Exercise, dateKey: string): boolean {
  const entry = ladder.days[dateKey]?.[ex.id];
  if (!entry) return false;
  const rx = rxFor(ladder, ex);
  return entry.sets.length >= rx.sets && entry.sets.every((reps) => reps >= rx.reps);
}

export function clearedStationsCount(ladder: LadderState, dateKey: string): number {
  return EXERCISES.filter((ex) => isExerciseMet(ladder, ex, dateKey)).length;
}

export function loggedSetsForDay(ladder: LadderState, dateKey: string): number {
  const day = ladder.days[dateKey];
  if (!day) return 0;
  return Object.values(day).reduce((sum, entry) => sum + entry.sets.length, 0);
}

/** Estimate kcal burned from logged ladder sets scaled by body weight. */
export function estimateDayBurnKcal(ladder: LadderState, dateKey: string, body: BodyProfile): number {
  const day = ladder.days[dateKey];
  if (!day) return 0;
  const kg = massToKg(body.mass, body.unit);
  const weightFactor = Math.max(0.6, kg / 75);
  let total = 0;
  for (const [id, entry] of Object.entries(day)) {
    const ex = EXERCISES.find((e) => e.id === id);
    const mult = ex?.section === "warm" || ex?.section === "cool" ? 4.5 : ex?.section === "super" ? 11.5 : 8.5;
    for (const reps of entry.sets) {
      const volume = Math.min(2.2, Math.max(0.5, reps / Math.max(1, ex?.goal ?? 15)));
      total += mult * volume * weightFactor;
    }
  }
  return Math.round(total);
}

export function burnSeriesForRange(
  ladder: LadderState,
  body: BodyProfile,
  range: "week" | "month",
  today = new Date(),
): { date: Date; key: string; kcal: number; sets: number; future: boolean }[] {
  const days = range === "week" ? weekDays(today) : monthDays(today);
  return days.map((date) => {
    const key = toDateKey(date);
    const future = isFutureDay(date, today);
    return {
      date,
      key,
      future,
      kcal: future ? 0 : estimateDayBurnKcal(ladder, key, body),
      sets: future ? 0 : loggedSetsForDay(ladder, key),
    };
  });
}

export function ladderStreakCount(ladder: LadderState, todayKey: string): { current: number; longest: number } {
  const map: Record<string, true> = {};
  for (const d of ladder.doneDays) map[d] = true;
  // Also count active training days with >= 3 logged sets for momentum
  for (const [d, log] of Object.entries(ladder.days)) {
    const sets = Object.values(log).reduce((s, e) => s + e.sets.length, 0);
    if (sets >= 3) map[d] = true;
  }
  return {
    current: currentStreak(map, todayKey),
    longest: longestStreak(map),
  };
}

function uniqueDates(completions: Completions): string[] {
  const set = new Set<string>();
  for (const map of Object.values(completions)) {
    for (const key of Object.keys(map)) set.add(key);
  }
  return [...set].sort();
}

export function computeProgression(
  habits: Habit[],
  completions: Completions,
  ladder: LadderState,
  meals: MealLogs,
  calorieTarget: number,
  body: BodyProfile,
  today = new Date(),
): CadenceSnapshot {
  const todayKey = toDateKey(today);
  const stats = emptyStatMap();
  let totalXp = 0;
  let totalQuestClears = 0;
  let longestAnyStreak = 0;
  let bestCurrentStreak = 0;

  for (const habit of habits) {
    const map = completions[habit.id];
    const count = map ? Object.keys(map).length : 0;
    totalQuestClears += count;
    totalXp += count * xpForQuest(habit.difficulty);
    stats[habit.stat] += count;
    longestAnyStreak = Math.max(longestAnyStreak, longestStreak(map));
    bestCurrentStreak = Math.max(bestCurrentStreak, currentStreak(map, todayKey));
  }

  let perfectQuestDays = 0;
  if (habits.length > 0) {
    for (const d of uniqueDates(completions)) {
      if (habits.every((h) => Boolean(completions[h.id]?.[d]))) {
        perfectQuestDays += 1;
      }
    }
  }
  totalXp += perfectQuestDays * DAILY_QUEST_CLEAR_BONUS;

  const week = weekDays(today).filter((d) => !isFutureDay(d, today));
  let weekDone = 0;
  for (const habit of habits) {
    for (const day of week) {
      if (completions[habit.id]?.[toDateKey(day)]) weekDone += 1;
    }
  }
  const weekPossible = habits.length * week.length;
  const weekRate = weekPossible === 0 ? 0 : weekDone / weekPossible;
  if (weekPossible > 0 && weekRate >= 0.8) totalXp += WEEKLY_CONSISTENCY_BONUS;

  // Workout Ladder XP & stats
  let totalWorkoutSets = 0;
  for (const log of Object.values(ladder.days)) {
    for (const entry of Object.values(log)) {
      totalWorkoutSets += entry.sets.length;
    }
  }
  totalXp += totalWorkoutSets * XP_PER_WORKOUT_SET;
  totalXp += ladder.doneDays.length * XP_WORKOUT_SHEET_BONUS;
  stats.body += Math.floor(totalWorkoutSets / 2);
  stats.energy += ladder.doneDays.length * 2;

  const ladderStreaks = ladderStreakCount(ladder, todayKey);
  longestAnyStreak = Math.max(longestAnyStreak, ladderStreaks.longest);
  bestCurrentStreak = Math.max(bestCurrentStreak, ladderStreaks.current);

  const ladderDoneToday = clearedStationsCount(ladder, todayKey);
  const ladderTotal = EXERCISES.length;
  const ladderClearedToday = ladderTotal > 0 && ladderDoneToday >= ladderTotal;

  // Fuel XP & stats
  totalXp += mealXp(meals);
  const fuel = fuelStreaks(meals, todayKey);
  stats.vitality += Object.values(meals).reduce((n, list) => n + list.length, 0);
  stats.energy += fuel.days;
  longestAnyStreak = Math.max(longestAnyStreak, fuel.longest);
  bestCurrentStreak = Math.max(bestCurrentStreak, fuel.current);

  const progress = progressFromXp(totalXp);
  const rank = rankFromLevel(progress.level);
  const dailyDone = habits.filter((h) => Boolean(completions[h.id]?.[todayKey])).length;
  const dailyAllClear = habits.length > 0 && dailyDone === habits.length;
  const summits = EXERCISES.filter((ex) => rxFor(ladder, ex).summit).length;

  const achievements: Achievement[] = [
    { id: "first_quest", name: "First Check", detail: "Complete a daily habit", unlocked: totalQuestClears >= 1 },
    { id: "first_set", name: "First Rep", detail: "Log your first ladder set", unlocked: totalWorkoutSets >= 1 },
    { id: "first_fuel", name: "Fuel Logged", detail: "Log 3 meals in a single day", unlocked: fuel.days >= 1 },
    { id: "perfect_day", name: "Clean Sweep", detail: "Clear all daily habits in one day", unlocked: perfectQuestDays >= 1 },
    { id: "full_sheet", name: "Sheet Cleared", detail: "Complete a full daily workout ladder", unlocked: ladder.doneDays.length >= 1 },
    { id: "streak_7", name: "Seven Straight", detail: "Hold a 7-day streak in any pillar", unlocked: longestAnyStreak >= 7 },
    { id: "summit_1", name: "Summit Reached", detail: "Push any exercise to 4 sets at goal", unlocked: summits >= 1 },
    { id: "rank_c", name: "Dialed In", detail: "Reach C-Rank (Level 10)", unlocked: progress.level >= 10 },
    { id: "rank_a", name: "Vanguard", detail: "Reach A-Rank (Level 28)", unlocked: progress.level >= 28 },
  ];

  return {
    totalXp,
    level: progress.level,
    xpCurrent: progress.current,
    xpNeed: progress.need,
    xpRatio: progress.ratio,
    rank: rank.id,
    rankTitle: rank.title,
    stats,
    dailyDone,
    dailyTotal: habits.length,
    dailyAllClear,
    weekRate,
    bestCurrentStreak,
    longestAnyStreak,
    ladderDoneToday,
    ladderTotal,
    ladderClearedToday,
    ladderStreak: ladderStreaks.current,
    ladderDaysTotal: ladder.doneDays.length,
    kcalToday: dayCalories(meals, todayKey),
    kcalTarget: calorieTarget,
    mealsToday: dayMealCount(meals, todayKey),
    fuelStreak: fuel.current,
    burnTodayKcal: estimateDayBurnKcal(ladder, todayKey, body),
    achievements,
  };
}
