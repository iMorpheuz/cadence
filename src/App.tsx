import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, CheckCircle2, Dumbbell, Flame, Utensils } from "lucide-react";
import { Toaster, toast } from "sonner";
import { FuelView } from "@/components/fuel-view";
import { HistoryView } from "@/components/history-view";
import { MealDialog } from "@/components/meal-dialog";
import { PhysiqueDialog } from "@/components/physique-dialog";
import { ProfileDrawer } from "@/components/profile-drawer";
import { QuestDialog } from "@/components/quest-dialog";
import { TodayView } from "@/components/today-view";
import { TrainView, type TrainSubView } from "@/components/train-view";
import { todayKey } from "@/lib/habits/dates";
import { foodById } from "@/lib/habits/foods";
import { XP_PER_MEAL } from "@/lib/habits/meals";
import { DIFFICULTIES, rankIndex } from "@/lib/habits/progress";
import type { Habit, MealEntry, MealSlot, NavTab } from "@/lib/habits/types";
import { computeProgression, isExerciseMet, XP_PER_WORKOUT_SET, XP_WORKOUT_SHEET_BONUS } from "@/lib/progression";
import { useCadenceStore } from "@/lib/store";
import { EXERCISES } from "@/lib/workout/exercises";

function slotForHour(date = new Date()): MealSlot {
  const hour = date.getHours();
  if (hour < 11) return "breakfast";
  if (hour < 15) return "lunch";
  if (hour < 21) return "dinner";
  return "snack";
}

const NAV_ITEMS: { id: NavTab; label: string; icon: typeof CheckCircle2; accent: string }[] = [
  { id: "today", label: "Today", icon: CheckCircle2, accent: "text-primary" },
  { id: "train", label: "Train", icon: Dumbbell, accent: "text-ember" },
  { id: "fuel", label: "Fuel", icon: Utensils, accent: "text-amber" },
  { id: "history", label: "History", icon: CalendarDays, accent: "text-primary" },
];

export function App() {
  const habits = useCadenceStore((s) => s.habits);
  const completions = useCadenceStore((s) => s.completions);
  const ladder = useCadenceStore((s) => s.ladder);
  const meals = useCadenceStore((s) => s.meals);
  const calorieTarget = useCadenceStore((s) => s.calorieTarget);
  const body = useCadenceStore((s) => s.body);
  const hydrated = useCadenceStore((s) => s.hydrated);

  const [tab, setTab] = useState<NavTab>("today");
  const [trainSubView, setTrainSubView] = useState<TrainSubView>("sheet");
  const [activeExerciseId, setActiveExerciseId] = useState(EXERCISES[0]!.id);
  const [fuelDay, setFuelDay] = useState(() => todayKey());

  const [profileOpen, setProfileOpen] = useState(false);
  const [questOpen, setQuestOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [mealOpen, setMealOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<MealEntry | null>(null);
  const [mealSlot, setMealSlot] = useState<MealSlot>(() => slotForHour());
  const [physiqueOpen, setPhysiqueOpen] = useState(false);

  const snap = useMemo(
    () => computeProgression(habits, completions, ladder, meals, calorieTarget, body, new Date()),
    [habits, completions, ladder, meals, calorieTarget, body],
  );

  // Level-up & Rank-up celebrations
  const ready = useRef(false);
  const prevLevel = useRef(snap.level);
  const prevRank = useRef(snap.rank);

  useEffect(() => {
    if (!hydrated) return;
    if (!ready.current) {
      ready.current = true;
      prevLevel.current = snap.level;
      prevRank.current = snap.rank;
      return;
    }
    if (rankIndex(snap.rank) > rankIndex(prevRank.current)) {
      toast.success(`Rank Up · ${snap.rank}-Rank (${snap.rankTitle})`, {
        description: `Reached Level ${snap.level} with ${snap.totalXp.toLocaleString()} XP.`,
      });
    } else if (snap.level > prevLevel.current) {
      toast.success(`Level ${snap.level} Reached`, {
        description: `${snap.totalXp.toLocaleString()} total XP across quests, training, and fuel.`,
      });
    }
    prevLevel.current = snap.level;
    prevRank.current = snap.rank;
  }, [hydrated, snap.level, snap.rank, snap.rankTitle, snap.totalXp]);

  const dateLabel = useMemo(
    () => new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
    [],
  );

  function handleToggleHabit(habitId: string, dateKey = todayKey()) {
    const habit = habits.find((h) => h.id === habitId);
    const became = useCadenceStore.getState().toggleCompletion(habitId, dateKey);
    if (became && habit && dateKey === todayKey()) {
      toast(`Quest cleared · +${DIFFICULTIES[habit.difficulty].xp} XP`, {
        description: habit.name,
      });
    }
  }

  function handleClearSet(exerciseId: string, reps: number) {
    const ex = EXERCISES.find((e) => e.id === exerciseId);
    const { stationCleared, sheetCleared } = useCadenceStore.getState().clearLadderSet(exerciseId, reps);
    if (sheetCleared) {
      toast.success(`Full Sheet Cleared · +${XP_WORKOUT_SHEET_BONUS} XP`, {
        description: "Every station steps up tomorrow.",
      });
    } else if (stationCleared && ex) {
      toast(`${ex.name} cleared · +${XP_PER_WORKOUT_SET} XP`, {
        description: "Target met — rung advances tomorrow.",
      });
    } else if (ex) {
      toast(`Set logged · +${XP_PER_WORKOUT_SET} XP`, {
        description: `${ex.name} · ${reps} logged`,
      });
    }
  }

  function handleQuickLog(foodId: string) {
    const food = foodById(foodId);
    if (!food) return;
    useCadenceStore.getState().addMeal(fuelDay, {
      name: food.name,
      slot: slotForHour(),
      kcal: food.kcal,
      servings: 1,
      foodId: food.id,
    });
    toast(`Fuel logged · +${XP_PER_MEAL} XP`, {
      description: `${food.name} · ${food.kcal} kcal`,
    });
  }

  function openTrain(resume = false) {
    if (resume) {
      const today = todayKey();
      const next = EXERCISES.find((ex) => !isExerciseMet(ladder, ex, today))?.id ?? EXERCISES[0]!.id;
      setActiveExerciseId(next);
      setTrainSubView("runner");
    } else {
      setTrainSubView("sheet");
    }
    setTab("train");
  }

  return (
    <div className="min-h-dvh pb-[max(5.5rem,env(safe-area-inset-bottom))]">
      <Toaster
        theme="dark"
        position="top-center"
        toastOptions={{
          style: {
            background: "#13171e",
            border: "1px solid #272f3c",
            color: "#f3f0e8",
          },
        }}
      />

      <div className="mx-auto max-w-2xl px-4 pt-5 sm:px-5">
        {/* Studio Progression Header */}
        <header className="mb-5 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-display text-3xl leading-none font-bold tracking-[0.08em] text-fg">
                CADENCE
              </h1>
              <span className="text-xs text-faint">{dateLabel}</span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-raised">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500"
                  style={{ width: `${Math.min(100, Math.round(snap.xpRatio * 100))}%` }}
                />
              </div>
              <span className="text-[11px] text-muted tabular-nums">
                Lv.{snap.level} · {snap.xpCurrent}/{snap.xpNeed} XP
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            className="card-interactive flex items-center gap-2.5 rounded-2xl px-3 py-2 text-left hover:bg-raised/60 active:scale-95"
            aria-label="Open rank and stats profile"
          >
            <div className="grid size-9 place-items-center rounded-xl bg-primary/15 font-display text-2xl leading-none font-bold text-primary">
              {snap.rank}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-fg leading-tight">{snap.rankTitle}</p>
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted tabular-nums">
                <Flame className="size-3 text-ember" />
                {snap.bestCurrentStreak}d streak
              </p>
            </div>
          </button>
        </header>

        {/* Main Content Area */}
        <main>
          {tab === "today" ? (
            <TodayView
              habits={habits}
              completions={completions}
              snap={snap}
              onToggleHabit={(id) => handleToggleHabit(id)}
              onAddHabit={() => {
                setEditingHabit(null);
                setQuestOpen(true);
              }}
              onEditHabit={(habit) => {
                setEditingHabit(habit);
                setQuestOpen(true);
              }}
              onDeleteHabit={(habit) => {
                useCadenceStore.getState().deleteHabit(habit.id);
                toast("Quest removed", { description: habit.name });
              }}
              onOpenTrain={openTrain}
              onOpenFuel={() => setTab("fuel")}
            />
          ) : null}

          {tab === "train" ? (
            <TrainView
              ladder={ladder}
              body={body}
              subView={trainSubView}
              activeId={activeExerciseId}
              onSubView={setTrainSubView}
              onActiveId={setActiveExerciseId}
              onClearSet={handleClearSet}
              onUndoSet={(id) => useCadenceStore.getState().undoLadderSet(id)}
              onRaiseSummit={(id) => {
                useCadenceStore.getState().raiseLadderSummit(id);
                toast("Summit raised", { description: "Target goal stepped up." });
              }}
              onRetarget={(mode) => {
                useCadenceStore.getState().retargetLadder(mode);
                toast(mode === "build" ? "Reset to Build-Up rungs" : "Jumped to Ink goals");
              }}
              onResetLadder={() => {
                useCadenceStore.getState().resetLadderAll();
                toast("Workout ladder reset");
              }}
              onEditBody={() => setPhysiqueOpen(true)}
            />
          ) : null}

          {tab === "fuel" ? (
            <FuelView
              meals={meals}
              calorieTarget={calorieTarget}
              dayKey={fuelDay}
              onSelectDay={setFuelDay}
              onAddMeal={(slot) => {
                setEditingMeal(null);
                setMealSlot(slot ?? slotForHour());
                setMealOpen(true);
              }}
              onEditMeal={(meal) => {
                setEditingMeal(meal);
                setMealSlot(meal.slot);
                setMealOpen(true);
              }}
              onDeleteMeal={(meal) => {
                useCadenceStore.getState().deleteMeal(fuelDay, meal.id);
                toast("Meal removed", { description: meal.name });
              }}
              onQuickLog={handleQuickLog}
              onSaveTarget={(kcal) => {
                useCadenceStore.getState().setCalorieTarget(kcal);
                toast("Calorie target updated", { description: `${kcal.toLocaleString()} kcal / day` });
              }}
            />
          ) : null}

          {tab === "history" ? (
            <HistoryView
              habits={habits}
              completions={completions}
              ladder={ladder}
              meals={meals}
              onToggleCompletion={(habitId, dateKey) => handleToggleHabit(habitId, dateKey)}
            />
          ) : null}
        </main>
      </div>

      {/* Persistent Bottom Navigation */}
      <nav
        aria-label="Primary navigation"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line/70 bg-bg/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-2xl">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === "train" && tab === "train" && trainSubView === "runner") {
                    setTrainSubView("sheet");
                  }
                  setTab(item.id);
                }}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-16 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                  active ? item.accent : "text-faint hover:text-muted"
                }`}
              >
                <span
                  className={`grid h-7 w-12 place-items-center rounded-full transition-colors ${
                    active ? "bg-raised" : ""
                  }`}
                >
                  <Icon className="size-4.5" />
                </span>
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Modals & Drawers */}
      <ProfileDrawer open={profileOpen} onClose={() => setProfileOpen(false)} snap={snap} />

      <QuestDialog
        open={questOpen}
        onClose={() => setQuestOpen(false)}
        initial={editingHabit}
        onSave={(input) => {
          if (editingHabit) {
            useCadenceStore.getState().updateHabit(editingHabit.id, input);
            toast("Quest updated", { description: input.name });
          } else {
            useCadenceStore.getState().addHabit(input);
            toast("Quest added", { description: `${input.name} · +${DIFFICULTIES[input.difficulty].xp} XP` });
          }
          setEditingHabit(null);
        }}
      />

      <MealDialog
        open={mealOpen}
        onClose={() => setMealOpen(false)}
        initial={editingMeal}
        defaultSlot={mealSlot}
        onSave={(input) => {
          if (editingMeal) {
            useCadenceStore.getState().updateMeal(fuelDay, editingMeal.id, input);
            toast("Meal updated", { description: `${input.name} · ${input.kcal} kcal` });
          } else {
            useCadenceStore.getState().addMeal(fuelDay, input);
            toast(`Fuel logged · +${XP_PER_MEAL} XP`, { description: `${input.name} · ${input.kcal} kcal` });
          }
          setEditingMeal(null);
        }}
      />

      <PhysiqueDialog
        open={physiqueOpen}
        onClose={() => setPhysiqueOpen(false)}
        profile={body}
        onSave={(next) => {
          useCadenceStore.getState().setBody(next);
          toast("Physique profile saved");
        }}
      />
    </div>
  );
}

export default App;
