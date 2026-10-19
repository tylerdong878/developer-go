"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import {
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  NormalBlending,
  ShaderMaterial,
  Vector3,
} from "three";
import { random } from "../geometry";
import { game } from "../state";
import type { Weather } from "../weather";
import { skyLook } from "./Sky";

/*
 * Rain and snow, like GO's (notes/research/gfx-art-direction.md 8.1-8.3):
 * short, nearly vertical streaks with rings splashing on the ground, or soft
 * flakes drifting down. Every drop moves in the shader, in a box that's fixed
 * to the world and wraps round the trainer, so nothing is updated per frame
 * but a few uniforms, and weather changes just fade the amount.
 */

const shared = {
  uTime: skyLook.uTime,
  uCenter: { value: new Vector3() },
  uRain: { value: 0 },
  uSnow: { value: 0 },
  uNight: skyLook.uNight,
  uPixel: { value: 1 },
};

const HASH = /* glsl */ `
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 wrapXZ(vec2 base, float box) { return uCenter.xz + mod(base - uCenter.xz + 0.5 * box, box) - 0.5 * box; }`;

function seeds(n: number, seed: number) {
  const rand = random(seed);
  const a = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) a.set([rand(), rand(), rand(), (i + 0.5) / n], i * 4);
  return new InstancedBufferAttribute(a, 4);
}

function quad(rows: [number, number][]) {
  const g = new InstancedBufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(rows.flatMap(([x, y]) => [x, y, 0]), 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  return g;
}

function rain(n: number) {
  const g = quad([
    [-0.5, 0],
    [0.5, 0],
    [0.5, 1],
    [-0.5, 1],
  ]);
  g.setAttribute("aSeed", seeds(n, 11));
  g.instanceCount = n;
  const m = new ShaderMaterial({
    uniforms: { ...shared, uColor: { value: new Color("#e6f2ff") } },
    vertexShader: /* glsl */ `
      uniform float uTime, uRain; uniform vec3 uCenter;
      attribute vec4 aSeed; varying float vA; varying float vV;
      ${HASH}
      void main() {
        if (aSeed.w > uRain) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
        float top = 16.0, box = 40.0;
        float fall = fract(aSeed.y - uTime * 14.0 / top);
        vec2 xz = wrapXZ(aSeed.xz * box, box);
        vec3 dir = normalize(vec3(0.08, -1.0, 0.04));
        vec3 p = vec3(xz.x, fall * top, xz.y) - vec3(0.08, 0.0, 0.04) * fall * top;
        vec3 side = normalize(cross(dir, cameraPosition - p));
        vec3 w = p + side * position.x * 0.06 - dir * position.y * 0.9;
        float near = smoothstep(2.0, 5.0, distance(w, cameraPosition));
        vA = smoothstep(0.0, 0.06, fall) * (1.0 - smoothstep(0.8, 1.0, fall)) * near;
        vV = position.y;
        gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uNight; varying float vA; varying float vV;
      void main() { gl_FragColor = vec4(uColor, mix(0.55, 0.4, uNight) * vA * (1.0 - vV)); }`,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: NormalBlending,
  });
  return { g, m };
}

function ripples(n: number) {
  const g = quad([
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ]);
  g.setAttribute("aSeed", seeds(n, 23));
  g.instanceCount = n;
  const m = new ShaderMaterial({
    uniforms: shared,
    vertexShader: /* glsl */ `
      uniform float uTime, uRain; uniform vec3 uCenter;
      attribute vec4 aSeed; varying vec2 vUv; varying float vPh;
      ${HASH}
      void main() {
        if (aSeed.w > uRain) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
        float cyc = uTime * 1.7 + aSeed.y; float k = floor(cyc); vPh = fract(cyc);
        vec2 spot = vec2(hash12(vec2(k, aSeed.x * 91.0)), hash12(vec2(aSeed.x * 37.0, k + 7.0))) - 0.5;
        vec2 xz = uCenter.xz + spot * 24.0;
        vUv = position.xy;
        gl_Position = projectionMatrix * viewMatrix * vec4(xz.x + position.x * 0.4, 0.03, xz.y + position.y * 0.4, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uNight; varying vec2 vUv; varying float vPh;
      void main() {
        float r = length(vUv), ring = 1.0 - smoothstep(0.0, 0.1, abs(r - vPh * 0.9));
        gl_FragColor = vec4(vec3(0.92, 0.96, 1.0), ring * (1.0 - vPh) * mix(0.6, 0.4, uNight));
      }`,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
  });
  return { g, m };
}

function snow(n: number) {
  const rand = random(31);
  const g = new BufferGeometry();
  const seed = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) seed.set([rand(), rand(), rand(), (i + 0.5) / n], i * 4);
  g.setAttribute("position", new Float32BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute("aSeed", new Float32BufferAttribute(seed, 4));
  const m = new ShaderMaterial({
    uniforms: shared,
    vertexShader: /* glsl */ `
      uniform float uTime, uSnow, uPixel; uniform vec3 uCenter;
      attribute vec4 aSeed; varying float vA;
      ${HASH}
      void main() {
        if (aSeed.w > uSnow) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; return; }
        float top = 14.0, box = 36.0;
        float fall = fract(aSeed.y - uTime * 0.9 / top);
        vec2 xz = wrapXZ(aSeed.xz * box, box) + vec2(sin(uTime * 1.3 + aSeed.x * 6.3), cos(uTime * 1.1 + aSeed.z * 6.3)) * 0.35;
        vec4 mv = viewMatrix * vec4(xz.x, fall * top, xz.y, 1.0);
        vA = smoothstep(0.0, 0.08, fall) * (1.0 - smoothstep(0.85, 1.0, fall));
        gl_PointSize = clamp(0.09 * uPixel * 600.0 / -mv.z, 2.0, 14.0);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uNight; varying float vA;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        gl_FragColor = vec4(mix(vec3(1.0), vec3(0.87, 0.9, 1.0), uNight), (1.0 - smoothstep(0.3, 0.5, d)) * 0.9 * vA);
      }`,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
  });
  return { g, m };
}

export function WeatherFx({ weather, light }: { weather: Weather; light: boolean }) {
  const fx = useMemo(() => ({ rain: rain(light ? 700 : 2000), ripples: ripples(light ? 50 : 120), snow: snow(light ? 500 : 1200) }), [light]);
  useFrame(({ gl }, dt) => {
    const k = 1 - Math.exp(-0.5 * dt);
    const { x, z } = game.player.trainer.position;
    shared.uCenter.value.set(x, 0, z);
    shared.uRain.value += ((weather === "rain" ? 1 : 0) - shared.uRain.value) * k;
    shared.uSnow.value += ((weather === "snow" ? 1 : 0) - shared.uSnow.value) * k;
    shared.uPixel.value = gl.getPixelRatio();
  });
  return (
    <>
      <mesh geometry={fx.rain.g} material={fx.rain.m} frustumCulled={false} renderOrder={5} />
      <mesh geometry={fx.ripples.g} material={fx.ripples.m} frustumCulled={false} renderOrder={-5} />
      <points geometry={fx.snow.g} material={fx.snow.m} frustumCulled={false} renderOrder={5} />
    </>
  );
}
