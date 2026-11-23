export type Pt = { x: number; y: number };

export type Pose = {
  head: Pt;
  neck: Pt;
  chest: Pt;
  hip: Pt;
  shL: Pt;
  elL: Pt;
  haL: Pt;
  shR: Pt;
  elR: Pt;
  haR: Pt;
  hipL: Pt;
  knL: Pt;
  foL: Pt;
  hipR: Pt;
  knR: Pt;
  foR: Pt;
  /** Which plane the flat pose was drawn in, before it is lifted into 3D. */
  plane?: "side" | "front";
  /** Arm spread. 1 is shoulder width; wide grips are higher, close grips lower. */
  width?: number;
};

const POSE_KEYS = [
  "head",
  "neck",
  "chest",
  "hip",
  "shL",
  "elL",
  "haL",
  "shR",
  "elR",
  "haR",
  "hipL",
  "knL",
  "foL",
  "hipR",
  "knR",
  "foR",
] as const;

export type Joint = (typeof POSE_KEYS)[number];

export type Clip = { at: number; pose: Pose3 }[];

export type Anchor = "low" | "hands";

export type Profile = "front" | "side" | "back";

export type V3 = { x: number; y: number; z: number };

export type Pose3 = Record<Joint, V3>;

export type Depths = Record<Joint, number>;

const TORSO = 48;
const NECK = 14;
const UPPER = 28;
const FORE = 26;
const THIGH = 40;
const SHIN = 38;

function dest(origin: Pt, deg: number, len: number): Pt {
  const r = (deg * Math.PI) / 180;
  return { x: origin.x + Math.sin(r) * len, y: origin.y - Math.cos(r) * len };
}

export function shift(p: Pose, dx: number, dy: number): Pose {
  const o = {} as Pose;
  for (const k of POSE_KEYS) o[k] = { x: p[k].x + dx, y: p[k].y + dy };
  if (p.plane) o.plane = p.plane;
  if (p.width) o.width = p.width;
  return o;
}

/** Glue contact points to a horizontal line so feet/hands stay planted while the body moves. */
export function settle(p: Pose, contacts: readonly Joint[], y: number): Pose {
  const avg = contacts.reduce((sum, k) => sum + p[k].y, 0) / contacts.length;
  return shift(p, 0, y - avg);
}

const GROUND = 214;
const BAR = 46;

export function onFloor(p: Pose, contacts: readonly Joint[] = ["foL", "foR"]): Pose {
  return settle(p, contacts, GROUND);
}

export function onBar(p: Pose): Pose {
  return settle(p, ["haL", "haR"], BAR);
}

type SideSpec = {
  hip?: Pt;
  torso?: number;
  head?: number;
  thighR?: number;
  kneeR?: number;
  thighL?: number;
  kneeL?: number;
  armR?: number;
  elbowR?: number;
  armL?: number;
  elbowL?: number;
  depth?: number;
  width?: number;
};

/** Side view, facing screen-right. 0° is upright; positive torso leans toward the face. */
export function side(s: SideSpec = {}): Pose {
  const hip = s.hip ?? { x: 104, y: 132 };
  const torso = s.torso ?? 8;
  const chest = dest(hip, torso, TORSO);
  const neck = dest(chest, torso + (s.head ?? 0) * 0.25, NECK);
  const head = dest(neck, torso + (s.head ?? 0), 18);
  const depth = s.depth ?? 12;

  const shR: Pt = { x: chest.x + 8, y: chest.y + 6 };
  const shL: Pt = { x: chest.x - depth * 0.62, y: chest.y + 1 };

  const armR = s.armR ?? 12;
  const armL = s.armL ?? 8;
  const elR = dest(shR, 180 - armR, UPPER);
  const haR = dest(elR, 180 - armR + (s.elbowR ?? 6), FORE);
  const elL = dest(shL, 180 - armL, UPPER);
  const haL = dest(elL, 180 - armL + (s.elbowL ?? 4), FORE);

  const hipR: Pt = { x: hip.x + 5, y: hip.y + 1 };
  const hipL: Pt = { x: hip.x - depth * 0.45, y: hip.y - 1 };
  const thR = s.thighR ?? 8;
  const thL = s.thighL ?? 4;
  const knR = dest(hipR, 180 - thR, THIGH);
  const foR = dest(knR, 180 - thR + (s.kneeR ?? 8), SHIN);
  const knL = dest(hipL, 180 - thL, THIGH);
  const foL = dest(knL, 180 - thL + (s.kneeL ?? 6), SHIN);

  return {
    head,
    neck,
    chest,
    hip,
    shL,
    elL,
    haL,
    shR,
    elR,
    haR,
    hipL,
    knL,
    foL,
    hipR,
    knR,
    foR,
    plane: "side",
    ...(s.width ? { width: s.width } : {}),
  };
}

type FrontSpec = {
  hipY?: number;
  spread?: number;
  headX?: number;
  thighR?: number;
  kneeR?: number;
  thighL?: number;
  kneeL?: number;
  armR?: number;
  elbowR?: number;
  armL?: number;
  elbowL?: number;
  shoulder?: number;
};

/** Front view. Thigh angles are outward from straight down. */
export function front(s: FrontSpec = {}): Pose {
  const cx = 100;
  const hipY = s.hipY ?? 128;
  const spread = s.spread ?? 16;
  const hip: Pt = { x: cx, y: hipY };
  const chest: Pt = { x: cx, y: hipY - TORSO };
  const neck: Pt = { x: cx, y: chest.y - NECK };
  const head: Pt = { x: cx + (s.headX ?? 0), y: neck.y - 16 };
  const sw = s.shoulder ?? 24;
  const shR: Pt = { x: cx + sw, y: chest.y + 4 };
  const shL: Pt = { x: cx - sw, y: chest.y + 4 };

  const armR = s.armR ?? 10;
  const armL = s.armL ?? 10;
  const elR = dest(shR, 180 - armR, UPPER);
  const haR = dest(elR, 180 - armR + (s.elbowR ?? 8), FORE);
  const elL = dest(shL, 180 + armL, UPPER);
  const haL = dest(elL, 180 + armL - (s.elbowL ?? 8), FORE);

  const hipR: Pt = { x: cx + spread, y: hipY };
  const hipL: Pt = { x: cx - spread, y: hipY };
  const outR = s.thighR ?? 8;
  const outL = s.thighL ?? 8;
  const knR = dest(hipR, 180 - outR, THIGH);
  const knL = dest(hipL, 180 + outL, THIGH);
  const foR = dest(knR, 180 - outR + (s.kneeR ?? outR * 0.85), SHIN);
  const foL = dest(knL, 180 + outL - (s.kneeL ?? outL * 0.85), SHIN);

  return { head, neck, chest, hip, shL, elL, haL, shR, elR, haR, hipL, knL, foL, hipR, knR, foR, plane: "front" };
}

export function mirror(p: Pose): Pose {
  const f = (pt: Pt): Pt => ({ x: 200 - pt.x, y: pt.y });
  return {
    head: f(p.head),
    neck: f(p.neck),
    chest: f(p.chest),
    hip: f(p.hip),
    shL: f(p.shR),
    elL: f(p.elR),
    haL: f(p.haR),
    shR: f(p.shL),
    elR: f(p.elL),
    haR: f(p.haL),
    hipL: f(p.hipR),
    knL: f(p.knR),
    foL: f(p.foR),
    hipR: f(p.hipL),
    knR: f(p.knL),
    foR: f(p.foL),
    ...(p.plane ? { plane: p.plane } : {}),
    ...(p.width ? { width: p.width } : {}),
  };
}

function sub(a: V3, b: V3): V3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function add(a: V3, b: V3): V3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function mul(a: V3, s: number): V3 {
  return { x: a.x * s, y: a.y * s, z: a.z * s };
}

function len(a: V3) {
  return Math.hypot(a.x, a.y, a.z);
}

function unit(a: V3, fallback: V3): V3 {
  const l = len(a);
  if (l < 0.5) return fallback;
  return { x: a.x / l, y: a.y / l, z: a.z / l };
}

function bone(root: V3, end: V3, length: number, fallback: V3): V3 {
  return add(root, mul(unit(sub(end, root), fallback), length));
}

function mixLen(a: V3, b: V3, c: V3, d: V3, e: number) {
  return len(sub(b, a)) + (len(sub(d, c)) - len(sub(b, a))) * e;
}

const DOWN: V3 = { x: 0, y: -1, z: 0 };

const ARM = { sh: 26, el: 28, ha: 20 };
const LEG = { hip: 12, kn: 13, fo: 11 };

function armGrip(p: Pose) {
  if (p.width) return p.width;
  const span = Math.abs(p.shR.x - p.shL.x);
  if (span < 11 || span > 17.5) return Math.min(1.42, Math.max(0.7, span / 15.2));
  return 1;
}

function stanceOf(p: Pose) {
  const span = Math.abs(p.hipR.x - p.hipL.x);
  return Math.min(1.12, Math.max(0.74, span / 10.5));
}

/** Side-drawn poses: screen x is forward, the left/right stagger is not real width. */
function liftSide(p: Pose): Pose3 {
  const g = armGrip(p);
  const shG = 0.84 + 0.16 * g;
  const haG = g;
  const elG = (shG + haG) / 2;
  const stance = stanceOf(p);
  const y = (k: Joint) => -p[k].y;
  const o = {} as Pose3;
  o.head = { x: 0, y: y("head"), z: p.head.x };
  o.neck = { x: 0, y: y("neck"), z: p.neck.x };
  o.chest = { x: 0, y: y("chest"), z: p.chest.x };
  o.hip = { x: 0, y: y("hip"), z: p.hip.x };

  const shZ = p.chest.x + ((p.shL.x - p.chest.x) + (p.shR.x - p.chest.x)) / 2;
  o.shL = { x: -ARM.sh * shG, y: y("shL"), z: shZ };
  o.shR = { x: ARM.sh * shG, y: y("shR"), z: shZ };
  o.elL = { x: -ARM.el * elG, y: y("elL"), z: shZ + (p.elL.x - p.shL.x) };
  o.elR = { x: ARM.el * elG, y: y("elR"), z: shZ + (p.elR.x - p.shR.x) };
  o.haL = { x: -ARM.ha * haG, y: y("haL"), z: o.elL.z + (p.haL.x - p.elL.x) };
  o.haR = { x: ARM.ha * haG, y: y("haR"), z: o.elR.z + (p.haR.x - p.elR.x) };

  const hipZ = p.hip.x + ((p.hipL.x - p.hip.x) + (p.hipR.x - p.hip.x)) / 2;
  o.hipL = { x: -LEG.hip * stance, y: y("hipL"), z: hipZ };
  o.hipR = { x: LEG.hip * stance, y: y("hipR"), z: hipZ };
  o.knL = { x: -LEG.kn * stance, y: y("knL"), z: hipZ + (p.knL.x - p.hipL.x) };
  o.knR = { x: LEG.kn * stance, y: y("knR"), z: hipZ + (p.knR.x - p.hipR.x) };
  o.foL = { x: -LEG.fo * stance, y: y("foL"), z: o.knL.z + (p.foL.x - p.knL.x) };
  o.foR = { x: LEG.fo * stance, y: y("foR"), z: o.knR.z + (p.foR.x - p.knR.x) };
  const face = Math.sign(o.head.z - o.chest.z) || 1;
  if (face < 0) {
    for (const k of POSE_KEYS) o[k] = { x: o[k].x, y: o[k].y, z: -o[k].z };
  }
  return o;
}

const FRONT_DEPTH: Record<Joint, number> = {
  head: 14,
  neck: 8,
  chest: 12,
  hip: 0,
  shL: 3,
  shR: 3,
  elL: 7,
  elR: 7,
  haL: 11,
  haR: 11,
  hipL: 1,
  hipR: 1,
  knL: 5,
  knR: 5,
  foL: 2,
  foR: 2,
};

/** Front-drawn poses: screen x is shoulder-to-shoulder. Knees reach forward as the leg shortens. */
function liftFront(p: Pose): Pose3 {
  const hx = p.hip.x;
  const reach = (hipK: Joint, footK: Joint) => Math.hypot(p[footK].x - p[hipK].x, p[footK].y - p[hipK].y);
  const fwdL = Math.max(0, 68 - reach("hipL", "foL")) * 0.62;
  const fwdR = Math.max(0, 68 - reach("hipR", "foR")) * 0.62;
  const o = {} as Pose3;
  for (const k of POSE_KEYS) {
    let z = FRONT_DEPTH[k];
    if (k === "knL") z += fwdL;
    if (k === "knR") z += fwdR;
    o[k] = { x: p[k].x - hx, y: -p[k].y, z };
  }
  return o;
}

function lift(p: Pose): Pose3 {
  return p.plane === "front" ? liftFront(p) : liftSide(p);
}

const FOCAL = 270;

function orient(lx: number, ly: number, lz: number, profile: Profile) {
  const yaw = profile === "side" ? 0.4 : 0.26;
  const pitch = profile === "side" ? 0 : 0.16;
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  let right = 0;
  let fore = 0;
  if (profile === "side") {
    right = lz * c - lx * s;
    fore = lx * c + lz * s;
  } else if (profile === "front") {
    right = -lx * c + lz * s;
    fore = lz * c + lx * s;
  } else {
    right = lx * c + lz * s;
    fore = -lz * c + lx * s;
  }
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const fore2 = Math.min(FOCAL * 0.62, fore * cp - ly * sp);
  const up = ly * cp - fore * sp;
  const scale = FOCAL / (FOCAL - fore2);
  return { x: right * scale, y: -up * scale, fore: fore2, scale };
}

export type ShellName = "sternum" | "spine" | "belly" | "sacrum";
export type Shell = Record<ShellName, Pt>;

const SHELL_KEYS: ShellName[] = ["sternum", "spine", "belly", "sacrum"];

function volume(body: Pose3): Record<ShellName, V3> {
  const chest = body.chest;
  const hip = body.hip;
  return {
    sternum: { x: chest.x, y: chest.y - 1, z: chest.z + 13 },
    spine: { x: chest.x * 0.2, y: chest.y + 1, z: chest.z - 11 },
    belly: { x: hip.x, y: hip.y + 5, z: hip.z + 10 },
    sacrum: { x: hip.x * 0.2, y: hip.y + 2, z: hip.z - 9 },
  };
}

export function project(body: Pose3, profile: Profile): {
  pose: Pose;
  depth: Depths;
  size: Depths;
  shell: Shell;
  shellDepth: Record<ShellName, number>;
} {
  const hip = body.hip;
  const pose = {} as Pose;
  const depth = {} as Depths;
  const size = {} as Depths;
  for (const k of POSE_KEYS) {
    const hit = orient(body[k].x - hip.x, body[k].y - hip.y, body[k].z - hip.z, profile);
    pose[k] = { x: hit.x, y: hit.y };
    depth[k] = hit.fore;
    size[k] = hit.scale;
  }
  const shell = {} as Shell;
  const shellDepth = {} as Record<ShellName, number>;
  const vol = volume(body);
  for (const k of SHELL_KEYS) {
    const hit = orient(vol[k].x - hip.x, vol[k].y - hip.y, vol[k].z - hip.z, profile);
    shell[k] = { x: hit.x, y: hit.y };
    shellDepth[k] = hit.fore;
  }
  return { pose, depth, size, shell, shellDepth };
}

function bboxOf(pts: Pt[]) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const pt of pts) {
    minX = Math.min(minX, pt.x);
    maxX = Math.max(maxX, pt.x);
    minY = Math.min(minY, pt.y);
    maxY = Math.max(maxY, pt.y);
  }
  return { minX, maxX, minY, maxY, w: maxX - minX, h: maxY - minY };
}

function bbox(p: Pose) {
  return bboxOf(POSE_KEYS.map((k) => p[k]));
}

function scaleAboutHip(p: Pose3, s: number): Pose3 {
  const o = {} as Pose3;
  const h = p.hip;
  for (const k of POSE_KEYS) {
    o[k] = {
      x: h.x + (p[k].x - h.x) * s,
      y: h.y + (p[k].y - h.y) * s,
      z: h.z + (p[k].z - h.z) * s,
    };
  }
  return o;
}

const PROFILES: Profile[] = ["front", "side", "back"];

/** One scale for the whole loop so the body doesn't pulse across profiles. */
export function frameClip(frames: { at: number; pose: Pose }[], _anchor: Anchor): Clip {
  const lifted = frames.map((frame) => ({ at: frame.at, pose: lift(frame.pose) }));
  let maxW = 1;
  let maxH = 1;
  for (const frame of lifted) {
    for (const profile of PROFILES) {
      const hit = project(frame.pose, profile);
      const box = bboxOf([...POSE_KEYS.map((k) => hit.pose[k]), ...SHELL_KEYS.map((k) => hit.shell[k])]);
      maxW = Math.max(maxW, box.w + 28);
      maxH = Math.max(maxH, box.h + 36);
    }
  }
  const scale = Math.min(158 / maxW, 178 / maxH, 1.15);
  return lifted.map((frame) => ({ at: frame.at, pose: scaleAboutHip(frame.pose, scale) }));
}

function guessAnchor(p: Pose): Anchor {
  const hands = (p.haL.y + p.haR.y) / 2;
  const feet = (p.foL.y + p.foR.y) / 2;
  if (hands + 36 < p.hip.y && hands + 24 < feet) return "hands";
  return "low";
}

function placement(p: Pose) {
  const box = bbox(p);
  const dx = 100 - (box.minX + box.maxX) / 2;
  const next = shift(p, dx, 0);
  if (guessAnchor(next) === "hands") {
    return { dx, dy: 44 - (next.haL.y + next.haR.y) / 2 };
  }
  const bottom = Math.max(next.foL.y, next.foR.y, next.haL.y, next.haR.y);
  return { dx, dy: 214 - bottom };
}

export function loop2(a: Pose, b: Pose, anchor: Anchor = "low"): Clip {
  return frameClip(
    [
      { at: 0, pose: a },
      { at: 0.16, pose: a },
      { at: 0.42, pose: b },
      { at: 0.66, pose: b },
      { at: 1, pose: a },
    ],
    anchor,
  );
}

export function loop3(a: Pose, b: Pose, c: Pose, anchor: Anchor = "low"): Clip {
  return frameClip(
    [
      { at: 0, pose: a },
      { at: 0.33, pose: b },
      { at: 0.66, pose: c },
      { at: 1, pose: a },
    ],
    anchor,
  );
}

function smooth(t: number) {
  return t * t * (3 - 2 * t);
}

function move(pt: Pt, dx: number, dy: number): Pt {
  return { x: pt.x + dx, y: pt.y + dy };
}

export function sample(clip: Clip, t: number, profile: Profile = "side"): {
  pose: Pose;
  depth: Depths;
  size: Depths;
  shell: Shell;
  shellDepth: Record<ShellName, number>;
} {
  const u = ((t % 1) + 1) % 1;
  let i = 0;
  while (i < clip.length - 1 && clip[i + 1]!.at < u) i += 1;
  const a = clip[i]!;
  const b = clip[Math.min(i + 1, clip.length - 1)]!;
  const span = Math.max(0.0001, b.at - a.at);
  const local = Math.min(1, Math.max(0, (u - a.at) / span));
  const e = smooth(local);
  const o = {} as Pose3;
  for (const k of POSE_KEYS) {
    o[k] = {
      x: a.pose[k].x + (b.pose[k].x - a.pose[k].x) * e,
      y: a.pose[k].y + (b.pose[k].y - a.pose[k].y) * e,
      z: a.pose[k].z + (b.pose[k].z - a.pose[k].z) * e,
    };
  }
  const projected = project(holdBones(a.pose, b.pose, o, e), profile);
  const { dx, dy } = placement(projected.pose);
  const pose = shift(projected.pose, dx, dy);
  const shell = {} as Shell;
  for (const k of SHELL_KEYS) shell[k] = move(projected.shell[k], dx, dy);
  return { pose, depth: projected.depth, size: projected.size, shell, shellDepth: projected.shellDepth };
}

/** Keep segment lengths on the arc between two poses so joints don't rubber-band. */
function holdBones(from: Pose3, to: Pose3, blended: Pose3, e: number): Pose3 {
  const hip = blended.hip;
  const chest = blended.chest;
  const neck = bone(chest, blended.neck, mixLen(from.chest, from.neck, to.chest, to.neck, e), DOWN);
  const head = bone(neck, blended.head, mixLen(from.neck, from.head, to.neck, to.head, e), DOWN);
  const shL = blended.shL;
  const shR = blended.shR;
  const hipL = blended.hipL;
  const hipR = blended.hipR;
  const elL = bone(shL, blended.elL, mixLen(from.shL, from.elL, to.shL, to.elL, e), DOWN);
  const elR = bone(shR, blended.elR, mixLen(from.shR, from.elR, to.shR, to.elR, e), DOWN);
  const haL = bone(elL, blended.haL, mixLen(from.elL, from.haL, to.elL, to.haL, e), unit(sub(elL, shL), DOWN));
  const haR = bone(elR, blended.haR, mixLen(from.elR, from.haR, to.elR, to.haR, e), unit(sub(elR, shR), DOWN));
  const knL = bone(hipL, blended.knL, mixLen(from.hipL, from.knL, to.hipL, to.knL, e), DOWN);
  const knR = bone(hipR, blended.knR, mixLen(from.hipR, from.knR, to.hipR, to.knR, e), DOWN);
  const foL = bone(knL, blended.foL, mixLen(from.knL, from.foL, to.knL, to.foL, e), unit(sub(knL, hipL), DOWN));
  const foR = bone(knR, blended.foR, mixLen(from.knR, from.foR, to.knR, to.foR, e), unit(sub(knR, hipR), DOWN));
  return { head, neck, chest, hip, shL, elL, haL, shR, elR, haR, hipL, knL, foL, hipR, knR, foR };
}
