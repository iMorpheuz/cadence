import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { HABIT_COLORS, HABIT_COLOR_ORDER, STAT_META, STAT_ORDER } from "@/lib/habits/colors";
import { DIFFICULTIES } from "@/lib/habits/progress";
import type { DifficultyId, Habit, HabitColorId, StatId } from "@/lib/habits/types";

export function QuestDialog({
  open,
  onClose,
  initial,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  initial: Habit | null;
  onSave: (input: { name: string; color: HabitColorId; stat: StatId; difficulty: DifficultyId }) => void;
}) {
  const [name, setName] = useState("");
  const [stat, setStat] = useState<StatId>("focus");
  const [difficulty, setDifficulty] = useState<DifficultyId>("normal");
  const [color, setColor] = useState<HabitColorId>("mint");

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setName(initial.name);
      setStat(initial.stat);
      setDifficulty(initial.difficulty);
      setColor(initial.color);
    } else {
      setName("");
      setStat("focus");
      setDifficulty("normal");
      setColor("mint");
    }
  }, [open, initial]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), stat, difficulty, color });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit Daily Quest" : "New Daily Quest"}
      subtitle="Build a recurring productivity or wellness habit."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="quest-name" className="block text-xs font-medium tracking-wider text-muted uppercase">
            Habit name
          </label>
          <input
            id="quest-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. 60m deep focus session"
            autoFocus
            className="mt-1.5 h-11 w-full rounded-xl bg-raised px-3.5 text-sm text-fg ring-1 ring-line outline-none focus:ring-primary"
          />
        </div>

        <div>
          <span className="block text-xs font-medium tracking-wider text-muted uppercase">Attribute</span>
          <div className="mt-1.5 grid grid-cols-3 gap-1.5">
            {STAT_ORDER.map((id) => {
              const meta = STAT_META[id];
              const active = stat === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setStat(id)}
                  className={`flex h-10 items-center justify-center gap-1.5 rounded-xl text-xs font-medium transition-colors ${
                    active ? "bg-primary text-primary-fg" : "bg-raised text-muted hover:text-fg"
                  }`}
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: active ? "currentColor" : meta.color }}
                  />
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span className="block text-xs font-medium tracking-wider text-muted uppercase">Difficulty &amp; XP</span>
          <div className="mt-1.5 grid grid-cols-3 gap-1.5">
            {(["easy", "normal", "hard"] as const).map((id) => {
              const item = DIFFICULTIES[id];
              const active = difficulty === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setDifficulty(id)}
                  className={`flex flex-col items-center justify-center rounded-xl py-2.5 text-xs font-medium transition-colors ${
                    active ? "bg-primary text-primary-fg" : "bg-raised text-muted hover:text-fg"
                  }`}
                >
                  <span>{item.label}</span>
                  <span className={`text-[11px] tabular-nums ${active ? "opacity-80" : "text-faint"}`}>
                    +{item.xp} XP
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span className="block text-xs font-medium tracking-wider text-muted uppercase">Tag color</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {HABIT_COLOR_ORDER.map((id) => {
              const active = color === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setColor(id)}
                  aria-label={HABIT_COLORS[id].label}
                  className={`grid size-8 place-items-center rounded-full transition-transform ${
                    active ? "scale-110 ring-2 ring-fg ring-offset-2 ring-offset-surface" : ""
                  }`}
                  style={{ backgroundColor: HABIT_COLORS[id].dot }}
                />
              );
            })}
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
            disabled={!name.trim()}
            className="glow-primary h-11 flex-1 rounded-xl bg-primary text-sm font-semibold text-primary-fg disabled:opacity-40"
          >
            {initial ? "Save changes" : "Add quest"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
