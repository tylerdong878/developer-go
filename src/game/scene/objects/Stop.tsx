"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef, useSyncExternalStore } from "react";
import {
  BoxGeometry,
  Color,
  DoubleSide,
  ExtrudeGeometry,
  type Group,
  type InstancedMesh,
  LatheGeometry,
  MeshLambertMaterial,
  Object3D,
  Path,
  Shape,
  ShapeGeometry,
  Vector2,
} from "three";
import type { Stop as StopContent } from "@/content";
import { LURE } from "../../colors";
import { progressStore } from "../../progress";
import { game } from "../../state";
import { REACH } from "../Rings";
import { Shadow } from "../Shadow";
import { Nameplate } from "./Nameplate";
import { hover, tapObject } from "./tap";

/*
 * GO's PokéStop in its current (2022+) tall style, from captures and the
 * Power-Up art (notes/research/gfx-go-gyms-stops.md 2.x): a hair-thin cyan
 * pole on a round foot, a shallow bowl, and a sharp cube tipped on its
 * corner, its faces in three shades so it reads as a gem. Step into reach
 * and the cube unfolds into the upright Photo Disc, a ring with a Poké Ball
 * emblem, turned to face you. Built in pole units and scaled to 1.6 tall.
 *
 * Never-visited stops wear the thin white ring. Spun stops go purple, all of
 * them. Featured projects are lured: a falling, swirling column of petals.
 */

const S = 1.6;
const BLUE = { base: "#04acfc", lit: "#2ce4fc", lip: "#38f8f8", bowl: "#1898f8", notch: "#1868c8", faces: ["#04a4fc", "#2ce4fc", "#0494fc"] };
const PURPLE = { base: "#b454fc", lit: "#c98cfc", lip: "#d7a8fd", bowl: "#9c48e8", notch: "#6a2cb8", faces: ["#ac44fc", "#c98cfc", "#9a3cf0"] };
type Look = typeof BLUE;

/** An annulus sector, extruded, centered on its depth. */
function ring(r0: number, r1: number, depth: number, start = 0, len = Math.PI * 2) {
  const s = new Shape();
  s.absarc(0, 0, r1, start, start + len, false);
  if (len >= Math.PI * 2 - 1e-6) {
    if (r0 > 0) s.holes.push(new Path().absarc(0, 0, r0, 0, Math.PI * 2, true));
  } else {
    s.absarc(0, 0, r0, start + len, start, true);
    s.closePath();
  }
  return new ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 48 }).translate(0, 0, -depth / 2);
}
const deg = (d: number) => (d * Math.PI) / 180;

/** The Photo Disc's pieces: the thick ring, four orbiting arcs, the two emblem halves with an empty belt, the button. */
const DISC = (() => {
  const halfTop = ring(0.18, 0.36, 0.06, 0, Math.PI).translate(0, 0.035, 0);
  const halfBottom = ring(0.18, 0.36, 0.06, Math.PI, Math.PI).translate(0, -0.035, 0);
  return [
    ring(0.5, 0.575, 0.05),
    ring(0.6, 0.63, 0.03, deg(30), deg(45)),
    ring(0.6, 0.63, 0.03, deg(200), deg(50)),
    ring(0.43, 0.46, 0.03, deg(95), deg(65)),
    ring(0.43, 0.46, 0.03, deg(285), deg(45)),
    halfTop,
    halfBottom,
    ring(0.1, 0.15, 0.07),
    ring(0, 0.075, 0.09),
  ];
})();
const bowl = new LatheGeometry(
  [
    [0.02, -0.22],
    [0.08, -0.19],
    [0.15, -0.13],
    [0.2, -0.06],
    [0.225, 0],
  ].map(([r, y]) => new Vector2(r, y)),
  40,
);
const cubeGeometry = new BoxGeometry(0.3, 0.3, 0.3);
const petal = (() => {
  const s = new Shape();
  s.moveTo(0, -0.5);
  s.bezierCurveTo(0.55, -0.1, 0.45, 0.5, 0, 0.3);
  s.bezierCurveTo(-0.45, 0.5, -0.55, -0.1, 0, -0.5);
  return new ShapeGeometry(s, 6);
})();

/** Materials per look, made once and shared by every stop. */
const looks = new Map<Look, { base: MeshLambertMaterial; lip: MeshLambertMaterial; bowl: MeshLambertMaterial; notch: MeshLambertMaterial; disc: MeshLambertMaterial; faces: MeshLambertMaterial[] }>();
function materials(look: Look) {
  let m = looks.get(look);
  if (!m) {
    const glow = (c: string, k: number) => new MeshLambertMaterial({ color: c, emissive: c, emissiveIntensity: k });
    const faces = look.faces.map((c) => glow(c, 0.28));
    m = {
      base: glow(look.lit, 0.18),
      lip: glow(look.lip, 0.3),
      bowl: glow(look.bowl, 0.12),
      notch: new MeshLambertMaterial({ color: look.notch }),
      disc: glow(look.lit, 0.32),
      // BoxGeometry's faces: +x, -x, +y, -y, +z, -z
      faces: [faces[0], faces[0], faces[1], faces[1], faces[2], faces[2]],
    };
    looks.set(look, m);
  }
  return m;
}

const PETALS = 40;
const PETAL_COLORS = ["#fcbcf4", "#fc9cf4", "#fc5cec"].map((c) => new Color(c));
const dummy = new Object3D();

/** A Normal Lure: petals falling and swirling in a column round the stop, respawning at the top. */
function Lure({ seed }: { seed: number }) {
  const mesh = useRef<InstancedMesh>(null);
  const motes = useMemo(
    () =>
      Array.from({ length: PETALS }, (_, i) => {
        const h = Math.sin((i + 1) * 12.9898 + seed) * 43758.5453;
        const r = h - Math.floor(h);
        return { a: (i / PETALS) * Math.PI * 2, r: 0.9 + r * 0.9, speed: 0.32 + r * 0.22, phase: r * 10, size: 0.07 + r * 0.06, spin: 1 + r * 3 };
      }),
    [seed],
  );
  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    motes.forEach((_, i) => m.setColorAt(i, PETAL_COLORS[i % PETAL_COLORS.length]));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [motes]);
  useFrame(({ clock }) => {
    const m = mesh.current;
    if (!m) return;
    const t = clock.elapsedTime;
    motes.forEach((p, i) => {
      const fall = ((t * p.speed + p.phase) % 3.4) / 3.4;
      const a = p.a + t * 0.35;
      dummy.position.set(Math.cos(a) * p.r + Math.sin(t * 1.3 + p.phase) * 0.12, 3.9 - fall * 3.7, Math.sin(a) * p.r);
      dummy.rotation.set(t * p.spin, t * p.spin * 0.7, p.phase);
      dummy.scale.setScalar(p.size * (fall < 0.08 ? fall / 0.08 : 1));
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[petal, undefined, PETALS]} frustumCulled={false}>
      <meshBasicMaterial side={DoubleSide} />
    </instancedMesh>
  );
}

export function Stop({ stop, x, z }: { stop: StopContent; x: number; z: number }) {
  const cube = useRef<Group>(null);
  const disc = useRef<Group>(null);
  const ringRef = useRef<Group>(null);
  const open = useRef(0);
  const progress = useSyncExternalStore(progressStore.subscribe, progressStore.get, progressStore.server);
  const spun = progress.spun.includes(stop.slug);
  const fresh = !spun && !progress.visited.includes(stop.slug);
  const m = materials(spun ? PURPLE : BLUE);

  useFrame(({ clock, camera }, dt) => {
    const t = clock.elapsedTime + x * 0.21;
    const { position } = game.player.trainer;
    const near = Math.hypot(position.x - x, position.z - z) < REACH;
    open.current += ((near ? 1 : 0) - open.current) * (1 - Math.exp(-7 * dt));
    const o = open.current;
    // the cube shrinks away as the disc grows in, with a little overshoot
    const grow = o < 0.999 ? 1 + 2.2 * Math.pow(o - 1, 3) + 1.2 * Math.pow(o - 1, 2) : 1;
    if (cube.current) {
      cube.current.rotation.y = t * 1.8;
      cube.current.scale.setScalar(Math.max(0.0001, 1 - o));
      cube.current.position.y = 1.65 + Math.sin(t * 1.6) * 0.02;
    }
    if (disc.current) {
      disc.current.scale.setScalar(Math.max(0.0001, grow));
      disc.current.visible = o > 0.01;
      // the disc faces the player (yaw only), drifting a little
      disc.current.rotation.y = Math.atan2(camera.position.x - x, camera.position.z - z) + Math.sin(t * 0.8) * 0.12;
    }
    if (ringRef.current) ringRef.current.rotation.z = t * 0.2;
  });

  return (
    <group position={[x, 0, z]}>
      <group onClick={tapObject(stop.slug)} {...hover}>
        <Shadow size={1.5} opacity={0.45} />
        <group scale={S}>
          {/* the foot and the hair-thin pole */}
          <mesh position-y={0.01} material={m.base}>
            <cylinderGeometry args={[0.11, 0.11, 0.02, 32]} />
          </mesh>
          <mesh position-y={0.6} material={m.base}>
            <cylinderGeometry args={[0.018, 0.018, 1.2, 10]} />
          </mesh>
          {/* the shallow bowl, with its dark notches */}
          <group position-y={1.2}>
            <mesh material={m.lip}>
              <cylinderGeometry args={[0.225, 0.225, 0.035, 40]} />
            </mesh>
            <mesh geometry={bowl} material={m.bowl} position-y={-0.0175} />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <group key={i} rotation-y={(i / 6) * Math.PI * 2}>
                <mesh position={[0, 0, 0.226]} material={m.notch}>
                  <boxGeometry args={[0.05, 0.02, 0.01]} />
                </mesh>
              </group>
            ))}
          </group>
          {/* the cube: sharp, tipped on its corner, turning */}
          <group ref={cube} position-y={1.65}>
            <mesh geometry={cubeGeometry} material={m.faces} rotation={[0.615, 0, Math.PI / 4]} />
            {fresh ? (
              <group ref={ringRef} rotation-x={Math.PI / 2}>
                <mesh>
                  <torusGeometry args={[0.57, 0.012, 6, 72]} />
                  <meshLambertMaterial color="#ffffff" emissive="#2ce4fc" emissiveIntensity={0.6} />
                </mesh>
              </group>
            ) : null}
          </group>
          {/* the Photo Disc */}
          <group ref={disc} position-y={1.95} visible={false}>
            {DISC.map((g, i) => (
              <mesh key={i} geometry={g} material={m.disc} />
            ))}
          </group>
        </group>
      </group>
      {stop.featured ? <Lure seed={x + z} /> : null}
      <Nameplate text={shortName(stop.name)} accent={stop.featured ? LURE : BLUE.base} x={x} z={z} y={4.7} />
    </group>
  );
}

/** Long project names get their short form on the map. */
function shortName(name: string) {
  const short: Record<string, string> = {
    "ETF Market Intelligence Pipeline": "ETF Pipeline",
    "Order Flow Imbalance Across Volatility Regimes": "Order Flow Study",
    "Limit Order Book Matching Engine": "Matching Engine",
    "NBA Player Consistency Analyzer": "NBA Analyzer",
    "Spotify Playlist Updater": "Playlist Updater",
  };
  return short[name] ?? name;
}
