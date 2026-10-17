"use client";

import { useMemo } from "react";
import {
  Color,
  DataTexture,
  DoubleSide,
  LinearFilter,
  LinearMipmapLinearFilter,
  RedFormat,
  RepeatWrapping,
  ShaderMaterial,
  UniformsLib,
  UniformsUtils,
  UnsignedByteType,
} from "three";
import { areas } from "../base";
import { pointInPolygon, random } from "../geometry";
import { polygonGeometry } from "./ground";
import { skyLook } from "./Sky";

/*
 * The harbor and the pond, drawn the way stylized games do water
 * (notes/research/gfx-reflections-water.md 4.x), not as a mirror: the
 * distance from the shore stands in for depth (pale shallows to deep blue),
 * a foam edge breathes against the bank, broken wave lines roll in every few
 * seconds, cel sparkles net the shallows like Wind Waker, the sky shows at
 * grazing angles, and the sun throws a glitter path. Four texture reads, the
 * same on phones.
 */

/** The box the shore field covers (world units); past it the field clamps to its edge (open sea). */
const SHORE = { x0: -160, z0: -224, size: 448, n: 256, near: -8, far: 24 };

/** Signed distance to the coast, positive in water, baked once into a small texture. */
function bakeShore() {
  const { x0, z0, size, n, near, far } = SHORE;
  const polys = areas.filter((a) => a.kind === "water").map((a) => a.points);
  const segs: [number, number, number, number][] = [];
  for (const poly of polys)
    poly.forEach((a, i) => {
      const b = poly[(i + 1) % poly.length];
      if (a[0] >= 400 || b[0] >= 400) return; // the open sea's far box edges aren't coast
      segs.push([a[0], a[1], b[0], b[1]]);
    });
  const data = new Uint8Array(n * n);
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const px = x0 + ((i + 0.5) / n) * size;
      const pz = z0 + ((j + 0.5) / n) * size;
      let best = Infinity;
      for (const [ax, az, bx, bz] of segs) {
        const vx = bx - ax;
        const vz = bz - az;
        const h = Math.max(0, Math.min(1, ((px - ax) * vx + (pz - az) * vz) / (vx * vx + vz * vz)));
        best = Math.min(best, Math.hypot(px - ax - vx * h, pz - az - vz * h));
      }
      const d = polys.some((p) => pointInPolygon([px, pz], p)) ? best : -best;
      data[j * n + i] = Math.round(255 * Math.min(1, Math.max(0, (d - near) / (far - near))));
    }
  const tex = new DataTexture(data, n, n, RedFormat, UnsignedByteType);
  tex.magFilter = tex.minFilter = LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

/** One tiling noise: voronoi cell edges (r), smooth value noise (g), cell distance (b). */
function bakeNoise(size = 256, cells = 8, seed = 7) {
  const rand = random(seed);
  const pts = Array.from({ length: cells * cells }, () => [rand(), rand()]);
  const val = Array.from({ length: cells * cells }, () => rand());
  const wrap = (i: number) => ((i % cells) + cells) % cells;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const u = (x / size) * cells;
      const v = (y / size) * cells;
      const cx = Math.floor(u);
      const cy = Math.floor(v);
      let f1 = 9;
      let f2 = 9;
      for (let j = -1; j <= 1; j++)
        for (let i = -1; i <= 1; i++) {
          const k = wrap(cy + j) * cells + wrap(cx + i);
          const dd = Math.hypot(cx + i + pts[k][0] - u, cy + j + pts[k][1] - v);
          if (dd < f1) {
            f2 = f1;
            f1 = dd;
          } else if (dd < f2) f2 = dd;
        }
      const fx = u - cx;
      const fy = v - cy;
      const sx = fx * fx * (3 - 2 * fx);
      const sy = fy * fy * (3 - 2 * fy);
      const at = (i: number, j: number) => val[wrap(cy + j) * cells + wrap(cx + i)];
      const nz = (at(0, 0) * (1 - sx) + at(1, 0) * sx) * (1 - sy) + (at(0, 1) * (1 - sx) + at(1, 1) * sx) * sy;
      const o = (y * size + x) * 4;
      data[o] = 255 * (1 - Math.min(1, (f2 - f1) / 0.18));
      data[o + 1] = 255 * nz;
      data[o + 2] = 255 * Math.min(1, f1 / 0.7);
      data[o + 3] = 255;
    }
  const tex = new DataTexture(data, size, size);
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.magFilter = LinearFilter;
  tex.minFilter = LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}

const vertexShader = /* glsl */ `
#include <common>
#include <fog_pars_vertex>
varying vec3 vWorld;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  vec4 mvPosition = viewMatrix * world;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const fragmentShader = /* glsl */ `
#include <common>
#include <fog_pars_fragment>
uniform sampler2D uShore, uNoise;
uniform vec3 uShallow, uBase, uDeep, uFoam, uShallowN, uBaseN, uDeepN, uFoamN;
uniform vec3 uTop, uHaze, uFog, uSunDir;
uniform float uTime, uNight;
varying vec3 vWorld;

vec3 skyIn(vec3 r) {
  vec3 up = mix(uHaze, uTop, pow(clamp(r.y * 1.8, 0.0, 1.0), 0.7));
  return r.y >= 0.0 ? up : uFog;
}

void main() {
  vec2 p = vWorld.xz;
  float t = uTime;
  float d = mix(${SHORE.near.toFixed(1)}, ${SHORE.far.toFixed(1)}, texture2D(uShore, (p - vec2(${SHORE.x0.toFixed(1)}, ${SHORE.z0.toFixed(1)})) / ${SHORE.size.toFixed(1)}).r);

  vec4 n1 = texture2D(uNoise, p * 0.045 + vec2(t * 0.012, t * 0.007));
  vec4 n2 = texture2D(uNoise, p * 0.060 - vec2(t * 0.009, -t * 0.011));
  vec2 slope = (vec2(n1.g, n2.g) - 0.5) * 0.35;
  vec3 N = normalize(vec3(slope.x, 1.0, slope.y));
  vec3 V = normalize(cameraPosition - vWorld);
  float ndv = max(dot(N, V), 0.0);

  vec3 shallow = mix(uShallow, uShallowN, uNight);
  vec3 base = mix(uBase, uBaseN, uNight);
  vec3 deep = mix(uDeep, uDeepN, uNight);
  vec3 foamC = mix(uFoam, uFoamN, uNight);

  // distance from shore stands in for depth
  vec3 col = mix(shallow, base, smoothstep(0.6, 7.0, d));
  col = mix(col, deep, smoothstep(12.0, 45.0, d));

  // cel sparkles where two voronoi nets cross, denser in the shallows
  float cells = n1.r * n2.r;
  float sparkle = step(0.55 - 0.25 * (1.0 - smoothstep(0.0, 6.0, d)), cells);
  col = mix(col, mix(shallow, vec3(1.0), 0.6), sparkle * 0.45 * (1.0 - 0.5 * uNight));

  // the sky at grazing angles, so the far sea melts into the haze like GO
  vec3 R = reflect(-V, N);
  float F = 0.02 + 0.98 * pow(1.0 - ndv, 5.0);
  col = mix(col, skyIn(R), clamp(F * 1.4, 0.0, 0.8));

  // the sun's glitter path
  float path = pow(max(dot(R, uSunDir), 0.0), 24.0);
  float flick = step(0.82, texture2D(uNoise, p * 0.35 + t * vec2(0.05, 0.03)).r);
  col += vec3(1.0, 0.97, 0.88) * path * flick * (1.0 - uNight);

  // foam: the breathing edge, plus a broken wave line rolling in every few seconds
  float edge = 1.0 - smoothstep(0.0, 0.2, d - (0.45 + 0.3 * sin(t * 1.3 + n1.g * 6.28) + 0.2 * n2.g));
  float phase = fract(t * 0.18 + n1.g * 0.25);
  float wave = 1.0 - smoothstep(0.0, 0.3, abs(d - mix(5.5, 0.4, phase)));
  wave *= smoothstep(0.0, 0.1, phase) * (1.0 - phase) * step(0.35, n2.g);
  col = mix(col, foamC, max(edge, wave * 0.85));

  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;

const color = (hex: string) => ({ value: new Color(hex) });

/** The water, drawn in its place in the ground's stack (no depth, like every ground layer). */
export function Water({ renderOrder }: { renderOrder: number }) {
  const { geometry, material } = useMemo(() => {
    const uniforms = UniformsUtils.merge([
      UniformsLib.fog,
      {
        uShore: { value: null },
        uNoise: { value: null },
        uShallow: color("#8fe6f4"),
        uBase: color("#58c6ec"),
        uDeep: color("#3a9fe0"),
        uFoam: color("#ffffff"),
        uShallowN: color("#24427e"),
        uBaseN: color("#1c4f8f"),
        uDeepN: color("#0f1e48"),
        uFoamN: color("#8fb0ff"),
      },
    ]);
    // shared by reference (merge clones), so the sky and time of day reach the water
    uniforms.uShore.value = bakeShore();
    uniforms.uNoise.value = bakeNoise();
    Object.assign(uniforms, {
      uTop: skyLook.uTop,
      uHaze: skyLook.uHaze,
      uFog: skyLook.uFog,
      uSunDir: skyLook.uSunDir,
      uTime: skyLook.uTime,
      uNight: skyLook.uNight,
    });
    const m = new ShaderMaterial({ uniforms, vertexShader, fragmentShader, fog: true, depthTest: false, depthWrite: false, side: DoubleSide });
    return { geometry: polygonGeometry(areas.filter((a) => a.kind === "water").map((a) => a.points)), material: m };
  }, []);
  return <mesh geometry={geometry} material={material} renderOrder={renderOrder} />;
}
