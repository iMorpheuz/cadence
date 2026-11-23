export type Unit = "reps" | "side" | "sec" | "cycles";

export type Rx = {
  reps: number;
  sets: number;
  goal: number;
  summit: boolean;
};

export type LadderMove = {
  id: string;
  start: number;
  step: number;
  goal: number;
  steady?: boolean;
};

/** Reps climb first. After the goal, sets climb to 4 — the columns on the sheet. */
export function prescription(ex: LadderMove, offset: number, bonus: number): Rx {
  const goal = ex.goal + Math.max(0, bonus);
  if (ex.steady || ex.step <= 0) {
    return { reps: ex.start, sets: 1, goal: ex.start, summit: false };
  }
  const steps = Math.max(0, Math.ceil((goal - ex.start) / ex.step));
  const safe = Math.max(0, offset);
  if (safe <= steps) {
    const reps = Math.min(goal, ex.start + safe * ex.step);
    return { reps, sets: 1, goal, summit: false };
  }
  const sets = Math.min(4, 2 + (safe - steps - 1));
  return { reps: goal, sets, goal, summit: sets >= 4 };
}

export function nextOffset(ex: LadderMove, offset: number, bonus: number) {
  const rx = prescription(ex, offset, bonus);
  if (ex.steady || rx.summit) return Math.max(0, offset);
  return Math.max(0, offset) + 1;
}

/** One set at the written goal — "start at the ink". */
export function inkOffset(ex: LadderMove) {
  if (ex.steady || ex.step <= 0) return 0;
  return Math.max(0, Math.ceil((ex.goal - ex.start) / ex.step));
}

export function rungLabel(rx: Rx, steady?: boolean) {
  if (steady) return "Steady";
  if (rx.summit) return "Summit";
  if (rx.sets > 1) return `${rx.sets} sets`;
  return "Building";
}
