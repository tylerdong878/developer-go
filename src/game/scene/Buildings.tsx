"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import {
  BoxGeometry,
  CylinderGeometry,
  Euler,
  type BufferGeometry,
  Color,
  Float32BufferAttribute,
  BufferGeometry as Geometry,
  InstancedBufferAttribute,
  type InstancedMesh,
  Matrix4,
  MeshLambertMaterial,
  Quaternion,
  Vector3,
} from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { buildings } from "../base";
import type { Building } from "../lots";
import { Blocks } from "./Blocks";
import { PokeMart, PokemonCenter } from "./civic/Civic";
import { skyLook } from "./Sky";
import { fade, TownTracker, town } from "./fade";

/**
 * A Lambert material with two extras for the houses: they fade out (as a
 * dither, so nothing needs sorting) when they stand between the camera and
 * the trainer, and their glass reflects the sky by day and glows warm after
 * dark.
 */
function townMaterial({ glass = false, pattern }: { glass?: boolean; pattern?: "planks" | "tiles" }) {
  const material = new MeshLambertMaterial({ color: "#ffffff", alphaHash: true });
  // The glass branch and the pattern are baked into the shader source, so each kind needs its own program.
  material.customProgramCacheKey = () => (glass ? "town-glass" : `town${pattern ? `-${pattern}` : ""}`);
  // Viridian's plank walls and Vermilion's square roof tiles, drawn as fine lines that fade out far away (gfx-buildings.md 7.6)
  const lines =
    pattern === "planks"
      ? `{ float u = vTown.y / 0.25; float w = fwidth(u); float e = 0.5 - abs(fract(u) - 0.5); diffuseColor.rgb *= 1.0 - 0.09 * (1.0 - smoothstep(0.0, 0.05 + w, e)) * (1.0 - smoothstep(0.3, 0.6, w)); }`
      : pattern === "tiles"
        ? `{ vec2 u = vec2((vTown.x + vTown.z) / 0.45, vTown.y / 0.3); u.x += 0.5 * floor(u.y); vec2 w = fwidth(u); vec2 e = 0.5 - abs(fract(u) - 0.5); float line = max(1.0 - smoothstep(0.0, 0.05 + w.x, e.x), 1.0 - smoothstep(0.0, 0.06 + w.y, e.y)); diffuseColor.rgb *= 1.0 - 0.1 * line * (1.0 - smoothstep(0.3, 0.6, max(w.x, w.y))); }`
        : "";
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, { uNight: town.uNight, uTop: skyLook.uTop, uHaze: skyLook.uHaze, uFog: skyLook.uFog, uSunDir: skyLook.uSunDir });
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float aFade;\nvarying float vFade;\nvarying vec3 vTown;")
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvFade = aFade;\nvTown = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uNight;
varying float vFade;
varying vec3 vTown;
float townHash(vec3 p) { return fract(sin(dot(floor(p * 0.4), vec3(127.1, 311.7, 74.7))) * 43758.5453); }
uniform vec3 uTop, uHaze, uFog, uSunDir;
float paneHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
// Glass that reflects the sky the way it reads from GO's high camera (notes/research/gfx-reflections-water.md 3.2):
// the reflection is tipped up toward the sky, each pane a touch different, with a sheen and the odd sun glint.
vec3 glassShade(vec3 P, vec3 N, vec3 tint, vec3 inside) {
  vec3 V = normalize(cameraPosition - P);
  vec3 T = normalize(vec3(-N.z, 0.0, N.x) + 1e-5);
  vec2 pane = floor(vec2(dot(P, T) / 1.6, P.y / 2.0));
  float ph = paneHash(pane);
  vec3 Np = normalize(N + T * (ph - 0.5) * 0.14 + vec3(0.0, (fract(ph * 7.7) - 0.5) * 0.06, 0.0));
  vec3 R = reflect(-V, Np);
  R.y = abs(R.y) * 0.8 + 0.2;
  R = normalize(R);
  vec3 refl = mix(uHaze, uTop, pow(clamp(R.y * 1.8, 0.0, 1.0), 0.7)) * mix(vec3(1.0), tint * 1.6, 0.3);
  float sheen = smoothstep(0.93, 0.98, sin(dot(R, vec3(4.0, 1.7, 4.0)) * 2.0 + ph) * 0.5 + 0.5);
  refl += sheen * 0.3 * (1.0 - uNight);
  refl += vec3(1.0, 0.96, 0.85) * step(0.4, pow(max(dot(R, uSunDir), 0.0), 220.0)) * (1.0 - uNight);
  float ndv = clamp(dot(N, V), 0.0, 1.0);
  float F = mix(0.45, 1.0, pow(1.0 - ndv, 2.0)) * (1.0 - 0.8 * uNight);
  return mix(inside, refl, F);
}`,
      )
      .replace("#include <color_fragment>", `#include <color_fragment>\ndiffuseColor.a *= vFade;\ndiffuseColor.rgb *= mix(0.74, 1.0, smoothstep(0.0, 1.4, vTown.y));\n${lines}`)
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
{
  ${glass ? "float isGlass = 1.0;" : "float isGlass = 0.0;"}
  float lit = step(0.35, townHash(vTown));
  if (isGlass > 0.5) {
    vec3 Nw = inverseTransformDirection(normal, viewMatrix);
    vec3 tint = diffuseColor.rgb;
    vec3 inside = mix(tint * 0.25, vec3(1.0, 0.78, 0.45) * lit, uNight);
    totalEmissiveRadiance += glassShade(vTown, Nw, tint, inside);
    diffuseColor.rgb *= 0.08;
  }
}`,
      );
  };
  return material;
}

/** A gable: a triangular prism one unit on each side, ridge along x, sitting on y = 0. */
function gableGeometry() {
  const g = new Geometry();
  const h = 0.5;
  // prettier-ignore
  const p = [
    -h, 0, -h,  h, 0, -h,  h, 1, 0,   -h, 0, -h,  h, 1, 0,  -h, 1, 0,
    -h, 0,  h, -h, 1, 0,   h, 1, 0,   -h, 0,  h,  h, 1, 0,   h, 0, h,
    -h, 0, -h, -h, 1, 0,  -h, 0, h,    h, 0, -h,  h, 0, h,   h, 1, 0,
  ];
  g.setAttribute("position", new Float32BufferAttribute(p, 3));
  g.computeVertexNormals();
  return g;
}

type Add = (part: string, m: Matrix4, color: string) => void;

/** A gable roof over a W x D box with its ridge along z (gable to the front): the two slabs and the triangle ends. */
function gableRoof(add: Add, part: string, wall: string, W: number, D: number, y0: number, rise: number, roof: string, overhang = 0.45) {
  add(part, euler(0, y0, 0, D, rise, W, 0, Math.PI / 2, 0), wall);
  const run = W / 2 + overhang;
  const slope = Math.atan2(rise, W / 2);
  for (const side of [-1, 1]) {
    const y = y0 + rise - (run / 2) * Math.tan(slope) + 0.15 / Math.cos(slope);
    add("roof", euler((side * run) / 2, y, 0, run / Math.cos(slope) + 0.15, 0.3, D + 0.6, 0, 0, -side * slope), roof);
  }
  return { run, slope };
}

/** A small window: a frame, the glass, and its muntins (cols x rows panes). */
function window4(add: Add, x: number, y: number, z: number, w: number, h: number, frame: string, cols: number, rows: number, turn = 0) {
  const at = (dx: number, dy: number, dz: number, sx: number, sy: number, sz: number) => euler(x + Math.cos(turn) * dx + Math.sin(turn) * dz, y + dy, z - Math.sin(turn) * dx + Math.cos(turn) * dz, sx, sy, sz, 0, turn, 0);
  add("frame", at(0, 0, 0, w + 0.18, h + 0.18, 0.1), frame);
  add("glass", at(0, 0, 0.03, w, h, 0.1), "#e6f8f8");
  for (let c = 1; c < cols; c++) add("frame", at(-w / 2 + (c * w) / cols, 0, 0.09, 0.05, h, 0.04), frame);
  for (let r = 1; r < rows; r++) add("frame", at(0, -h / 2 + (r * h) / rows, 0.09, w, 0.05, 0.04), frame);
}

/**
 * Viridian City's house (kanto-buildings.md 6, gfx-buildings.md 7.6): a storey
 * and a half of dark brown planks with white corner and eave boards, a steep
 * green gable to the front with white bargeboards and a little gable window, a
 * wooden door with a diamond window, small 2 x 3 pane windows in dark frames.
 */
function viridian(add: Add, W: number, D: number, f: number, i: number) {
  const front = D / 2;
  const Hw = 3.3;
  const wall = "#725f4c";
  const trim = "#f2efe6";
  const roof = ["#4d745d", "#5b7f5c", "#456b6a"][i % 3];
  add("base", euler(0, 0.15, 0, W + 0.14, 0.3, D + 0.14), "#8f8a80");
  add("planks", euler(0, Hw / 2, 0, W, Hw, D), wall);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) add("white", euler((sx * W) / 2, Hw / 2, (sz * D) / 2, 0.2, Hw, 0.2), trim);
  for (const sz of [-1, 1]) add("white", euler(0, Hw - 0.1, sz * (front + 0.03), W + 0.1, 0.18, 0.08), trim);
  const rise = W * 0.55;
  const { run, slope } = gableRoof(add, "plankGable", wall, W, D, Hw, rise, roof);
  // white bargeboards along the front rakes
  for (const side of [-1, 1]) {
    const y = Hw + rise - (run / 2) * Math.tan(slope) - 0.05;
    add("white", euler((side * run) / 2, y, front + 0.28, run / Math.cos(slope), 0.22, 0.1, 0, 0, -side * slope), trim);
  }
  window4(add, 0, Hw + rise * 0.38, front + 0.05, 0.6, 0.6, "#35594b", 2, 2);
  const xd = -f * W * 0.22;
  add("door", euler(xd, 1.15, front + 0.06, 1.1, 2.2, 0.1), "#8a7056");
  add("glass", euler(xd, 1.65, front + 0.12, 0.3, 0.3, 0.06, 0, 0, Math.PI / 4), "#9fd3f2");
  window4(add, f * W * 0.24, 1.75, front + 0.06, 0.9, 1.05, "#35594b", 2, 3);
  // a window on each side wall
  for (const s of [-1, 1]) window4(add, s * (W / 2 + 0.05), 1.75, 0, 0.9, 1.05, "#35594b", 2, 3, (s * Math.PI) / 2);
  add("bed", euler(f * W * 0.24, 0.12, front + 0.7, 2.0, 0.24, 0.7), "#4f9a45");
  for (let k = 0; k < 5; k++) add("flower", euler(f * W * 0.24 - 0.8 + k * 0.4, 0.32, front + 0.56 + (k % 2) * 0.28, 0.2, 0.12, 0.2), "#f6d24a");
}

/**
 * Vermilion City's house (kanto-buildings.md 6, gfx-buildings.md 7.6): two
 * storeys of cream plaster with brown brick quoins on the corners, a stone
 * base band, an orange square-tile roof with a small front gable and window,
 * a dark green X-braced door under a little orange awning, white-framed
 * windows, and a tulip planter.
 */
function vermilion(add: Add, W: number, D: number, f: number, i: number) {
  const front = D / 2;
  const Hw = 5.4;
  const wall = "#d8cbb0";
  const roof = ["#e88e47", "#d9763c", "#e4995a"][i % 3];
  add("base", euler(0, 0.22, 0, W + 0.12, 0.45, D + 0.12), "#b8ab96");
  add("walls", euler(0, Hw / 2, 0, W, Hw, D), wall);
  add("white", euler(0, 2.85, 0, W + 0.08, 0.16, D + 0.08), "#efe6d6");
  // brick quoins up each corner, long and short in turn
  for (const sx of [-1, 1])
    for (const sz of [-1, 1])
      for (let k = 0; k < 17; k++) {
        const long = k % 2 === 0;
        add("timber", euler(sx * (W / 2 - (long ? 0.2 : 0.14)), 0.6 + k * 0.29, sz * (D / 2 - (long ? 0.12 : 0.18)), long ? 0.46 : 0.34, 0.25, long ? 0.3 : 0.42), "#8a6a50");
      }
  // the main roof, ridge along x, tiles
  const rise = D * 0.42;
  add("gable", euler(0, Hw, 0, W, rise, D), wall);
  const run = D / 2 + 0.45;
  const slope = Math.atan2(rise, D / 2);
  for (const side of [-1, 1]) {
    const y = Hw + rise - (run / 2) * Math.tan(slope) + 0.15 / Math.cos(slope);
    add("tiles", euler(0, y, (side * run) / 2, W + 0.6, 0.3, run / Math.cos(slope) + 0.15, side * slope, 0, 0), roof);
  }
  // the small front gable, with its window
  const xg = f * W * 0.18;
  const wg = Math.min(3.2, W * 0.42);
  const rg = wg * 0.55;
  add("gable", euler(xg, Hw - 0.1, front - 0.9, 1.9, rg, wg, 0, Math.PI / 2, 0), wall);
  const runG = wg / 2 + 0.3;
  const slopeG = Math.atan2(rg, wg / 2);
  for (const side of [-1, 1]) {
    const y = Hw - 0.1 + rg - (runG / 2) * Math.tan(slopeG) + 0.15 / Math.cos(slopeG);
    add("tiles", euler(xg + (side * runG) / 2, y, front - 0.7, runG / Math.cos(slopeG) + 0.12, 0.26, 2.4, 0, 0, -side * slopeG), roof);
  }
  window4(add, xg, Hw + rg * 0.3, front + 0.07, 0.7, 0.55, "#f4f1e6", 2, 1);
  // the X-braced door under its awning
  const xd = -f * W * 0.24;
  add("door", euler(xd, 1.2, front + 0.06, 1.2, 2.3, 0.1), "#3b5540");
  for (const s of [-1, 1]) add("frame", euler(xd, 1.2, front + 0.13, 0.12, 2.4, 0.04, 0, 0, s * 0.48), "#2d4232");
  add("roof", euler(xd, 2.7, front + 0.42, 1.8, 0.12, 0.8, 0.32, 0, 0), "#e59a52");
  // white-framed windows: one by the door, two upstairs, one on each side per floor
  window4(add, f * W * 0.22, 1.6, front + 0.06, 1.05, 1.15, "#f4f1e6", 2, 2);
  for (const x of [-0.24, 0.22]) window4(add, f * W * x, 4.1, front + 0.06, 1.0, 1.1, "#f4f1e6", 2, 2);
  for (const s of [-1, 1]) for (const y of [1.6, 4.1]) window4(add, s * (W / 2 + 0.05), y, 0, 1.0, 1.1, "#f4f1e6", 2, 2, (s * Math.PI) / 2);
  add("bed", euler(f * W * 0.22, 0.14, front + 0.7, 2.2, 0.28, 0.7), "#8a5a3b");
  for (let k = 0; k < 6; k++) add("flower", euler(f * W * 0.22 - 0.9 + k * 0.36, 0.38, front + 0.58 + (k % 2) * 0.26, 0.18, 0.16, 0.18), k % 2 ? "#e8434f" : "#f6d24a");
}

/** One instance of a part: which building it belongs to, where it sits, and its color. */
type Piece = { b: number; m: Matrix4; color: string };

const Y = new Vector3(0, 1, 0);
const placeOf = (b: Building) => new Matrix4().compose(new Vector3(b.x, 0, b.z), new Quaternion().setFromAxisAngle(Y, b.turn), new Vector3(1, 1, 1));

/** A piece's own transform: position, size, then rotation (radians, XYZ order). */
const euler = (x: number, y: number, z: number, sx: number, sy: number, sz: number, rx = 0, ry = 0, rz = 0) =>
  new Matrix4().compose(new Vector3(x, y, z), new Quaternion().setFromEuler(new Euler(rx, ry, rz)), new Vector3(sx, sy, sz));

/** A lighter tint of a roof color, for the bullnosed lower edge of the skirt. */
function lighter(hex: string, k = 0.55) {
  const c = new Color(hex);
  return `#${c.lerp(new Color("#ffffff"), k).getHexString()}`;
}

const TIMBER = "#8e6a4e";
const BASEBOARD = "#7a5c4e";

/**
 * A Let's Go town house, part by part (notes/research/kanto-buildings.md,
 * Pallet Town): two storeys of cream plaster in a dark-brown timber frame on
 * a brown base board; a sloped skirt roof in the town color wrapping round
 * between the floors, with a pale bullnosed edge; a smaller upper floor set
 * to one side under its own front-facing gable, with a wooden balcony and
 * railing beside it; a brown door with two tall glass panes, a white-framed
 * frosted window, a white mailbox on a post, and daisies along the front.
 * Front faces +z; `flip` mirrors it (Pallet's two houses are mirror twins).
 */
function housePieces(): Record<string, Piece[]> {
  const out: Record<string, Piece[]> = {
    base: [], walls: [], timber: [], skirt: [], skirtEdge: [], gable: [], roof: [], door: [], frame: [], glass: [], white: [], bed: [], flower: [],
    planks: [], plankGable: [], tiles: [], hedge: [],
  };
  buildings.forEach((b, i) => {
    if (b.model !== "house") return;
    const sideways = Math.round(b.turn / (Math.PI / 2)) % 2 !== 0;
    const W = sideways ? b.d : b.w;
    const D = sideways ? b.w : b.d;
    const H = b.h; // ground floor wall height
    const f = b.flip ? -1 : 1;
    const at = placeOf(b);
    const add = (part: string, m: Matrix4, color: string) => out[part].push({ b: i, m: at.clone().multiply(m), color });
    // a clipped hedge along the street side of the yard, with a gap at the walk to the door (town-polish.md 10)
    const door = -f * W * (b.style === "viridian" ? 0.22 : b.style === "vermilion" ? 0.24 : 0.25);
    const yard = W / 2 + 0.3;
    for (const [x0, x1] of [[-yard, door - 1], [door + 1, yard]])
      if (x1 - x0 > 0.6) add("hedge", euler((x0 + x1) / 2, 0.35, D / 2 + 1.5, x1 - x0, 0.7, 0.6), "#4f9a45");
    if (b.style === "viridian") return viridian(add, W, D, f, i);
    if (b.style === "vermilion") return vermilion(add, W, D, f, i);
    const roof = b.roof ?? "#b24c49";
    const front = D / 2;

    // ground floor: base board, plaster, timber posts and the beam on top
    add("base", euler(0, 0.18, 0, W + 0.14, 0.36, D + 0.14), BASEBOARD);
    add("walls", euler(0, H / 2, 0, W, H, D), b.color);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add("timber", euler((sx * W) / 2, H / 2, (sz * D) / 2, 0.3, H, 0.3), TIMBER);
    for (const x of [-0.08, 0.1]) add("timber", euler(f * x * W, H / 2, front + 0.03, 0.24, H, 0.1), TIMBER);
    add("timber", euler(0, H - 0.12, front + 0.04, W + 0.06, 0.24, 0.1), TIMBER);
    add("timber", euler(0, H - 0.12, -front - 0.04, W + 0.06, 0.24, 0.1), TIMBER);

    // the skirt roof between the floors, with its pale lower edge
    add("skirt", euler(0, H - 0.2, 0, W + 1.3, 0.75, D + 1.3), roof);
    add("skirtEdge", euler(0, H - 0.24, 0, W + 1.36, 0.16, D + 1.36), lighter(roof));

    // the upper floor, set to one side, with its front gable
    const Wu = W * 0.58;
    const Du = D * 0.82;
    const x0 = -f * W * 0.21;
    const z0 = -D * 0.06;
    const U0 = H + 0.45;
    const H2 = 2.3;
    add("walls", euler(x0, U0 + H2 / 2, z0, Wu, H2, Du), b.color);
    for (const sx of [-1, 1]) add("timber", euler(x0 + (sx * Wu) / 2, U0 + H2 / 2, z0 + Du / 2, 0.26, H2, 0.26), TIMBER);
    const rise = Wu * 0.42;
    add("gable", euler(x0, U0 + H2, z0, Du, rise, Wu, 0, Math.PI / 2, 0), b.color);
    const run = Wu / 2 + 0.45;
    const slope = Math.atan2(rise, Wu / 2);
    for (const side of [-1, 1]) {
      const y = U0 + H2 + rise - (run / 2) * Math.tan(slope) + 0.15 / Math.cos(slope);
      add("roof", euler(x0 + (side * run) / 2, y, z0, run / Math.cos(slope) + 0.15, 0.3, Du + 0.6, 0, 0, -side * slope), roof);
    }
    add("frame", euler(x0, U0 + 1.25, z0 + Du / 2 + 0.03, 1.9, 1.15, 0.1), "#e8e4d4");
    add("glass", euler(x0, U0 + 1.25, z0 + Du / 2 + 0.05, 1.6, 0.85, 0.1), "#e6f8f8");

    // the balcony beside it: a wood deck and a railing on the open sides
    const xb = f * (W / 2 - (W - Wu) / 4 - 0.05);
    const Wb = W - Wu - 0.4;
    add("timber", euler(xb, U0 + 0.05, z0, Wb, 0.12, Du), "#a07850");
    add("timber", euler(xb, U0 + 0.75, z0 + Du / 2, Wb, 0.12, 0.12), TIMBER);
    add("timber", euler(xb + (f * Wb) / 2, U0 + 0.75, z0, 0.12, 0.12, Du), TIMBER);
    for (let k = 0; k <= 4; k++) add("timber", euler(xb - Wb / 2 + (k * Wb) / 4, U0 + 0.4, z0 + Du / 2, 0.1, 0.7, 0.1), TIMBER);

    // the front: door with two glass panes, the frosted window, mailbox, daisies
    const xd = -f * W * 0.25;
    add("door", euler(xd, 1.35, front + 0.06, 1.3, 2.4, 0.1), "#a87a56");
    for (const dx of [-0.22, 0.22]) add("glass", euler(xd + dx, 1.5, front + 0.12, 0.14, 1.7, 0.06), "#9fd3f2");
    const xw = f * W * 0.27;
    add("frame", euler(xw, 1.9, front + 0.06, 2.1, 1.35, 0.1), "#e8e4d4");
    add("glass", euler(xw - 0.46, 1.9, front + 0.09, 0.82, 1.05, 0.1), "#e6f8f8");
    add("glass", euler(xw + 0.46, 1.9, front + 0.09, 0.82, 1.05, 0.1), "#e6f8f8");
    add("white", euler(xd - f * 1.35, 1.25, front + 0.9, 0.55, 0.42, 0.42), "#f4f4f2");
    add("timber", euler(xd - f * 1.35, 0.55, front + 0.9, 0.1, 1.1, 0.1), "#9a9a92");
    add("bed", euler(xw, 0.12, front + 0.75, 2.6, 0.24, 0.8), "#4f9a45");
    for (let k = 0; k < 6; k++) add("flower", euler(xw - 1.1 + k * 0.44, 0.32, front + 0.6 + (k % 2) * 0.3, 0.2, 0.12, 0.2), "#ffffff");
  });
  return out;
}

const box = new BoxGeometry(1, 1, 1);
// a little round on the walls and the base, so houses read as toys, not crates (town-polish.md 10)
const soft = new RoundedBoxGeometry(1, 1, 1, 2, 0.04);
/** The skirt roof's shape: a square frustum (a truncated pyramid), unit size, standing on y = 0. */
const frustum = new CylinderGeometry(0.8 / Math.SQRT2, 1 / Math.SQRT2, 1, 4, 1).rotateY(Math.PI / 4).translate(0, 0.5, 0);
const HOUSE_PARTS: Record<string, BufferGeometry> = {
  base: soft,
  walls: soft,
  timber: box,
  skirt: frustum,
  skirtEdge: frustum,
  gable: gableGeometry(),
  roof: box,
  door: box,
  frame: box,
  glass: box,
  white: box,
  bed: box,
  flower: box,
  planks: soft,
  plankGable: gableGeometry(),
  tiles: box,
  // the yard hedge: well rounded, like a clipped bush
  hedge: new RoundedBoxGeometry(1, 1, 1, 2, 0.3),
};

/** An instanced layer: one geometry and material, one instance per piece. */
function Layer({ geometry, material, pieces }: { geometry: BufferGeometry; material: MeshLambertMaterial; pieces: Piece[] }) {
  const mesh = useRef<InstancedMesh>(null);
  const geo = useMemo(() => geometry.clone(), [geometry]);

  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    pieces.forEach((p, k) => {
      m.setMatrixAt(k, p.m);
      m.setColorAt(k, new Color(p.color));
    });
    geo.setAttribute("aFade", new InstancedBufferAttribute(new Float32Array(pieces.length).fill(1), 1));
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [pieces, geo]);

  // Anything standing between the camera and the trainer fades to a ghost.
  useFrame(() => {
    const attr = mesh.current?.geometry.getAttribute("aFade") as InstancedBufferAttribute | undefined;
    if (!attr) return;
    let changed = false;
    pieces.forEach((p, k) => {
      const want = fade[p.b];
      if (Math.abs((attr.array[k] as number) - want) > 0.004) {
        attr.array[k] = want;
        changed = true;
      }
    });
    if (changed) attr.needsUpdate = true;
  });

  return <instancedMesh ref={mesh} args={[geo, material, pieces.length]} castShadow receiveShadow />;
}

function Houses() {
  const parts = useMemo(() => {
    const pieces = housePieces();
    const plain = townMaterial({});
    const glass = townMaterial({ glass: true });
    const planks = townMaterial({ pattern: "planks" });
    const tiles = townMaterial({ pattern: "tiles" });
    const pick = (part: string) => (part === "glass" ? glass : part === "planks" || part === "plankGable" ? planks : part === "tiles" ? tiles : plain);
    return Object.entries(pieces)
      .filter(([, list]) => list.length)
      .map(([part, list]) => ({ part, list, material: pick(part) }));
  }, []);
  return (
    <>
      {parts.map(({ part, list, material }) => (
        <Layer key={part} geometry={HOUSE_PARTS[part]} material={material} pieces={list} />
      ))}
    </>
  );
}

/**
 * The neighborhood: Pokémon-town houses built from parts, the job buildings
 * and the town's blocks from our own kit, the Center and the Mart, all
 * instanced. After dark, windows light up.
 */
export function Buildings({ night }: { night: boolean }) {
  return (
    <>
      <TownTracker night={night} />
      <Houses />
      <Blocks />
      <PokemonCenter />
      <PokeMart />
    </>
  );
}
