import type { HabitColorId, StatId } from "./types";

export const HABIT_COLORS: Record<HabitColorId, { label: string; dot: string; ring: string }> = {
  mint: { label: "Mint", dot: "#38d9a9", ring: "rgb(56 217 169 / 0.25)" },
  ember: { label: "Ember", dot: "#f06438", ring: "rgb(240 100 56 / 0.25)" },
  amber: { label: "Amber", dot: "#eab308", ring: "rgb(234 179 8 / 0.25)" },
  sky: { label: "Sky", dot: "#38bdf8", ring: "rgb(56 189 248 / 0.25)" },
  sage: { label: "Sage", dot: "#84cc16", ring: "rgb(132 204 22 / 0.25)" },
  rose: { label: "Rose", dot: "#f43f5e", ring: "rgb(244 63 94 / 0.25)" },
  slate: { label: "Slate", dot: "#94a3b8", ring: "rgb(148 163 184 / 0.25)" },
  sand: { label: "Sand", dot: "#e5c08b", ring: "rgb(229 192 139 / 0.25)" },
};

export const HABIT_COLOR_ORDER: HabitColorId[] = [
  "mint",
  "ember",
  "amber",
  "sky",
  "sage",
  "rose",
  "slate",
  "sand",
];

export const STAT_ORDER: StatId[] = ["body", "mind", "focus", "vitality", "aura", "energy"];

export const STAT_META: Record<StatId, { label: string; short: string; color: string }> = {
  body: { label: "Body", short: "STR", color: "#f06438" },
  mind: { label: "Mind", short: "INT", color: "#38bdf8" },
  focus: { label: "Focus", short: "FOC", color: "#38d9a9" },
  vitality: { label: "Vitality", short: "VIT", color: "#eab308" },
  aura: { label: "Aura", short: "AUR", color: "#e5c08b" },
  energy: { label: "Energy", short: "END", color: "#84cc16" },
};
