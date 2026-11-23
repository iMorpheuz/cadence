import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import {
  Check,
  ChevronLeft,
  Flame,
  Minus,
  Play,
  Plus,
  Timer,
  Undo2,
} from "lucide-react";
import { FormLoop } from "@/components/form-loop";
import { todayKey, weekdayLabel } from "@/lib/habits/dates";
import { bmiBand, bmiFrom, formatBmi, formatMass, gapKcal, weeksToGoal } from "@/lib/habits/physique";
import type { BodyProfile, LadderState } from "@/lib/habits/types";
import {
  burnSeriesForRange,
  clearedStationsCount,
  isExerciseMet,
  ladderStreakCount,
  rxFor,
} from "@/lib/progression";
import { EXERCISES, SECTIONS, formatTarget, unitWord, type Exercise } from "@/lib/workout/exercises";
import { nextOffset, prescription, rungLabel } from "@/lib/workout/ladder";

export type TrainSubView = "sheet" | "runner" | "forms" | "ladder";

function Ring({
  value,
  total,
  size = 76,
  children,
}: {
  value: number;
  total: number;
  size?: number;
  children?: ReactNode;
}) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const frac = total <= 0 ? 0 : Math.max(0, Math.min(1, value / total));
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg className="absolute inset-0 size-full" viewBox="0 0 72 72" aria-hidden>
        <circle cx="36" cy="36" r={r} fill="none" strokeWidth="5" className="stroke-raised" />
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          strokeWidth="5"
          strokeLinecap={frac > 0 ? "round" : "butt"}
          className="stroke-ember transition-[stroke-dasharray] duration-500 ease-out"
          strokeDasharray={`${c * frac} ${c}`}
          transform="rotate(-90 36 36)"
        />
      </svg>
      <div className="relative text-center">{children}</div>
    </div>
  );
}

function groups(list: Exercise[]) {
  const out: Exercise[][] = [];
  for (const ex of list) {
    const prev = out[out.length - 1];
    if (prev && ex.pair && prev[0]?.pair === ex.pair) prev.push(ex);
    else out.push([ex]);
  }
  return out;
}

function minutesFor(ladder: LadderState) {
  const seconds = EXERCISES.reduce((sum, ex) => {
    const rx = rxFor(ladder, ex);
    return sum + rx.sets * (28 + Math.max(ex.rest, 12));
  }, 0);
  return Math.max(12, Math.round(seconds / 60));
}

function firstOpenId(ladder: LadderState, today: string) {
  return EXERCISES.find((ex) => !isExerciseMet(ladder, ex, today))?.id ?? EXERCISES[0]!.id;
}

export function TrainView({
  ladder,
  body,
  subView,
  activeId,
  onSubView,
  onActiveId,
  onClearSet,
  onUndoSet,
  onRaiseSummit,
  onRetarget,
  onResetLadder,
  onEditBody,
}: {
  ladder: LadderState;
  body: BodyProfile;
  subView: TrainSubView;
  activeId: string;
  onSubView: (v: TrainSubView) => void;
  onActiveId: (id: string) => void;
  onClearSet: (exerciseId: string, reps: number) => void;
  onUndoSet: (exerciseId: string) => void;
  onRaiseSummit: (exerciseId: string) => void;
  onRetarget: (mode: "build" | "ink") => void;
  onResetLadder: () => void;
  onEditBody: () => void;
}) {
  const today = todayKey();
  const [burnRange, setBurnRange] = useState<"week" | "month">("week");
  const [confirmMode, setConfirmMode] = useState<null | "build" | "ink" | "wipe">(null);

  if (subView === "runner") {
    return (
      <ExerciseRunner
        ladder={ladder}
        activeId={activeId}
        today={today}
        onActiveId={onActiveId}
        onBack={() => onSubView("sheet")}
        onClearSet={onClearSet}
        onUndoSet={onUndoSet}
      />
    );
  }

  const done = clearedStationsCount(ladder, today);
  const total = EXERCISES.length;
  const streaks = ladderStreakCount(ladder, today);

  return (
    <div className="space-y-5">
      {/* Train Sub-Navigation */}
      <div className="flex rounded-xl bg-surface p-1 ring-1 ring-line">
        {(
          [
            { id: "sheet", label: "Daily Sheet" },
            { id: "forms", label: "Form Demos" },
            { id: "ladder", label: "Ladder & Burn" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSubView(tab.id)}
            className={`h-9 flex-1 rounded-lg text-xs font-semibold tracking-wider uppercase transition-colors ${
              subView === tab.id ? "bg-ember text-ember-fg" : "text-muted hover:text-fg"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {subView === "sheet" ? (
        <div className="space-y-5">
          {/* Progress Ring Summary */}
          <div className="card flex items-center gap-4 rounded-2xl p-4">
            <Ring value={done} total={total} size={88}>
              <span className="block font-display text-3xl leading-none text-fg tabular-nums">{done}</span>
              <span className="block text-[10px] tracking-widest text-faint uppercase">of {total}</span>
            </Ring>
            <div className="min-w-0 flex-1">
              <p className="font-display text-xs font-semibold tracking-[0.18em] text-ember uppercase">
                Progressive Ladder · {ladder.mode === "build" ? "Build Up" : "At The Ink"}
              </p>
              <h2 className="mt-0.5 font-display text-3xl leading-none text-fg">
                {done === total ? "Sheet cleared" : done === 0 ? "Fresh sheet" : `${total - done} stations left`}
              </h2>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                <span className="flex items-center gap-1">
                  <Flame className="size-3.5 text-ember" />
                  {streaks.current}-day streak
                </span>
                <span className="flex items-center gap-1">
                  <Timer className="size-3.5 text-ember" />~{minutesFor(ladder)} min
                </span>
              </div>
            </div>
          </div>

          {done < total ? (
            <button
              type="button"
              onClick={() => {
                onActiveId(firstOpenId(ladder, today));
                onSubView("runner");
              }}
              className="glow-ember flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-ember px-4 text-sm font-semibold text-ember-fg transition-transform active:scale-[0.98]"
            >
              <Play className="size-4 fill-current" />
              {done === 0 ? "Start Today’s Ladder" : "Resume Ladder"}
            </button>
          ) : (
            <div className="card rounded-2xl px-4 py-3 text-sm text-chalk">
              Sheet cleared. Every station you hit steps up tomorrow. Sets climb up to 4 after reaching goal.
            </div>
          )}

          {/* Sections & Supersets */}
          <div className="space-y-6">
            {SECTIONS.map((section) => {
              const list = EXERCISES.filter((ex) => ex.section === section.id);
              const clearedInSection = list.filter((ex) => isExerciseMet(ladder, ex, today)).length;
              return (
                <section key={section.id}>
                  <div className="flex items-baseline justify-between px-0.5">
                    <h3 className="font-display text-2xl font-semibold tracking-wide text-fg uppercase">
                      {section.label}
                    </h3>
                    <span className="font-display text-sm tracking-widest text-faint tabular-nums">
                      {clearedInSection}/{list.length}
                    </span>
                  </div>
                  <div className="mt-2.5 space-y-2.5">
                    {groups(list).map((group) => (
                      <div
                        key={group[0]!.id}
                        className={`card overflow-hidden rounded-2xl ${
                          group.length > 1 ? "border-l-2 border-ember/80" : ""
                        }`}
                      >
                        {group.length > 1 ? (
                          <p className="px-4 pt-2.5 font-display text-xs font-semibold tracking-[0.18em] text-ember uppercase">
                            Super Set
                          </p>
                        ) : null}
                        <ul className="divide-y divide-line/60">
                          {group.map((ex) => {
                            const rx = rxFor(ladder, ex);
                            const cleared = isExerciseMet(ladder, ex, today);
                            const loggedSets = ladder.days[today]?.[ex.id]?.sets.length ?? 0;
                            return (
                              <li key={ex.id}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onActiveId(ex.id);
                                    onSubView("runner");
                                  }}
                                  className={`flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-raised/40 ${
                                    cleared ? "opacity-60" : ""
                                  }`}
                                >
                                  <span
                                    className={`grid size-7 shrink-0 place-items-center rounded-full border ${
                                      cleared
                                        ? "border-ember bg-ember text-ember-fg"
                                        : loggedSets > 0
                                          ? "border-ember/60 bg-ember/15 text-ember"
                                          : "border-line bg-raised text-transparent"
                                    }`}
                                  >
                                    <Check className="size-3.5 stroke-[2.75]" />
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-medium text-fg">
                                      {ex.sheet ? <span className="mr-1.5 text-faint tabular-nums">{ex.sheet}</span> : null}
                                      {ex.name}
                                    </span>
                                    <span className="mt-0.5 block text-xs text-muted">
                                      {rungLabel(rx, ex.steady)} · goal {rx.goal}
                                      {loggedSets > 0 && !cleared ? ` · ${loggedSets}/${rx.sets} sets` : ""}
                                    </span>
                                  </span>
                                  <span className="text-right">
                                    <span className="block font-display text-2xl leading-none text-fg tabular-nums">
                                      {rx.sets > 1 ? `${rx.sets}×${rx.reps}` : rx.reps}
                                    </span>
                                    <span className="text-[11px] text-muted">{unitWord(ex.unit, rx.reps)}</span>
                                  </span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      ) : null}

      {subView === "forms" ? (
        <FormsGallery
          activeId={activeId}
          onActiveId={onActiveId}
          onTrain={(id) => {
            onActiveId(id);
            onSubView("runner");
          }}
        />
      ) : null}

      {subView === "ladder" ? (
        <LadderAndPhysique
          ladder={ladder}
          body={body}
          burnRange={burnRange}
          onBurnRange={setBurnRange}
          confirmMode={confirmMode}
          onConfirmMode={setConfirmMode}
          onRaiseSummit={onRaiseSummit}
          onRetarget={onRetarget}
          onResetLadder={onResetLadder}
          onEditBody={onEditBody}
        />
      ) : null}
    </div>
  );
}

function ExerciseRunner({
  ladder,
  activeId,
  today,
  onActiveId,
  onBack,
  onClearSet,
  onUndoSet,
}: {
  ladder: LadderState;
  activeId: string;
  today: string;
  onActiveId: (id: string) => void;
  onBack: () => void;
  onClearSet: (exerciseId: string, reps: number) => void;
  onUndoSet: (exerciseId: string) => void;
}) {
  const ex = EXERCISES.find((e) => e.id === activeId) ?? EXERCISES[0]!;
  const rx = rxFor(ladder, ex);
  const entry = ladder.days[today]?.[ex.id];
  const setsDone = entry?.sets.length ?? 0;
  const finished = setsDone >= rx.sets;
  const short = (entry?.sets ?? []).some((n) => n < rx.reps);
  const [draft, setDraft] = useState<number | null>(null);
  const [rest, setRest] = useState<{ left: number; total: number; nextId: string | null } | null>(null);

  const shown = draft ?? rx.reps;
  const index = EXERCISES.findIndex((item) => item.id === ex.id);
  const upcoming = EXERCISES[index + 1];
  const paired = Boolean(upcoming?.pair && upcoming.pair === ex.pair);
  const section = SECTIONS.find((s) => s.id === ex.section);

  useEffect(() => {
    setDraft(null);
  }, [ex.id, setsDone]);

  useEffect(() => {
    if (!rest || rest.left <= 0) return;
    const id = window.setInterval(() => {
      setRest((curr) => (curr ? { ...curr, left: Math.max(0, curr.left - 1) } : null));
    }, 1000);
    return () => window.clearInterval(id);
  }, [rest?.nextId, rest?.total]);

  useEffect(() => {
    if (!rest || rest.left > 0) return;
    if (rest.nextId) onActiveId(rest.nextId);
    setRest(null);
  }, [rest, onActiveId]);

  const ahead = prescription(
    ex,
    nextOffset(ex, ladder.offsets[ex.id] ?? 0, ladder.bonuses[ex.id] ?? 0),
    ladder.bonuses[ex.id] ?? 0,
  );
  const holds = ex.steady || (ahead.reps === rx.reps && ahead.sets === rx.sets);

  function handleClear() {
    if (finished) {
      if (upcoming) onActiveId(upcoming.id);
      else onBack();
      return;
    }
    onClearSet(ex.id, shown);
    const willFinish = setsDone + 1 >= rx.sets;
    if (!willFinish) {
      setRest({ left: 20, total: 20, nextId: ex.id });
      return;
    }
    if (!upcoming) return;
    const secs = paired ? 12 : Math.max(20, ex.rest);
    setRest({ left: secs, total: secs, nextId: upcoming.id });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="card grid size-10 place-items-center rounded-full text-fg hover:bg-raised"
          aria-label="Back to sheet"
        >
          <ChevronLeft className="size-5" />
        </button>
        <p className="text-xs font-medium tracking-wider text-muted uppercase">
          {section?.label} · {index + 1}/{EXERCISES.length}
        </p>
        <button
          type="button"
          onClick={() => onUndoSet(ex.id)}
          disabled={setsDone === 0}
          className="card grid size-10 place-items-center rounded-full text-fg hover:bg-raised disabled:opacity-35"
          aria-label="Undo last set"
        >
          <Undo2 className="size-4" />
        </button>
      </div>

      <FormLoop exercise={ex} />

      <div>
        <h2 className="font-display text-4xl leading-none font-semibold text-fg">{ex.name}</h2>
        <ul className="mt-2.5 space-y-1.5">
          {ex.cues.map((cue) => (
            <li key={cue} className="text-sm leading-relaxed text-muted">
              {cue}
            </li>
          ))}
        </ul>
        <p className="mt-1.5 text-xs text-faint">Scale down: {ex.easier}</p>
      </div>

      <div className="card rounded-2xl p-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] font-medium tracking-wider text-muted uppercase">Today&apos;s Target</p>
            <p className="font-display text-4xl leading-none text-fg tabular-nums">
              {formatTarget(rx.reps, rx.sets, ex.unit)}
            </p>
          </div>
          <p className="text-right text-xs text-muted">
            <span className="block font-semibold text-ember">{rungLabel(rx, ex.steady)}</span>
            <span>Goal {rx.goal}</span>
          </p>
        </div>

        <div className="mt-3 flex gap-1.5">
          {Array.from({ length: rx.sets }, (_, i) => (
            <span
              key={i}
              className={`h-2 flex-1 rounded-full transition-colors ${i < setsDone ? "bg-ember" : "bg-raised"}`}
            />
          ))}
        </div>

        <p className="mt-2 text-xs text-muted">
          Set {Math.min(setsDone + 1, rx.sets)} of {rx.sets}
          {paired && upcoming ? ` · superset with ${upcoming.name}` : ""}
        </p>
        {short ? <p className="mt-1.5 text-xs text-ember">Under target — rung holds tomorrow.</p> : null}
        {finished && !short ? (
          <p className="mt-1.5 text-xs text-primary">
            {holds ? "Cleared. This station holds." : `Cleared. Tomorrow: ${formatTarget(ahead.reps, ahead.sets, ex.unit)}.`}
          </p>
        ) : null}
      </div>

      {rest && rest.left > 0 ? (
        <div className="card flex items-center gap-4 rounded-2xl p-4" aria-live="polite">
          <Ring value={rest.left} total={rest.total} size={76}>
            <span className="font-display text-3xl leading-none text-fg tabular-nums">{rest.left}</span>
          </Ring>
          <div className="min-w-0 flex-1">
            <p className="font-display text-xs font-semibold tracking-[0.18em] text-ember uppercase">Rest</p>
            <p className="mt-0.5 text-sm text-fg">
              {rest.nextId === ex.id ? "Next set" : paired ? "Straight into superset pair" : `Up next · ${upcoming?.name}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRest((curr) => (curr ? { ...curr, left: 0 } : null))}
            className="h-10 rounded-xl bg-raised px-4 text-xs font-semibold text-ember"
          >
            Skip
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="card flex items-center justify-between rounded-2xl p-2.5">
            <button
              type="button"
              onClick={() => setDraft(Math.max(0, shown - 1))}
              disabled={finished}
              aria-label="Fewer reps"
              className="grid size-12 place-items-center rounded-xl bg-raised text-fg disabled:opacity-40"
            >
              <Minus className="size-5" />
            </button>
            <div className="text-center">
              <span className="block font-display text-5xl leading-none text-fg tabular-nums">{shown}</span>
              <span className="text-xs text-muted">{unitWord(ex.unit, shown)}</span>
            </div>
            <button
              type="button"
              onClick={() => setDraft(Math.min(999, shown + 1))}
              disabled={finished}
              aria-label="More reps"
              className="grid size-12 place-items-center rounded-xl bg-raised text-fg disabled:opacity-40"
            >
              <Plus className="size-5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleClear}
            className="glow-ember flex h-12 w-full items-center justify-center rounded-xl bg-ember px-4 text-sm font-semibold text-ember-fg transition-transform active:scale-[0.98]"
          >
            {finished ? (upcoming ? "Next Station" : "Finish Sheet") : setsDone > 0 ? "Clear Next Set (+12 XP)" : "Clear Set (+12 XP)"}
          </button>
        </div>
      )}
    </div>
  );
}

function FormsGallery({
  activeId,
  onActiveId,
  onTrain,
}: {
  activeId: string;
  onActiveId: (id: string) => void;
  onTrain: (id: string) => void;
}) {
  const ex = EXERCISES.find((e) => e.id === activeId) ?? EXERCISES[0]!;
  return (
    <div className="space-y-4">
      <FormLoop exercise={ex} />
      <div className="flex items-center justify-between gap-3 px-0.5">
        <div>
          <h3 className="font-display text-2xl leading-none font-semibold text-fg">{ex.name}</h3>
          <p className="mt-1 text-xs text-muted">{ex.cues[0]}</p>
        </div>
        <button
          type="button"
          onClick={() => onTrain(ex.id)}
          className="glow-ember h-10 shrink-0 rounded-xl bg-ember px-4 text-xs font-semibold tracking-wider text-ember-fg uppercase"
        >
          Train
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {EXERCISES.map((item) => {
          const selected = item.id === ex.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onActiveId(item.id)}
              className={`card overflow-hidden rounded-xl text-left transition-all ${
                selected ? "ring-2 ring-ember" : "hover:bg-raised/40"
              }`}
            >
              <FormLoop exercise={item} playing={false} compact />
              <span className="block truncate px-2.5 py-2 text-xs font-medium text-fg">{item.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LadderAndPhysique({
  ladder,
  body,
  burnRange,
  onBurnRange,
  confirmMode,
  onConfirmMode,
  onRaiseSummit,
  onRetarget,
  onResetLadder,
  onEditBody,
}: {
  ladder: LadderState;
  body: BodyProfile;
  burnRange: "week" | "month";
  onBurnRange: (r: "week" | "month") => void;
  confirmMode: null | "build" | "ink" | "wipe";
  onConfirmMode: (m: null | "build" | "ink" | "wipe") => void;
  onRaiseSummit: (id: string) => void;
  onRetarget: (mode: "build" | "ink") => void;
  onResetLadder: () => void;
  onEditBody: () => void;
}) {
  const today = new Date();
  const series = useMemo(() => burnSeriesForRange(ladder, body, burnRange, today), [ladder, body, burnRange]);
  const totalBurn = series.reduce((sum, r) => sum + r.kcal, 0);
  const activeDaysCount = series.filter((r) => !r.future).length;
  const targetBurn = body.burnTarget * activeDaysCount;
  const bmi = bmiFrom(body);
  const gap = gapKcal(body);
  const weekBurn = useMemo(
    () => burnSeriesForRange(ladder, body, "week", today).reduce((s, r) => s + r.kcal, 0),
    [ladder, body],
  );
  const eta = weeksToGoal(body, weekBurn);

  const chartData = series.map((r) => ({
    label: burnRange === "week" ? weekdayLabel(r.date, true) : String(r.date.getDate()),
    kcal: r.kcal,
  }));

  return (
    <div className="space-y-4">
      {/* Physique & BMI Card */}
      <section className="card rounded-2xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-xs font-semibold tracking-[0.18em] text-muted uppercase">
              Physique &amp; Goal
            </p>
            <p className="mt-1 font-display text-3xl leading-none text-fg tabular-nums">
              {formatMass(body.mass, body.unit)}
              <span className="text-xl text-faint"> → {formatMass(body.goalMass, body.unit)}</span>
            </p>
            <p className="mt-1 text-xs text-muted">
              BMI {formatBmi(bmi)} ({bmiBand(bmi)})
              {gap > 0
                ? ` · ${Math.round(Math.abs(body.mass - body.goalMass) * 10) / 10} ${body.unit} to goal`
                : " · Goal held"}
            </p>
          </div>
          <button
            type="button"
            onClick={onEditBody}
            className="h-9 rounded-xl bg-raised px-3 text-xs font-semibold text-fg hover:bg-ember hover:text-ember-fg"
          >
            Edit Goal
          </button>
        </div>
        <p className="mt-2.5 text-xs text-faint">
          {gap <= 0
            ? "Weight is at or below your target. Keep climbing the ladder to hold the line."
            : eta === null
              ? "Log workout sets to estimate pace toward your physique goal."
              : `At this week’s burn (${weekBurn} kcal), ~${eta < 1 ? "<1" : Math.round(eta)} weeks of training volume to close the gap.`}
        </p>
      </section>

      {/* Training Burn Chart */}
      <section className="card rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display text-xs font-semibold tracking-[0.18em] text-ember uppercase">
              Training Burn
            </p>
            <p className="mt-0.5 font-display text-2xl leading-none text-fg tabular-nums">
              {totalBurn.toLocaleString()}
              <span className="text-sm text-faint"> / {targetBurn.toLocaleString()} kcal</span>
            </p>
          </div>
          <div className="flex rounded-lg bg-raised p-0.5">
            {(["week", "month"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onBurnRange(r)}
                className={`h-7 rounded-md px-2.5 text-[11px] font-semibold uppercase ${
                  burnRange === r ? "bg-surface text-ember" : "text-muted"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="label"
                tick={{ fill: "#9aa3b2", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval={burnRange === "month" ? 4 : 0}
              />
              <Tooltip
                cursor={{ fill: "rgb(240 100 56 / 0.12)" }}
                contentStyle={{
                  backgroundColor: "#13171e",
                  border: "1px solid #272f3c",
                  borderRadius: 10,
                  fontSize: 12,
                  color: "#f3f0e8",
                }}
                formatter={(value) => [`${value} kcal`, "Burn"]}
              />
              <Bar dataKey="kcal" fill="#f06438" radius={[4, 4, 0, 0]} maxBarSize={26} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Exercise Progression Ladder */}
      <section className="space-y-2.5">
        <p className="px-0.5 text-xs font-medium tracking-wider text-muted uppercase">
          Station Progression
        </p>
        {EXERCISES.map((ex) => {
          const rx = rxFor(ladder, ex);
          const nextGoal = ex.goal + (ladder.bonuses[ex.id] ?? 0) + ex.step;
          const pct = ex.steady ? 100 : Math.min(100, Math.round((rx.reps / Math.max(rx.goal, 1)) * 100));
          return (
            <div key={ex.id} className="card rounded-2xl px-4 py-3">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-medium text-fg">{ex.name}</p>
                <p className="font-display text-2xl leading-none text-fg tabular-nums">
                  {rx.sets > 1 ? `${rx.sets}×${rx.reps}` : rx.reps}
                </p>
              </div>
              <p className="mt-0.5 text-xs text-muted">
                {rungLabel(rx, ex.steady)} · goal {rx.goal} {unitWord(ex.unit, rx.goal)}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-raised">
                <div className="h-full rounded-full bg-ember" style={{ width: `${pct}%` }} />
              </div>
              {!ex.steady ? (
                <button
                  type="button"
                  onClick={() => onRaiseSummit(ex.id)}
                  className="mt-2 text-xs font-semibold text-ember hover:underline"
                >
                  Raise goal to {nextGoal}
                </button>
              ) : null}
            </div>
          );
        })}
      </section>

      {/* Ladder Mode Controls */}
      <section className="card rounded-2xl p-4">
        <p className="text-xs font-medium tracking-wider text-muted uppercase">Ladder Calibration</p>
        {confirmMode ? (
          <div className="mt-3 space-y-3">
            <p className="text-sm text-fg">
              {confirmMode === "wipe"
                ? "Erase workout streak, today’s sets, and reset the whole ladder?"
                : "Today’s logged sets will clear and targets will recalibrate. Past completed days stay."}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (confirmMode === "wipe") onResetLadder();
                  else onRetarget(confirmMode);
                  onConfirmMode(null);
                }}
                className="h-10 flex-1 rounded-xl bg-ember text-xs font-semibold text-ember-fg"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => onConfirmMode(null)}
                className="h-10 flex-1 rounded-xl bg-raised text-xs font-semibold text-fg"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => onConfirmMode("build")}
              className="h-10 rounded-xl bg-raised px-3 text-xs font-semibold text-fg hover:bg-raised/80"
            >
              Build-Up Start
            </button>
            <button
              type="button"
              onClick={() => onConfirmMode("ink")}
              className="h-10 rounded-xl bg-raised px-3 text-xs font-semibold text-fg hover:bg-raised/80"
            >
              Jump to Ink Goals
            </button>
            <button
              type="button"
              onClick={() => onConfirmMode("wipe")}
              className="h-10 rounded-xl bg-bg/60 px-3 text-xs font-semibold text-faint hover:text-danger"
            >
              Reset Ladder
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
