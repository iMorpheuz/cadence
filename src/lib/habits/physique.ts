import type { BodyProfile, WeightUnit } from "./types";

export const DEFAULT_BODY: BodyProfile = {
  mass: 180,
  height: 70,
  goalMass: 170,
  unit: "lb",
  burnTarget: 280,
};

const LB_PER_KG = 2.20462262;
const IN_PER_CM = 0.393700787;

export function massToKg(mass: number, unit: WeightUnit): number {
  return unit === "kg" ? mass : mass / LB_PER_KG;
}

export function heightToMeters(height: number, unit: WeightUnit): number {
  const meters = unit === "kg" ? height / 100 : height * 0.0254;
  return Math.max(0.5, meters);
}

export function bmiFrom(profile: BodyProfile): number {
  const kg = massToKg(profile.mass, profile.unit);
  const m = heightToMeters(profile.height, profile.unit);
  return kg / (m * m);
}

export function goalBmi(profile: BodyProfile): number {
  const kg = massToKg(profile.goalMass, profile.unit);
  const m = heightToMeters(profile.height, profile.unit);
  return kg / (m * m);
}

export function bmiBand(bmi: number): string {
  if (bmi < 18.5) return "Low";
  if (bmi < 25) return "Standard";
  if (bmi < 30) return "Elevated";
  return "High";
}

export function formatMass(mass: number, unit: WeightUnit): string {
  const n = Number.isInteger(mass) ? String(mass) : mass.toFixed(1).replace(/\.0$/, "");
  return `${n} ${unit}`;
}

export function formatHeight(height: number, unit: WeightUnit): string {
  if (unit === "kg") return `${Math.round(height)} cm`;
  const total = Math.round(height);
  const ft = Math.floor(total / 12);
  const inch = total % 12;
  return `${ft}'${inch}"`;
}

export function formatBmi(bmi: number): string {
  return bmi.toFixed(1);
}

export function kcalPerLb(): number {
  return 3500;
}

export function kcalPerKg(): number {
  return 7700;
}

export function gapKcal(profile: BodyProfile): number {
  const delta = profile.mass - profile.goalMass;
  if (Math.abs(delta) < 0.05) return 0;
  return delta * (profile.unit === "kg" ? kcalPerKg() : kcalPerLb());
}

export function weeksToGoal(profile: BodyProfile, weeklyBurn: number): number | null {
  const gap = Math.abs(gapKcal(profile));
  if (gap === 0) return 0;
  if (weeklyBurn <= 0) return null;
  return gap / weeklyBurn;
}

export function convertProfile(profile: BodyProfile, unit: WeightUnit): BodyProfile {
  if (profile.unit === unit) return profile;
  if (unit === "kg") {
    return {
      unit,
      mass: Math.round((profile.mass / LB_PER_KG) * 10) / 10,
      goalMass: Math.round((profile.goalMass / LB_PER_KG) * 10) / 10,
      height: Math.round(profile.height / IN_PER_CM),
      burnTarget: profile.burnTarget,
    };
  }
  return {
    unit,
    mass: Math.round(profile.mass * LB_PER_KG),
    goalMass: Math.round(profile.goalMass * LB_PER_KG),
    height: Math.round(profile.height * IN_PER_CM),
    burnTarget: profile.burnTarget,
  };
}

export function normalizeBody(profile: Partial<BodyProfile> | undefined): BodyProfile {
  const unit: WeightUnit = profile?.unit === "kg" ? "kg" : "lb";
  const massMax = unit === "kg" ? 250 : 550;
  const massMin = unit === "kg" ? 30 : 70;
  const heightMax = unit === "kg" ? 230 : 90;
  const heightMin = unit === "kg" ? 120 : 48;
  const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
  return {
    unit,
    mass: clamp(Number(profile?.mass) || DEFAULT_BODY.mass, massMin, massMax),
    goalMass: clamp(Number(profile?.goalMass) || DEFAULT_BODY.goalMass, massMin, massMax),
    height: clamp(Number(profile?.height) || (unit === "kg" ? 178 : 70), heightMin, heightMax),
    burnTarget: clamp(Math.round(Number(profile?.burnTarget) || DEFAULT_BODY.burnTarget), 50, 2000),
  };
}
