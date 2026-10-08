"use client";

import { useFrame, useLoader } from "@react-three/fiber";
import { Component, type ReactNode, Suspense, useLayoutEffect, useMemo, useRef } from "react";
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
  type Mesh,
  MeshLambertMaterial,
  NearestFilter,
  Quaternion,
  type Texture,
  Vector3,
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { buildings } from "../base";
import { type Building, type ModelId, MODELS } from "../lots";
import { PokeMart, PokemonCenter } from "./civic/Civic";
import { fade, TownTracker, town } from "./fade";

/**
 * A Lambert material with two extras for the town: buildings fade out (as a
 * dither, so nothing needs sorting) when they stand between the camera and
 * the trainer, and after dark, glass glows warm. On the Kenney models the
 * glass is found by its color in the texture; house windows are marked glass.
 */
function townMaterial({ map, glass = false }: { map?: Texture; glass?: boolean }) {
  const material = new MeshLambertMaterial({ color: "#ffffff", alphaHash: true });
  if (map) {
    // Kenney's models share one small palette texture: sample it crisp, or colors bleed into gray.
    map.minFilter = NearestFilter;
    map.magFilter = NearestFilter;
    map.generateMipmaps = false;
    map.needsUpdate = true;
    material.map = map;
  }
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uNight = town.uNight;
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
float townHash(vec3 p) { return fract(sin(dot(floor(p * 0.4), vec3(127.1, 311.7, 74.7))) * 43758.5453); }`,
      )
      .replace("#include <color_fragment>", "#include <color_fragment>\ndiffuseColor.a *= vFade;")
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
{
  ${glass ? "float isGlass = 1.0;" : map ? "vec3 c = diffuseColor.rgb; float isGlass = step(0.5, c.b) * step(0.1, c.b - c.r);" : "float isGlass = 0.0;"}
  float lit = step(0.35, townHash(vTown));
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.16, 0.2, 0.32), uNight * isGlass);
  totalEmissiveRadiance += uNight * isGlass * lit * vec3(1.0, 0.78, 0.45);
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
/** The skirt roof's shape: a square frustum (a truncated pyramid), unit size, standing on y = 0. */
const frustum = new CylinderGeometry(0.8 / Math.SQRT2, 1 / Math.SQRT2, 1, 4, 1).rotateY(Math.PI / 4).translate(0, 0.5, 0);
const HOUSE_PARTS: Record<string, BufferGeometry> = {
  base: box,
  walls: box,
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

const OFFICE_MODELS = [...new Set(buildings.map((b) => b.model).filter((m): m is ModelId => m in MODELS))];
const urls = OFFICE_MODELS.map((m) => `/models/${m}.glb`);

/** The offices and towers: Kenney's city kit models, one instanced mesh per model. */
function Offices() {
  const gltfs = useLoader(GLTFLoader, urls, (loader) => loader.setMeshoptDecoder(MeshoptDecoder));
  const layers = useMemo(
    () =>
      OFFICE_MODELS.map((model, j) => {
        let mesh: Mesh | null = null;
        gltfs[j].scene.traverse((o) => {
          if (!mesh && (o as Mesh).isMesh) mesh = o as Mesh;
        });
        const found = mesh as Mesh | null;
        const geometry = found ? found.geometry.clone().applyMatrix4(found.matrixWorld) : box;
        const map = found ? ((found.material as MeshLambertMaterial).map ?? undefined) : undefined;
        const pieces: Piece[] = [];
        buildings.forEach((b, i) => {
          if (b.model !== model) return;
          pieces.push({ b: i, m: placeOf(b).multiply(new Matrix4().makeScale(b.scale, b.scale, b.scale)), color: b.color });
        });
        return { model, geometry, material: townMaterial({ map }), pieces };
      }),
    [gltfs],
  );
  return (
    <>
      {layers.map((l) => (
        <Layer key={l.model} geometry={l.geometry} material={l.material} pieces={l.pieces} />
      ))}
    </>
  );
}

function Houses() {
  const parts = useMemo(() => {
    const pieces = housePieces();
    const plain = townMaterial({});
    const glass = townMaterial({ glass: true });
    return Object.entries(pieces).map(([part, list]) => ({ part, list, material: part === "glass" ? glass : plain }));
  }, []);
  return (
    <>
      {parts.map(({ part, list, material }) => (
        <Layer key={part} geometry={HOUSE_PARTS[part]} material={material} pieces={list} />
      ))}
    </>
  );
}

/** If the office models can't load (offline, blocked), the town goes on without them instead of the whole game failing. */
class SkipOnError extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * The neighborhood: Pokémon-town houses built from parts, and offices and
 * towers from Kenney's city kit, all instanced. After dark, windows light up.
 */
export function Buildings({ night }: { night: boolean }) {
  return (
    <>
      <TownTracker night={night} />
      <Houses />
      <PokemonCenter />
      <PokeMart />
      <SkipOnError>
        <Suspense fallback={null}>
          <Offices />
        </Suspense>
      </SkipOnError>
    </>
  );
}
