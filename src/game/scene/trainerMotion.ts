import type { Object3D } from "three";

/*
 * How Tyler moves, from the v2 model's notes (.cache/research/models/
 * trainer-v2-notes.md 5): real gait numbers nudged a little bigger so they
 * read small on screen. One phase p per stride (two steps); the right side runs
 * half a stride behind. A walk blends into a run with speed; standing, he
 * breathes, shifts his weight now and then, and looks around, like GO's avatar.
 * Angles in radians about each bone's pivot (x > 0 swings a limb back, bends a
 * knee, tips a toe down; forearm x < 0 bends the elbow).
 */

export const BONES = ["hips", "spine", "chest", "head", "armL", "armR", "forearmL", "forearmR", "legL", "legR", "shinL", "shinR", "footL", "footR"] as const;
export type Bones = Record<(typeof BONES)[number], Object3D>;

const TAU = Math.PI * 2;
const wrap = (d: number) => ((((d + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
/** A bump centered on phase m, w wide. */
const g = (p: number, m: number, w: number) => Math.exp(-((wrap(p - m) / w) ** 2));
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Strides a second: matched to the feet at a walk, capped above it so a cartoon-fast run doesn't go frantic. */
export function strideRate(v: number) {
  if (v < 4) return Math.min(1.6, Math.max(0.7, v / 1.24));
  if (v <= 10) return Math.min(2, Math.max(1.25, v / 3.2));
  return Math.min(2.4, 2 + (v - 10) / 12);
}

/** One side's leg and arm for a walk (k 0) or run (k 1), at that side's phase. */
function limbs(p: number, k: number, big: number) {
  const c = Math.cos(p);
  const walk = {
    leg: -0.12 - 0.34 * c,
    shin: 0.06 + 0.22 * g(p, 0.7, 0.45) + 1.0 * g(p, 4.4, 0.6),
    foot: -0.12 * g(p, 0, 0.35) + 0.38 * g(p, 3.75, 0.35) - 0.1 * g(p, 4.6, 0.5),
    arm: 0.04 + 0.3 * c,
    out: 0.06,
    forearm: -0.2 - (0.25 * (1 - c)) / 2,
  };
  const run = {
    leg: (-0.3 - 0.6 * c) * big,
    shin: (0.15 + 0.45 * g(p, 0.5, 0.4) + 1.6 * g(p, 3.9, 0.75)) * big,
    foot: 0.5 * g(p, 2.6, 0.35) - 0.2 * g(p, 4.2, 0.6),
    arm: (0.12 + 0.6 * c) * big,
    out: 0.14,
    forearm: -1.35 - (0.15 * (1 - c)) / 2,
  };
  const mix = (a: number, b: number) => a + (b - a) * k;
  return { leg: mix(walk.leg, run.leg), shin: mix(walk.shin, run.shin), foot: mix(walk.foot, run.foot), arm: mix(walk.arm, run.arm), out: mix(walk.out, run.out), forearm: mix(walk.forearm, run.forearm) };
}

/** What carries over between frames: the stride, how much he's moving, and the idle's weight shift and glances. */
export type Motion = {
  p: number;
  amp: number;
  hipX: number | null;
  shift: { side: number; now: number; next: number };
  look: { target: number; at: number; vel: number; next: number };
};
export const newMotion = (): Motion => ({ p: 0, amp: 0, hipX: null, shift: { side: 0, now: 0, next: 4 }, look: { target: 0, at: 0, vel: 0, next: 3 } });

/**
 * Poses the bones for this frame and returns how high to bob the body (in the
 * 1-tall model's units). `speed` is in m/s, `dash` for the dash that skims
 * across the map, `t` the clock, `dt` the frame.
 */
export function pose(b: Bones, m: Motion, speed: number, dash: boolean, t: number, dt: number) {
  // ease the cycle in over about 0.15 s from a stop, out over 0.25 s
  const moving = speed > 0.3;
  m.amp += ((moving ? 1 : 0) - m.amp) * Math.min(1, dt * (moving ? 7 : 4.5));
  // finish the step before standing still: keep going to the next double support, then hold
  if (moving || Math.abs(Math.sin(m.p)) > 0.12) m.p = (m.p + TAU * strideRate(Math.max(speed, 1.2)) * dt) % TAU;
  const p = dash ? 2.2 : m.p;
  const k = dash ? 1 : smooth(3, 5, speed);
  const big = speed > 10 ? 1.15 : 1;
  const a = m.amp;
  const c = Math.cos(p);
  const s = Math.sin(p);
  const L = limbs(p, k, big);
  const R = limbs(p + Math.PI, k, big);

  // standing: breathing, a weight shift every 6-10 s, a look around every 4-9 s
  const still = 1 - a;
  const sh = m.shift;
  if (t > sh.next) {
    sh.side = sh.side ? 0 : Math.random() < 0.5 ? -1 : 1;
    sh.next = t + 6 + Math.random() * 4;
  }
  sh.now += (sh.side - sh.now) * Math.min(1, dt * 1.1);
  const lk = m.look;
  if (t > lk.next) {
    lk.target = lk.target ? 0 : (Math.random() < 0.2 ? 0.6 : 0.35) * (Math.random() < 0.5 ? -1 : 1);
    lk.next = t + (lk.target ? 1 + Math.random() * 1.5 : 4 + Math.random() * 5);
  }
  // a spring at 2.5 Hz, damping 0.8
  const w = TAU * 2.5;
  lk.vel += ((lk.target - lk.at) * w * w - 2 * 0.8 * w * lk.vel) * Math.min(dt, 0.05);
  lk.at += lk.vel * Math.min(dt, 0.05);
  const breath = 0.012 * Math.sin(TAU * 0.25 * t);
  const sway = 0.02 * Math.sin(TAU * 0.25 * t);

  b.legL.rotation.set(L.leg * a, 0, 0);
  b.legR.rotation.set(R.leg * a, 0, 0);
  b.shinL.rotation.x = L.shin * a + (sh.now > 0 ? 0.12 * sh.now * still : 0);
  b.shinR.rotation.x = R.shin * a + (sh.now < 0 ? -0.12 * sh.now * still : 0);
  b.footL.rotation.x = L.foot * a;
  b.footR.rotation.x = R.foot * a;
  b.armL.rotation.set(L.arm * a + sway * still, 0, L.out * a);
  b.armR.rotation.set(R.arm * a - sway * still, 0, -R.out * a);
  b.forearmL.rotation.x = L.forearm * a - 0.12 * still;
  b.forearmR.rotation.x = R.forearm * a - 0.12 * still;
  // the hips of the forward leg lead and the swing side drops; the chest turns against them
  b.hips.rotation.set(0, (-0.08 - 0.06 * k) * c * a, (0.04 + 0.01 * k) * s * a + 0.035 * sh.now * still);
  m.hipX ??= b.hips.position.x;
  b.hips.position.x = m.hipX + 0.0069 * s * a * (1 - k) + 0.0069 * sh.now * still;
  const lean = dash ? 0.3 : speed > 10 ? 0.22 : 0.04 + 0.08 * k;
  b.spine.rotation.x = lean * a;
  b.chest.rotation.set((0.05 * k) * a + breath, (0.14 + 0.12 * k) * c * a + lk.at * 0.25 * still, -0.02 * s * a * (1 - k));
  b.head.rotation.set(-0.12 * k * a, (-0.06 - 0.06 * k) * c * a + lk.at * 0.75 * still, 0);
  // the bob: highest mid-stance at a walk, mid-flight at a run
  const bob = (1 - k) * 0.0086 * (1 - Math.cos(2 * p)) + k * 0.02 * (1 - Math.cos(2 * (p - 1.26)));
  return dash ? 0.02 : bob * a;
}

