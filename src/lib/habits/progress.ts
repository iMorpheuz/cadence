import type { DifficultyId, RankId, StatId } from "./types";
import { STAT_ORDER } from "./colors";

export const DIFFICULTIES: Record<
  DifficultyId,
  { id: DifficultyId; label: string; xp: number }
> = {
  easy: { id: "easy", label: "Light", xp: 20 },
  normal: { id: "normal", label: "Standard", xp: 35 },
  hard: { id: "hard", label: "Deep", xp: 55 },
};

export const RANKS: { id: RankId; minLevel: number; title: string }[] = [
  { id: "E", minLevel: 1, title: "Initiate" },
  { id: "D", minLevel: 5, title: "Consistent" },
  { id: "C", minLevel: 10, title: "Dialed In" },
  { id: "B", minLevel: 18, title: "Relentless" },
  { id: "A", minLevel: 28, title: "Vanguard" },
  { id: "S", minLevel: 40, title: "Apex" },
];

export function xpForQuest(difficulty: DifficultyId): number {
  return DIFFICULTIES[difficulty].xp;
}

export function xpForLevel(level: number): number {
  return 60 + level * 24;
}

export function progressFromXp(totalXp: number): {
  level: number;
  current: number;
  need: number;
  totalXp: number;
  ratio: number;
} {
  let level = 1;
  let remaining = Math.max(0, Math.floor(totalXp));
  let need = xpForLevel(1);
  while (remaining >= need && level < 99) {
    remaining -= need;
    level += 1;
    need = xpForLevel(level);
  }
  return {
    level,
    current: remaining,
    need,
    totalXp,
    ratio: need <= 0 ? 1 : remaining / need,
  };
}

export function rankFromLevel(level: number): (typeof RANKS)[number] {
  let current = RANKS[0]!;
  for (const rank of RANKS) {
    if (level >= rank.minLevel) current = rank;
  }
  return current;
}

export function rankIndex(id: RankId): number {
  return RANKS.findIndex((rank) => rank.id === id);
}

export function emptyStatMap(): Record<StatId, number> {
  return {
    body: 0,
    mind: 0,
    focus: 0,
    vitality: 0,
    aura: 0,
    energy: 0,
  };
}

export { STAT_ORDER };
