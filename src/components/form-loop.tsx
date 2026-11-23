import { useEffect, useId, useState } from "react";
import type { Exercise } from "@/lib/workout/exercises";
import {
  sample,
  type Depths,
  type Pose,
  type Profile,
  type Pt,
  type Shell,
  type ShellName,
} from "@/lib/workout/pose";

function Bone({ a, b, w, className }: { a: Pt; b: Pt; w: number; className: string }) {
  return (
    <line
      x1={a.x}
      y1={a.y}
      x2={b.x}
      y2={b.y}
      strokeWidth={w}
      strokeLinecap="round"
      className={className}
    />
  );
}

function Capsule({
  a,
  b,
  r,
  className,
  sw = 1.75,
}: {
  a: Pt;
  b: Pt;
  r: number;
  className: string;
  sw?: number;
}) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 0.001;
  const px = (-dy / len) * r;
  const py = (dx / len) * r;
  const d = `M ${a.x + px} ${a.y + py} L ${b.x + px} ${b.y + py} A ${r} ${r} 0 0 1 ${b.x - px} ${b.y - py} L ${a.x - px} ${a.y - py} A ${r} ${r} 0 0 1 ${a.x + px} ${a.y + py} Z`;
  return <path d={d} className={className} strokeWidth={sw} strokeLinejoin="round" />;
}

function Joint({ at, r = 3.2 }: { at: Pt; r?: number }) {
  return <circle cx={at.x} cy={at.y} r={r} className="fill-bg" />;
}

function tone(depth: Depths, key: keyof Depths) {
  const values = Object.values(depth);
  const mid = (Math.min(...values) + Math.max(...values)) / 2;
  return depth[key] >= mid ? "stroke-chalk" : "stroke-faint";
}

function Foot({
  ankle,
  knee,
  profile,
  facing,
  side,
  weight,
}: {
  ankle: Pt;
  knee: Pt;
  profile: Profile;
  facing: number;
  side: number;
  weight: number;
}) {
  const dx = ankle.x - knee.x;
  const dy = ankle.y - knee.y;
  const dl = Math.hypot(dx, dy) || 1;
  const ux = dx / dl;
  const uy = dy / dl;
  const grounded = ankle.y > 196;
  let heel: Pt;
  let toe: Pt;
  if (!grounded) {
    heel = { x: ankle.x - ux * 4, y: ankle.y - uy * 3 };
    toe = { x: ankle.x + ux * 11 + facing * 3, y: ankle.y + uy * 6 };
  } else if (profile === "side") {
    heel = { x: ankle.x - facing * 6, y: ankle.y + 1.2 };
    toe = { x: ankle.x + facing * 15, y: ankle.y + 1.4 };
  } else if (profile === "front") {
    heel = { x: ankle.x - side * 1.2, y: ankle.y - 3 };
    toe = { x: ankle.x + side * 4, y: ankle.y + 11 };
  } else {
    heel = { x: ankle.x - side * 1, y: ankle.y + 4 };
    toe = { x: ankle.x + side * 3.5, y: ankle.y - 10 };
  }
  return <Bone a={heel} b={toe} w={5 * weight} className="stroke-chalk" />;
}

function Limb({
  root,
  joint,
  tip,
  depth,
  size,
  rootKey,
  jointKey,
  tipKey,
  foot,
  profile,
  facing,
  side,
}: {
  root: Pt;
  joint: Pt;
  tip: Pt;
  depth: Depths;
  size: Depths;
  rootKey: keyof Depths;
  jointKey: keyof Depths;
  tipKey: keyof Depths;
  foot?: boolean;
  profile: Profile;
  facing: number;
  side: number;
}) {
  const weight = (size[rootKey] + size[tipKey]) / 2;
  const near = tone(depth, jointKey) === "stroke-chalk";
  const ink = near ? "fill-chalk stroke-bg" : "fill-faint stroke-bg";
  const upper = (foot ? 6.4 : 4.8) * weight;
  const lower = (foot ? 4.4 : 3.5) * weight;
  return (
    <g>
      <Capsule a={root} b={joint} r={upper} className={ink} sw={near ? 1.6 : 1.1} />
      <Capsule a={joint} b={tip} r={lower} className={ink} sw={near ? 1.6 : 1.1} />
      {foot ? (
        <Foot ankle={tip} knee={joint} profile={profile} facing={facing} side={side} weight={weight} />
      ) : (
        <circle cx={tip.x} cy={tip.y} r={4.6 * weight} className="fill-ember stroke-bg" strokeWidth="1.2" />
      )}
      <Joint at={joint} r={2.4 * weight} />
    </g>
  );
}

function Figure({
  pose,
  depth,
  size,
  shell,
  shellDepth,
  profile,
}: {
  pose: Pose;
  depth: Depths;
  size: Depths;
  shell: Shell;
  shellDepth: Record<ShellName, number>;
  profile: Profile;
}) {
  const span = Math.hypot(pose.head.x - pose.neck.x, pose.head.y - pose.neck.y);
  const headR = Math.max(9, Math.min(14.5, span * 0.7)) * (0.62 + size.head * 0.38);
  const nx = pose.head.x - pose.neck.x;
  const ny = pose.head.y - pose.neck.y;
  const nl = Math.hypot(nx, ny) || 1;
  const ux = nx / nl;
  const uy = ny / nl;
  const px = -uy;
  const py = ux;
  const jaw = { x: pose.head.x - ux * headR * 0.78, y: pose.head.y - uy * headR * 0.78 };
  const facing = shell.sternum.x >= shell.spine.x ? 1 : -1;
  const fromBack = shellDepth.spine > shellDepth.sternum + 1.2;
  const bulk = (size.chest + size.hip) / 2;
  const eye = (sign: number, along = 0.05): Pt => ({
    x: pose.head.x + px * headR * 0.32 * sign + ux * headR * along,
    y: pose.head.y + py * headR * 0.32 * sign + uy * headR * along,
  });

  const parts = [
    {
      d: (depth.hipL + depth.knL + depth.foL) / 3,
      node: (
        <Limb
          key="legL"
          root={pose.hipL}
          joint={pose.knL}
          tip={pose.foL}
          depth={depth}
          size={size}
          rootKey="hipL"
          jointKey="knL"
          tipKey="foL"
          foot
          profile={profile}
          facing={facing}
          side={-1}
        />
      ),
    },
    {
      d: (depth.shL + depth.elL + depth.haL) / 3,
      node: (
        <Limb
          key="armL"
          root={pose.shL}
          joint={pose.elL}
          tip={pose.haL}
          depth={depth}
          size={size}
          rootKey="shL"
          jointKey="elL"
          tipKey="haL"
          profile={profile}
          facing={facing}
          side={-1}
        />
      ),
    },
    {
      d: (depth.hipR + depth.knR + depth.foR) / 3,
      node: (
        <Limb
          key="legR"
          root={pose.hipR}
          joint={pose.knR}
          tip={pose.foR}
          depth={depth}
          size={size}
          rootKey="hipR"
          jointKey="knR"
          tipKey="foR"
          foot
          profile={profile}
          facing={facing}
          side={1}
        />
      ),
    },
    {
      d: (depth.shR + depth.elR + depth.haR) / 3,
      node: (
        <Limb
          key="armR"
          root={pose.shR}
          joint={pose.elR}
          tip={pose.haR}
          depth={depth}
          size={size}
          rootKey="shR"
          jointKey="elR"
          tipKey="haR"
          profile={profile}
          facing={facing}
          side={1}
        />
      ),
    },
    {
      d: (depth.hip + depth.chest + shellDepth.sternum + shellDepth.spine) / 4,
      node: (
        <g key="trunk">
          <Capsule a={pose.hip} b={pose.chest} r={10.5 * bulk} className="fill-chalk stroke-bg" />
          <Capsule a={shell.belly} b={shell.sacrum} r={5.8 * bulk} className="fill-chalk stroke-bg" sw={1.2} />
          <Capsule a={pose.hipL} b={pose.hipR} r={6.4 * bulk} className="fill-chalk stroke-bg" sw={1.2} />
          <Capsule a={shell.sternum} b={shell.spine} r={6.2 * bulk} className="fill-chalk stroke-bg" sw={1.2} />
          <Capsule a={pose.shL} b={pose.shR} r={7.2 * bulk} className="fill-chalk stroke-bg" />
          <Capsule a={pose.neck} b={jaw} r={3.3 * size.neck} className="fill-chalk stroke-bg" sw={1.3} />
          {fromBack ? <Bone a={pose.neck} b={shell.sacrum} w={2.2} className="stroke-bg" /> : null}
          <Joint at={pose.shL} r={2.3 * size.shL} />
          <Joint at={pose.shR} r={2.3 * size.shR} />
          <Joint at={pose.hipL} r={2.4 * size.hipL} />
          <Joint at={pose.hipR} r={2.4 * size.hipR} />
        </g>
      ),
    },
    {
      d: fromBack ? shellDepth.spine + 6 : (depth.head + depth.neck) / 2 + 1,
      node: (
        <g key="head">
          <circle cx={pose.head.x} cy={pose.head.y} r={headR} strokeWidth="2" className="fill-chalk stroke-bg" />
          {profile === "front" ? (
            <>
              <circle cx={eye(-1).x} cy={eye(-1).y} r="1.7" className="fill-bg" />
              <circle cx={eye(1).x} cy={eye(1).y} r="1.7" className="fill-bg" />
              <line
                x1={pose.head.x + ux * headR * 0.02}
                y1={pose.head.y + uy * headR * 0.02}
                x2={pose.head.x - ux * headR * 0.28}
                y2={pose.head.y - uy * headR * 0.28}
                strokeWidth="1.7"
                strokeLinecap="round"
                className="stroke-bg"
              />
            </>
          ) : null}
          {profile === "side" ? (
            <>
              <circle
                cx={pose.head.x + facing * headR * 0.22 - ux * headR * 0.08}
                cy={pose.head.y - uy * headR * 0.12}
                r="1.5"
                className="fill-bg"
              />
              <line
                x1={pose.head.x + facing * headR * 0.35}
                y1={pose.head.y + headR * 0.02}
                x2={pose.head.x + facing * (headR + 5.5)}
                y2={pose.head.y + headR * 0.16}
                strokeWidth="2.6"
                strokeLinecap="round"
                className="stroke-bg"
              />
              <ellipse
                cx={pose.head.x - facing * headR * 0.92}
                cy={pose.head.y + headR * 0.02}
                rx={headR * 0.16}
                ry={headR * 0.32}
                className="fill-faint stroke-bg"
                strokeWidth="1.3"
              />
            </>
          ) : null}
          {profile === "back" ? (
            <>
              <ellipse
                cx={pose.head.x + px * (headR + 1)}
                cy={pose.head.y + py * (headR + 1)}
                rx={headR * 0.18}
                ry={headR * 0.34}
                className="fill-faint stroke-bg"
                strokeWidth="1.3"
              />
              <ellipse
                cx={pose.head.x - px * (headR + 1)}
                cy={pose.head.y - py * (headR + 1)}
                rx={headR * 0.18}
                ry={headR * 0.34}
                className="fill-faint stroke-bg"
                strokeWidth="1.3"
              />
            </>
          ) : null}
        </g>
      ),
    },
  ].sort((a, b) => a.d - b.d);

  return <g fill="none">{parts.map((part) => part.node)}</g>;
}

function Ground({ profile }: { profile: Profile }) {
  if (profile === "side") {
    return (
      <g>
        <polygon points="14,236 186,228 162,206 34,212" className="fill-raised" />
        <g className="stroke-line" fill="none" strokeWidth="1.25">
          <line x1="14" y1="236" x2="186" y2="228" />
          <line x1="34" y1="212" x2="162" y2="206" />
          <line x1="48" y1="232" x2="62" y2="210" />
          <line x1="92" y1="232" x2="98" y2="208" />
          <line x1="140" y1="230" x2="136" y2="207" />
        </g>
      </g>
    );
  }
  return (
    <g>
      <polygon points="16,240 184,240 152,196 48,196" className="fill-raised" />
      <g className="stroke-line" fill="none" strokeWidth="1.25">
        <line x1="16" y1="240" x2="184" y2="240" />
        <line x1="48" y1="196" x2="152" y2="196" />
        <line x1="16" y1="240" x2="48" y2="196" />
        <line x1="184" y1="240" x2="152" y2="196" />
        <line x1="72" y1="240" x2="78" y2="196" />
        <line x1="128" y1="240" x2="122" y2="196" />
        <line x1="100" y1="240" x2="100" y2="196" />
      </g>
    </g>
  );
}

function Shadows({ pose }: { pose: Pose }) {
  const spots = [pose.foL, pose.foR, pose.haL, pose.haR].filter((pt) => pt.y > 198);
  return (
    <g className="fill-line">
      {spots.map((pt, i) => (
        <ellipse key={i} cx={pt.x} cy={218} rx="10" ry="2.7" />
      ))}
    </g>
  );
}

function Scene({
  exercise,
  pose,
  depth,
  size,
  shell,
  shellDepth,
  profile,
}: {
  exercise: Exercise;
  pose: Pose;
  depth: Depths;
  size: Depths;
  shell: Shell;
  shellDepth: Record<ShellName, number>;
  profile: Profile;
}) {
  const handY = (pose.haL.y + pose.haR.y) / 2;
  const handX = (pose.haL.x + pose.haR.x) / 2;
  const gripL = Math.min(pose.haL.x, pose.haR.x);
  const gripR = Math.max(pose.haL.x, pose.haR.x);
  const barWide = profile !== "side";
  const barX1 = barWide ? Math.max(28, gripL - 22) : 32;
  const barX2 = barWide ? Math.min(172, gripR + 22) : 168;
  const facing = shell.sternum.x >= shell.spine.x ? 1 : -1;
  return (
    <>
      {exercise.prop !== "bar" ? (
        <>
          <Ground profile={profile} />
          <Shadows pose={pose} />
        </>
      ) : (
        <g className="stroke-muted" fill="none" strokeWidth="4" strokeLinecap="round">
          <line x1={barX1} y1={handY} x2={barX2} y2={handY} />
          <line x1={barX1} y1="16" x2={barX1} y2={handY} />
          <line x1={barX2} y1="16" x2={barX2} y2={handY} />
        </g>
      )}
      {exercise.prop === "cable" ? (
        <g>
          <line x1="186" y1="78" x2={handX} y2={Math.min(pose.haL.y, pose.haR.y)} className="stroke-muted" strokeWidth="2" />
          <rect x="178" y="70" width="12" height="86" rx="2" className="fill-raised" />
        </g>
      ) : null}
      {exercise.prop === "wheel" ? (
        <circle cx={handX} cy={handY} r="8" className="fill-none stroke-primary" strokeWidth="3" />
      ) : null}
      {exercise.id === "hspu" && profile === "side" ? (
        <line x1={facing > 0 ? 176 : 24} y1="36" x2={facing > 0 ? 176 : 24} y2="230" className="stroke-line" strokeWidth="3" />
      ) : null}
      <Figure pose={pose} depth={depth} size={size} shell={shell} shellDepth={shellDepth} profile={profile} />
    </>
  );
}

const PROFILES: { id: Profile; label: string }[] = [
  { id: "front", label: "Front" },
  { id: "side", label: "Side" },
  { id: "back", label: "Back" },
];

function naturalProfile(exercise: Exercise): Profile {
  return exercise.view === "front" ? "front" : "side";
}

export function FormLoop({
  exercise,
  playing = true,
  compact = false,
}: {
  exercise: Exercise;
  playing?: boolean;
  compact?: boolean;
}) {
  const [t, setT] = useState(0.38);
  const [reduced, setReduced] = useState(false);
  const [profile, setProfile] = useState<Profile>(naturalProfile(exercise));

  useEffect(() => {
    setProfile(naturalProfile(exercise));
  }, [exercise.id, exercise.view]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(media.matches);
    if (!playing || media.matches) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      setT(((now - start) % 2800) / 2800);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, exercise.id]);

  const shown = compact ? naturalProfile(exercise) : profile;
  const posed = sample(exercise.clip, playing && !reduced ? t : 0.4, shown);
  const phase = t > 0.3 && t < 0.7 ? exercise.phases[1] : exercise.phases[0];
  const spot = useId();

  return (
    <div className={`relative overflow-hidden ${compact ? "rounded-xl bg-surface" : "card rounded-2xl"}`}>
      <svg
        viewBox="0 0 200 250"
        role="img"
        aria-label={`${exercise.name} from the ${shown}`}
        className={compact ? "h-36 w-full" : "h-56 w-full"}
      >
        <defs>
          <radialGradient id={spot} cx="50%" cy="58%" r="50%">
            <stop offset="0%" stopColor="#e7d7bc" stopOpacity="0.09" />
            <stop offset="100%" stopColor="#e7d7bc" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="200" height="250" fill={`url(#${spot})`} />
        <Scene exercise={exercise} pose={posed.pose} depth={posed.depth} size={posed.size} shell={posed.shell} shellDepth={posed.shellDepth} profile={shown} />
      </svg>
      {compact ? null : (
        <>
          <p className="absolute top-3 left-4 text-xs tracking-wide text-muted uppercase">{exercise.equipment}</p>
          <p className="absolute top-3 right-4 text-xs tracking-wide text-muted uppercase">{shown}</p>
          <p className="absolute bottom-[4.6rem] left-4 font-display text-lg tracking-widest text-ember">{phase}</p>
          <div className="mx-2 mb-2 grid grid-cols-3 gap-1 rounded-xl bg-bg/60 p-1" role="group" aria-label="View">
            {PROFILES.map((item) => {
              const on = shown === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setProfile(item.id)}
                  className={`min-h-10 rounded-lg text-sm font-semibold transition-colors ${on ? "bg-ember text-ember-fg shadow-sm" : "text-muted hover:text-fg"}`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
