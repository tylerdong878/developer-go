"use client";

import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { addItems, progressStore, spendItem } from "../progress";
import { catchRewards } from "../cp";
import { sfx } from "../sound";
import { FoeView } from "./FoeView";
import { ItemIcon } from "./icons";

/** Who you're trying to catch. Fact Pokémon never run and always get caught by the second hit. */
export type Foe = { dex: number; name: string; rare: boolean; cp: number };

type Phase = "aim" | "flying" | "wiggle" | "caught" | "fled";
type Throw = "Nice" | "Great" | "Excellent" | null;

const RING_CYCLE = 1.7; // seconds for the inner ring to shrink from full to nearly nothing
const RING_MIN = 0.1;
const HIT_RADIUS = 80; // px around the Pokémon that counts as a hit

/**
 * GO's catch screen (notes/research/pokemon-go-ui.md): the Pokémon on a field
 * inside a fixed white ring, with an inner ring that keeps shrinking and
 * growing, colored by how hard the catch is (green easy to red hard); a dark
 * name plate over it; a big Poké Ball cut off at the bottom, a berry button
 * on the left and the ball switch on the right. Flick the ball up at it. The
 * inner ring's size against the outer one when it lands is the throw, like
 * GO: Excellent under 0.3, Great under 0.7, Nice otherwise. Then the ball
 * wiggles, and either it's caught or it breaks free.
 */
export type Thrown = "Nice" | "Great" | "Excellent" | null;

export function Encounter({ foe, onDone }: { foe: Foe; onDone: (caught: boolean, best: Thrown) => void }) {
  const field = useRef<HTMLDivElement>(null);
  const ball = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("aim");
  const [label, setLabel] = useState<Throw>(null);
  const [message, setMessage] = useState<string | null>(null);
  const hits = useRef(0);
  const drag = useRef<{ id: number; samples: { x: number; y: number; t: number }[] } | null>(null);
  const start = useRef(0);
  const { items } = useSyncExternalStore(progressStore.subscribe, progressStore.get, progressStore.server);
  const [ballType, setBallType] = useState<"ball" | "great">("ball");
  const [berry, setBerry] = useState(false);
  const [firstOfKind] = useState(() => !progressStore.get().caught[foe.dex]);
  const thrown = useRef<{ great: boolean; berry: boolean }>({ great: false, berry: false });

  // A fact Pokémon never gets stuck behind an empty bag: it hands you a ball.
  useEffect(() => {
    const bag = progressStore.get().items;
    if (foe.rare && bag.ball + bag.great === 0) addItems({ ball: 1 });
  }, [foe.rare]);

  // Ring colors like GO, from the chance a Nice throw would catch it with what's selected: a Great Ball or a berry shifts it greener.
  const ease = (foe.rare ? 0.7 : 0.45) + 0.1 + (ballType === "great" ? 0.15 : 0) + (berry ? 0.2 : 0);
  const ringColor = ease >= 0.85 ? "#2ee82e" : ease >= 0.65 ? "#b5f21b" : ease >= 0.45 ? "#fef204" : ease >= 0.25 ? "#ff9a1f" : "#f2342a";
  const caughtBefore = (progressStore.get().caught[foe.dex] ?? 0) > 0;

  const geometry = useCallback(() => {
    const box = field.current?.getBoundingClientRect();
    const w = box?.width ?? 390;
    const h = box?.height ?? 800;
    const size = Math.min(w * 0.32, 150);
    // the ball rests big at the bottom, partly cut off by the edge, like GO
    return { w, h, size, target: { x: w / 2, y: h * 0.45 }, rest: { x: w / 2, y: h - size * 0.32 } };
  }, []);

  const place = useCallback((x: number, y: number, scale = 1, spin = 0) => {
    const el = ball.current;
    if (!el) return;
    const half = el.offsetWidth / 2;
    el.style.transform = `translate(${x - half}px, ${y - half}px) scale(${scale}) rotate(${spin}deg)`;
  }, []);

  // Park the ball, and keep the ring breathing while you aim.
  useEffect(() => {
    start.current = performance.now();
    const { rest } = geometry();
    place(rest.x, rest.y);
    let raf = 0;
    const tick = () => {
      const t = ((performance.now() - start.current) / 1000 / RING_CYCLE) % 1;
      if (ring.current) ring.current.style.transform = `translate(-50%, -50%) scale(${1 - t * (1 - RING_MIN)})`;
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [geometry, place]);

  const ringNow = () => 1 - (((performance.now() - start.current) / 1000 / RING_CYCLE) % 1) * (1 - RING_MIN);

  const resolve = (hitRing: number) => {
    const bonus = hitRing < 0.3 ? "Excellent" : hitRing < 0.7 ? "Great" : "Nice";
    setLabel(bonus);
    hits.current += 1;
    const chance = foe.rare
      ? hits.current >= 2
        ? 1
        : 0.7
      : 0.45 +
        { Nice: 0.1, Great: 0.2, Excellent: 0.35 }[bonus] +
        (thrown.current.great ? 0.15 : 0) +
        (thrown.current.berry ? 0.2 : 0);
    const caught = Math.random() < chance;
    const wiggles = caught ? 3 : 1 + Math.floor(Math.random() * 3);
    setPhase("wiggle");
    for (let i = 0; i < wiggles; i++) window.setTimeout(sfx.wiggle, 500 + i * 650);
    window.setTimeout(() => {
      if (caught) {
        setPhase("caught");
        sfx.catch();
        setMessage(null);
        return;
      }
      if (!foe.rare && Math.random() < 0.15) {
        setPhase("fled");
        sfx.breakFree();
        setMessage(`Oh no! ${foe.name} fled.`);
        return;
      }
      setMessage(`${foe.name} broke free!`);
      sfx.breakFree();
      setLabel(null);
      const { rest } = geometry();
      place(rest.x, rest.y);
      setPhase("aim");
      window.setTimeout(() => setMessage(null), 1100);
    }, 700 + wiggles * 650);
  };

  /** Spends a ball from the bag for this throw (and the berry, if one's fed). */
  const spendBall = () => {
    if (!spendItem(ballType)) {
      setMessage(ballType === "great" ? "Out of Great Balls." : "Out of Poké Balls. Spin a PokéStop!");
      window.setTimeout(() => setMessage(null), 1400);
      return false;
    }
    thrown.current = { great: ballType === "great", berry };
    setBerry(false);
    return true;
  };

  const fly = (from: { x: number; y: number }, to: { x: number; y: number }, hit: boolean) => {
    sfx.throw();
    setPhase("flying");
    const t0 = performance.now();
    const duration = 560;
    const ringAtRelease = ringNow();
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / duration);
      const x = from.x + (to.x - from.x) * k;
      const y = from.y + (to.y - from.y) * k - Math.sin(k * Math.PI) * 120;
      place(x, y, 1 - k * 0.55, k * 720);
      if (k < 1) requestAnimationFrame(step);
      else if (hit) {
        place(to.x, to.y + 40, 0.45);
        resolve(ringAtRelease);
      } else {
        setMessage("Missed!");
        window.setTimeout(() => {
          const { rest } = geometry();
          place(rest.x, rest.y);
          setMessage(null);
          setPhase("aim");
        }, 700);
      }
    };
    requestAnimationFrame(step);
  };

  const onDown = (e: ReactPointerEvent) => {
    if (phase !== "aim") return;
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
    drag.current.samples.push({ x: e.clientX, y: e.clientY, t: performance.now() });
    if (drag.current.samples.length > 6) drag.current.samples.shift();
    place(p.x, p.y);
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
    if (vy > -350) {
      place(rest.x, rest.y); // not a throw, just let go
      return;
    }
    // Where the ball would cross the Pokémon's height.
    const lead = (from.y - target.y) / -vy;
    const x = from.x + vx * lead;
    const hit = Math.abs(x - target.x) < HIT_RADIUS && from.y > target.y;
    if (!spendBall()) {
      place(rest.x, rest.y);
      return;
    }
    fly(from, hit ? target : { x, y: target.y - 60 }, hit);
  };

  // Keyboard fallback: space throws straight at it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDone(false, null);
      if ((e.key === " " || e.key === "Enter") && phase === "aim") {
        e.preventDefault();
        const { target, rest } = geometry();
        if (spendBall()) fly(rest, target, true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const done = phase === "caught" || phase === "fled";
  // Worked out when the encounter starts, so a catch doesn't count itself as already in the Pokédex.
  const rewards = catchRewards(foe.rare, label, firstOfKind);

  return (
    <div
      ref={field}
      role="dialog"
      aria-modal="true"
      aria-label={`Wild ${foe.name}`}
      className="encounter fixed inset-0 z-50 touch-none overflow-hidden select-none"
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      {/* run, top left: GO's white running figure */}
      <button
        type="button"
        onClick={() => onDone(phase === "caught", label)}
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
        <p className="flex items-center gap-2 rounded-full bg-black/40 px-5 py-1.5 font-[family-name:var(--font-lato)] text-lg font-bold text-white">
          {caughtBefore ? <ItemIcon id="ball" size={18} /> : null}
          {foe.rare ? "✦ " : ""}
          {foe.name}
          <span className="opacity-70">/</span>
          <span>
            <span className="text-xs">CP</span>
            <span className="text-xl font-black">{foe.cp}</span>
          </span>
        </p>
      </div>

      {/* the Pokémon inside its rings */}
      <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="absolute top-1/2 left-1/2 size-60 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white/90" />
        {phase === "aim" ? (
          <div ref={ring} className="absolute top-1/2 left-1/2 size-60 rounded-full border-[5px]" style={{ borderColor: ringColor }} />
        ) : null}
        <FoeView
          dex={foe.dex}
          name={foe.name}
          className={`relative size-56 ${phase === "aim" ? "foe-hop" : phase === "flying" ? "" : phase === "fled" ? "foe-flee" : "foe-in"}`}
        />
      </div>

      {label && phase !== "aim" && phase !== "caught" ? (
        <p className="throw-pop absolute top-[30%] left-1/2 -translate-x-1/2 font-[family-name:var(--font-lato)] text-4xl font-black text-white drop-shadow-lg">
          {label}!
        </p>
      ) : null}

      <div
        ref={ball}
        onPointerDown={onDown}
        className="absolute top-0 left-0 aspect-square w-[min(32vw,150px)] cursor-grab touch-none"
        style={{ transformOrigin: "50% 50%" }}
      >
        <div className={`size-full ${phase === "wiggle" ? "ball-wiggle" : ""}`}>
          <PokeBall great={ballType === "great"} />
        </div>
      </div>

      {message && phase !== "caught" ? (
        <div className="absolute inset-x-0 top-[66%] flex justify-center px-6">
          <p className="card-in rounded-full bg-black/45 px-5 py-2 text-center font-[family-name:var(--font-lato)] text-lg font-bold text-white">{message}</p>
        </div>
      ) : phase === "aim" ? (
        <p className="pointer-events-none absolute inset-x-0 bottom-[calc(min(32vw,150px)*0.85+28px)] text-center font-[family-name:var(--font-lato)] text-xs font-bold tracking-wide text-white drop-shadow">
          Flick the ball up to throw (or press space)
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
            className={`absolute bottom-6 left-[8%] grid size-16 place-items-center rounded-full bg-white/40 backdrop-blur-sm transition active:scale-90 disabled:opacity-50 ${berry ? "ring-4 ring-[#e0457b]" : ""}`}
          >
            <ItemIcon id="razz" size={34} />
            <span className="absolute -right-1 -bottom-1 rounded-full bg-black/50 px-1.5 text-[11px] font-bold text-white">{items.razz}</span>
          </button>
          {/* how many of this ball are left, next to it */}
          <p className="pointer-events-none absolute bottom-5 left-[calc(50%+min(16vw,75px)+6px)] font-[family-name:var(--font-lato)] text-lg font-black text-white [text-shadow:0_0_3px_#0a2a4a,0_0_3px_#0a2a4a]">
            {items[ballType]}
          </p>
          {/* ball switch, bottom right */}
          <button
            type="button"
            onClick={() => setBallType((b) => (b === "ball" ? "great" : "ball"))}
            aria-label={`Switch to ${ballType === "ball" ? "Great Balls" : "Poké Balls"}`}
            className="absolute right-[8%] bottom-6 grid size-16 place-items-center rounded-full bg-white/40 backdrop-blur-sm transition active:scale-90"
          >
            <ItemIcon id={ballType === "ball" ? "great" : "ball"} size={34} />
          </button>
        </>
      ) : null}

      {phase === "caught" ? <Caught foe={foe} rewards={rewards} /> : null}

      {done ? (
        <div className="absolute inset-x-0 bottom-10 flex justify-center">
          <button
            type="button"
            onClick={() => onDone(phase === "caught", label)}
            className="go-pill rounded-full px-12 py-3 text-lg transition active:scale-95"
          >
            OK
          </button>
        </div>
      ) : null}
    </div>
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

/** The ball in your hand: a Poké Ball, or a Great Ball (blue top with its red side panels). */
function PokeBall({ great = false }: { great?: boolean }) {
  return (
    <svg viewBox="0 0 64 64" className="size-full drop-shadow-lg" aria-hidden>
      <circle cx="32" cy="32" r="30" fill="#f2f8fa" />
      <path d="M2 32a30 30 0 0 1 60 0Z" fill={great ? "#2b6fd6" : "#ff2a18"} />
      {great ? (
        <>
          <path d="M9 14c5 2 8 6 9.5 12L9 27Z" fill="#e3350d" />
          <path d="M55 14c-5 2-8 6-9.5 12L55 27Z" fill="#e3350d" />
        </>
      ) : null}
      <circle cx="32" cy="32" r="30" fill="none" stroke="#151c24" strokeWidth="3" />
      <path d="M2.5 32h59" stroke="#151c24" strokeWidth="4" />
      <circle cx="32" cy="32" r="9.5" fill="#fff" stroke="#151c24" strokeWidth="4" />
    </svg>
  );
}
