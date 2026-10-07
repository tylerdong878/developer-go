"use client";

import { useEffect, useRef, useState } from "react";
import { type MapObject, mapObjects } from "@/content";
import { areas, buildings, RADIUS, roads, slots } from "../base";
import { describe } from "../objects";
import { palettes } from "../palette";
import { game } from "../state";
import { goTo } from "../travel";
import { useTimeOfDay } from "../useTimeOfDay";
import { ObjectIcon } from "./icons";
import { Sheet } from "./Sheet";

/** The whole base drawn once, 2 px per meter. */
const PX = 2;
const SIZE = (RADIUS + 10) * 2 * PX;
const toPx = (v: number) => (v + RADIUS + 10) * PX;

const DOT: Record<MapObject["kind"], string> = {
  gym: "#0b84d6",
  stop: "#1ab6e8",
  raid: "#f472b6",
  spawn: "#f6c453",
  egg: "#f28a2e",
};

function drawBase(night: boolean) {
  const p = palettes[night ? "night" : "day"];
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SIZE;
  const g = canvas.getContext("2d")!;
  g.fillStyle = p.land;
  g.beginPath();
  g.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2);
  g.fill();
  g.save();
  g.clip();
  for (const kind of ["park", "grass", "lawn", "plaza", "water", "deck"] as const) {
    g.fillStyle = p.areas[kind];
    for (const a of areas.filter((x) => x.kind === kind)) {
      g.beginPath();
      a.points.forEach(([x, z], i) => (i ? g.lineTo(toPx(x), toPx(z)) : g.moveTo(toPx(x), toPx(z))));
      g.closePath();
      g.fill();
    }
  }
  g.lineCap = g.lineJoin = "round";
  for (const r of roads) {
    g.strokeStyle = p.roads[r.kind][0];
    g.lineWidth = r.width * PX;
    g.beginPath();
    r.points.forEach(([x, z], i) => (i ? g.lineTo(toPx(x), toPx(z)) : g.moveTo(toPx(x), toPx(z))));
    if (r.loop) g.closePath();
    g.stroke();
  }
  g.fillStyle = night ? "#3b4770" : "#c9cfd8";
  for (const b of buildings) g.fillRect(toPx(b.x - b.w / 2), toPx(b.z - b.d / 2), b.w * PX, b.d * PX);
  g.restore();
  return canvas;
}

/**
 * A round minimap in the corner, turned with the camera like GO's compass
 * view, with every gym, stop, and raid as a dot. Tap it for the full map,
 * where tapping anything dashes you there.
 */
export function Minimap() {
  const night = useTimeOfDay() === "night";
  const canvas = useRef<HTMLCanvasElement>(null);
  const [open, setOpen] = useState(false);
  const [base, setBase] = useState<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Drawn after the first paint, off the critical path.
    const id = window.setTimeout(() => setBase(drawBase(night)), 0);
    return () => window.clearTimeout(id);
  }, [night]);

  useEffect(() => {
    const c = canvas.current;
    if (!c || !base) return;
    const g = c.getContext("2d")!;
    const size = c.width;
    const span = 70; // meters from the center to the edge
    const k = size / 2 / span;
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now - last < 66) return; // about 15 times a second is plenty
      last = now;
      const { x, z } = game.player.trainer.position;
      const yaw = game.view.yaw;
      g.clearRect(0, 0, size, size);
      g.save();
      g.translate(size / 2, size / 2);
      g.rotate(-yaw);
      g.scale(k / PX, k / PX);
      g.translate(-toPx(x), -toPx(z));
      g.drawImage(base, 0, 0);
      g.restore();
      // dots stay upright: place them by hand
      const cos = Math.cos(-yaw);
      const sin = Math.sin(-yaw);
      for (const o of mapObjects) {
        if (o.kind === "egg") continue;
        const [ox, oz] = slots[o.slug];
        const dx = (ox - x) * k;
        const dz = (oz - z) * k;
        const sx = size / 2 + dx * cos - dz * sin;
        const sy = size / 2 + dx * sin + dz * cos;
        if (Math.hypot(sx - size / 2, sy - size / 2) > size / 2 - 6) continue;
        g.fillStyle = DOT[o.kind];
        g.strokeStyle = "#ffffff";
        g.lineWidth = 2;
        g.beginPath();
        g.arc(sx, sy, o.kind === "gym" || o.kind === "raid" ? 5.5 : 4, 0, Math.PI * 2);
        g.fill();
        g.stroke();
      }
      // you, pointing the way you face
      const h = game.player.trainer.heading;
      const ax = Math.sin(h);
      const az = Math.cos(h);
      const fx = ax * cos - az * sin;
      const fy = ax * sin + az * cos;
      g.save();
      g.translate(size / 2, size / 2);
      g.rotate(Math.atan2(fy, fx) + Math.PI / 2);
      g.fillStyle = "#0b84d6";
      g.strokeStyle = "#ffffff";
      g.lineWidth = 2.5;
      g.beginPath();
      g.moveTo(0, -9);
      g.lineTo(7, 7);
      g.lineTo(0, 3.5);
      g.lineTo(-7, 7);
      g.closePath();
      g.fill();
      g.stroke();
      g.restore();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [base]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open the map"
        className="panel grid size-[120px] place-items-center overflow-hidden rounded-full p-1 transition hover:scale-[1.03] active:scale-95 sm:size-[140px]"
      >
        <canvas ref={canvas} width={280} height={280} className="size-full rounded-full" />
      </button>
      {open && base ? <MapSheet base={base} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

/** The whole base, north up, with a button on everything. Tap one to dash there. */
function MapSheet({ base, onClose }: { base: HTMLCanvasElement; onClose: () => void }) {
  const [src] = useState(() => base.toDataURL());
  // The keys don't walk the trainer around behind the map.
  useEffect(() => {
    game.input.paused = true;
    return () => {
      game.input.paused = false;
    };
  }, []);
  const pct = (v: number) => `${(toPx(v) / SIZE) * 100}%`;
  const go = (slug: string) => {
    onClose();
    goTo(slug, true);
  };
  const { x, z } = game.player.trainer.position;
  return (
    <Sheet title="Map" subtitle="Tap anything to go there" onClose={onClose}>
      <div className="relative mx-auto aspect-square w-full max-w-md">
        {/* eslint-disable-next-line @next/next/no-img-element -- drawn on the fly */}
        <img src={src} alt="" className="size-full" />
        {mapObjects.map((o) => {
          if (o.kind === "egg" || o.kind === "spawn") return null;
          const [ox, oz] = slots[o.slug];
          return (
            <button
              key={o.slug}
              type="button"
              onClick={() => go(o.slug)}
              aria-label={`Go to ${describe(o).name}`}
              title={describe(o).name}
              className="absolute grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-surface shadow transition hover:scale-125"
              style={{ left: pct(ox), top: pct(oz) }}
            >
              <ObjectIcon object={o} size={18} />
            </button>
          );
        })}
        <span
          aria-hidden
          className="absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-mystic-500 ring-3 ring-white"
          style={{ left: pct(x), top: pct(z) }}
        />
      </div>
    </Sheet>
  );
}
