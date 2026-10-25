"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BoxGeometry,
  type BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  Color,
  CylinderGeometry,
  Float32BufferAttribute,
  type InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Object3D,
  Path,
  RingGeometry,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  SRGBColorSpace,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { benches, bins, bollards, lamps, lids, type Prop, vending } from "../props";
import { town } from "./fade";

/*
 * Street furniture in the Let's Go style (notes/research/world-2.md,
 * gfx-landmarks.md 6): black cast-iron lampposts along the streets,
 * wooden-slat benches by the paths, gray bins with a blue band, bollards,
 * iron manhole lids, and red-and-blue vending machines with a lit window of
 * drinks. All of it is baked into one mesh with its colors in the vertices
 * (town-polish.md 9), so the whole street is one draw. After dark the lamp
 * glass and the drink windows light up, and each lamp throws a warm pool.
 */

const POLE_H = 3.7;

/** One colored piece of a prop, in the prop's own frame (front toward +z), with how it glows: [r, g, b, day level]. */
type Part = { g: BufferGeometry; color: string; glow?: [number, number, number, number] };

const box = (w: number, h: number, d: number, x: number, y: number, z: number) => new BoxGeometry(w, h, d).translate(x, y, z);

/** Let's Go's street lamp: a stepped square base, a square post with a collar, a square lantern under a pyramid cap. */
const LAMP: Part[] = [
  {
    g: mergeGeometries([
      box(0.56, 0.24, 0.56, 0, 0.12, 0),
      box(0.38, 0.22, 0.38, 0, 0.35, 0),
      box(0.14, POLE_H, 0.14, 0, POLE_H / 2, 0),
      box(0.24, 0.16, 0.24, 0, POLE_H * 0.55, 0),
      box(0.5, 0.07, 0.5, 0, POLE_H - 0.06, 0),
      new CylinderGeometry(0.05, 0.4, 0.34, 4).rotateY(Math.PI / 4).translate(0, POLE_H + 0.67, 0),
      new CylinderGeometry(0.04, 0.04, 0.16, 6).translate(0, POLE_H + 0.92, 0),
      ...[-1, 1].flatMap((x) => [-1, 1].map((z) => box(0.05, 0.5, 0.05, x * 0.2, POLE_H + 0.25, z * 0.2))),
    ])!,
    color: "#1f2b28",
  },
  { g: box(0.38, 0.46, 0.38, 0, POLE_H + 0.25, 0), color: "#a5c9da", glow: [1.6, 1.5, 1.15, 0.03] },
];

const BENCH: Part[] = [
  { g: mergeGeometries([box(1.7, 0.1, 0.5, 0, 0.48, 0), box(1.7, 0.42, 0.08, 0, 0.82, -0.24)])!, color: "#a98e5f" },
  { g: mergeGeometries([box(0.08, 0.5, 0.5, -0.7, 0.24, 0), box(0.08, 0.5, 0.5, 0.7, 0.24, 0)])!, color: "#293525" },
];

/** A gray metal bin with a domed lid, a dark slot and a thin blue band. */
const BIN: Part[] = [
  { g: new CylinderGeometry(0.3, 0.26, 0.85, 12).translate(0, 0.425, 0), color: "#9aa3ad" },
  { g: new SphereGeometry(0.3, 12, 4, 0, Math.PI * 2, 0, Math.PI / 2).translate(0, 0.85, 0), color: "#7f8893" },
  { g: new BoxGeometry(0.3, 0.08, 0.04).rotateX(-0.5).translate(0, 0.97, 0.25), color: "#2a2a2a" },
  { g: new CylinderGeometry(0.295, 0.29, 0.06, 12).translate(0, 0.62, 0), color: "#3a6fc0" },
];

const BOLLARD: Part[] = [
  { g: new CylinderGeometry(0.12, 0.13, 0.8, 8).translate(0, 0.4, 0), color: "#f1f4f4" },
  { g: new CylinderGeometry(0.125, 0.125, 0.08, 8).translate(0, 0.6, 0), color: "#3d4655" },
];

/** A rounded rectangle traced into a path. */
function roundRect(s: Path, x: number, y: number, w: number, h: number, r: number) {
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
}

/** A rounded-rectangle ring, for the machine's red bezel. */
function bezel(w: number, h: number, r: number, t: number) {
  const outer = new Shape();
  roundRect(outer, -w / 2, -h / 2, w, h, r);
  const hole = new Path();
  roundRect(hole, -w / 2 + t, -h / 2 + t, w - 2 * t, h - 2 * t, Math.max(0.02, r - t));
  outer.holes.push(hole);
  return new ShapeGeometry(outer, 4);
}

/** A five-point star, our own mark for the machine's side (not a Poké Ball). */
function star(r: number) {
  const s = new Shape();
  for (let k = 0; k < 10; k++) {
    const a = Math.PI / 2 + (k * Math.PI) / 5;
    const rr = k % 2 ? r * 0.45 : r;
    if (k) s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    else s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  return new ShapeGeometry(s);
}

/** SV's vending machine, our own: a blue body, a thick red bezel round a lit window of 4 x 4 drinks, a slot below. */
const VENDING: Part[] = (() => {
  const front = 0.4;
  const drinks = ["#e0303f", "#f5b52e", "#3fae5a", "#ffffff", "#3a7fe0", "#f07ab0", "#8a5ad8", "#ff8a3a"];
  const parts: Part[] = [
    { g: box(1.1, 1.9, 0.8, 0, 0.95, 0), color: "#3a55c8" },
    { g: box(1.14, 0.08, 0.84, 0, 1.92, 0), color: "#2c3f9a" },
    { g: bezel(0.98, 1.2, 0.12, 0.09).translate(0, 1.2, front + 0.012), color: "#e0303f" },
    { g: new BoxGeometry(0.8, 1.02, 0.02).translate(0, 1.2, front + 0.005), color: "#daf9fa", glow: [0.75, 0.95, 0.95, 0.3] },
    { g: box(0.8, 0.14, 0.02, 0, 1.73, front + 0.012), color: "#e0303f" },
    { g: box(0.8, 0.24, 0.04, 0, 0.25, front + 0.01), color: "#7c687f" },
    { g: box(0.5, 0.06, 0.02, 0, 0.25, front + 0.035), color: "#2a2a2a" },
    { g: box(0.1, 0.5, 0.02, 0.48, 1.05, front + 0.01), color: "#9baccc" },
  ];
  // the drinks on their shelves, each with a cyan price strip under it
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++) {
      const x = -0.27 + c * 0.18;
      const y = 0.82 + r * 0.24;
      parts.push({ g: box(0.09, 0.15, 0.02, x, y + 0.04, front + 0.02), color: drinks[(r * 4 + c * 3) % drinks.length], glow: [0.35, 0.35, 0.35, 0.3] });
      parts.push({ g: box(0.15, 0.03, 0.02, x, y - 0.06, front + 0.02), color: "#9ae0f7", glow: [0.4, 0.6, 0.65, 0.3] });
    }
  for (const s of [-1, 1]) {
    const side = (g: BufferGeometry) => g.rotateY((s * Math.PI) / 2).translate(s * 0.556, 1.1, 0);
    parts.push({ g: side(new CircleGeometry(0.3, 24)), color: "#e0303f" });
    parts.push({ g: side(star(0.2).translate(0, 0, 0.004)), color: "#ffffff" });
  }
  return parts;
})();

/** An iron manhole lid with two ring lines, flush with the road. */
const LID: Part[] = [
  { g: new CircleGeometry(0.6, 20).rotateX(-Math.PI / 2).translate(0, 0.02, 0), color: "#6b7078" },
  { g: new RingGeometry(0.44, 0.5, 20).rotateX(-Math.PI / 2).translate(0, 0.026, 0), color: "#545a62" },
  { g: new RingGeometry(0.2, 0.25, 16).rotateX(-Math.PI / 2).translate(0, 0.026, 0), color: "#545a62" },
];

/** Every prop baked in place into one geometry: positions, normals, colors and glow. */
function bake(sets: [Part[], Prop[]][]) {
  const pieces: BufferGeometry[] = [];
  const m = new Matrix4();
  const o = new Object3D();
  const c = new Color();
  for (const [parts, props] of sets) {
    // each kind painted once, then copied to every spot
    const kind = mergeGeometries(
      parts.map((p) => {
        const g = (p.g.index ? p.g.toNonIndexed() : p.g.clone()).deleteAttribute("uv");
        const n = g.getAttribute("position").count;
        c.set(p.color);
        const glow = p.glow ?? [0, 0, 0, 0];
        g.setAttribute("color", new Float32BufferAttribute(Array.from({ length: n * 3 }, (_, i) => [c.r, c.g, c.b][i % 3]), 3));
        g.setAttribute("aGlow", new Float32BufferAttribute(Array.from({ length: n * 4 }, (_, i) => glow[i % 4]), 4));
        return g;
      }),
    )!;
    for (const prop of props) {
      o.position.set(prop.at[0], 0, prop.at[1]);
      o.rotation.set(0, prop.turn, 0);
      o.updateMatrix();
      pieces.push(kind.clone().applyMatrix4(m.copy(o.matrix)));
    }
  }
  const all = mergeGeometries(pieces)!;
  all.computeBoundingSphere();
  return all;
}

const material = new MeshLambertMaterial({ vertexColors: true });
material.customProgramCacheKey = () => "street-bits";
material.onBeforeCompile = (s) => {
  s.uniforms.uNight = town.uNight;
  s.vertexShader = s.vertexShader
    .replace("#include <common>", "#include <common>\nattribute vec4 aGlow;\nvarying vec4 vGlow;")
    .replace("#include <begin_vertex>", "#include <begin_vertex>\nvGlow = aGlow;");
  s.fragmentShader = s.fragmentShader
    .replace("#include <common>", "#include <common>\nuniform float uNight;\nvarying vec4 vGlow;")
    // lit parts glow a little by day (the drink window) and fully after dark (the lamps too)
    .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance += vGlow.rgb * mix(vGlow.a, 1.0, uNight);");
};

const lampPool = new MeshBasicMaterial({ color: "#ffbf66", transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending });

/** A soft radial falloff for the light pools. */
function poolTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.35, "rgba(255,255,255,0.62)");
  grad.addColorStop(0.7, "rgba(255,255,255,0.2)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}
const pool = new CircleGeometry(3.4, 32).rotateX(-Math.PI / 2).translate(0, 0.03, 0);

export function Props({ night, shadows }: { night: boolean; shadows: boolean }) {
  const pools = useRef<InstancedMesh>(null);
  const street = useMemo(
    () =>
      bake([
        [LAMP, lamps],
        [BENCH, benches],
        [BIN, bins],
        [BOLLARD, bollards],
        [VENDING, vending],
        [LID, lids],
      ]),
    [],
  );

  useLayoutEffect(() => {
    // each pool falls off softly from under the lamp, warm in the middle, instead of a hard disc
    if (!lampPool.map) {
      lampPool.map = poolTexture();
      lampPool.needsUpdate = true;
    }
    const m = pools.current;
    if (!m) return;
    const o = new Object3D();
    lamps.forEach((p, i) => {
      o.position.set(p.at[0], 0, p.at[1]);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }, []);

  // the pools fade on and off with the time of day instead of snapping
  const glow = useRef(night ? 1 : 0);
  useFrame(() => {
    glow.current += ((night ? 1 : 0) - glow.current) * 0.06;
    lampPool.opacity = glow.current * 0.55;
    lampPool.visible = glow.current > 0.02;
  });

  return (
    <>
      <mesh geometry={street} material={material} castShadow={shadows} receiveShadow />
      <instancedMesh ref={pools} args={[pool, lampPool, lamps.length]} renderOrder={-20} />
    </>
  );
}
