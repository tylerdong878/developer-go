"use client";

import { useEffect, useState } from "react";
import { BoxGeometry, CanvasTexture, SphereGeometry, SRGBColorSpace } from "three";
import { gyms } from "@/content";
import { buildings, slots } from "../base";
import type { Vec2 } from "../geometry";

/**
 * A pair of gym statues at every job's gym, as in the games: in Gens 1-6 two
 * statues flank a gym's entrance, and reading one gives the gym, its Leader,
 * and the winning trainers. Ours are the Indigo Plateau's stone Poké Balls
 * on square pedestals (a stone figure of a real species would need its own
 * model), with a plaque: "<COMPANY> GYM / LEADER: <Tyler's title>".
 */

const STONE = "#b8b6ba";
const box = new BoxGeometry(1, 1, 1);
const ball = new SphereGeometry(1, 24, 16);
const band = new BoxGeometry(1, 1, 1);

/** Short names for the plaque. */
const SHORT: Record<string, string> = {
  aws: "AWS",
  khoury: "KHOURY",
  quartzy: "QUARTZY",
  tetracorp: "TETRACORP",
  philips: "PHILIPS",
  outamation: "OUTAMATION",
  homegoods: "HOMEGOODS",
};

/** Which way a gym faces: away from its building, toward the street. */
function frontOf(slug: string, at: Vec2): Vec2 {
  const b = buildings.find((x) => x.slug === slug);
  if (!b) return [0, 1];
  const dx = at[0] - b.x;
  const dz = at[1] - b.z;
  return Math.abs(dx) > Math.abs(dz) ? [Math.sign(dx), 0] : [0, Math.sign(dz)];
}

function plaqueTexture(lines: string[]) {
  const family = getComputedStyle(document.documentElement).getPropertyValue("--font-lato") || "sans-serif";
  const c = document.createElement("canvas");
  c.width = 384;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#8f7a4a";
  g.fillRect(0, 0, 384, 256);
  g.fillStyle = "#e6d7a8";
  g.fillRect(10, 10, 364, 236);
  g.fillStyle = "#3d3420";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = `900 40px ${family}`;
  g.fillText(lines[0], 192, 58);
  g.font = `700 22px ${family}`;
  g.fillText("LEADER:", 192, 112);
  g.font = `700 26px ${family}`;
  // wrap the title onto up to three lines
  const words = lines[1].split(" ");
  const out: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (g.measureText(next).width > 330 && line) {
      out.push(line);
      line = w;
    } else line = next;
  }
  out.push(line);
  out.slice(0, 3).forEach((l, i) => g.fillText(l, 192, 148 + i * 32));
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function Statue({ at, face, plaque }: { at: Vec2; face: number; plaque: CanvasTexture | null }) {
  return (
    <group position={[at[0], 0, at[1]]} rotation-y={face}>
      <mesh geometry={box} position={[0, 0.65, 0]} scale={[1.3, 1.3, 1.3]} castShadow receiveShadow>
        <meshLambertMaterial color={STONE} />
      </mesh>
      <mesh geometry={box} position={[0, 1.36, 0]} scale={[1.5, 0.14, 1.5]} castShadow>
        <meshLambertMaterial color="#a6a4a9" />
      </mesh>
      <mesh geometry={ball} position={[0, 2.05, 0]} scale={0.62} castShadow>
        <meshLambertMaterial color={STONE} />
      </mesh>
      <mesh geometry={band} position={[0, 2.05, 0]} scale={[1.28, 0.12, 1.28]}>
        <meshLambertMaterial color="#9a989d" />
      </mesh>
      <mesh geometry={ball} position={[0, 2.05, 0.6]} scale={[0.2, 0.2, 0.06]}>
        <meshLambertMaterial color="#d6d4d8" />
      </mesh>
      {plaque ? (
        <mesh position={[0, 0.72, 0.66]}>
          <planeGeometry args={[1.05, 0.7]} />
          <meshLambertMaterial map={plaque} />
        </mesh>
      ) : null}
    </group>
  );
}

export function GymStatues() {
  const [plaques, setPlaques] = useState<Record<string, CanvasTexture>>({});
  useEffect(() => {
    let live = true;
    let made: CanvasTexture[] = [];
    document.fonts.ready.then(() => {
      if (!live) return;
      const next: Record<string, CanvasTexture> = {};
      for (const g of gyms) next[g.slug] = plaqueTexture([`${SHORT[g.slug] ?? g.org.toUpperCase()} GYM`, g.roles[0]?.title ?? ""]);
      made = Object.values(next);
      setPlaques(next);
    });
    return () => {
      live = false;
      made.forEach((t) => t.dispose());
    };
  }, []);

  return (
    <>
      {gyms.map((g) => {
        const at = slots[g.slug];
        if (!at) return null;
        const [fx, fz] = frontOf(g.slug, at);
        const face = Math.atan2(fx, fz);
        // one each side of the gym's front, a few steps out
        return [-1, 1].map((s) => (
          <Statue key={`${g.slug}${s}`} at={[at[0] + fx * 3.4 + fz * s * 3.4, at[1] + fz * 3.4 - fx * s * 3.4]} face={face} plaque={plaques[g.slug] ?? null} />
        ));
      })}
    </>
  );
}
