import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, Dumbbell, Utensils } from "lucide-react";
import { HABIT_COLORS } from "@/lib/habits/colors";
import {
  formatMonthLabel,
  formatWeekRange,
  isFutureDay,
  isToday,
  monthCalendarGrid,
  shiftMonth,
  shiftWeek,
  toDateKey,
  weekdayLabel,
  weekDays,
} from "@/lib/habits/dates";
import { isFuelDay } from "@/lib/habits/meals";
import type { Completions, Habit, LadderState, MealLogs } from "@/lib/habits/types";
import { loggedSetsForDay } from "@/lib/progression";

export function HistoryView({
  habits,
  completions,
  ladder,
  meals,
  onToggleCompletion,
}: {
  habits: Habit[];
  completions: Completions;
  ladder: LadderState;
  meals: MealLogs;
  onToggleCompletion: (habitId: string, dateKey: string) => void;
}) {
  const [mode, setMode] = useState<"week" | "month">("week");
  const [anchor, setAnchor] = useState(() => new Date());
  const today = new Date();

  const days = weekDays(anchor);
  const grid = monthCalendarGrid(anchor);

  return (
    <div className="space-y-5">
      {/* Mode Switcher & Date Navigation */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex rounded-xl bg-surface p-1 ring-1 ring-line">
          {(["week", "month"] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setMode(id)}
              className={`h-8 rounded-lg px-4 text-xs font-semibold tracking-wider uppercase transition-colors ${
                mode === id ? "bg-primary text-primary-fg" : "text-muted hover:text-fg"
              }`}
            >
              {id}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setAnchor((d) => (mode === "week" ? shiftWeek(d, -1) : shiftMonth(d, -1)))}
            aria-label="Previous"
            className="grid size-8 place-items-center rounded-lg bg-surface text-muted ring-1 ring-line hover:text-fg"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="min-w-[116px] text-center text-xs font-medium text-fg">
            {mode === "week" ? formatWeekRange(anchor) : formatMonthLabel(anchor)}
          </span>
          <button
            type="button"
            onClick={() => setAnchor((d) => (mode === "week" ? shiftWeek(d, 1) : shiftMonth(d, 1)))}
            aria-label="Next"
            className="grid size-8 place-items-center rounded-lg bg-surface text-muted ring-1 ring-line hover:text-fg"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {mode === "week" ? (
        <section className="card overflow-hidden rounded-2xl p-4">
          {/* Header Row */}
          <div className="grid grid-cols-[minmax(0,1.4fr)_repeat(7,minmax(0,1fr))] items-center gap-1 pb-2.5 text-center">
            <span className="text-left text-[11px] font-medium tracking-wider text-faint uppercase">
              Pillar / Quest
            </span>
            {days.map((d) => (
              <div key={toDateKey(d)} className="flex flex-col items-center">
                <span className={`font-display text-xs uppercase ${isToday(d) ? "text-primary font-bold" : "text-muted"}`}>
                  {weekdayLabel(d, true)}
                </span>
                <span className="text-[10px] text-faint tabular-nums">{d.getDate()}</span>
              </div>
            ))}
          </div>

          {/* Workout Ladder Row */}
          <div className="grid grid-cols-[minmax(0,1.4fr)_repeat(7,minmax(0,1fr))] items-center gap-1 border-t border-line/60 py-2.5">
            <span className="flex items-center gap-1.5 truncate text-xs font-semibold text-ember">
              <Dumbbell className="size-3.5 shrink-0" />
              Ladder
            </span>
            {days.map((d) => {
              const key = toDateKey(d);
              const full = ladder.doneDays.includes(key);
              const sets = loggedSetsForDay(ladder, key);
              const future = isFutureDay(d, today);
              return (
                <div key={key} className="flex justify-center">
                  <span
                    title={full ? "Full sheet cleared" : sets > 0 ? `${sets} sets logged` : "Rest"}
                    className={`grid size-7 place-items-center rounded-lg text-[10px] font-semibold tabular-nums ${
                      future
                        ? "bg-bg/40 text-faint/30"
                        : full
                          ? "bg-ember text-ember-fg"
                          : sets > 0
                            ? "bg-ember/25 text-ember"
                            : "bg-raised/60 text-faint"
                    }`}
                  >
                    {full ? <Check className="size-3.5 stroke-[2.75]" /> : sets > 0 ? sets : "·"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Fuel Row */}
          <div className="grid grid-cols-[minmax(0,1.4fr)_repeat(7,minmax(0,1fr))] items-center gap-1 border-t border-line/60 py-2.5">
            <span className="flex items-center gap-1.5 truncate text-xs font-semibold text-amber">
              <Utensils className="size-3.5 shrink-0" />
              Fuel (3+)
            </span>
            {days.map((d) => {
              const key = toDateKey(d);
              const fuelled = isFuelDay(meals, key);
              const count = meals[key]?.length ?? 0;
              const future = isFutureDay(d, today);
              return (
                <div key={key} className="flex justify-center">
                  <span
                    className={`grid size-7 place-items-center rounded-lg text-[10px] font-semibold tabular-nums ${
                      future
                        ? "bg-bg/40 text-faint/30"
                        : fuelled
                          ? "bg-amber text-amber-fg"
                          : count > 0
                            ? "bg-amber/20 text-amber"
                            : "bg-raised/60 text-faint"
                    }`}
                  >
                    {fuelled ? <Check className="size-3.5 stroke-[2.75]" /> : count > 0 ? count : "·"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Habit Rows (Interactive) */}
          {habits.map((habit) => {
            const color = HABIT_COLORS[habit.color]?.dot ?? "#38d9a9";
            return (
              <div
                key={habit.id}
                className="grid grid-cols-[minmax(0,1.4fr)_repeat(7,minmax(0,1fr))] items-center gap-1 border-t border-line/60 py-2.5"
              >
                <span className="flex items-center gap-1.5 truncate pr-1 text-xs text-fg">
                  <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                  <span className="truncate">{habit.name}</span>
                </span>
                {days.map((d) => {
                  const key = toDateKey(d);
                  const future = isFutureDay(d, today);
                  const done = Boolean(completions[habit.id]?.[key]);
                  return (
                    <div key={key} className="flex justify-center">
                      <button
                        type="button"
                        disabled={future}
                        onClick={() => onToggleCompletion(habit.id, key)}
                        aria-label={`${habit.name} on ${key}`}
                        className={`grid size-7 place-items-center rounded-lg transition-transform active:scale-90 disabled:opacity-25 ${
                          done ? "bg-primary text-primary-fg" : "bg-raised/70 text-transparent hover:bg-raised"
                        }`}
                      >
                        <Check className="size-3.5 stroke-[2.75]" />
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </section>
      ) : (
        <section className="card rounded-2xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-display text-lg font-semibold tracking-wide text-fg uppercase">
              Combined Intensity
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-muted">
              <span>Low</span>
              <span className="size-2.5 rounded-sm bg-raised" />
              <span className="size-2.5 rounded-sm bg-primary/30" />
              <span className="size-2.5 rounded-sm bg-primary/65" />
              <span className="size-2.5 rounded-sm bg-primary" />
              <span>Peak</span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-medium text-faint uppercase">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((lbl) => (
              <span key={lbl}>{lbl}</span>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1.5">
            {grid.map((cell) => {
              const key = toDateKey(cell.date);
              const future = isFutureDay(cell.date, today);
              const qDone = habits.filter((h) => Boolean(completions[h.id]?.[key])).length;
              const qRatio = habits.length > 0 ? qDone / habits.length : 0;
              const wDone = ladder.doneDays.includes(key) ? 1 : loggedSetsForDay(ladder, key) > 0 ? 0.5 : 0;
              const fDone = isFuelDay(meals, key) ? 1 : 0;
              const score = future ? 0 : (qRatio + wDone + fDone) / 3;

              let bg = "bg-raised/50 text-faint";
              if (!cell.inMonth) bg = "bg-bg/30 text-faint/25";
              else if (score >= 0.8) bg = "bg-primary text-primary-fg font-semibold";
              else if (score >= 0.45) bg = "bg-primary/55 text-fg";
              else if (score > 0.1) bg = "bg-primary/25 text-fg";

              return (
                <div
                  key={key}
                  className={`flex aspect-square flex-col items-center justify-center rounded-xl text-xs tabular-nums ${bg} ${
                    isToday(cell.date) ? "ring-2 ring-ember ring-offset-1 ring-offset-surface" : ""
                  }`}
                >
                  <span>{cell.date.getDate()}</span>
                  {cell.inMonth && !future && wDone > 0 ? (
                    <span className={`mt-0.5 size-1 rounded-full ${score >= 0.8 ? "bg-primary-fg" : "bg-ember"}`} />
                  ) : null}
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted">
            Cell intensity blends daily quest completion, workout ladder sets, and fuel targets. Dot marks workout days.
          </p>
        </section>
      )}
    </div>
  );
}
