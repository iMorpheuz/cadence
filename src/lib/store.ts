import { subDays } from "date-fns";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { toDateKey, todayKey } from "@/lib/habits/dates";
import { createDemoMeals, DEFAULT_CALORIE_TARGET } from "@/lib/habits/meals";
import { DEFAULT_BODY, normalizeBody } from "@/lib/habits/physique";
import type {
  BodyProfile,
  Completions,
  DifficultyId,
  Habit,
  HabitColorId,
  LadderState,
  MealEntry,
  MealLogs,
  StatId,
} from "@/lib/habits/types";
import { isExerciseMet, rxFor } from "@/lib/progression";
import { EXERCISES, jumpOffsets } from "@/lib/workout/exercises";
import { nextOffset } from "@/lib/workout/ladder";

type CadenceStore = {
  habits: Habit[];
  completions: Completions;
  ladder: LadderState;
  meals: MealLogs;
  calorieTarget: number;
  body: BodyProfile;
  hydrated: boolean;

  // Habits / Quests
  addHabit: (input: { name: string; color: HabitColorId; stat: StatId; difficulty: DifficultyId }) => string;
  updateHabit: (id: string, patch: Partial<Pick<Habit, "name" | "color" | "stat" | "difficulty">>) => void;
  deleteHabit: (id: string) => void;
  toggleCompletion: (habitId: string, dateKey: string) => boolean;

  // Workout Daily Ladder
  rollLadder: () => void;
  clearLadderSet: (exerciseId: string, reps: number) => { stationCleared: boolean; sheetCleared: boolean };
  undoLadderSet: (exerciseId: string) => void;
  raiseLadderSummit: (exerciseId: string) => void;
  retargetLadder: (mode: "build" | "ink") => void;
  resetLadderAll: () => void;

  // Fuel
  addMeal: (dateKey: string, input: Omit<MealEntry, "id">) => string;
  updateMeal: (dateKey: string, id: string, patch: Partial<Omit<MealEntry, "id">>) => void;
  deleteMeal: (dateKey: string, id: string) => void;
  setCalorieTarget: (kcal: number) => void;

  // Physique
  setBody: (patch: Partial<BodyProfile>) => void;

  // Hydration
  setHydrated: () => void;
};

function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function shouldCompleteDemo(habitIndex: number, daysAgo: number): boolean {
  if (daysAgo === 0) return habitIndex === 0 || habitIndex === 2;
  if (daysAgo === 1) return true;
  const n = daysAgo * 7 + habitIndex * 13;
  if (habitIndex === 0) return n % 6 !== 0;
  if (habitIndex === 1) return n % 5 !== 0 && daysAgo !== 4;
  if (habitIndex === 2) return n % 4 !== 0;
  if (habitIndex === 3) return n % 3 !== 0 && daysAgo % 7 !== 3;
  return n % 5 !== 1;
}

function createDemoHabits(): { habits: Habit[]; completions: Completions } {
  const today = new Date();
  const createdAt = toDateKey(subDays(today, 30));
  const habits: Habit[] = [
    { id: "deep-work", name: "90m deep work block", color: "mint", stat: "focus", difficulty: "hard", createdAt },
    { id: "morning-walk", name: "Morning sunlight walk", color: "ember", stat: "body", difficulty: "normal", createdAt },
    { id: "hydrate", name: "3L water & electrolytes", color: "sky", stat: "vitality", difficulty: "easy", createdAt },
    { id: "read-20", name: "Read 20 pages", color: "amber", stat: "mind", difficulty: "normal", createdAt },
    { id: "shutdown", name: "Evening plan & stretch", color: "sand", stat: "energy", difficulty: "easy", createdAt },
  ];
  const completions: Completions = {};
  for (const [index, habit] of habits.entries()) {
    const map: Record<string, true> = {};
    for (let daysAgo = 0; daysAgo <= 30; daysAgo += 1) {
      if (shouldCompleteDemo(index, daysAgo)) {
        map[toDateKey(subDays(today, daysAgo))] = true;
      }
    }
    completions[habit.id] = map;
  }
  return { habits, completions };
}

function createDemoLadder(): LadderState {
  const today = new Date();
  const offsets = jumpOffsets("build");
  const days: LadderState["days"] = {};
  const doneDays: string[] = [];

  // Seed realistic recent workout history over past 6 days
  for (let ago = 6; ago >= 1; ago -= 1) {
    const key = toDateKey(subDays(today, ago));
    if (ago === 3) continue; // rest day
    const dayLog: Record<string, { sets: number[] }> = {};
    const takeCount = ago === 1 || ago === 4 ? EXERCISES.length : Math.min(8, EXERCISES.length);
    for (let i = 0; i < takeCount; i += 1) {
      const ex = EXERCISES[i]!;
      dayLog[ex.id] = { sets: [ex.start] };
    }
    days[key] = dayLog;
    if (takeCount === EXERCISES.length) doneDays.push(key);
  }

  // Seed 2 warm-up exercises done today so the user sees live progress immediately
  const todayStr = toDateKey(today);
  const todayLog: Record<string, { sets: number[] }> = {};
  for (const ex of EXERCISES.slice(0, 2)) {
    todayLog[ex.id] = { sets: [ex.start] };
  }
  days[todayStr] = todayLog;

  return {
    mode: "build",
    offsets,
    bonuses: {},
    clearedOn: {
      [EXERCISES[0]!.id]: todayStr,
      [EXERCISES[1]!.id]: todayStr,
    },
    days,
    doneDays,
    lastRoll: todayStr,
  };
}

function rollLadderState(ladder: LadderState): LadderState {
  const today = todayKey();
  if (ladder.lastRoll === today) return ladder;
  const next: LadderState = {
    ...ladder,
    offsets: { ...ladder.offsets },
    clearedOn: { ...ladder.clearedOn },
    lastRoll: today,
  };
  for (const [id, date] of Object.entries(ladder.clearedOn)) {
    if (date >= today) continue;
    const ex = EXERCISES.find((item) => item.id === id);
    if (ex) next.offsets[id] = nextOffset(ex, ladder.offsets[id] ?? 0, ladder.bonuses[id] ?? 0);
    delete next.clearedOn[id];
  }
  return next;
}

function syncDoneDays(ladder: LadderState, today: string): LadderState {
  const full = EXERCISES.every((ex) => isExerciseMet(ladder, ex, today));
  const has = ladder.doneDays.includes(today);
  if (full === has) return ladder;
  return {
    ...ladder,
    doneDays: full ? [...ladder.doneDays, today] : ladder.doneDays.filter((d) => d !== today),
  };
}

const DEMO_HABITS = createDemoHabits();
const DEMO_LADDER = createDemoLadder();
const DEMO_MEALS = createDemoMeals();

export const useCadenceStore = create<CadenceStore>()(
  persist(
    (set) => ({
      habits: DEMO_HABITS.habits,
      completions: DEMO_HABITS.completions,
      ladder: DEMO_LADDER,
      meals: DEMO_MEALS,
      calorieTarget: DEFAULT_CALORIE_TARGET,
      body: DEFAULT_BODY,
      hydrated: false,

      addHabit: (input) => {
        const id = newId("h");
        const habit: Habit = {
          id,
          name: input.name.trim(),
          color: input.color,
          stat: input.stat,
          difficulty: input.difficulty,
          createdAt: todayKey(),
        };
        set((s) => ({ habits: [...s.habits, habit] }));
        return id;
      },

      updateHabit: (id, patch) => {
        set((s) => ({
          habits: s.habits.map((h) =>
            h.id === id
              ? {
                  ...h,
                  name: patch.name !== undefined ? patch.name.trim() : h.name,
                  color: patch.color ?? h.color,
                  stat: patch.stat ?? h.stat,
                  difficulty: patch.difficulty ?? h.difficulty,
                }
              : h,
          ),
        }));
      },

      deleteHabit: (id) => {
        set((s) => {
          const completions = { ...s.completions };
          delete completions[id];
          return {
            habits: s.habits.filter((h) => h.id !== id),
            completions,
          };
        });
      },

      toggleCompletion: (habitId, dateKey) => {
        let becameComplete = false;
        set((s) => {
          const prev = s.completions[habitId] ?? {};
          const next = { ...prev };
          if (next[dateKey]) {
            delete next[dateKey];
            becameComplete = false;
          } else {
            next[dateKey] = true;
            becameComplete = true;
          }
          return { completions: { ...s.completions, [habitId]: next } };
        });
        return becameComplete;
      },

      rollLadder: () => {
        set((s) => ({ ladder: rollLadderState(s.ladder) }));
      },

      clearLadderSet: (exerciseId, reps) => {
        let stationCleared = false;
        let sheetCleared = false;
        set((s) => {
          const today = todayKey();
          const ex = EXERCISES.find((e) => e.id === exerciseId);
          if (!ex) return s;
          const rx = rxFor(s.ladder, ex);
          const day = { ...(s.ladder.days[today] ?? {}) };
          const prevSets = day[exerciseId]?.sets ?? [];
          if (prevSets.length >= rx.sets) return s;

          const sets = [...prevSets, Math.max(0, Math.round(reps))];
          day[exerciseId] = { sets };
          const clearedOn = { ...s.ladder.clearedOn };
          const wasCleared = isExerciseMet(s.ladder, ex, today);
          const isNowCleared = sets.length >= rx.sets && sets.every((n) => n >= rx.reps);
          if (isNowCleared) {
            clearedOn[exerciseId] = today;
            if (!wasCleared) stationCleared = true;
          } else {
            delete clearedOn[exerciseId];
          }

          const wasSheetDone = s.ladder.doneDays.includes(today);
          const updated = syncDoneDays(
            {
              ...s.ladder,
              days: { ...s.ladder.days, [today]: day },
              clearedOn,
            },
            today,
          );
          if (!wasSheetDone && updated.doneDays.includes(today)) {
            sheetCleared = true;
          }
          return { ladder: updated };
        });
        return { stationCleared, sheetCleared };
      },

      undoLadderSet: (exerciseId) => {
        set((s) => {
          const today = todayKey();
          const day = { ...(s.ladder.days[today] ?? {}) };
          const prev = day[exerciseId]?.sets ?? [];
          if (!prev.length) return s;
          const sets = prev.slice(0, -1);
          if (sets.length) day[exerciseId] = { sets };
          else delete day[exerciseId];
          const clearedOn = { ...s.ladder.clearedOn };
          delete clearedOn[exerciseId];
          const updated = syncDoneDays(
            {
              ...s.ladder,
              days: { ...s.ladder.days, [today]: day },
              clearedOn,
            },
            today,
          );
          return { ladder: updated };
        });
      },

      raiseLadderSummit: (exerciseId) => {
        set((s) => {
          const ex = EXERCISES.find((e) => e.id === exerciseId);
          if (!ex || ex.steady) return s;
          return {
            ladder: {
              ...s.ladder,
              bonuses: {
                ...s.ladder.bonuses,
                [exerciseId]: (s.ladder.bonuses[exerciseId] ?? 0) + ex.step,
              },
            },
          };
        });
      },

      retargetLadder: (mode) => {
        set((s) => {
          const today = todayKey();
          const days = { ...s.ladder.days };
          days[today] = {};
          const updated = syncDoneDays(
            {
              ...s.ladder,
              mode,
              offsets: jumpOffsets(mode),
              clearedOn: {},
              days,
            },
            today,
          );
          return { ladder: updated };
        });
      },

      resetLadderAll: () => {
        set(() => ({
          ladder: {
            mode: "build",
            offsets: jumpOffsets("build"),
            bonuses: {},
            clearedOn: {},
            days: {},
            doneDays: [],
            lastRoll: todayKey(),
          },
        }));
      },

      addMeal: (dateKey, input) => {
        const id = newId("m");
        const entry: MealEntry = {
          id,
          name: input.name.trim(),
          slot: input.slot,
          kcal: Math.max(1, Math.round(input.kcal)),
          servings: Math.max(0.25, Math.round(input.servings * 100) / 100),
          foodId: input.foodId,
        };
        set((s) => ({
          meals: {
            ...s.meals,
            [dateKey]: [...(s.meals[dateKey] ?? []), entry],
          },
        }));
        return id;
      },

      updateMeal: (dateKey, id, patch) => {
        set((s) => {
          const list = s.meals[dateKey] ?? [];
          return {
            meals: {
              ...s.meals,
              [dateKey]: list.map((m) =>
                m.id === id
                  ? {
                      ...m,
                      name: patch.name !== undefined ? patch.name.trim() : m.name,
                      slot: patch.slot ?? m.slot,
                      kcal: patch.kcal !== undefined ? Math.max(1, Math.round(patch.kcal)) : m.kcal,
                      servings: patch.servings ?? m.servings,
                      foodId: patch.foodId !== undefined ? patch.foodId : m.foodId,
                    }
                  : m,
              ),
            },
          };
        });
      },

      deleteMeal: (dateKey, id) => {
        set((s) => ({
          meals: {
            ...s.meals,
            [dateKey]: (s.meals[dateKey] ?? []).filter((m) => m.id !== id),
          },
        }));
      },

      setCalorieTarget: (kcal) => {
        set({ calorieTarget: Math.min(8000, Math.max(800, Math.round(kcal))) });
      },

      setBody: (patch) => {
        set((s) => ({ body: normalizeBody({ ...s.body, ...patch }) }));
      },

      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "cadence-v1",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.rollLadder();
        state?.setHydrated();
      },
    },
  ),
);
