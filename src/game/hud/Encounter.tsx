"use client";

import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { addItems, progressStore, spendItem } from "../progress";
import { catchRewards } from "../cp";
import { movementOf, SPECIES } from "../species";
import { sfx } from "../sound";
import { FoeView } from "./FoeView";
import { ItemIcon } from "./icons";
import { WeatherIcon } from "./WeatherBadge";
import type { Weather } from "../weather";

/**
 * Who you're trying to catch. Fact Pokémon never run and always get caught by
 * the second hit. A raid boss comes with `premier`: GO's bonus round, a set of
 * Premier Balls and the odds; it never runs early, but it's gone when they're spent.
 */
export type Foe = {
  dex: number;
  name: string;
  rare: boolean;
  cp: number;
  premier?: { balls: number; rate: number };
  /** The weather boosting it, if any: GO shows its icon by the CP. */
  boost?: Weather;
};

type Phase = "aim" | "flying" | "catching" | "caught" | "fled";
type Throw = "Nice" | "Great" | "Excellent" | null;
export type Thrown = Throw;

const RING_CYCLE = 1.7; // seconds for the inner ring to shrink from full to nearly nothing
const RING_MIN = 0.12;

/**
 * GO's odds (notes/research/encounter.md 7): P = 1 - (1 - min(1, BCR / 2·CPM))^M,
 * with the species' base capture rate, a level 15 CP multiplier, and M the
 * ball x berry x throw x curveball multipliers.
 */
const CPM = 0.5174;
const CURVE = 1.7;
const catchChance = (dex: number, m: number) => 1 - (1 - Math.min(1, (SPECIES[dex]?.capture ?? 0.3) / (2 * CPM))) ** m;
/** GO's ring color: the plain-throw chance, red at 0, yellow at a half, green at 1. */
const ringColorFor = (p: number) => (p < 0.5 ? `rgb(255, ${Math.round(510 * p)}, 0)` : `rgb(${Math.round(510 * (1 - p))}, 255, 0)`);

/**
 * What it does between your throws, like GO (encounter.md 4): every 0.2 to 1.6 s
 * it may attack (2 s, and a ball that lands then bounces off) or dodge, by its
 * movement type. Raid bosses attack more.
 */
const ATTACK = 0.1;
const DODGE = 0.15;
type Act = { kind: "idle" | "attack" | "dodge"; start: number; dur: number; from: [number, number]; to: [number, number] };

/** How an encounter ended, for the HUD: caught, it fled, or you ran (it stays on the map). */
export type CatchResult = { outcome: "caught" | "fled" | "ran"; best: Throw; firstThrow: boolean; curve: boolean };

/**
 * GO's catch screen (notes/research/pokemon-go-ui.md, encounter.md): the
 * Pokémon on a field under a high horizon, a dark name plate over it, a big
 * Poké Ball cut off at the bottom, a berry button on the left and the ball
 * switch on the right. Hold the ball and the rings show: a white one round the
 * Pokémon and an inner one that keeps shrinking, colored by the chance. Circle
 * the ball to spin it for a curveball. Flick it up. Land inside the colored
 * ring for a bonus, by its size when the ball arrives: Excellent under 0.3,
 * Great under 0.7, Nice otherwise. The ball pops open, pulls it in, drops and
 * shakes up to three times; then it's caught in a burst of stars, or it breaks
 * free, and maybe flees in a puff.
 */
export function Encounter({ foe, onDone }: { foe: Foe; onDone: (result: CatchResult) => void }) {
  const field = useRef<HTMLDivElement>(null);
  const ball = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const actor = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("aim");
  const phaseNow = useRef<Phase>("aim");
  const [label, setLabel] = useState<Throw>(null);
  const [curved, setCurved] = useState(false);
  const [critical, setCritical] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  /** The rings only show while you hold the ball, and while it flies. */
  const [holding, setHolding] = useState(false);
  /** Circled the ball enough to spin it: -1 or 1 for the way it turns, 0 not spinning. */
  const [spin, setSpin] = useState(0);
  const turned = useRef({ total: 0, last: null as number | null, at: 0 });
  /** Shakes for the ball's animation, and whether to show the Pokémon (hidden once it's in the ball). */
  const [shakes, setShakes] = useState(0);
  const [inBall, setInBall] = useState(false);
  const [bounced, setBounced] = useState(false);
  const hits = useRef(0);
  const throws = useRef(0);
  const [firstBall, setFirstBall] = useState(false);
  /** A fact Pokémon has been hit once (the next hit always catches it). */
  const [struck, setStruck] = useState(false);
  const drag = useRef<{ id: number; samples: { x: number; y: number; t: number }[] } | null>(null);
  const start = useRef(0);
  const act = useRef<Act>({ kind: "idle", start: 0, dur: 0, from: [0, 0], to: [0, 0] });
  const offset = useRef<[number, number]>([0, 0]);
  const { items } = useSyncExternalStore(progressStore.subscribe, progressStore.get, progressStore.server);
  const [ballType, setBallType] = useState<"ball" | "great">("ball");
  const [berry, setBerry] = useState(false);
  const [firstOfKind] = useState(() => !progressStore.get().caught[foe.dex]);
  const thrown = useRef<{ great: boolean; berry: boolean; spin: number }>({ great: false, berry: false, spin: 0 });
  const round = foe.premier;
  const left = useRef(round?.balls ?? 0);
  const [premierLeft, setPremierLeft] = useState(round?.balls ?? 0);
  /** The bonus round is over once the last Premier Ball misses or breaks open. */
  const spent = () => !!round && left.current <= 0;
  const move = movementOf(foe.dex);

  const go = useCallback((p: Phase) => {
    phaseNow.current = p;
    setPhase(p);
  }, []);

  // A fact Pokémon never gets stuck behind an empty bag: it hands you a ball.
  useEffect(() => {
    const bag = progressStore.get().items;
    if (foe.rare && bag.ball + bag.great === 0) addItems({ ball: 1 });
  }, [foe.rare]);

  // Ring color like GO: a plain throw's chance with the selected ball and berry
  const plain = round
    ? round.rate + (berry ? 0.15 : 0)
    : foe.rare
      ? struck
        ? 1
        : 0.7
      : catchChance(foe.dex, (ballType === "great" ? 1.5 : 1) * (berry ? 1.5 : 1));
  const ringColor = ringColorFor(Math.min(1, plain));
  const caughtBefore = (progressStore.get().caught[foe.dex] ?? 0) > 0;

  const geometry = useCallback(() => {
    const box = field.current?.getBoundingClientRect();
    const w = box?.width ?? 390;
    const h = box?.height ?? 800;
    const size = Math.min(w * 0.32, 150);
    // GO's layout: the Pokémon at 52% down, its white ring 42% of the width, the ball resting a tenth cut off
    return { w, h, size, outer: Math.min(w * 0.42, 200) / 2, target: { x: w / 2, y: h * 0.52 }, rest: { x: w / 2, y: h - size * 0.4 } };
  }, []);

  const place = useCallback((x: number, y: number, scale = 1, turn = 0, fade = 1) => {
    const el = ball.current;
    if (!el) return;
    const half = el.offsetWidth / 2;
    el.style.transform = `translate(${x - half}px, ${y - half}px) scale(${scale}) rotate(${turn}deg)`;
    el.style.opacity = String(fade);
  }, []);

  // Park the ball; breathe the ring; and let the Pokémon idle, attack and dodge
  useEffect(() => {
    start.current = performance.now();
    const { rest } = geometry();
    place(rest.x, rest.y);
    let raf = 0;
    let nextRoll = performance.now() + 900;
    let side = 0;
    const tick = () => {
      const now = performance.now();
      const t = ((now - start.current) / 1000 / RING_CYCLE) % 1;
      if (ring.current) ring.current.style.transform = `translate(-50%, -50%) scale(${1 - t * (1 - RING_MIN)})`;
      const { w, h } = geometry();
      const a = act.current;
      const active = phaseNow.current === "aim" || phaseNow.current === "flying";
      if (active && a.kind === "idle" && now >= nextRoll && move !== "none") {
        const r = Math.random();
        const attack = round ? 0.25 : ATTACK;
        if (r < attack) act.current = { kind: "attack", start: now, dur: 2000, from: offset.current, to: offset.current };
        else if (r < attack + DODGE) {
          // where it dodges to, by how it moves
          let to: [number, number] = [0, 0];
          if (move === "hover") {
            side = side ? 0 : Math.random() < 0.5 ? -1 : 1;
            to = [side * w * 0.22, 0];
          } else if (move === "fly") {
            side = side ? 0 : 1;
            to = [0, -side * h * 0.1];
          } else if (move === "electric") to = [(Math.random() - 0.5) * w * 0.3, (Math.random() - 0.5) * h * 0.06];
          act.current = { kind: "dodge", start: now, dur: move === "jump" ? 1000 : 900, from: offset.current, to };
        } else nextRoll = now + 200 + Math.random() * 1400;
      }
      // play it out
      const k = a.kind === "idle" ? 0 : Math.min(1, (now - a.start) / a.dur);
      let dx = offset.current[0];
      let dy = offset.current[1];
      let scale = 1;
      if (a.kind === "dodge") {
        const e = k * k * (3 - 2 * k);
        dx = a.from[0] + (a.to[0] - a.from[0]) * e;
        dy = a.from[1] + (a.to[1] - a.from[1]) * e;
        if (move === "jump") dy -= Math.sin(Math.PI * k) * h * 0.08;
        if (move === "psychic") {
          dx += Math.sin(k * Math.PI * 2) * w * 0.12;
          dy += Math.sin(k * Math.PI * 4) * h * 0.025;
        }
        if (move === "electric" && k > 0.5) {
          // dart back home in the second half
          const back = (k - 0.5) * 2;
          dx = a.to[0] * (1 - back);
          dy = a.to[1] * (1 - back);
        }
      } else if (a.kind === "attack") {
        // a lunge at you, a shudder, and back
        const lunge = Math.sin(Math.min(1, k * 3) * Math.PI * 0.5) * (1 - Math.max(0, (k - 0.75) * 4));
        scale = 1 + lunge * 0.14;
        dy += lunge * h * 0.02;
        dx += Math.sin(now / 28) * 4 * lunge;
      }
      if (a.kind !== "idle" && k >= 1) {
        if (a.kind === "dodge") offset.current = move === "electric" || move === "jump" || move === "psychic" ? [0, 0] : a.to;
        act.current = { kind: "idle", start: now, dur: 0, from: offset.current, to: offset.current };
        nextRoll = now + 200 + Math.random() * 1400;
      }
      if (a.kind === "idle") [dx, dy] = offset.current;
      if (actor.current) actor.current.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${scale})`;
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [geometry, place, move, round]);

  const ringNow = () => 1 - (((performance.now() - start.current) / 1000 / RING_CYCLE) % 1) * (1 - RING_MIN);
  /** Where the Pokémon is right now, with its dodge. */
  const targetNow = () => {
    const { target } = geometry();
    const a = act.current;
    if (a.kind !== "dodge") return { x: target.x + offset.current[0], y: target.y + offset.current[1] };
    const k = Math.min(1, (performance.now() - a.start) / a.dur);
    return { x: target.x + a.from[0] + (a.to[0] - a.from[0]) * k, y: target.y + a.from[1] + (a.to[1] - a.from[1]) * k };
  };

  /** Back to aiming: a fresh ball rises from the bottom. */
  const nextBall = () => {
    const { rest, size } = geometry();
    let t0 = -1;
    const rise = (ts: number) => {
      if (t0 < 0) t0 = ts;
      const k = Math.min(1, (ts - t0) / 260);
      place(rest.x, rest.y + size * (1 - k) ** 2);
      if (k < 1) requestAnimationFrame(rise);
    };
    requestAnimationFrame(rise);
    setLabel(null);
    setCurved(false);
    setBounced(false);
    go("aim");
  };

  /** The ball landed on it: \`ringAt\` is the inner ring's size then, \`inside\` whether it came down within it. */
  const resolve = (at: { x: number; y: number }, ringAt: number, inside: boolean) => {
    const bonus: Throw = !inside ? null : ringAt <= 0.3 ? "Excellent" : ringAt <= 0.7 ? "Great" : "Nice";
    const curve = thrown.current.spin !== 0;
    setLabel(bonus);
    setCurved(curve);
    setHolding(false);
    hits.current += 1;
    if (foe.rare) setStruck(true);
    const throwBonus = inside ? 2 - ringAt : 1;
    // GO's critical catch: 1 in 100, or sure when it lands in the ring at its smallest; one shake and done
    const crit = !round && !foe.rare && (Math.random() < 0.01 || (inside && ringAt <= RING_MIN + 0.02));
    const chance = crit
      ? 1
      : round
        ? round.rate + (throwBonus - 1) * 0.25 + (curve ? 0.05 : 0) + (thrown.current.berry ? 0.15 : 0)
        : foe.rare
          ? hits.current >= 2
            ? 1
            : 0.7
          : catchChance(foe.dex, (thrown.current.great ? 1.5 : 1) * (thrown.current.berry ? 1.5 : 1) * throwBonus * (curve ? CURVE : 1));
    const caught = Math.random() < chance;
    const n = crit ? 1 : caught ? 3 : Math.floor(Math.random() * 4);
    setCritical(crit);
    go("catching");
    // GO's beats: the ball bounces back and pops open, pulls it in, snaps shut and drops, then shakes
    const { target } = geometry();
    const ground = target.y + 70;
    place(at.x, at.y - 30, 0.45, 0);
    window.setTimeout(() => setInBall(true), 150);
    window.setTimeout(() => place(target.x, ground, 0.45, 0), 550);
    window.setTimeout(() => {
      setShakes(n);
      for (let i = 0; i < n; i++) window.setTimeout(sfx.wiggle, i * 950);
    }, 900);
    window.setTimeout(
      () => {
        setShakes(0);
        if (caught) {
          setFirstBall(throws.current === 1);
          go("caught");
          sfx.catch();
          setMessage(null);
          return;
        }
        // it bursts out of the ball, back on its spot
        setInBall(false);
        sfx.breakFree();
        // GO only rolls a flee after a break-out, at the species' own rate (Abra nearly always teleports off)
        if (spent() || (!round && !foe.rare && Math.random() < (SPECIES[foe.dex]?.flee ?? 0.1))) {
          window.setTimeout(() => {
            go("fled");
            setMessage(`Oh no! ${foe.name} fled.`);
          }, 400);
          place(target.x, ground, 0.45, 0, 0);
          return;
        }
        nextBall();
      },
      900 + n * 950 + 150,
    );
  };

  /** Spends a ball from the bag for this throw (and the berry, if one's fed). */
  const spendBall = () => {
    if (round) {
      if (spent()) return false;
      left.current -= 1;
      setPremierLeft(left.current);
    } else if (!spendItem(ballType)) {
      setMessage(ballType === "great" ? "Out of Great Balls." : "Out of Poké Balls. Spin a PokéStop!");
      window.setTimeout(() => setMessage(null), 1400);
      return false;
    }
    thrown.current = { great: !round && ballType === "great", berry, spin };
    setBerry(false);
    setSpin(0);
    throws.current += 1;
    return true;
  };

  /** Throws from \`from\` at a spot level with the Pokémon; a curveball hooks sideways on the way. */
  const fly = (from: { x: number; y: number }, aim: { x: number; y: number }) => {
    sfx.throw();
    go("flying");
    const { w, outer } = geometry();
    const duration = 560;
    const hook = thrown.current.spin ? -thrown.current.spin * w * 0.18 : 0;
    const spinning = thrown.current.spin !== 0;
    let t0 = -1;
    const step = (ts: number) => {
      if (t0 < 0) t0 = ts;
      const k = Math.min(1, (ts - t0) / duration);
      const x = from.x + (aim.x - from.x) * k + hook * k * k;
      const y = from.y + (aim.y - from.y) * k - Math.sin(k * Math.PI) * 120;
      place(x, y, 1 - k * 0.55, spinning ? k * 1440 : k * 360);
      if (k < 1) return void requestAnimationFrame(step);
      // where it came down, against where the Pokémon is now
      const at = { x, y: aim.y };
      const there = targetNow();
      const off = Math.abs(at.x - there.x);
      if (off < outer && Math.abs(at.y - there.y) < outer * 1.2) {
        if (act.current.kind === "attack") {
          // mid-attack: it bounces off, and the ball's spent
          setBounced(true);
          setHolding(false);
          bounceAway(at, x > there.x ? 1 : -1);
          return;
        }
        // the ring's size when the ball gets there is what counts, like GO
        const r = ringNow();
        resolve(at, r, off <= r * outer);
        return;
      }
      setHolding(false);
      fallAway(at);
    };
    requestAnimationFrame(step);
  };

  /** A miss: the ball drops past and fades, no fuss, and a new one comes up. */
  const fallAway = (at: { x: number; y: number }) => {
    if (spent()) {
      go("fled");
      setMessage(`Oh no! ${foe.name} fled.`);
      return;
    }
    const t0 = performance.now();
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / 450);
      place(at.x, at.y + k * 90, 0.45, 0, 1 - k);
      if (k < 1) requestAnimationFrame(step);
      else nextBall();
    };
    requestAnimationFrame(step);
  };
  const bounceAway = (at: { x: number; y: number }, way: number) => {
    const t0 = performance.now();
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / 500);
      place(at.x + way * k * 160, at.y - Math.sin(k * Math.PI) * 60 + k * 60, 0.45, way * k * 540, 1 - k * 0.8);
      if (k < 1) requestAnimationFrame(step);
      else if (spent()) {
        go("fled");
        setMessage(`Oh no! ${foe.name} fled.`);
      } else nextBall();
    };
    requestAnimationFrame(step);
  };

  const onDown = (e: ReactPointerEvent) => {
    if (phase !== "aim") return;
    setHolding(true);
    turned.current = { total: 0, last: null, at: performance.now() };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    drag.current = { id: e.pointerId, samples: [{ x: e.clientX, y: e.clientY, t: performance.now() }] };
  };
  const local = (e: ReactPointerEvent) => {
    const box = field.current!.getBoundingClientRect();
    return { x: e.clientX - box.left, y: e.clientY - box.top };
  };
  const onMove = (e: ReactPointerEvent) => {
    if (!drag.current || drag.current.id !== e.pointerId) return;
    const p = local(e);
    const prev = drag.current.samples[drag.current.samples.length - 1];
    drag.current.samples.push({ x: e.clientX, y: e.clientY, t: performance.now() });
    if (drag.current.samples.length > 6) drag.current.samples.shift();
    place(p.x, p.y, 1, spin ? (performance.now() / 2) * spin : 0);
    // circling your finger spins the ball for a curveball: a full turn within 0.8 s
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    if (Math.hypot(dx, dy) > 2 && !spin) {
      const dir = Math.atan2(dy, dx);
      const tr = turned.current;
      const now = performance.now();
      if (now - tr.at > 800) {
        tr.total = 0;
        tr.at = now;
      }
      if (tr.last !== null) {
        let d = dir - tr.last;
        if (d > Math.PI) d -= Math.PI * 2;
        if (d < -Math.PI) d += Math.PI * 2;
        tr.total += d;
        if (Math.abs(tr.total) >= Math.PI * 2) {
          setSpin(Math.sign(tr.total));
          sfx.spinBall();
        }
      }
      tr.last = dir;
    }
  };
  const onUp = (e: ReactPointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.id !== e.pointerId) return;
    const { target, rest } = geometry();
    const first = d.samples[0];
    const last = { x: e.clientX, y: e.clientY, t: performance.now() };
    const dt = Math.max(16, last.t - first.t) / 1000;
    const vx = (last.x - first.x) / dt;
    const vy = (last.y - first.y) / dt;
    const from = local(e);
    if (vy > -350 || from.y < target.y) {
      place(rest.x, rest.y); // not a throw, just let go
      setHolding(false);
      return;
    }
    // where the ball would cross the Pokémon's height
    const lead = (from.y - target.y) / -vy;
    if (!spendBall()) {
      place(rest.x, rest.y);
      setHolding(false);
      return;
    }
    fly(from, { x: from.x + vx * lead, y: target.y });
  };

  /** What to tell the HUD: run means it stays on the map. */
  const result = (outcome: CatchResult["outcome"]): CatchResult => ({ outcome, best: label, firstThrow: outcome === "caught" && firstBall, curve: outcome === "caught" && curved });
  const ending: CatchResult["outcome"] = phase === "caught" ? "caught" : phase === "fled" ? "fled" : "ran";

  // Keyboard: hold space to raise the ball (the rings show), let go to throw straight at it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDone(result("ran"));
      if ((e.key === " " || e.key === "Enter") && phase === "aim") {
        e.preventDefault();
        if (!e.repeat) setHolding(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if ((e.key === " " || e.key === "Enter") && phase === "aim" && holding) {
        e.preventDefault();
        const { rest } = geometry();
        if (spendBall()) fly(rest, targetNow());
        else setHolding(false);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
    };
  });

  const done = phase === "caught" || phase === "fled";
  // Worked out when the encounter starts, so a catch doesn't count itself as already in the Pokédex.
  const rewards = catchRewards(foe.rare, label, firstOfKind, phase === "caught" && firstBall, phase === "caught" && curved);
  const ringPx = "min(42vw, 200px)";

  return (
    <div
      ref={field}
      role="dialog"
      aria-modal="true"
      aria-label={round ? `Raid boss ${foe.name}` : `Wild ${foe.name}`}
      className="encounter fixed inset-0 z-50 touch-none overflow-hidden select-none"
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      {/* run, top left: GO's white running figure */}
      <button
        type="button"
        onClick={() => onDone(result(ending))}
        aria-label={done ? "Back to the map" : "Run"}
        className="absolute top-4 left-4 grid size-12 place-items-center rounded-full text-white drop-shadow-md transition active:scale-90"
      >
        <svg viewBox="0 0 32 32" className="size-9" aria-hidden>
          <circle cx="19" cy="5.5" r="3" fill="currentColor" />
          <path d="M16.5 10.5 11 13l-2.5 5M16.5 10.5l-2 8 5 4 1 7M14.5 18.5l-4 4.5-5.5.5M16.5 10.5l3.5 4.5 5 1" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* the name plate: dark, translucent, "Name / CP" */}
      <div className={`pointer-events-none absolute inset-x-0 top-[22%] flex justify-center px-6 transition-opacity ${phase === "caught" ? "opacity-0" : ""}`}>
        <p className="flex items-center gap-2 rounded-full bg-black/45 px-5 py-1.5 font-[family-name:var(--font-lato)] text-lg font-bold text-white">
          {caughtBefore ? <ItemIcon id="ball" size={18} /> : null}
          {foe.rare ? "✦ " : ""}
          {foe.name}
          <span className="opacity-70">/</span>
          <span>
            <span className="text-xs">CP</span>
            <span className="text-xl font-black">{foe.cp}</span>
          </span>
          {foe.boost ? (
            <span className="grid size-7 place-items-center rounded-full bg-white/90" title="Weather boosted">
              <WeatherIcon weather={foe.boost} size={20} />
            </span>
          ) : null}
        </p>
      </div>

      {/* the Pokémon inside its rings; the whole lot moves when it dodges */}
      <div ref={actor} className="absolute top-[52%] left-1/2" style={{ transform: "translate(-50%, -50%)" }}>
        {holding && !inBall ? (
          <>
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/80 shadow-[0_0_6px_rgba(255,255,255,0.8)]"
              style={{ width: ringPx, height: ringPx }}
            />
            <div
              ref={ring}
              className="absolute top-1/2 left-1/2 rounded-full border-4"
              style={{ width: ringPx, height: ringPx, borderColor: ringColor, boxShadow: `0 0 6px ${ringColor}` }}
            />
          </>
        ) : null}
        <FoeView
          dex={foe.dex}
          name={foe.name}
          className={`relative size-56 ${phase === "fled" ? "foe-flee" : inBall ? "foe-in" : "foe-out"}`}
        />
        {phase === "fled" ? <span className={`foe-puff ${round ? "foe-puff-glow" : ""}`} aria-hidden /> : null}
      </div>

      {(label || curved || critical || bounced) && (phase === "catching" || phase === "flying") ? (
        <p className="throw-pop absolute top-[32%] left-1/2 -translate-x-1/2 text-center font-[family-name:var(--font-lato)] text-white drop-shadow-lg">
          {critical ? <span className="block text-3xl font-black">Critical Catch!</span> : null}
          {label ? <span className="block text-4xl font-black">{label}!</span> : null}
          {curved ? <span className="block text-xl font-bold">Curveball</span> : null}
        </p>
      ) : null}

      <div
        ref={ball}
        onPointerDown={onDown}
        className="absolute top-0 left-0 aspect-square w-[min(32vw,150px)] cursor-grab touch-none"
        style={{ transformOrigin: "50% 50%" }}
      >
        <div
          className={`size-full ${phase === "caught" ? "brightness-75" : ""} ${spin ? "ball-spinning" : ""}`}
          style={shakes ? ({ animation: `ball-shake 950ms ease-in-out ${shakes}` } as CSSProperties) : undefined}
        >
          <PokeBall kind={round ? "premier" : ballType} />
        </div>
        {spin ? <Sparks /> : null}
        {phase === "caught" ? <StarBurst /> : null}
      </div>

      {message && phase !== "caught" ? (
        <div className="absolute inset-x-0 top-[66%] flex justify-center px-6">
          <p className="card-in rounded-full bg-black/45 px-5 py-2 text-center font-[family-name:var(--font-lato)] text-lg font-bold text-white">{message}</p>
        </div>
      ) : phase === "aim" && !holding ? (
        <p className="pointer-events-none absolute inset-x-0 bottom-[calc(min(32vw,150px)*0.85+28px)] text-center font-[family-name:var(--font-lato)] text-xs font-bold tracking-wide text-white drop-shadow">
          Hold the ball and flick it up (or hold space). Circle it first for a curveball
        </p>
      ) : null}

      {phase === "aim" ? (
        <>
          {/* berry, bottom left */}
          <button
            type="button"
            disabled={berry || items.razz <= 0}
            onClick={() => {
              if (spendItem("razz")) setBerry(true);
            }}
            aria-label={berry ? "Razz Berry fed" : `Feed a Razz Berry (${items.razz} left)`}
            className={`absolute bottom-[6%] left-[12%] grid size-16 -translate-x-1/2 place-items-center rounded-full bg-white/55 backdrop-blur-sm transition active:scale-90 disabled:opacity-50 ${berry ? "ring-4 ring-[#e0457b]" : ""}`}
          >
            <ItemIcon id="razz" size={34} />
            <span className="absolute -right-1 -bottom-1 rounded-full bg-black/50 px-1.5 text-[11px] font-bold text-white">{items.razz}</span>
          </button>
          {/* how many of this ball are left, next to it */}
          <p className="pointer-events-none absolute bottom-5 left-[calc(50%+min(16vw,75px)+6px)] font-[family-name:var(--font-lato)] text-lg font-black text-white [text-shadow:0_0_3px_#0a2a4a,0_0_3px_#0a2a4a]">
            {round ? premierLeft : items[ballType]}
          </p>
          {/* ball switch, bottom right (a bonus round only has Premier Balls) */}
          {round ? null : (
            <button
              type="button"
              onClick={() => setBallType((b) => (b === "ball" ? "great" : "ball"))}
              aria-label={`Switch to ${ballType === "ball" ? "Great Balls" : "Poké Balls"}`}
              className="absolute right-[12%] bottom-[6%] grid size-16 translate-x-1/2 place-items-center rounded-full bg-white/55 backdrop-blur-sm transition active:scale-90"
            >
              <ItemIcon id={ballType === "ball" ? "great" : "ball"} size={34} />
            </button>
          )}
        </>
      ) : null}

      {phase === "caught" ? <Caught foe={foe} rewards={rewards} /> : null}

      {done ? (
        <div className="absolute inset-x-0 bottom-10 flex justify-center">
          <button type="button" onClick={() => onDone(result(ending))} className="go-pill rounded-full px-12 py-3 text-lg transition active:scale-95">
            OK
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** Sparkles round a spinning ball, ready for a curveball. */
function Sparks() {
  return (
    <span className="pointer-events-none absolute inset-0" aria-hidden>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <span key={i} className="ball-spark" style={{ "--a": `${i * 60}deg`, animationDelay: `${i * 90}ms` } as CSSProperties} />
      ))}
    </span>
  );
}

/** GO's yellow stars bursting off the ball when it's caught. */
function StarBurst() {
  return (
    <span className="pointer-events-none absolute inset-0" aria-hidden>
      {Array.from({ length: 10 }, (_, i) => (
        <span key={i} className="catch-star" style={{ "--a": `${i * 36 + 8}deg`, animationDelay: `${(i % 3) * 40}ms` } as CSSProperties}>
          ★
        </span>
      ))}
    </span>
  );
}

/** GO's results: a big white "Gotcha!" over the scene, then a white card with the XP and what it was for. */
function Caught({ foe, rewards }: { foe: Foe; rewards: [string, number][] }) {
  const total = rewards.reduce((sum, [, xp]) => sum + xp, 0);
  return (
    <>
      <div className="throw-pop pointer-events-none absolute inset-x-0 top-[12%] text-center font-[family-name:var(--font-lato)] text-white drop-shadow-lg">
        <p className="text-5xl font-black">Gotcha!</p>
        <p className="mt-1 text-lg font-bold">{foe.name} was caught!</p>
      </div>
      <div className="absolute inset-x-0 bottom-28 flex justify-center px-6">
        <div className="go-sheet card-in w-full max-w-xs rounded-3xl px-6 py-5 text-center">
          <p className="go-title text-[0.65rem] text-ink-soft">XP</p>
          <p className="text-4xl font-black tabular-nums">+{total.toLocaleString("en-US")}</p>
          <ul className="mt-3 space-y-1 text-sm">
            {rewards.map(([why, xp], i) => (
              <li key={why} className="item-pop flex justify-between" style={{ animationDelay: `${200 + i * 120}ms` }}>
                <span className="text-ink-soft">{why}</span>
                <span className="font-bold tabular-nums">+{xp}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-ink-soft">
            {foe.name}, CP {foe.cp}
          </p>
        </div>
      </div>
    </>
  );
}

/** The ball in your hand: a Poké Ball, a Great Ball (blue top with its red side panels), or a raid's Premier Ball (all white, red band). */
function PokeBall({ kind = "ball" }: { kind?: "ball" | "great" | "premier" }) {
  const great = kind === "great";
  const premier = kind === "premier";
  const line = premier ? "#e3350d" : "#151c24";
  return (
    <svg viewBox="0 0 64 64" className="size-full drop-shadow-lg" aria-hidden>
      <circle cx="32" cy="32" r="30" fill="#f2f8fa" />
      {premier ? null : <path d="M2 32a30 30 0 0 1 60 0Z" fill={great ? "#2b6fd6" : "#ff2a18"} />}
      {great ? (
        <>
          <path d="M9 14c5 2 8 6 9.5 12L9 27Z" fill="#e3350d" />
          <path d="M55 14c-5 2-8 6-9.5 12L55 27Z" fill="#e3350d" />
        </>
      ) : null}
      <circle cx="32" cy="32" r="30" fill="none" stroke={premier ? "#a9b2bc" : "#151c24"} strokeWidth="3" />
      <path d="M2.5 32h59" stroke={line} strokeWidth="4" />
      <circle cx="32" cy="32" r="9.5" fill="#fff" stroke={line} strokeWidth="4" />
    </svg>
  );
}
