export type HabitColorId =
  | "mint"
  | "ember"
  | "amber"
  | "sky"
  | "sage"
  | "rose"
  | "slate"
  | "sand";

export type StatId = "body" | "mind" | "focus" | "vitality" | "aura" | "energy";

export type DifficultyId = "easy" | "normal" | "hard";

export type RankId = "E" | "D" | "C" | "B" | "A" | "S";

export type NavTab = "today" | "train" | "fuel" | "history";

export type Habit = {
  id: string;
  name: string;
  color: HabitColorId;
  stat: StatId;
  difficulty: DifficultyId;
  createdAt: string;
};

export type Completions = Record<string, Record<string, true>>;

export type WeightUnit = "lb" | "kg";

export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

export type MealEntry = {
  id: string;
  name: string;
  slot: MealSlot;
  kcal: number;
  servings: number;
  foodId?: string;
};

export type MealLogs = Record<string, MealEntry[]>;

export type BodyProfile = {
  mass: number;
  height: number;
  goalMass: number;
  unit: WeightUnit;
  burnTarget: number;
};

export type SetLog = {
  sets: number[];
};

export type LadderState = {
  mode: "build" | "ink";
  offsets: Record<string, number>;
  bonuses: Record<string, number>;
  clearedOn: Record<string, string>;
  days: Record<string, Record<string, SetLog>>;
  doneDays: string[];
  lastRoll: string;
};
