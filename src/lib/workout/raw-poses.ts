import type { Pose } from "@/lib/workout/pose";

function p(x: number, y: number) {
  return { x, y };
}

/** Side-view plank facing right. `bend` 0 is the top; higher drops the shoulders and flares the elbow. */
export function plank(bend = 0): Pose {
  const shoulderY = 150 + bend * 0.85;
  const hipY = 156 + bend * 0.35;
  const elbowY = bend > 0 ? shoulderY - 6 : 176;
  const elbowX = bend > 0 ? 132 : 158;
  return {
    foL: p(34, 206),
    foR: p(42, 208),
    knL: p(62, hipY - 6),
    knR: p(70, hipY - 2),
    hipL: p(96, hipY - 5),
    hipR: p(102, hipY),
    hip: p(100, hipY),
    chest: p(150, shoulderY),
    shL: p(144, shoulderY - 5),
    shR: p(156, shoulderY + 2),
    elL: p(elbowX - 8, elbowY + 4),
    elR: p(elbowX, elbowY),
    haL: p(154, 206),
    haR: p(166, 208),
    neck: p(164, shoulderY - 4),
    head: p(178, shoulderY - 8),
  };
}

export function plankWide(bend = 0): Pose {
  return { ...plank(bend), width: 1.7 };
}

export function plankMilitary(bend = 0): Pose {
  const base = plank(bend);
  return {
    ...base,
    haL: p(158, 207),
    haR: p(168, 208),
    elL: p(bend ? 124 : 160, base.elL.y),
    elR: p(bend ? 128 : 164, base.elR.y),
  };
}

export function plankStagger(bend = 0): Pose {
  const base = plank(bend);
  return {
    ...base,
    haR: p(base.haR.x + 16, base.haR.y),
    haL: p(base.haL.x - 14, base.haL.y),
    elR: p(base.elR.x + (bend > 0 ? 8 : 12), base.elR.y),
    elL: p(base.elL.x - (bend > 0 ? 6 : 8), base.elL.y),
  };
}

export function climber(lead: "near" | "far"): Pose {
  const base = plank(0);
  if (lead === "near") {
    return { ...base, knR: p(132, 168), foR: p(148, 186) };
  }
  return { ...base, knL: p(128, 162), foL: p(146, 180) };
}

export function handstand(bend = 0): Pose {
  const k = Math.max(0, Math.min(40, bend)) / 40;
  const hipY = 98 + 18 * k;
  return {
    haL: p(80, 208),
    haR: p(120, 208),
    elL: p(80 - 18 * k, 180 + 4 * k),
    elR: p(120 + 18 * k, 180 + 4 * k),
    shL: p(88 - 4 * k, 150 + 18 * k),
    shR: p(112 + 4 * k, 150 + 18 * k),
    chest: p(100, 142 + 18 * k),
    neck: p(100, 156 + 16 * k),
    head: p(100, 174 + 16 * k),
    hip: p(100, hipY),
    hipL: p(92, hipY),
    hipR: p(108, hipY),
    knL: p(90, hipY - 36),
    knR: p(110, hipY - 36),
    foL: p(86, hipY - 70),
    foR: p(114, hipY - 70),
    plane: "front",
  };
}

export function downwardDog(): Pose {
  return {
    haL: p(46, 206),
    haR: p(62, 208),
    elL: p(58, 176),
    elR: p(74, 178),
    shL: p(78, 148),
    shR: p(90, 150),
    chest: p(86, 146),
    neck: p(74, 156),
    head: p(62, 172),
    hip: p(112, 78),
    hipL: p(106, 84),
    hipR: p(116, 80),
    knL: p(142, 130),
    knR: p(150, 128),
    foL: p(168, 204),
    foR: p(178, 206),
  };
}

export function cobra(): Pose {
  return {
    foL: p(156, 206),
    foR: p(166, 208),
    knL: p(142, 200),
    knR: p(150, 198),
    hipL: p(128, 196),
    hipR: p(132, 194),
    hip: p(130, 196),
    chest: p(86, 176),
    shL: p(78, 180),
    shR: p(92, 178),
    elL: p(70, 190),
    elR: p(74, 192),
    haL: p(52, 206),
    haR: p(64, 208),
    neck: p(74, 164),
    head: p(66, 150),
  };
}

export function upwardDog(): Pose {
  return {
    foL: p(150, 206),
    foR: p(162, 208),
    knL: p(138, 188),
    knR: p(146, 184),
    hipL: p(124, 176),
    hipR: p(128, 170),
    hip: p(126, 172),
    chest: p(78, 132),
    shL: p(70, 140),
    shR: p(86, 138),
    elL: p(58, 168),
    elR: p(64, 172),
    haL: p(46, 204),
    haR: p(58, 206),
    neck: p(64, 118),
    head: p(58, 100),
  };
}

export function bridge(): Pose {
  return {
    head: p(46, 176),
    neck: p(58, 168),
    shL: p(70, 188),
    shR: p(78, 192),
    elL: p(62, 200),
    elR: p(66, 204),
    haL: p(48, 208),
    haR: p(58, 210),
    chest: p(84, 160),
    hip: p(112, 96),
    hipL: p(106, 104),
    hipR: p(118, 100),
    knL: p(142, 150),
    knR: p(150, 146),
    foL: p(164, 206),
    foR: p(176, 208),
  };
}

export function bridgeDown(): Pose {
  return {
    head: p(52, 188),
    neck: p(66, 186),
    shL: p(78, 196),
    shR: p(86, 198),
    elL: p(70, 204),
    elR: p(74, 206),
    haL: p(56, 208),
    haR: p(66, 210),
    chest: p(96, 190),
    hip: p(118, 184),
    hipL: p(112, 186),
    hipR: p(122, 186),
    knL: p(140, 168),
    knR: p(148, 164),
    foL: p(162, 206),
    foR: p(174, 208),
  };
}
