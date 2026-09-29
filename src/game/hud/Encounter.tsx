"use client";

import { type PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef, useState } from "react";
import { sfx } from "../sound";

/** Who you're trying to catch. Fact Pokémon never run and always get caught by the second hit. */
export type Foe = { dex: number; name: string; rare: boolean };

type Phase = "aim" | "flying" | "wiggle" | "caught" | "fled";
type Throw = "Nice" | "Great" | "Excellent" | null;

const RING_CYCLE = 1.7; // seconds for the ring to shrink from big to small
const HIT_RADIUS = 80; // px around the Pokémon that counts as a hit

/**
 * GO's catch screen: the Pokémon on a field with a shrinking colored ring,
 * and a Poké Ball at the bottom. Flick the ball up at it; landing inside the
 * ring while it's small is a Nice, Great, or Excellent throw and helps the
 * catch. Then the ball wiggles, and either it's caught or it breaks free.
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

  // Ring colors like GO: green is easy, yellow harder, red hardest.
  const ringColor = foe.rare ? "#f6c453" : "#5fc15a";

  const geometry = useCallback(() => {
    const box = field.current?.getBoundingClientRect();
    const w = box?.width ?? 390;
    const h = box?.height ?? 800;
    return { w, h, target: { x: w / 2, y: h * 0.4 }, rest: { x: w / 2, y: h - 110 } };
  }, []);

  const place = useCallback((x: number, y: number, scale = 1, spin = 0) => {
    if (ball.current) ball.current.style.transform = `translate(${x - 32}px, ${y - 32}px) scale(${scale}) rotate(${spin}deg)`;
  }, []);

  // Park the ball, and keep the ring breathing while you aim.
  useEffect(() => {
    start.current = performance.now();
    const { rest } = geometry();
    place(rest.x, rest.y);
    let raf = 0;
    const tick = () => {
      const t = ((performance.now() - start.current) / 1000 / RING_CYCLE) % 1;
      if (ring.current) ring.current.style.transform = `translate(-50%, -50%) scale(${1 - t * 0.72})`;
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [geometry, place]);

  const ringNow = () => 1 - (((performance.now() - start.current) / 1000 / RING_CYCLE) % 1) * 0.72;

  const resolve = (hitRing: number) => {
    const bonus = hitRing < 0.45 ? "Excellent" : hitRing < 0.7 ? "Great" : "Nice";
    setLabel(bonus);
    hits.current += 1;
    const chance = foe.rare
      ? hits.current >= 2
        ? 1
        : 0.7
      : 0.5 + { Nice: 0.1, Great: 0.2, Excellent: 0.35 }[bonus];
    const caught = Math.random() < chance;
    const wiggles = caught ? 3 : 1 + Math.floor(Math.random() * 3);
    setPhase("wiggle");
    for (let i = 0; i < wiggles; i++) window.setTimeout(sfx.wiggle, 500 + i * 650);
    window.setTimeout(() => {
      if (caught) {
        setPhase("caught");
        sfx.catch();
        setMessage(`Gotcha! ${foe.name} was caught!`);
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
      place(x, y, 1 - k * 0.5, k * 720);
      if (k < 1) requestAnimationFrame(step);
      else if (hit) {
        place(to.x, to.y + 40, 0.5);
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
    fly(from, hit ? target : { x, y: target.y - 60 }, hit);
  };

  // Keyboard fallback: space throws straight at it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDone(false, null);
      if ((e.key === " " || e.key === "Enter") && phase === "aim") {
        e.preventDefault();
        const { target, rest } = geometry();
        fly(rest, target, true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const done = phase === "caught" || phase === "fled";

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
      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
        <button
          type="button"
          onClick={() => onDone(phase === "caught", label)}
          className="rounded-full bg-white/85 px-4 py-2 font-display font-semibold text-ink shadow"
        >
          {done ? "Back to the map" : "Run"}
        </button>
        <p className="rounded-full bg-white/85 px-4 py-2 font-display font-semibold text-ink shadow">
          {foe.rare ? "✦ " : ""}
          {foe.name}
        </p>
      </div>

      <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="absolute top-1/2 left-1/2 size-56 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white/70" />
        {phase === "aim" ? (
          <div
            ref={ring}
            className="absolute top-1/2 left-1/2 size-56 rounded-full border-[6px]"
            style={{ borderColor: ringColor }}
          />
        ) : null}
        {/* eslint-disable-next-line @next/next/no-img-element -- local sprite */}
        <img
          src={`/sprites/${foe.dex}.webp`}
          alt={foe.name}
          width={176}
          height={176}
          className={`relative size-44 object-contain drop-shadow-xl ${
            phase === "aim" ? "foe-hop" : phase === "flying" ? "" : phase === "fled" ? "foe-flee" : "foe-in"
          }`}
        />
      </div>

      {label && phase !== "aim" ? (
        <p className="throw-pop absolute top-[22%] left-1/2 -translate-x-1/2 font-display text-4xl font-bold text-white drop-shadow-lg">
          {label}!
        </p>
      ) : null}

      <div
        ref={ball}
        onPointerDown={onDown}
        className="absolute top-0 left-0 size-16 cursor-grab touch-none"
        style={{ transformOrigin: "50% 50%" }}
      >
        <div className={`size-full ${phase === "wiggle" ? "ball-wiggle" : ""}`}>
          <PokeBall />
        </div>
      </div>

      {message ? (
        <div className="absolute inset-x-0 bottom-36 flex justify-center px-6">
          <p className="card-in rounded-2xl bg-white/92 px-5 py-3 text-center font-display text-xl font-semibold text-ink shadow-xl">
            {message}
          </p>
        </div>
      ) : phase === "aim" ? (
        <p className="absolute inset-x-0 bottom-6 text-center text-sm font-semibold text-white drop-shadow">
          Flick the ball up to throw (or press space)
        </p>
      ) : null}

      {done ? (
        <div className="absolute inset-x-0 bottom-12 flex justify-center">
          <button
            type="button"
            onClick={() => onDone(phase === "caught", label)}
            className="rounded-full bg-teal px-8 py-3 font-display text-lg font-semibold text-mystic-900 shadow-lg"
          >
            OK
          </button>
        </div>
      ) : null}
    </div>
  );
}

function PokeBall() {
  return (
    <svg viewBox="0 0 64 64" className="size-full drop-shadow-lg" aria-hidden>
      <circle cx="32" cy="32" r="30" fill="#fff" />
      <path d="M2 32a30 30 0 0 1 60 0Z" fill="#e3350d" />
      <circle cx="32" cy="32" r="30" fill="none" stroke="#1c1c24" strokeWidth="3" />
      <path d="M2.5 32h59" stroke="#1c1c24" strokeWidth="4" />
      <circle cx="32" cy="32" r="9.5" fill="#fff" stroke="#1c1c24" strokeWidth="4" />
    </svg>
  );
}
