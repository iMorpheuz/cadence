import { Check, Dumbbell, Flame, Pencil, Play, Plus, Trash2, Utensils } from "lucide-react";
import { HABIT_COLORS, STAT_META } from "@/lib/habits/colors";
import { todayKey } from "@/lib/habits/dates";
import { DIFFICULTIES } from "@/lib/habits/progress";
import { currentStreak } from "@/lib/habits/stats";
import type { Completions, Habit } from "@/lib/habits/types";
import type { CadenceSnapshot } from "@/lib/progression";

export function TodayView({
  habits,
  completions,
  snap,
  onToggleHabit,
  onAddHabit,
  onEditHabit,
  onDeleteHabit,
  onOpenTrain,
  onOpenFuel,
}: {
  habits: Habit[];
  completions: Completions;
  snap: CadenceSnapshot;
  onToggleHabit: (id: string) => void;
  onAddHabit: () => void;
  onEditHabit: (habit: Habit) => void;
  onDeleteHabit: (habit: Habit) => void;
  onOpenTrain: (resume?: boolean) => void;
  onOpenFuel: () => void;
}) {
  const today = todayKey();
  const questPct = snap.dailyTotal > 0 ? Math.round((snap.dailyDone / snap.dailyTotal) * 100) : 0;
  const ladderPct = snap.ladderTotal > 0 ? Math.round((snap.ladderDoneToday / snap.ladderTotal) * 100) : 0;
  const fuelPct = snap.kcalTarget > 0 ? Math.min(100, Math.round((snap.kcalToday / snap.kcalTarget) * 100)) : 0;

  return (
    <div className="space-y-5">
      {/* 3-Pillar Daily Pulse */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="card rounded-2xl p-3.5">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Quests</span>
            <span className="tabular-nums text-primary">{questPct}%</span>
          </div>
          <p className="mt-1.5 font-display text-3xl leading-none text-fg tabular-nums">
            {snap.dailyDone}
            <span className="text-lg text-faint">/{snap.dailyTotal}</span>
          </p>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-raised">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500"
              style={{ width: `${questPct}%` }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpenTrain(true)}
          className="card-interactive rounded-2xl p-3.5 text-left hover:bg-raised/40 active:scale-[0.98]"
        >
          <div className="flex items-center justify-between text-xs text-muted">
            <span className="flex items-center gap-1">
              <Dumbbell className="size-3.5 text-ember" />
              Ladder
            </span>
            <span className="tabular-nums text-ember">{ladderPct}%</span>
          </div>
          <p className="mt-1.5 font-display text-3xl leading-none text-fg tabular-nums">
            {snap.ladderDoneToday}
            <span className="text-lg text-faint">/{snap.ladderTotal}</span>
          </p>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-raised">
            <div
              className="h-full rounded-full bg-ember transition-[width] duration-500"
              style={{ width: `${ladderPct}%` }}
            />
          </div>
        </button>

        <button
          type="button"
          onClick={onOpenFuel}
          className="card-interactive rounded-2xl p-3.5 text-left hover:bg-raised/40 active:scale-[0.98]"
        >
          <div className="flex items-center justify-between text-xs text-muted">
            <span className="flex items-center gap-1">
              <Utensils className="size-3.5 text-amber" />
              Fuel
            </span>
            <span className="tabular-nums text-amber">{fuelPct}%</span>
          </div>
          <p className="mt-1.5 font-display text-3xl leading-none text-fg tabular-nums">
            {snap.kcalToday.toLocaleString()}
          </p>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-raised">
            <div
              className="h-full rounded-full bg-amber transition-[width] duration-500"
              style={{ width: `${fuelPct}%` }}
            />
          </div>
        </button>
      </div>

      {/* Quick Workout Launch Banner */}
      <div className="card flex items-center justify-between gap-4 rounded-2xl p-4">
        <div className="min-w-0">
          <p className="font-display text-xs font-semibold tracking-[0.18em] text-ember uppercase">
            Today&apos;s Workout Ladder
          </p>
          <p className="mt-0.5 text-sm font-medium text-fg">
            {snap.ladderClearedToday
              ? "Full sheet cleared — every station steps up tomorrow."
              : snap.ladderDoneToday === 0
                ? `${snap.ladderTotal} stations ready · animated form cues included`
                : `${snap.ladderDoneToday} of ${snap.ladderTotal} cleared · ~${snap.burnTodayKcal} kcal burned`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onOpenTrain(true)}
          className="glow-ember flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-ember px-4 text-xs font-semibold tracking-wide text-ember-fg uppercase transition-transform active:scale-95"
        >
          <Play className="size-3.5 fill-current" />
          {snap.ladderDoneToday > 0 && !snap.ladderClearedToday ? "Resume" : "Train"}
        </button>
      </div>

      {/* Daily Quests Section */}
      <section>
        <div className="mb-3 flex items-center justify-between px-0.5">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-wide text-fg uppercase">
              Daily Quests
            </h2>
            <p className="text-xs text-muted">
              {snap.dailyAllClear
                ? "All daily habits cleared · +50 XP bonus applied"
                : `${snap.dailyTotal - snap.dailyDone} remaining today · clear all for +50 XP`}
            </p>
          </div>
          <button
            type="button"
            onClick={onAddHabit}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-raised px-3 text-xs font-semibold text-fg transition-colors hover:bg-primary hover:text-primary-fg"
          >
            <Plus className="size-3.5" />
            New Quest
          </button>
        </div>

        {habits.length === 0 ? (
          <div className="card rounded-2xl px-6 py-10 text-center">
            <p className="font-display text-xl text-fg">No daily quests yet</p>
            <p className="mt-1 text-sm text-muted">Add your core daily habits to start earning XP and streaks.</p>
            <button
              type="button"
              onClick={onAddHabit}
              className="glow-primary mt-4 h-10 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-fg"
            >
              Create first quest
            </button>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {habits.map((habit) => {
              const done = Boolean(completions[habit.id]?.[today]);
              const streak = currentStreak(completions[habit.id], today);
              const colorMeta = HABIT_COLORS[habit.color] ?? HABIT_COLORS.mint;
              const statMeta = STAT_META[habit.stat];
              const diff = DIFFICULTIES[habit.difficulty];

              return (
                <li
                  key={habit.id}
                  className={`card group flex items-center gap-3 rounded-2xl px-3.5 py-3 transition-opacity ${
                    done ? "opacity-75" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onToggleHabit(habit.id)}
                    aria-pressed={done}
                    aria-label={`Toggle ${habit.name}`}
                    className={`grid size-8 shrink-0 place-items-center rounded-xl border transition-all active:scale-90 ${
                      done
                        ? "border-primary bg-primary text-primary-fg"
                        : "border-line bg-raised text-transparent hover:border-primary/60"
                    }`}
                  >
                    <Check className="size-4 stroke-[2.75]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleHabit(habit.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: colorMeta.dot }}
                      />
                      <span
                        className={`truncate text-sm font-medium ${
                          done ? "text-muted line-through" : "text-fg"
                        }`}
                      >
                        {habit.name}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-muted">
                      <span style={{ color: statMeta.color }}>{statMeta.label}</span>
                      <span className="text-faint">·</span>
                      <span className="tabular-nums">+{diff.xp} XP</span>
                      {streak > 0 ? (
                        <>
                          <span className="text-faint">·</span>
                          <span className="flex items-center gap-0.5 text-fg tabular-nums">
                            <Flame className="size-3 text-ember" />
                            {streak}d
                          </span>
                        </>
                      ) : null}
                    </div>
                  </button>

                  <div className="flex shrink-0 items-center gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => onEditHabit(habit)}
                      aria-label={`Edit ${habit.name}`}
                      className="grid size-8 place-items-center rounded-lg text-faint hover:bg-raised hover:text-fg"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteHabit(habit)}
                      aria-label={`Delete ${habit.name}`}
                      className="grid size-8 place-items-center rounded-lg text-faint hover:bg-raised hover:text-danger"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
