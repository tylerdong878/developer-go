"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import {
  type BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  Euler,
  type Group,
  InstancedBufferAttribute,
  type InstancedMesh,
  type Mesh,
  Matrix4,
  MeshLambertMaterial,
  Quaternion,
  SRGBColorSpace,
  Vector3,
} from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { buildings } from "../base";
import type { Building, Recipe } from "../lots";
import { fade, town } from "./fade";
import {
  awnings,
  bays,
  bit,
  blade,
  blank,
  type Box,
  bulkhead,
  doorway,
  drawDisc,
  fascia,
  flatRoof,
  glassRail,
  glow,
  HEROES,
  mansard,
  planters,
  roofGarden,
  roofUnit,
  STYLE,
  waterTank,
} from "./heroes";

/*
 * Our own Pokémon-town building kit (notes/research/gfx-buildings.md 3.6,
 * 4.2-4.7, 7.4), in place of the city-builder models: toy-scale blocks with
 * rolled edges, a darker plinth, a shopfront floor, a plain body of windows
 * and a thick cap. Glass is opaque blue with white strokes in thick white
 * frames, never see-through; walls are pastel with one strong accent; clean,
 * no grime; at night a third of the windows and every shop light up.
 *
 * Every part of every block is one rounded box in one instanced mesh, rebuilt
 * at its real size in the vertex shader (so a 12 m wall keeps a 0.4 m corner),
 * with the facade painted on in the fragment shader. The small parts (valances,
 * planters, door frames) are a second, lighter mesh with the same material,
 * and tower roofs a third. Three draw calls.
 */

const { punched: PUNCHED, curtain: CURTAIN, tall: TALL, brick: BRICK } = STYLE;

const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const pick = <T,>(list: readonly T[], n: number) => list[Math.floor(hash(n) * list.length) % list.length];
/** A building's own shade of its wall color: a few degrees of hue and a little lightness either way, never the trim or accent (town-polish.md 8). */
const shade = (color: string, i: number) => `#${new Color(color).offsetHSL((hash(i + 41) - 0.5) * 0.022, 0, (hash(i + 43) - 0.5) * 0.08).getHexString()}`;

/** The building's own width and depth, before its turn. */
const localSize = (b: Building) => (Math.round(b.turn / (Math.PI / 2)) % 2 !== 0 ? [b.d, b.w] : [b.w, b.d]);

/** The wall colors a Saffron block can have, each with the accent and door that go with it (town-polish.md 8). */
const SAFFRON = [
  { wall: "#e8cf86", accent: "#d8688a", door: "#a84a66" },
  { wall: "#f0c49a", accent: "#3f8fd0", door: "#2f6aa0" },
  { wall: "#cfe6c8", accent: "#e07a5a", door: "#a85840" },
  { wall: "#d9cfe8", accent: "#4fae8a", door: "#3a8068" },
];

/** The parts of one block, in its own frame (front toward +z, ground at y 0). */
function parts(b: Building, i: number): Box[] {
  const [W, D] = localSize(b);
  const H = b.h;
  if (b.slug && HEROES[b.slug]) return HEROES[b.slug](W, D, H).boxes;
  const recipe: Recipe = b.recipe ?? "saffron";
  const F = D / 2;
  const door = (x: number, glass: string, trim: string): Box => ({
    at: [x, 1.4, F + 0.12],
    size: [2.2, 2.8, 0.4],
    round: [0.12, 0.12, 0.08],
    facade: [1.8, 1.7, 0.15, CURTAIN],
    color: trim,
    glass,
    trim,
  });
  const tall = (b.floors ?? 0) >= 3;
  // half the awnings in town are striped, the rest plain like LGPE Saffron's
  const striped = hash(i + 21) < 0.5;
  const out: Box[] = [];
  if (recipe === "saffron") {
    const { wall: base, accent, door: paint } = pick(SAFFRON, i);
    const wall = shade(base, i);
    const bay = bays(W, 0.4, 2.4);
    const dx = bay.x[bay.door];
    out.push(blank([W + 0.2, 0.9, D + 0.2], [0, 0.45, 0], "#8b80a6", [0.5, 0.08, 0.5]));
    out.push({ at: [0, (H - 0.6) / 2, 0], size: [W, H - 0.6, D], round: [0.4, 0.12, 0.4], facade: [2.4, 3, 4.2, PUNCHED], color: wall, glass: "#8fc4ee", trim: "#f4ecd2" });
    out.push(blank([W + 0.5, 0.6, D + 0.5], [0, H - 0.3, 0], "#f4ecd2", [0.6, 0.06, 0.6]));
    // a shop: a sign board, awnings over the shop bays, a framed door under a canopy, planters, a blade sign
    out.push(...fascia(Math.min(W - 1.2, 9), 4.2, F, "#f4ecd2", accent));
    out.push(...awnings(bay.x.filter((_, k) => k !== bay.door), bay.bw, 3.5, F, accent, striped));
    out.push(...doorway(dx, F, "#8fc4ee", paint, "#f4ecd2", accent));
    out.push(...planters(dx, F, 2.4));
    out.push(...blade(W / 2 - 0.6, 5.6, F, accent));
    // up top: a garden on one in four, otherwise a deck with the stairs, a unit and, on one in three, a water tank
    const roof = hash(i + 31);
    if (roof < 0.25) out.push(...flatRoof(W, D, H, null, "#f4ecd2"), ...roofGarden(W, D, H), ...roofUnit(W * 0.22, H, -D * 0.1));
    else {
      out.push(...flatRoof(W, D, H, "#b9ae98", "#f4ecd2"), ...roofUnit(W * 0.2, H, D * 0.12));
      if (tall) out.push(...bulkhead(-W * 0.25, H, -D * 0.2, wall));
      if (roof > 0.67) out.push(...waterTank(W * 0.22, H, -D * 0.22));
    }
  } else if (recipe === "glass") {
    out.push(blank([W + 0.1, 0.6, D + 0.1], [0, 0.3, 0], "#5f6b85", [0.2, 0.08, 0.2]));
    out.push({ at: [0, (H - 0.5) / 2, 0], size: [W, H - 0.5, D], round: [0.1, 0.15, 0.1], facade: [1.6, 3.2, 4.4, CURTAIN], color: shade("#f4f1ea", i), glass: pick(["#6f8fc8", "#7fa2d8", "#8fb4e2"], i), trim: "#d6dcea" });
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) out.push(blank([0.9, H - 0.4, 0.9], [sx * (W / 2 - 0.3), (H - 0.4) / 2, sz * (D / 2 - 0.3)], "#f6f7fa", [0.35, 0.1, 0.35]));
    out.push(blank([W * 0.6, 0.3, 2.2], [0, 4.1, F + 1.0], "#f6f7fa"));
    // a lit name strip along the canopy, and planters either side of it
    out.push({ ...glow([W * 0.6, 0.12, 0.05], [0, 4.1, F + 2.13], "#eef6ff", [0.03, 0.03, 0.02]), small: true });
    out.push(...planters(0, F, W * 0.3 + 0.9));
    out.push(blank([W + 0.3, 0.5, D + 0.3], [0, H - 0.25, 0], "#e6e9f0", [0.3, 0.06, 0.3]));
    out.push(door(0, "#8fb4e2", "#f6f7fa"));
    // a glass rail and a louvered screen hiding the plant, like a Paldea office
    out.push(bit([W - 0.3, 0.08, D - 0.3], [0, H + 0.04, 0], "#b9bfcc", [0.03, 0.02, 0.03]), ...glassRail(W, D, H));
    out.push({ ...blank([W * 0.5, 2.0, D * 0.4], [0, H + 1.0, -D * 0.15], "#e6e9f0", [0.2, 0.06, 0.2]), facade: [1, 0.12, 0.25, STYLE.louver] });
    out.push(...roofUnit(-W * 0.25, H, D * 0.3));
  } else if (recipe === "stone") {
    const accent = pick(["#2c3d5c", "#b04a48"], i);
    const bay = bays(W, 0.8, 2.2);
    const dx = bay.x[bay.door];
    out.push(blank([W + 0.1, 0.5, D + 0.1], [0, 0.25, 0], "#9a8670", [0.8, 0.08, 0.8]));
    out.push({ at: [0, (H - 0.4) / 2, 0], size: [W, H - 0.4, D], round: [0.8, 0.1, 0.8], facade: [2.2, 3.2, 4.6, TALL], color: shade("#ecdcbc", i), glass: "#8fa6e3", trim: "#f6eedd" });
    out.push(blank([W + 0.25, 0.25, D + 0.25], [0, 4.6, 0], "#f6eedd", [0.9, 0.08, 0.9]));
    // a Lumiose shop floor: a sign board under the string course, awnings, a framed door
    out.push(...fascia(Math.min(W - 2, 9), 3.9, F, "#f6eedd", accent));
    out.push(...awnings(bay.x.filter((_, k) => k !== bay.door), bay.bw, 3.2, F, accent, striped));
    out.push(...doorway(dx, F, "#8fa6e3", accent, "#f6eedd"));
    out.push(...planters(dx, F, 2.4));
    out.push(...blade(W / 2 - 1.0, 6.0, F, accent));
    out.push(blank([W + 0.4, 0.4, D + 0.4], [0, H - 0.2, 0], "#f6eedd", [1.0, 0.08, 1.0]));
    out.push(...mansard(W, D, H, "#f6eedd", W > 11 ? 3 : 2));
  } else {
    const wall = shade(pick(["#c0624a", "#b4583f", "#c87156"], i), i);
    const bay = bays(W, 0.25, 2.2);
    const dx = bay.x[bay.door];
    out.push(blank([W + 0.15, 0.7, D + 0.15], [0, 0.35, 0], "#6e4a40", [0.25, 0.08, 0.25]));
    out.push({ at: [0, (H - 0.5) / 2, 0], size: [W, H - 0.5, D], round: [0.25, 0.1, 0.25], facade: [2.2, 3, 3.6, BRICK], color: wall, glass: "#7fb0e0", trim: "#f4ecdf" });
    out.push(blank([W + 0.4, 0.5, D + 0.4], [0, H - 0.25, 0], "#efe6d6", [0.4, 0.06, 0.4]));
    // a stoop up to a green door in a white frame, under a little canopy, planters either side
    out.push(blank([2.6, 0.5, 1.3], [dx, 0.25, F + 0.6], "#b9a99a"));
    out.push(blank([1.6, 2.6, 0.3], [dx, 1.8, F + 0.08], "#2f5d4a", [0.1, 0.1, 0.06]));
    out.push(bit([0.25, 2.8, 0.3], [dx - 0.93, 1.9, F + 0.1], "#f4ecdf"), bit([0.25, 2.8, 0.3], [dx + 0.93, 1.9, F + 0.1], "#f4ecdf"));
    out.push(bit([2.2, 0.3, 0.34], [dx, 3.25, F + 0.12], "#f4ecdf"));
    out.push(bit([2.6, 0.16, 1.1], [dx, 3.52, F + 0.6], "#2f5d4a", [0.05, 0.03, 0.05]));
    out.push(...planters(dx, F, 2.3));
    // the Boston water tank on its legs, on every one
    out.push(...flatRoof(W, D, H, "#8f8a86", "#efe6d6"), ...waterTank(W * 0.18, H, -D * 0.1));
    if (hash(i + 5) < 0.5) out.push(...roofUnit(-W * 0.25, H, D * 0.15));
  }
  return out;
}

const material = new MeshLambertMaterial({ alphaHash: true });
material.customProgramCacheKey = () => "town-blocks";
material.onBeforeCompile = (shader) => {
  Object.assign(shader.uniforms, { uNight: town.uNight, uLitShare: { value: 0.38 } });
  shader.vertexShader = shader.vertexShader
    .replace(
      "#include <common>",
      `#include <common>
attribute vec3 aRound; attribute vec4 aFacade; attribute vec3 aGlass; attribute vec3 aTrim; attribute float aSeed; attribute float aFade;
varying vec3 vBPos; varying vec3 vBSize; varying vec3 vBNrm; varying vec3 vRound;
varying vec4 vFacade; varying vec3 vGlass; varying vec3 vTrim; varying float vSeed; varying float vFade; varying float vWorldY;`,
    )
    .replace(
      "#include <beginnormal_vertex>",
      `#include <beginnormal_vertex>
vec3 bS = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
vec3 bH = 0.5 * bS;
vec3 bR = clamp(aRound, vec3(0.001), bH - 0.01);
objectNormal = normalize(normal / bR) * bS;`,
    )
    .replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
vec3 bM = sign(position) * (bH - bR) + normal * bR;
transformed = bM / bS;
vBPos = bM; vBSize = bS; vBNrm = normal; vRound = bR;
vFacade = aFacade; vGlass = aGlass; vTrim = aTrim; vSeed = aSeed; vFade = aFade;
vWorldY = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).y;`,
    );
  shader.fragmentShader = shader.fragmentShader
    .replace(
      "#include <common>",
      `#include <common>
uniform float uNight; uniform float uLitShare;
varying vec3 vBPos; varying vec3 vBSize; varying vec3 vBNrm; varying vec3 vRound;
varying vec4 vFacade; varying vec3 vGlass; varying vec3 vTrim; varying float vSeed; varying float vFade; varying float vWorldY;
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float box2(vec2 p, vec2 lo, vec2 hi, vec2 aa) {
  vec2 a = smoothstep(lo - aa, lo + aa, p) * (1.0 - smoothstep(hi - aa, hi + aa, p));
  return a.x * a.y;
}
float bWin = 0.0; float bLit = 0.0; float bShop = 0.0;`,
    )
    .replace(
      "#include <color_fragment>",
      `#include <color_fragment>
diffuseColor.a *= vFade;
{
  float style = vFacade.w;
  bool sx = abs(vBNrm.x) > abs(vBNrm.z);
  float wallM = 1.0 - step(0.6, abs(vBNrm.y));
  float W = sx ? vBSize.z : vBSize.x;
  float R = sx ? vRound.z : vRound.x;
  float u = sx ? -vBPos.z * sign(vBNrm.x) : vBPos.x * sign(vBNrm.z);
  float h = vBPos.y + 0.5 * vBSize.y;
  float span = max(W - 2.0 * R - 0.6, 0.5);
  float nb = max(1.0, floor(span / vFacade.x + 0.5));
  float g0 = vFacade.z; float fl = vFacade.y;
  float nf = max(0.0, floor((vBSize.y - g0) / fl + 0.02));
  vec2 c = vec2((u + 0.5 * span) * nb / span, (h - g0) / fl);
  vec2 id = floor(c); vec2 f = fract(c);
  vec2 aa = fwidth(c) * 1.2;
  float far = smoothstep(0.12, 0.3, max(aa.x, aa.y));
  float windows = step(style, 1.5) + step(2.5, style) * step(style, 4.5);
  float cells = wallM * step(0.0, c.x) * step(c.x, nb) * step(0.0, c.y) * step(c.y, nf) * windows;
  // windows 60% of the bay and 70% of the floor, like real punched windows
  vec2 lo = style > 0.5 && style < 1.5 ? vec2(0.06, 0.18) : style > 2.5 && style < 3.5 ? vec2(0.22, 0.1) : vec2(0.2, 0.16);
  vec2 hi = style > 0.5 && style < 1.5 ? vec2(0.94, 0.97) : style > 2.5 && style < 3.5 ? vec2(0.78, 0.9) : vec2(0.8, 0.86);
  float pane = box2(f, lo, hi, aa) * cells;
  float frame = box2(f, lo - vec2(0.05, 0.05), hi + vec2(0.05, 0.03), aa) * cells - pane;
  // a stone sill with its shadow under it and a lintel over (punched, tall and brick walls)
  float pl = step(style, 0.5) + step(2.5, style) * step(style, 4.5);
  float sill = box2(f, vec2(lo.x - 0.07, lo.y - 0.075), vec2(hi.x + 0.07, lo.y - 0.03), aa) * cells * pl;
  float sillS = box2(f, vec2(lo.x - 0.07, lo.y - 0.12), vec2(hi.x + 0.07, lo.y - 0.075), aa) * cells * pl;
  float lintel = box2(f, vec2(lo.x - 0.04, hi.y + 0.035), vec2(hi.x + 0.04, hi.y + 0.075), aa) * cells * pl;
  // ground-floor windows on the sides and back, one a bay, so no wall is blank at eye level
  float base = wallM * step(0.0, c.x) * step(c.x, nb) * pl * step(2.5, g0) * (1.0 - step(0.6, vBNrm.z));
  vec2 gs = vec2(fract(c.x), h);
  float gpane = box2(gs, vec2(lo.x, 0.9), vec2(hi.x, g0 - 1.0), vec2(aa.x, 0.03)) * base;
  float gframe = box2(gs, vec2(lo.x - 0.05, 0.78), vec2(hi.x + 0.05, g0 - 0.88), vec2(aa.x, 0.03)) * base - gpane;
  vec2 q = clamp((f - lo) / (hi - lo), 0.0, 1.0);
  float d = q.x + 0.6 * q.y;
  float streak = 1.0 - smoothstep(0.05, 0.08, abs(d - 0.55));
  streak += 0.6 * (1.0 - smoothstep(0.02, 0.04, abs(d - 0.85)));
  vec3 glass = mix(vGlass * 0.8, vGlass * 1.12, q.y) + streak * 0.3 * (1.0 - far);
  // the glass sits back in the wall: a shadow along its top and one side
  float reveal = pane * max(smoothstep(0.82, 0.9, q.y), 0.6 * (1.0 - smoothstep(0.04, 0.1, q.x)));
  // the shop glass on the street face, under a fascia
  vec2 s = vec2(fract(c.x), h);
  float shop = step(0.6, vBNrm.z) * wallM * step(0.0, c.x) * step(c.x, nb) * windows * step(2.5, g0)
             * box2(s, vec2(0.08, 0.5), vec2(0.92, g0 - 1.1), vec2(aa.x, 0.03));
  // faint brick courses between the windows
  if (style > 3.5) {
    float row = abs(fract(h / 0.5) - 0.5);
    diffuseColor.rgb *= 1.0 - 0.07 * (1.0 - smoothstep(0.0, fwidth(h / 0.5) * 1.5 + 0.04, row)) * (1.0 - far) * (1.0 - pane - frame) * wallM;
  }
  // pilasters between the bays above the shop floor, the Saffron street look
  float pil = wallM * step(style, 0.5) * step(0.0, c.x) * step(c.x, nb) * step(g0, h) * step(h, vBSize.y - 0.1)
            * (1.0 - smoothstep(0.035, 0.035 + aa.x, abs(fract(c.x + 0.5) - 0.5)));
  // awning stripes, painted across the box so they show on the top too
  if (style > 5.5 && style < 6.5) {
    float sw = fwidth(vBPos.x / 0.6);
    float st = smoothstep(-sw, sw, abs(fract(vBPos.x / 0.6) - 0.5) - 0.25);
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.97, 0.95, 0.92), st * (1.0 - smoothstep(0.2, 0.45, sw)));
  }
  // louvers and slate courses: bands up the face, the spacing in the facade's ground-floor slot, the strength in its floor slot
  if (style > 6.5) {
    float lw = fwidth(h / g0);
    float band = smoothstep(0.5 - lw, 0.5 + lw, fract(h / g0));
    diffuseColor.rgb *= 1.0 - fl * band * wallM * (1.0 - smoothstep(0.25, 0.5, lw));
  }
  diffuseColor.rgb = mix(diffuseColor.rgb, vTrim, pil);
  diffuseColor.rgb = mix(diffuseColor.rgb, vTrim, frame + gframe);
  diffuseColor.rgb = mix(diffuseColor.rgb, vTrim * 1.08, sill * (1.0 - far));
  diffuseColor.rgb *= 1.0 - 0.22 * sillS * (1.0 - far);
  diffuseColor.rgb = mix(diffuseColor.rgb, vTrim, lintel * (1.0 - far));
  diffuseColor.rgb = mix(diffuseColor.rgb, glass, pane);
  diffuseColor.rgb = mix(diffuseColor.rgb, mix(vGlass * 0.85, vGlass * 1.1, smoothstep(0.9, g0 - 1.0, h)), gpane);
  diffuseColor.rgb *= 1.0 - 0.3 * reveal * (1.0 - far);
  diffuseColor.rgb = mix(diffuseColor.rgb, mix(vGlass, vec3(1.0), 0.15), shop);
  bWin = pane + gpane; bShop = shop;
  bLit = step(1.0 - uLitShare, hash12(id + vec2(vSeed, dot(vBNrm, vec3(3.0, 0.0, 7.0)))));
  // the rolled edges catch a little more light, like LGPE's glossy toy plastic
  float curve = 1.0 - max(max(abs(vBNrm.x), abs(vBNrm.y)), abs(vBNrm.z));
  diffuseColor.rgb *= 1.0 + 0.12 * smoothstep(0.04, 0.3, curve) * (1.0 - step(0.6, abs(vBNrm.y)));
  // soft contact shade where the walls meet the ground, and a touch lighter up high
  diffuseColor.rgb *= mix(0.72, 1.0, smoothstep(0.0, 1.6, vWorldY));
  diffuseColor.rgb *= mix(0.95, 1.04, smoothstep(1.5, 14.0, vWorldY));
}`,
    )
    .replace(
      "#include <emissivemap_fragment>",
      `#include <emissivemap_fragment>
{
  float cool = step(0.8, hash12(vec2(vSeed * 3.1, bLit + bWin)));
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.13, 0.17, 0.3), uNight * bWin * (1.0 - bLit));
  totalEmissiveRadiance += uNight * (bWin * bLit * mix(vec3(1.0, 0.8, 0.5), vec3(0.81, 0.88, 1.0), cool) + bShop * vec3(1.0, 0.86, 0.62) * 0.9);
  // soffit strips, crown rings and fascias glow after dark
  totalEmissiveRadiance += uNight * step(4.5, vFacade.w) * step(vFacade.w, 5.5) * diffuseColor.rgb * 1.3;
}`,
    );
};

type Piece = { b: number; box: Box };

const BIG = new RoundedBoxGeometry(1, 1, 1, 3, 0.25);
// parts under about 1.5 m: one bevel to a corner, a fifth of the triangles
const SMALL = new RoundedBoxGeometry(1, 1, 1, 1, 0.25);
// a four-sided pyramid with flat faces, its corners on the unit box's so the shader sizes it like a box
const SPIRE = new CylinderGeometry(0, Math.SQRT1_2, 1, 4, 1).rotateY(Math.PI / 4).toNonIndexed();
SPIRE.computeVertexNormals();
const UP = new Vector3(0, 1, 0);

/** Every block in town (buildings built from the kit): instanced meshes for the big parts, the small ones and the spires, sharing one material. */
export function Blocks() {
  const layers = useMemo(() => {
    const big: Piece[] = [];
    const small: Piece[] = [];
    const spire: Piece[] = [];
    buildings.forEach((b, i) => {
      if (b.model !== "block") return;
      for (const box of parts(b, i)) (box.spire ? spire : box.small ? small : big).push({ b: i, box });
    });
    return { big, small, spire };
  }, []);
  return layers.big.length ? (
    <>
      <KitLayer pieces={layers.big} geometry={BIG} />
      <KitLayer pieces={layers.small} geometry={SMALL} />
      <KitLayer pieces={layers.spire} geometry={SPIRE} />
      <HeroDiscs />
    </>
  ) : null;
}

/** One instanced mesh of kit boxes: placed once, faded building by building. */
function KitLayer({ pieces, geometry }: { pieces: Piece[]; geometry: BufferGeometry }) {
  const mesh = useRef<InstancedMesh>(null);
  const geo = useMemo(() => {
    const g = geometry.clone();
    const n = pieces.length;
    const round = new Float32Array(n * 3);
    const facade = new Float32Array(n * 4);
    const glass = new Float32Array(n * 3);
    const trim = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    const c = new Color();
    pieces.forEach(({ b, box }, k) => {
      round.set(box.round, k * 3);
      facade.set(box.facade, k * 4);
      glass.set(c.set(box.glass ?? box.color).toArray(), k * 3);
      trim.set(c.set(box.trim ?? box.color).toArray(), k * 3);
      seed[k] = b * 1.7;
    });
    g.setAttribute("aRound", new InstancedBufferAttribute(round, 3));
    g.setAttribute("aFacade", new InstancedBufferAttribute(facade, 4));
    g.setAttribute("aGlass", new InstancedBufferAttribute(glass, 3));
    g.setAttribute("aTrim", new InstancedBufferAttribute(trim, 3));
    g.setAttribute("aSeed", new InstancedBufferAttribute(seed, 1));
    g.setAttribute("aFade", new InstancedBufferAttribute(new Float32Array(n).fill(1), 1));
    return g;
  }, [pieces, geometry]);
  // each building's run of pieces (they're listed building by building), so the fade only touches what changed
  const runs = useMemo(() => {
    const out: [number, number, number][] = [];
    pieces.forEach(({ b }, k) => {
      const last = out[out.length - 1];
      if (last && last[0] === b) last[2] = k + 1;
      else out.push([b, k, k + 1]);
    });
    return out;
  }, [pieces]);

  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const place = new Matrix4();
    const local = new Matrix4();
    const q = new Quaternion();
    const turn = new Quaternion();
    const e = new Euler();
    const c = new Color();
    pieces.forEach(({ b, box }, k) => {
      const bd = buildings[b];
      place.compose(new Vector3(bd.x, 0, bd.z), q.setFromAxisAngle(UP, bd.turn), new Vector3(1, 1, 1));
      turn.identity();
      if (box.rot) turn.setFromEuler(e.set(...box.rot));
      local.compose(new Vector3(...box.at), turn, new Vector3(...box.size));
      m.setMatrixAt(k, place.multiply(local));
      m.setColorAt(k, c.set(box.color));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [pieces]);

  // anything between the camera and the trainer fades out of the way, like every building
  useFrame(() => {
    const attr = mesh.current?.geometry.getAttribute("aFade") as InstancedBufferAttribute | undefined;
    if (!attr) return;
    const arr = attr.array as Float32Array;
    let changed = false;
    for (const [b, from, to] of runs) {
      const want = fade[b];
      if (Math.abs(arr[from] - want) > 0.004 || (want === 1 && arr[from] !== 1)) {
        arr.fill(want, from, to);
        changed = true;
      }
    }
    if (changed) attr.needsUpdate = true;
  });

  return pieces.length ? <instancedMesh ref={mesh} args={[geo, material, pieces.length]} castShadow receiveShadow /> : null;
}

/** The emblem discs on the job buildings, drawn once into textures, glowing after dark. */
function HeroDiscs() {
  const discs = useMemo(() => {
    const out: { key: string; matrix: Matrix4; size: number; material: MeshLambertMaterial; b: number }[] = [];
    buildings.forEach((b, i) => {
      if (!b.slug || !HEROES[b.slug]) return;
      const [W, D] = localSize(b);
      HEROES[b.slug](W, D, b.h).discs.forEach((d, k) => {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 512;
        drawDisc(canvas.getContext("2d")!, d);
        const map = new CanvasTexture(canvas);
        map.colorSpace = SRGBColorSpace;
        map.anisotropy = 4;
        const material = new MeshLambertMaterial({ map, emissiveMap: map, emissive: "#ffffff", emissiveIntensity: 0, transparent: true });
        const matrix = new Matrix4()
          .compose(new Vector3(b.x, 0, b.z), new Quaternion().setFromAxisAngle(UP, b.turn), new Vector3(1, 1, 1))
          .multiply(new Matrix4().makeTranslation(...d.at));
        out.push({ key: `${b.slug}${k}`, matrix, size: d.size, material, b: i });
      });
    });
    return out;
  }, []);
  const group = useRef<Group>(null);
  useFrame(() => {
    group.current?.children.forEach((o) => {
      const m = (o as Mesh).material as MeshLambertMaterial;
      m.emissiveIntensity = town.uNight.value * 0.85;
      m.opacity = fade[o.userData.b as number];
    });
  });
  return (
    <group ref={group}>
      {discs.map((d) => (
        <mesh key={d.key} matrix={d.matrix} matrixAutoUpdate={false} material={d.material} userData={{ b: d.b }}>
          <circleGeometry args={[d.size / 2, 64]} />
        </mesh>
      ))}
    </group>
  );
}
