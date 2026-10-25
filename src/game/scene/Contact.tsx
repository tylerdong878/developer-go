"use client";

import { BufferGeometry, Color, Float32BufferAttribute, MultiplyBlending, ShaderMaterial } from "three";
import { buildings } from "../base";

/*
 * Ground contact (notes/research/town-polish.md 6): a soft shade on the
 * ground round the foot of every building, darkest at the wall and gone 1.6 m
 * out, so nothing looks set down on the lawn. One quad per building, all in one
 * mesh, multiplied onto the ground before anything stands on it. One draw, no
 * shadow map.
 */

const REACH = 1.6;

const geometry = (() => {
  const pos: number[] = [];
  const local: number[] = [];
  const half: number[] = [];
  const index: number[] = [];
  for (const b of buildings) {
    const hx = b.w / 2;
    const hz = b.d / 2;
    const base = pos.length / 3;
    for (const [sx, sz] of [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ]) {
      const lx = sx * (hx + REACH);
      const lz = sz * (hz + REACH);
      pos.push(b.x + lx, 0.01, b.z + lz);
      local.push(lx, lz);
      half.push(hx, hz);
    }
    index.push(base, base + 2, base + 1, base, base + 3, base + 2);
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setAttribute("aLocal", new Float32BufferAttribute(local, 2));
  g.setAttribute("aHalf", new Float32BufferAttribute(half, 2));
  g.setIndex(index);
  g.computeBoundingSphere();
  return g;
})();

const material = new ShaderMaterial({
  uniforms: { uTint: { value: new Color(0.78, 0.8, 0.9) } },
  vertexShader: /* glsl */ `
attribute vec2 aLocal;
attribute vec2 aHalf;
varying vec2 vLocal;
varying vec2 vHalf;
void main() {
  vLocal = aLocal;
  vHalf = aHalf;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,
  fragmentShader: /* glsl */ `
uniform vec3 uTint;
varying vec2 vLocal;
varying vec2 vHalf;
void main() {
  // a rounded box's distance: 0 at the wall, growing outward
  vec2 q = abs(vLocal) - (vHalf - 0.3);
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - 0.3;
  float ao = (1.0 - smoothstep(0.0, ${REACH.toFixed(1)}, d)) * step(-0.05, d);
  gl_FragColor = vec4(mix(vec3(1.0), uTint, ao * ao * 0.85), 1.0);
}`,
  // multiplied onto what's under it; not "transparent", so it draws in order with the ground layers, under everything else
  blending: MultiplyBlending,
  premultipliedAlpha: true,
  depthTest: false,
  depthWrite: false,
});

export function Contact({ renderOrder }: { renderOrder: number }) {
  return <mesh geometry={geometry} material={material} renderOrder={renderOrder} frustumCulled={false} />;
}
