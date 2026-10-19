"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  type Group,
  type InstancedMesh,
  LatheGeometry,
  type Mesh,
  type MeshBasicMaterial,
  type MeshLambertMaterial,
  Object3D,
  SRGBColorSpace,
  ShaderMaterial,
  SphereGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { raids } from "@/content";
import { slots } from "../base";
import { town } from "./fade";
import { SmoothModel } from "./pokemon/Smooth";
import { skyLook } from "./Sky";

/*
 * The town's sights (notes/research/gfx-landmarks.md): a Celadon fountain in
 * the roundabout with a real jet, Vermilion's harbor kit along the quay
 * (mushroom bollards, sagging gold rope, bunting over the pier, beacon
 * towers at the deck), a squat Olivine-shaped lighthouse with Hulbury's red
 * bands and a sweeping night beam, and at every raid a Paldea battle court
 * inside Legends Z-A's red holographic fence. Gulls wheel over the water.
 */

const night = () => town.uNight.value;

/* ---------------- the fountain ---------------- */

const DROPS = 60;
const dummy = new Object3D();

function Fountain() {
  const drops = useRef<InstancedMesh>(null);
  const jet = useRef<Mesh>(null);
  const water = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { uTime: skyLook.uTime, uNight: town.uNight, uDay: { value: new Color("#8fd3ea") }, uDark: { value: new Color("#2c5c8f") } },
        vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `uniform float uTime, uNight; uniform vec3 uDay, uDark; varying vec2 vUv;
          void main() {
            float d = length(vUv - 0.5) * 2.0;
            vec3 c = mix(uDay, uDark, uNight);
            float ripple = step(fract(d * 3.5 - uTime * 0.6), 0.06) * (1.0 - d);
            float foam = smoothstep(0.9, 1.0, d);
            c = mix(c, vec3(1.0), max(ripple * 0.6, foam * 0.7));
            gl_FragColor = vec4(c, 1.0);
            #include <colorspace_fragment>
          }`,
      }),
    [],
  );
  const shape = useMemo(() => {
    const wall = new LatheGeometry(
      [
        [3.0, 0],
        [3.0, 0.6],
        [2.55, 0.6],
        [2.55, 0],
      ].map(([r, y]) => new Vector2(r, y)),
      12,
    );
    const rim = new LatheGeometry(
      [
        [3.08, 0.6],
        [3.08, 0.68],
        [2.5, 0.68],
        [2.5, 0.6],
      ].map(([r, y]) => new Vector2(r, y)),
      12,
    );
    return { wall, rim, jet: new CylinderGeometry(0.07, 0.28, 2.5, 10, 1, true) };
  }, []);
  const motes = useMemo(
    () => Array.from({ length: DROPS }, (_, i) => ({ a: (i / DROPS) * Math.PI * 2 + Math.sin(i * 7.1) * 0.2, out: 1.0 + ((i * 37) % 13) / 20, phase: ((i * 53) % 17) / 17 })),
    [],
  );
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const m = drops.current;
    if (m) {
      motes.forEach((p, i) => {
        // a parabola from the top of the jet out to the water, on a loop
        const k = (t * 0.9 + p.phase) % 1;
        const r = 0.2 + p.out * k;
        dummy.position.set(Math.cos(p.a) * r, 3.3 + 2.4 * k - 5.3 * k * k, Math.sin(p.a) * r);
        dummy.scale.setScalar(0.07 + 0.05 * (1 - k));
        dummy.updateMatrix();
        m.setMatrixAt(i, dummy.matrix);
      });
      m.instanceMatrix.needsUpdate = true;
    }
    if (jet.current) jet.current.scale.set(1 + Math.sin(t * 9) * 0.04, 1 + Math.sin(t * 5.3) * 0.03, 1 + Math.cos(t * 8) * 0.04);
  });
  return (
    <group>
      {/* the sand ring round the basin */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.005} renderOrder={-31}>
        <ringGeometry args={[3.0, 4.4, 48]} />
        <meshBasicMaterial color="#dccf9e" depthTest={false} depthWrite={false} />
      </mesh>
      <mesh geometry={shape.wall} castShadow receiveShadow>
        <meshLambertMaterial color="#d2c4a2" flatShading />
      </mesh>
      <mesh geometry={shape.rim} castShadow>
        <meshLambertMaterial color="#ecdfc0" flatShading />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.42} material={water}>
        <circleGeometry args={[2.56, 40]} />
      </mesh>
      <mesh position-y={0.45} castShadow>
        <cylinderGeometry args={[0.35, 0.55, 0.9, 12]} />
        <meshLambertMaterial color="#ecdfc0" />
      </mesh>
      <mesh position-y={0.95}>
        <cylinderGeometry args={[0.9, 0.5, 0.2, 16]} />
        <meshLambertMaterial color="#ecdfc0" />
      </mesh>
      <mesh ref={jet} geometry={shape.jet} position-y={2.15}>
        <meshLambertMaterial color="#ffffff" emissive="#dff6ff" emissiveIntensity={0.3} transparent opacity={0.82} depthWrite={false} />
      </mesh>
      <instancedMesh ref={drops} args={[undefined, undefined, DROPS]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 0]} />
        <meshLambertMaterial color="#ffffff" emissive="#dff6ff" emissiveIntensity={0.3} />
      </instancedMesh>
    </group>
  );
}

/* ---------------- the harbor ---------------- */

/** The quay edge along the harbor walk, and where bollards go on it (skipping the pier). */
const QUAY_X = 81.35;
const BOLLARDS = Array.from({ length: 45 }, (_, i) => -132 + i * 6).filter((z) => Math.abs(z) > 4);

function HarborKit() {
  const bollards = useRef<InstancedMesh>(null);
  const posts = useRef<InstancedMesh>(null);
  const pennants = useRef<InstancedMesh>(null);
  const kit = useMemo(() => {
    const bollard = mergeGeometries([new CylinderGeometry(0.26, 0.3, 0.42, 12).translate(0, 0.21, 0), new SphereGeometry(0.3, 12, 8).scale(1, 0.55, 1).translate(0, 0.44, 0)]);
    const post = mergeGeometries([new CylinderGeometry(0.05, 0.05, 0.8, 6).translate(0, 0.4, 0), new SphereGeometry(0.08, 8, 6).translate(0, 0.84, 0)]);
    // the rope: one merged tube, sagging between every pair of posts
    const postAt: number[] = [];
    for (let i = 0; i < BOLLARDS.length - 1; i++) {
      if (BOLLARDS[i + 1] - BOLLARDS[i] > 6.5) continue;
      for (let k = 1; k <= 3; k++) postAt.push(BOLLARDS[i] + k * 1.5);
    }
    const ropes: TubeGeometry[] = [];
    const all = [...postAt, ...BOLLARDS].sort((a, b) => a - b);
    for (let i = 0; i < all.length - 1; i++) {
      const [a, b] = [all[i], all[i + 1]];
      if (b - a > 2) continue;
      const curve = new CatmullRomCurve3([new Vector3(QUAY_X, 0.82, a), new Vector3(QUAY_X, 0.67, (a + b) / 2), new Vector3(QUAY_X, 0.82, b)]);
      ropes.push(new TubeGeometry(curve, 6, 0.035, 5));
    }
    // bunting over the pier walk: lines zigzagging across, pennants hanging off them
    const flags: { at: Vector3; turn: number; color: string }[] = [];
    const colors = ["#f08a3c", "#3a7fd0", "#f6c94a", "#ffffff"];
    const lines: TubeGeometry[] = [];
    for (let x = 82; x < 99; x += 4.5) {
      const a = new Vector3(x, 3.4, -2.6);
      const b = new Vector3(x + 4.5, 3.4, 2.6);
      const sag = new CatmullRomCurve3([a, a.clone().lerp(b, 0.5).add(new Vector3(0, -0.6, 0)), b]);
      lines.push(new TubeGeometry(sag, 12, 0.02, 4));
      for (let k = 1; k < 12; k++) flags.push({ at: sag.getPoint(k / 12), turn: Math.atan2(b.x - a.x, b.z - a.z), color: colors[k % 4] });
    }
    const pennant = new BufferGeometry();
    pennant.setAttribute("position", new Float32BufferAttribute([-0.16, 0, 0, 0.16, 0, 0, 0, -0.42, 0], 3));
    pennant.computeVertexNormals();
    return { bollard, post, postAt, rope: mergeGeometries(ropes), bunting: mergeGeometries(lines), flags, pennant };
  }, []);

  useLayoutEffect(() => {
    BOLLARDS.forEach((z, i) => {
      dummy.position.set(QUAY_X, 0, z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      bollards.current?.setMatrixAt(i, dummy.matrix);
    });
    kit.postAt.forEach((z, i) => {
      dummy.position.set(QUAY_X, 0, z);
      dummy.updateMatrix();
      posts.current?.setMatrixAt(i, dummy.matrix);
    });
    const c = new Color();
    kit.flags.forEach((f, i) => {
      dummy.position.copy(f.at);
      dummy.rotation.set(0, f.turn, 0);
      dummy.updateMatrix();
      pennants.current?.setMatrixAt(i, dummy.matrix);
      pennants.current?.setColorAt(i, c.set(f.color));
    });
    for (const m of [bollards.current, posts.current, pennants.current]) {
      if (!m) continue;
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
      m.computeBoundingSphere();
    }
  }, [kit]);

  return (
    <group>
      <instancedMesh ref={bollards} args={[kit.bollard, undefined, BOLLARDS.length]} castShadow>
        <meshLambertMaterial color="#3a3d3b" />
      </instancedMesh>
      <instancedMesh ref={posts} args={[kit.post, undefined, kit.postAt.length]}>
        <meshLambertMaterial color="#3a3d3b" />
      </instancedMesh>
      <mesh geometry={kit.rope}>
        <meshLambertMaterial color="#c4a160" />
      </mesh>
      <mesh geometry={kit.bunting}>
        <meshLambertMaterial color="#f4f1ea" />
      </mesh>
      <instancedMesh ref={pennants} args={[kit.pennant, undefined, kit.flags.length]}>
        <meshLambertMaterial side={DoubleSide} />
      </instancedMesh>
      <Beacon at={[112.8, -5.6]} color="#3fd27a" phase={0} />
      <Beacon at={[112.8, 5.6]} color="#ff4a4a" phase={1} />
    </group>
  );
}

/** A white beacon tower at the deck's outer corner; at night its glass ring blinks green or red. */
function Beacon({ at, color, phase }: { at: [number, number]; color: string; phase: number }) {
  const glass = useRef<MeshLambertMaterial>(null);
  useFrame(({ clock }) => {
    if (!glass.current) return;
    const on = (clock.elapsedTime + phase) % 2 < 1 ? 1 : 0.15;
    glass.current.emissiveIntensity = 0.1 + night() * 1.6 * on;
  });
  return (
    <group position={[at[0], 0, at[1]]}>
      <mesh position-y={0.8} castShadow>
        <cylinderGeometry args={[0.95, 1.1, 1.6, 16]} />
        <meshLambertMaterial color="#eceeee" />
      </mesh>
      <mesh position-y={2.1}>
        <cylinderGeometry args={[0.7, 0.75, 1.0, 16]} />
        <meshLambertMaterial ref={glass} color="#bfe3e6" emissive={color} emissiveIntensity={0.1} />
      </mesh>
      <mesh position-y={2.6} scale={[1, 0.6, 1]}>
        <sphereGeometry args={[0.72, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshLambertMaterial color="#eceeee" />
      </mesh>
      <mesh position-y={3.1}>
        <sphereGeometry args={[0.12, 8, 6]} />
        <meshLambertMaterial color="#eceeee" />
      </mesh>
    </group>
  );
}

/* ---------------- the lighthouse ---------------- */

const LIGHTHOUSE: [number, number] = [124, -16];

function Lighthouse() {
  const lantern = useRef<MeshLambertMaterial>(null);
  const beam = useRef<Group>(null);
  const beamGeometry = useMemo(() => new CylinderGeometry(0.3, 1.6, 24, 16, 1, true).translate(0, 12, 0).rotateZ(-Math.PI / 2), []);
  useFrame(({ clock }) => {
    const n = night();
    if (lantern.current) lantern.current.emissiveIntensity = 0.1 + n * 1.8;
    if (beam.current) {
      beam.current.rotation.y = clock.elapsedTime * 0.5;
      beam.current.visible = n > 0.05;
      beam.current.children.forEach((o) => (((o as Mesh).material as MeshBasicMaterial).opacity = n * 0.18));
    }
  });
  return (
    <group position={[LIGHTHOUSE[0], 0, LIGHTHOUSE[1]]}>
      <mesh position-y={-0.2} scale={[6, 1.6, 5]} castShadow receiveShadow>
        <dodecahedronGeometry args={[1, 0]} />
        <meshLambertMaterial color="#8a939c" flatShading />
      </mesh>
      <mesh position-y={1.4} castShadow>
        <boxGeometry args={[5, 2.8, 5]} />
        <meshLambertMaterial color="#efe6e6" />
      </mesh>
      <mesh position-y={2.75}>
        <boxGeometry args={[5.05, 0.15, 5.05]} />
        <meshLambertMaterial color="#b38f8d" />
      </mesh>
      <mesh position-y={6.4} rotation-y={Math.PI / 4} castShadow>
        <cylinderGeometry args={[1.35, 2.1, 7.2, 4]} />
        <meshLambertMaterial color="#d4d7d6" flatShading />
      </mesh>
      {[4.6, 7.6].map((y) => {
        const k = (y - 2.8) / 7.2;
        const r = 2.1 + (1.35 - 2.1) * k;
        return (
          <mesh key={y} position-y={y} rotation-y={Math.PI / 4}>
            <cylinderGeometry args={[r - 0.04 + 0.02, r + 0.04 + 0.02, 0.9, 4]} />
            <meshLambertMaterial color="#e0453a" flatShading />
          </mesh>
        );
      })}
      <mesh position-y={10.2} castShadow>
        <boxGeometry args={[3.2, 0.4, 3.2]} />
        <meshLambertMaterial color="#807a89" />
      </mesh>
      <mesh position-y={11.05}>
        <cylinderGeometry args={[0.9, 0.9, 1.3, 12]} />
        <meshLambertMaterial ref={lantern} color="#5aaee6" emissive="#fff2b0" emissiveIntensity={0.1} />
      </mesh>
      <mesh position-y={12.2}>
        <coneGeometry args={[1.1, 1.0, 8]} />
        <meshLambertMaterial color="#8f8aa6" />
      </mesh>
      <mesh position-y={13}>
        <cylinderGeometry args={[0.03, 0.03, 0.7, 6]} />
        <meshLambertMaterial color="#3d4655" />
      </mesh>
      {/* the beam: two soft cones sweeping round at night */}
      <group ref={beam} position-y={11.05}>
        {[0, Math.PI].map((r) => (
          <mesh key={r} geometry={beamGeometry} rotation-y={r}>
            <meshBasicMaterial color="#fff2b0" transparent opacity={0} blending={AdditiveBlending} depthWrite={false} side={DoubleSide} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ---------------- raid sites ---------------- */

/** The Paldea battle court, painted once: a double boundary, a center line, the half-red, half-white center ring. */
function courtTexture() {
  const c = document.createElement("canvas");
  c.width = 768;
  c.height = 512;
  const g = c.getContext("2d")!;
  const s = 64; // pixels per meter: the court is 12 x 8
  g.fillStyle = "#6fa8d6";
  g.fillRect(0, 0, 768, 512);
  g.strokeStyle = "#ffffff";
  g.lineWidth = 0.16 * s;
  const inset = (m: number) => g.strokeRect(m * s, m * s, 768 - 2 * m * s, 512 - 2 * m * s);
  inset(0.12);
  inset(0.62);
  g.beginPath();
  g.moveTo(384, 0);
  g.lineTo(384, 512);
  g.stroke();
  for (const [from, to, color] of [
    [Math.PI / 2, Math.PI * 1.5, "#e07a72"],
    [-Math.PI / 2, Math.PI / 2, "#eef0ea"],
  ] as const) {
    g.fillStyle = color;
    g.beginPath();
    g.arc(384, 256, 1.6 * s, from, to);
    g.arc(384, 256, 0.65 * s, to, from, true);
    g.fill();
  }
  g.lineWidth = 0.14 * s;
  g.beginPath();
  g.arc(384, 256, 1.67 * s, 0, Math.PI * 2);
  g.stroke();
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Legends Z-A's red holographic fence: a translucent triangle-lattice wall with light bands sweeping round, a gap to walk in. */
const fenceMaterial = new ShaderMaterial({
  uniforms: { uTime: skyLook.uTime, uNight: town.uNight },
  vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform float uTime, uNight; varying vec2 vUv;
    void main() {
      vec2 p = vec2(vUv.x * 48.0, vUv.y * 4.0);
      p.x += p.y * 0.5;
      vec2 f = fract(p);
      float tri = min(min(f.x, f.y), abs(f.x - f.y));
      float line = 1.0 - smoothstep(0.03, 0.09, tri);
      float band = smoothstep(0.92, 1.0, fract(vUv.x * 6.0 - uTime * 0.15));
      float edge = smoothstep(0.96, 1.0, vUv.y) + (1.0 - smoothstep(0.0, 0.04, vUv.y));
      float a = (0.12 + line * 0.5 + band * 0.5 + edge * 0.9) * mix(1.0, 0.35, vUv.y) * mix(0.4, 1.0, uNight);
      vec3 c = mix(vec3(1.0, 0.1, 0.18), vec3(1.0, 0.42, 0.48), band);
      gl_FragColor = vec4(c * a, a);
    }`,
  transparent: true,
  depthWrite: false,
  blending: AdditiveBlending,
  side: DoubleSide,
});
/** A ring wall 7.8 across with a 40 degree gap (open cylinder), the gap at angle 0. */
const fenceGeometry = new CylinderGeometry(7.8, 7.8, 2.4, 72, 1, true, 0.35, Math.PI * 2 - 0.7).translate(0, 1.2, 0);

function RaidSites() {
  const court = useMemo(() => courtTexture(), []);
  const sites = useMemo(
    () =>
      raids.map((r) => {
        const [x, z] = slots[r.slug];
        // the gap faces where people come from: the quad's middle on campus, the roundabout elsewhere
        const [tx, tz] = x > 28 && z > 34 ? [58, 67] : [0, 0];
        return { slug: r.slug, x, z, gap: Math.atan2(tx - x, tz - z) };
      }),
    [],
  );
  return (
    <>
      {sites.map((s) => (
        <group key={s.slug} position={[s.x, 0, s.z]}>
          <mesh rotation-x={-Math.PI / 2} position-y={0.006} renderOrder={-33}>
            <planeGeometry args={[12, 8]} />
            <meshBasicMaterial map={court} depthTest={false} depthWrite={false} />
          </mesh>
          <mesh geometry={fenceGeometry} material={fenceMaterial} rotation-y={s.gap} />
        </group>
      ))}
    </>
  );
}

/* ---------------- Pokémon of the waterfront ---------------- */

/**
 * A flock of Wingull wheeling over the harbor (Bulbapedia: "it circles above
 * oceans"), gliding on wide wings with a few beats now and then.
 */
function Wingulls() {
  const flock = useRef<Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    flock.current?.children.forEach((g, i) => {
      const a = t * (0.12 + i * 0.012) + i * 1.3;
      const r = 14 + (i % 3) * 5;
      g.position.set(108 + Math.cos(a) * r, 15 + (i % 3) * 2.2 + Math.sin(t * 0.6 + i) * 0.7, -6 + Math.sin(a) * r);
      // fly along the circle, banking into the turn
      g.rotation.set(0, -a, 0.3);
    });
  });
  return (
    <group ref={flock}>
      {Array.from({ length: 5 }, (_, i) => (
        <group key={i} userData={{ noShadow: true }}>
          <group scale={3.6} rotation-y={Math.PI}>
            <SmoothModel dex={278} seed={i} />
          </group>
        </group>
      ))}
    </group>
  );
}

/** Lapras swimming slow circles in the harbor past the pier, as Ash's Lapras carried him round the Orange Islands. */
function Lapras() {
  const swim = useRef<Group>(null);
  useFrame(({ clock }) => {
    const g = swim.current;
    if (!g) return;
    const t = clock.elapsedTime * 0.05;
    g.position.set(112 + Math.cos(t) * 9, Math.sin(clock.elapsedTime * 1.1) * 0.06, -30 + Math.sin(t) * 5);
    g.rotation.set(Math.sin(clock.elapsedTime * 0.9) * 0.03, -t - Math.PI / 2, 0);
  });
  // waterline at 0.2 of its height
  return (
    <group ref={swim} userData={{ noShadow: true }}>
      <group scale={5.2} position-y={-0.2 * 5.2}>
        <SmoothModel dex={131} />
      </group>
    </group>
  );
}

/**
 * The park pond's swan boat (a nod to the Public Garden's), with a Swanna
 * gliding along behind it, both slowly round the pond.
 */
function SwanBoat() {
  const boat = useRef<Group>(null);
  const swan = useRef<Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.045;
    const at = (k: number, g: Group | null) => {
      if (!g) return;
      const a = t + k;
      g.position.set(-97 + Math.cos(a) * 11, Math.sin(clock.elapsedTime * 1.3 + k) * 0.03, -3 + Math.sin(a) * 6.5);
      // the bow points along the path
      g.rotation.y = Math.atan2(-Math.sin(a) * 11, Math.cos(a) * 6.5);
    };
    at(0, boat.current);
    at(-0.5, swan.current);
  });
  return (
    <>
      <group ref={boat} userData={{ noShadow: true }}>
        <group scale={2.6} position-y={-0.09 * 2.6}>
          <SmoothModel dex="boat-swanna" />
        </group>
      </group>
      <group ref={swan} userData={{ noShadow: true }}>
        <group scale={2.2} position-y={-0.14 * 2.2}>
          <SmoothModel dex={581} />
        </group>
      </group>
    </>
  );
}

export function Sights() {
  return (
    <>
      <Fountain />
      <HarborKit />
      <Lighthouse />
      <RaidSites />
      <Wingulls />
      <Lapras />
      <SwanBoat />
    </>
  );
}
