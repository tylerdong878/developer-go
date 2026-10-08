"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useState } from "react";
import {
  BoxGeometry,
  type BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  type Material,
  MeshBasicMaterial,
  MeshLambertMaterial,
  RingGeometry,
  Shape,
  SphereGeometry,
  SRGBColorSpace,
} from "three";
import { buildings } from "../../base";
import type { Building } from "../../lots";
import { fade, town } from "../fade";

/**
 * The Pokémon Center and the Poké Mart, modeled from Let's Go Pikachu/Eevee
 * (in-game shots and the official concept art; see notes/research/kanto-buildings.md).
 * They're one of a kind, so each is a hand-built group of meshes rather than
 * instances. Like every building they fade when they block the camera, and
 * their white roof paint, stripes and glass glow (the concept art's note:
 * "the white paint on the roof glows"), brighter after dark.
 */

// ---------- shapes ----------

/** A rounded rectangle in the XY plane, centered. */
function roundedRect(w: number, d: number, r: number) {
  const s = new Shape();
  const x = -w / 2;
  const y = -d / 2;
  r = Math.min(r, w / 2 - 0.001, d / 2 - 0.001);
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + d - r);
  s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
  s.lineTo(x + r, y + d);
  s.quadraticCurveTo(x, y + d, x, y + d - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/** A rectangle with its corners cut at 45 degrees (the Mart's roof plan). */
function chamfered(w: number, d: number, c: number) {
  const s = new Shape();
  const x = w / 2;
  const y = d / 2;
  s.moveTo(-x + c, -y);
  s.lineTo(x - c, -y);
  s.lineTo(x, -y + c);
  s.lineTo(x, y - c);
  s.lineTo(x - c, y);
  s.lineTo(-x + c, y);
  s.lineTo(-x, y - c);
  s.lineTo(-x, -y + c);
  s.closePath();
  return s;
}

/**
 * A slab standing on y = 0: the plan shape extruded up by h. With a bevel,
 * every top and bottom edge rolls over (the Center's pillowy roof bands);
 * the outer size stays w x d x h either way.
 */
function slab(w: number, d: number, h: number, { r = 0, bevel = 0, chamfer = 0 } = {}) {
  const b = Math.min(bevel, h / 2 - 0.001);
  const shape = chamfer ? chamfered(w - 2 * b, d - 2 * b, chamfer) : roundedRect(w - 2 * b, d - 2 * b, Math.max(0.001, r - b));
  const g = new ExtrudeGeometry(shape, {
    depth: Math.max(0.001, h - 2 * b),
    bevelEnabled: b > 0,
    bevelThickness: b,
    bevelSize: b,
    bevelSegments: 4,
    curveSegments: 10,
  });
  g.rotateX(-Math.PI / 2);
  g.translate(0, b, 0);
  return g;
}

const box = new BoxGeometry(1, 1, 1);
const disc = new CircleGeometry(1, 48);

// ---------- materials ----------

type Kind = "paint" | "glow" | "glass";

/** One building's materials, so its parts fade and glow together. */
function materialSet(index: number) {
  const made = new Map<string, { m: Material; kind: Kind }>();
  const get = (color: string, kind: Kind = "paint") => {
    const key = `${kind}:${color}`;
    let entry = made.get(key);
    if (!entry) {
      const m =
        kind === "glow"
          ? new MeshBasicMaterial({ color, alphaHash: true })
          : new MeshLambertMaterial({ color, alphaHash: true, emissive: kind === "glass" ? color : "#000000", emissiveIntensity: 0 });
      entry = { m, kind };
      made.set(key, entry);
    }
    return entry.m;
  };
  const update = () => {
    const night = town.uNight.value;
    for (const { m, kind } of made.values()) {
      m.opacity = fade[index];
      if (kind === "glass") (m as MeshLambertMaterial).emissiveIntensity = 0.2 + night * 0.9;
    }
  };
  return { get, update };
}

const indexOf = (kind: Building["kind"]) => buildings.findIndex((b) => b.kind === kind);

// ---------- pieces ----------

type V3 = [number, number, number];

function Piece({ geometry, material, at = [0, 0, 0], scale, turn, shadow = true }: { geometry: BufferGeometry; material: Material; at?: V3; scale?: V3 | number; turn?: V3; shadow?: boolean }) {
  return <mesh geometry={geometry} material={material} position={at} scale={scale} rotation={turn} castShadow={shadow} receiveShadow />;
}

/** A plaque texture: a white field in a colored frame (octagon for the Center, stadium with bracket arcs for the Mart). */
function usePlaque(kind: "center" | "mart") {
  const [texture, setTexture] = useState<CanvasTexture | null>(null);
  useEffect(() => {
    let live = true;
    let made: CanvasTexture | null = null;
    document.fonts.ready.then(() => {
      if (!live) return;
      const c = document.createElement("canvas");
      c.width = 320;
      c.height = 200;
      const g = c.getContext("2d")!;
      const family = getComputedStyle(document.documentElement).getPropertyValue("--font-fredoka") || "sans-serif";
      if (kind === "center") {
        // the Center's chamfered octagon: thick red-orange border, white field, orange letters over a thin teal rule
        const k = 34;
        const path = (inset: number) => {
          g.beginPath();
          g.moveTo(k + inset, inset);
          g.lineTo(320 - k - inset, inset);
          g.lineTo(320 - inset, k + inset);
          g.lineTo(320 - inset, 200 - k - inset);
          g.lineTo(320 - k - inset, 200 - inset);
          g.lineTo(k + inset, 200 - inset);
          g.lineTo(inset, 200 - k - inset);
          g.lineTo(inset, k + inset);
          g.closePath();
        };
        g.fillStyle = "#d04a3e";
        path(0);
        g.fill();
        g.fillStyle = "#f2f4f4";
        path(16);
        g.fill();
        g.fillStyle = "#e07a3a";
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.font = `700 50px ${family}`;
        g.fillText("POKéMON", 160, 74);
        g.font = `700 42px ${family}`;
        g.fillText("CENTER", 160, 124);
        g.fillStyle = "#2f9fa0";
        g.fillRect(70, 152, 180, 5);
      } else {
        // the Mart's stadium plaque: white with a blue bracket arc at each end and a blue panel in the middle
        g.fillStyle = "#f0f3f2";
        g.beginPath();
        g.roundRect(4, 30, 312, 140, 70);
        g.fill();
        g.strokeStyle = "#3a84e0";
        g.lineWidth = 12;
        for (const [cx, a0, a1] of [
          [74, Math.PI * 0.6, Math.PI * 1.4],
          [246, -Math.PI * 0.4, Math.PI * 0.4],
        ] as const) {
          g.beginPath();
          g.arc(cx, 100, 46, a0, a1);
          g.stroke();
        }
        g.fillStyle = "#3a84e0";
        g.beginPath();
        g.roundRect(96, 62, 128, 76, 10);
        g.fill();
        g.fillStyle = "#ffffff";
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.font = `700 50px ${family}`;
        g.fillText("MART", 160, 102);
      }
      made = new CanvasTexture(c);
      made.colorSpace = SRGBColorSpace;
      made.anisotropy = 4;
      setTexture(made);
    });
    return () => {
      live = false;
      made?.dispose();
    };
  }, [kind]);
  return texture;
}

// ---------- the Pokémon Center ----------

/** Let's Go's Pokémon Center, front facing +z: 10 wide, 9 deep, 9.3 to the top of the hood. */
const C = { W: 10, D: 9 };
const centerIndex = indexOf("center");
const centerMats = materialSet(centerIndex);
const CENTER = (() => {
  const { W, D } = C;
  return {
    foot: slab(W + 0.14, D + 0.14, 0.3, { r: 0.75 }),
    plinth: slab(W, D, 0.3, { r: 0.7 }),
    walls: slab(W, D, 3.3, { r: 0.7 }),
    windowBand: slab(W + 0.05, D + 0.05, 0.3, { r: 0.72 }),
    eaveUnder: slab(W + 1, D + 1, 0.2, { r: 1.1 }),
    eave: slab(W + 1.2, D + 1.2, 1.7, { r: 1.2, bevel: 0.45 }),
    eaveStripe: slab(W + 1.26, D + 1.26, 0.17, { r: 1.23 }),
    clerestory: slab(W + 0.6, D + 0.6, 0.7, { r: 0.95 }),
    clerestoryGlass: slab(W + 0.64, D + 0.64, 0.34, { r: 0.97 }),
    upper: slab(W + 0.5, D + 0.5, 2.2, { r: 1.1, bevel: 0.6 }),
    upperStripe: slab(W + 0.06 + 0.5, D + 0.56, 0.15, { r: 1.13 }),
    hood: slab(4.6, D + 0.5, 1.9, { r: 0.8, bevel: 0.45 }),
    glass: new CylinderGeometry(1.8, 1.8, 3.6, 32, 1, true, -Math.PI / 2, Math.PI),
    rim: new CylinderGeometry(2.1, 2.1, 0.32, 32, 1, false, -Math.PI / 2, Math.PI),
    dome: new SphereGeometry(2.15, 32, 14, 0, Math.PI, 0, Math.PI / 2),
    domeStripe: new CylinderGeometry(2.17, 2.17, 0.12, 32, 1, true, -Math.PI / 2, Math.PI),
    step: (r: number) => new CircleGeometry(r, 40, Math.PI, Math.PI).rotateX(-Math.PI / 2),
    ring: (a: number, b: number) => new RingGeometry(a, b, 40),
  };
})();
const STEPS = [CENTER.step(2.9), CENTER.step(2.35), CENTER.step(1.8)];
const ETCH = CENTER.ring(0.86, 0.96);
const EMBLEM_RING = CENTER.ring(0.19, 0.33);

/** The glowing white Poké Ball line art: a disc, a band through it, a ring round the button. */
function Emblem({ at, size, ink, get }: { at: V3; size: number; ink: string; get: (color: string, kind?: Kind) => Material }) {
  return (
    <group position={at} scale={size}>
      <Piece geometry={disc} material={get("#ffffff", "glow")} shadow={false} />
      <Piece geometry={box} material={get(ink, "glow")} at={[0, 0, 0.01]} scale={[2, 0.17, 0.001]} shadow={false} />
      <Piece geometry={EMBLEM_RING} material={get(ink, "glow")} at={[0, 0, 0.02]} shadow={false} />
      <Piece geometry={disc} material={get("#ffffff", "glow")} at={[0, 0, 0.025]} scale={0.2} shadow={false} />
    </group>
  );
}

export function PokemonCenter() {
  const plaque = usePlaque("center");
  useFrame(centerMats.update);
  const b = buildings[centerIndex];
  if (!b) return null;
  const { W, D } = C;
  const m = centerMats.get;
  const RED = "#cc4a42";
  const front = D / 2;
  return (
    <group position={[b.x, 0, b.z]} rotation-y={b.turn}>
      {/* red feet and the black plinth */}
      <Piece geometry={CENTER.foot} material={m("#d64a3e")} />
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <Piece key={`${sx}${sz}`} geometry={box} material={m("#d64a3e")} at={[sx * (W / 2 - 0.25), 0.17, sz * (D / 2 - 0.25)]} scale={[1.1, 0.34, 1.1]} />
        )),
      )}
      <Piece geometry={CENTER.plinth} material={m("#2a3436")} at={[0, 0.3, 0]} />
      {/* white paneled walls with a glass strip at the top */}
      <Piece geometry={CENTER.walls} material={m("#e6eef2")} at={[0, 0.6, 0]} />
      <Piece geometry={CENTER.windowBand} material={m("#8cc0d6", "glass")} at={[0, 3.55, 0]} />
      {/* dark pilasters, a panel seam, and the big left window; tall windows down each side */}
      {[-W / 2 + 0.55, -2.15, 2.15, W / 2 - 0.55].map((x) => (
        <Piece key={x} geometry={box} material={m("#3a4548")} at={[x, 2.2, front + 0.03]} scale={[0.26, 3.2, 0.08]} />
      ))}
      <Piece geometry={box} material={m("#b9c7cd")} at={[0, 1.55, front + 0.02]} scale={[W - 1.4, 0.05, 0.05]} shadow={false} />
      <Piece geometry={box} material={m("#a8d8ea", "glass")} at={[-3.35, 2.45, front + 0.04]} scale={[2.0, 1.7, 0.06]} />
      {[-1, 1].flatMap((sx) =>
        [-2.1, 2.1].map((z) => (
          <Piece key={`${sx}${z}`} geometry={box} material={m("#a8d8ea", "glass")} at={[sx * (W / 2 + 0.03), 2.3, z]} scale={[0.06, 2.3, 1.5]} />
        )),
      )}
      {[-1, 1].map((sx) => (
        <Piece key={sx} geometry={box} material={m("#3a4548")} at={[sx * (W / 2 + 0.04), 2.2, 0]} scale={[0.08, 3.2, 0.26]} />
      ))}
      {/* the fat red eave ring with its white pinstripe low down, dark underneath */}
      <Piece geometry={CENTER.eaveUnder} material={m("#6a2a2a")} at={[0, 3.85, 0]} />
      <Piece geometry={CENTER.eave} material={m(RED)} at={[0, 3.9, 0]} />
      <Piece geometry={CENTER.eaveStripe} material={m("#f4f8f8", "glow")} at={[0, 4.28, 0]} shadow={false} />
      {/* the thin glowing clerestory between black bands, with mullions */}
      <Piece geometry={CENTER.clerestory} material={m("#3a4548")} at={[0, 5.6, 0]} />
      <Piece geometry={CENTER.clerestoryGlass} material={m("#b8e8f4", "glass")} at={[0, 5.78, 0]} />
      {[-4, -2.4, -0.8, 0.8, 2.4, 4].map((x) => (
        <Piece key={x} geometry={box} material={m("#3a4548")} at={[x, 5.95, (D + 0.64) / 2 + 0.02]} scale={[0.14, 0.36, 0.06]} shadow={false} />
      ))}
      {/* the pillow-shaped upper roof and the raised hood carrying the emblem */}
      <Piece geometry={CENTER.upper} material={m("#d0453f")} at={[0, 6.3, 0]} />
      <Piece geometry={CENTER.upperStripe} material={m("#f4f8f8", "glow")} at={[0, 6.62, 0]} shadow={false} />
      <Piece geometry={CENTER.hood} material={m("#cf4440")} at={[0, 7.7, 0]} />
      {[-1, 1].map((sx) => (
        <Piece key={sx} geometry={box} material={m("#f4f8f8", "glow")} at={[sx * 2.0, 9.55, -0.3]} scale={[0.16, 0.06, D - 1]} shadow={false} />
      ))}
      <Emblem at={[0, 8.8, (D + 0.5) / 2 + 0.03]} size={0.78} ink="#e04a44" get={m} />
      {/* the round entrance: blue glass half-cylinder with a Poké Ball etched in it, gray rim, red half-dome */}
      {[-1, 1].map((sx) => (
        <Piece key={sx} geometry={box} material={m("#3a4548")} at={[sx * 1.92, 2.4, front + 0.2]} scale={[0.32, 3.6, 0.5]} />
      ))}
      <Piece geometry={CENTER.glass} material={m("#3a8fc0", "glass")} at={[0, 2.4, front]} />
      <Piece geometry={ETCH} material={m("#8cc8e6", "glow")} at={[0, 2.3, front + 1.82]} shadow={false} />
      <Piece geometry={box} material={m("#8cc8e6", "glow")} at={[0, 2.3, front + 1.82]} scale={[1.9, 0.07, 0.01]} shadow={false} />
      <Piece geometry={CENTER.rim} material={m("#b4c6cc")} at={[0, 4.36, front]} />
      <Piece geometry={CENTER.dome} material={m("#cf4440")} at={[0, 4.5, front]} />
      <Piece geometry={CENTER.domeStripe} material={m("#f4f8f8", "glow")} at={[0, 4.86, front]} shadow={false} />
      {/* the half-disc step, three gray bands */}
      {STEPS.map((g, i) => (
        <Piece key={i} geometry={g} material={m(i % 2 ? "#9ea8ae" : "#c8d0d4")} at={[0, 0.03 + i * 0.012, front]} shadow={false} />
      ))}
      {/* the octagon plaque, right of the door */}
      {plaque ? (
        <mesh position={[3.4, 2.75, front + 0.06]}>
          <planeGeometry args={[2.2, 1.375]} />
          <meshBasicMaterial map={plaque} transparent toneMapped={false} />
        </mesh>
      ) : null}
    </group>
  );
}

// ---------- the Poké Mart ----------

/** Let's Go's Poké Mart, front facing +z: 10 wide, 6.5 deep; walls 4.2, roof slab 2.5. */
const M = { W: 10, D: 6.5, WALL: 4.2, ROOF: 2.5 };
const martIndex = indexOf("mart");
const martMats = materialSet(martIndex);
const MART = (() => {
  const { W, D, ROOF } = M;
  const cut = 1.1;
  return {
    under: slab(W + 0.6, D + 0.6, 0.35, { chamfer: cut }),
    low: slab(W + 1, D + 1, ROOF * 0.36, { chamfer: cut + 0.15 }),
    mid: slab(W + 0.24, D + 0.24, ROOF * 0.3, { chamfer: cut }),
    high: slab(W, D, ROOF * 0.3, { chamfer: cut - 0.05 }),
    stripe: (w: number) => slab(W + w, D + w, 0.12, { chamfer: cut + w / 4 }),
    top: slab(W - 1.2, D - 1.2, 0.18, { chamfer: cut - 0.4 }),
    badge: (() => {
      const s = new Shape();
      s.moveTo(-2.15, 0);
      s.lineTo(-1.55, 0.95);
      s.lineTo(1.55, 0.95);
      s.lineTo(2.15, 0);
      s.lineTo(1.55, -0.95);
      s.lineTo(-1.55, -0.95);
      s.closePath();
      return s;
    })(),
  };
})();
const BADGE = new ExtrudeGeometry(MART.badge, { depth: 0.08, bevelEnabled: false });
const BADGE_RING = new RingGeometry(0.62, 0.78, 40);

export function PokeMart() {
  const plaque = usePlaque("mart");
  useFrame(martMats.update);
  const b = buildings[martIndex];
  if (!b) return null;
  const { W, D, WALL, ROOF } = M;
  const m = martMats.get;
  const front = D / 2;
  const roof0 = WALL;
  return (
    <group position={[b.x, 0, b.z]} rotation-y={b.turn}>
      {/* white walls over a gray dado with its little square windows */}
      <Piece geometry={box} material={m("#eef1f0")} at={[0, WALL / 2, 0]} scale={[W - 0.4, WALL, D - 0.4]} />
      <Piece geometry={box} material={m("#bcbfbe")} at={[0, 0.65, 0]} scale={[W - 0.36, 1.3, D - 0.36]} />
      {[-1, 1].flatMap((side) =>
        [0, 1, 2].map((k) => (
          <Piece key={`${side}${k}`} geometry={box} material={m("#7fb3ea", "glass")} at={[side * (1.9 + k * 0.8), 0.7, front - 0.16]} scale={[0.43, 0.43, 0.06]} />
        )),
      )}
      {/* rounded blue corner pillars, full height */}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * (W / 2 - 0.45), WALL / 2, sz * (D / 2 - 0.45)]} material={m("#4f8fd8")} castShadow>
            <cylinderGeometry args={[0.45, 0.45, WALL, 20]} />
          </mesh>
        )),
      )}
      {/* the big left window, the full-height glass door, the plaque on the right */}
      <Piece geometry={box} material={m("#e4eaea")} at={[-2.55, 2.75, front - 0.17]} scale={[2.2, 2.55, 0.06]} />
      <Piece geometry={box} material={m("#c4f2fa", "glass")} at={[-2.55, 2.75, front - 0.13]} scale={[1.9, 2.25, 0.06]} />
      {[2.35, 3.05].map((y) => (
        <Piece key={y} geometry={box} material={m("#ffffff", "glow")} at={[-2.55, y, front - 0.09]} scale={[1.6, 0.07, 0.01]} shadow={false} />
      ))}
      <Piece geometry={box} material={m("#7fc0dc", "glass")} at={[0, (WALL - 0.1) / 2, front - 0.15]} scale={[2.4, WALL - 0.1, 0.06]} />
      <Piece geometry={box} material={m("#ffffff")} at={[-0.75, 2, front - 0.1]} scale={[0.22, 0.75, 0.04]} />
      {/* the thick chamfered blue roof slab: dark lip, flared bottom band, two white pinstripes, then the top */}
      <Piece geometry={MART.under} material={m("#2f66a8")} at={[0, roof0 - 0.02, 0]} />
      <Piece geometry={MART.low} material={m("#3a82d6")} at={[0, roof0 + 0.3, 0]} />
      <Piece geometry={MART.stripe(0.62)} material={m("#ffffff", "glow")} at={[0, roof0 + 0.3 + ROOF * 0.36, 0]} shadow={false} />
      <Piece geometry={MART.mid} material={m("#3c83d4")} at={[0, roof0 + 0.42 + ROOF * 0.36, 0]} />
      <Piece geometry={MART.stripe(0.36)} material={m("#ffffff", "glow")} at={[0, roof0 + 0.42 + ROOF * 0.66, 0]} shadow={false} />
      <Piece geometry={MART.high} material={m("#4592dc")} at={[0, roof0 + 0.54 + ROOF * 0.66, 0]} />
      <Piece geometry={MART.top} material={m("#8cbcf5")} at={[0, roof0 + 0.54 + ROOF * 0.96, 0]} />
      {/* skylights left and right, a raised blue panel between */}
      {[-1, 1].map((sx) => (
        <group key={sx} position={[sx * 2.55, roof0 + 0.72 + ROOF * 0.96, 0]}>
          <Piece geometry={box} material={m("#7684a2")} scale={[2.6, 0.1, 3.4]} />
          {[-1, 0, 1].map((row) => (
            <Piece key={row} geometry={box} material={m("#e8fbff", "glow")} at={[0, 0.07, row * 1.05]} scale={[2.35, 0.05, 0.85]} shadow={false} />
          ))}
        </group>
      ))}
      <Piece geometry={box} material={m("#8fb8f6")} at={[0, roof0 + 0.85 + ROOF * 0.96, 0]} scale={[2.1, 0.35, 3.6]} />
      {/* the glowing hexagon badge across the front of the roof: white outline, blue field, chevrons, a Poké Ball */}
      <group position={[0, roof0 + 0.3 + ROOF * 0.5, (D + 1) / 2 + 0.02]}>
        <Piece geometry={BADGE} material={m("#f4ffff", "glow")} shadow={false} />
        <Piece geometry={BADGE} material={m("#4b84dd")} at={[0, 0, 0.04]} scale={[0.88, 0.8, 1]} shadow={false} />
        {[-1, 1].flatMap((sx) =>
          [1.15, 1.55].map((x) => (
            <group key={`${sx}${x}`} position={[sx * x, 0, 0.13]}>
              <Piece geometry={box} material={m("#ffffff", "glow")} at={[0, 0.27, 0]} scale={[0.14, 0.62, 0.01]} turn={[0, 0, sx * -0.55]} shadow={false} />
              <Piece geometry={box} material={m("#ffffff", "glow")} at={[0, -0.27, 0]} scale={[0.14, 0.62, 0.01]} turn={[0, 0, sx * 0.55]} shadow={false} />
            </group>
          )),
        )}
        <Piece geometry={BADGE_RING} material={m("#94defe", "glow")} at={[0, 0, 0.13]} shadow={false} />
        <Emblem at={[0, 0, 0.14]} size={0.58} ink="#3a7fd8" get={m} />
      </group>
      {plaque ? (
        <mesh position={[2.75, 3.05, front - 0.1]}>
          <planeGeometry args={[2.1, 1.31]} />
          <meshBasicMaterial map={plaque} transparent toneMapped={false} />
        </mesh>
      ) : null}
    </group>
  );
}
