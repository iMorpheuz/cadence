import { Award, Check, Flame, Trophy } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { STAT_META, STAT_ORDER } from "@/lib/habits/colors";
import type { CadenceSnapshot } from "@/lib/progression";

export function ProfileDrawer({
  open,
  onClose,
  snap,
}: {
  open: boolean;
  onClose: () => void;
  snap: CadenceSnapshot;
}) {
  const maxStat = Math.max(10, ...STAT_ORDER.map((k) => snap.stats[k]));
  const unlockedCount = snap.achievements.filter((a) => a.unlocked).length;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Rank ${snap.rank} · ${snap.rankTitle}`}
      subtitle={`Level ${snap.level} · ${snap.totalXp.toLocaleString()} total XP`}
    >
      <div className="space-y-5">
        <div className="rounded-xl bg-raised/70 p-3.5">
          <div className="flex items-center justify-between text-xs text-muted">
            <span className="uppercase tracking-wider">Next Level</span>
            <span className="tabular-nums text-fg">
              {snap.xpCurrent} / {snap.xpNeed} XP
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-bg">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500"
              style={{ width: `${Math.min(100, Math.round(snap.xpRatio * 100))}%` }}
            />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-bg/60 px-2 py-2">
              <p className="font-display text-2xl leading-none text-fg tabular-nums">{snap.bestCurrentStreak}d</p>
              <p className="mt-1 text-[11px] text-muted">Current streak</p>
            </div>
            <div className="rounded-lg bg-bg/60 px-2 py-2">
              <p className="font-display text-2xl leading-none text-ember tabular-nums">{snap.ladderDaysTotal}</p>
              <p className="mt-1 text-[11px] text-muted">Full sheets</p>
            </div>
            <div className="rounded-lg bg-bg/60 px-2 py-2">
              <p className="font-display text-2xl leading-none text-primary tabular-nums">
                {Math.round(snap.weekRate * 100)}%
              </p>
              <p className="mt-1 text-[11px] text-muted">Week rate</p>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-2.5 flex items-center gap-1.5 text-xs font-medium tracking-wider text-muted uppercase">
            <Flame className="size-3.5 text-ember" />
            Attributes
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {STAT_ORDER.map((id) => {
              const meta = STAT_META[id];
              const value = snap.stats[id];
              const pct = Math.min(100, Math.round((value / maxStat) * 100));
              return (
                <div key={id} className="rounded-xl bg-raised/50 p-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-medium text-muted">{meta.label}</span>
                    <span className="font-display text-xl leading-none text-fg tabular-nums">{value}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg">
                    <div
                      className="h-full rounded-full transition-[width] duration-500"
                      style={{ width: `${pct}%`, backgroundColor: meta.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-2.5 flex items-center justify-between text-xs font-medium tracking-wider text-muted uppercase">
            <span className="flex items-center gap-1.5">
              <Trophy className="size-3.5 text-amber" />
              Milestones
            </span>
            <span className="tabular-nums text-faint">
              {unlockedCount}/{snap.achievements.length}
            </span>
          </div>
          <div className="space-y-2">
            {snap.achievements.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
                  item.unlocked ? "bg-raised/80 text-fg" : "bg-raised/25 text-faint"
                }`}
              >
                <span
                  className={`grid size-7 shrink-0 place-items-center rounded-full ${
                    item.unlocked ? "bg-primary/20 text-primary" : "bg-bg/80 text-faint"
                  }`}
                >
                  {item.unlocked ? <Check className="size-3.5" /> : <Award className="size-3.5" />}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight">{item.name}</p>
                  <p className="text-xs text-muted">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
