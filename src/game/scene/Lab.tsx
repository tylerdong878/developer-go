"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CanvasTexture,
  CylinderGeometry,
  DoubleSide,
  type Group,
  LatheGeometry,
  type MeshLambertMaterial,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
  Vector2,
} from "three";
import { LAB } from "../base";
import { game } from "../state";
import { town } from "./fade";

/*
 * Northeastern's lab, as the anime's Oak's lab (notes/research/gfx-landmarks.md 7,
 * anime-movies-2.md): a magenta barrel vault over a cream hall with arched
 * windows, a lower annex, and behind it the tall white wind turbine that makes
 * the lab stand out in Pallet Town, all up on a wooded hill. A stone stair
 * climbs to it from an iron gate between ball-capped pillars, with a stone
 * slab sign. It faces north, down to the campus; at night the windows glow and
 * the turbine blinks red. The gate opens as you walk up.
 */

const CREAM = "#efe9d3";
const MAGENTA = "#c672a6";
const GLASS = "#8ccae0";

const hill = new LatheGeometry(
  [
    [0, 4],
    [8.5, 4],
    [9, 3.7],
    [10, 2.8],
    [11.2, 1.2],
    [12, 0],
  ].map(([r, y]) => new Vector2(r, y)),
  48,
);
// a half cylinder lying along z, curved side up
const vault = new CylinderGeometry(4.5, 4.5, 12, 28, 1, false, -Math.PI / 2, Math.PI).rotateX(-Math.PI / 2);
const halfDisc = (() => {
  const s = new Shape();
  s.absarc(0, 0, 4.5, 0, Math.PI, false);
  s.closePath();
  return new ShapeGeometry(s, 24);
})();
const archWindow = (() => {
  const s = new Shape();
  s.moveTo(-0.55, 0);
  s.lineTo(0.55, 0);
  s.lineTo(0.55, 1.1);
  s.absarc(0, 1.1, 0.55, 0, Math.PI, false);
  s.closePath();
  return new ShapeGeometry(s, 12);
})();
const blade = (() => {
  const s = new Shape();
  s.moveTo(-0.28, 0);
  s.lineTo(0.28, 0);
  s.lineTo(0.12, 6.5);
  s.lineTo(-0.12, 6.5);
  s.closePath();
  return new ShapeGeometry(s);
})();

/** The stone slab sign by the gate. */
function signTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 224;
  const g = c.getContext("2d")!;
  g.fillStyle = "#8b9597";
  g.fillRect(0, 0, 512, 224);
  g.fillStyle = "#a2acae";
  g.fillRect(12, 12, 488, 200);
  g.fillStyle = "#ffffff";
  g.textAlign = "center";
  g.textBaseline = "middle";
  const family = getComputedStyle(document.documentElement).getPropertyValue("--font-lato") || "sans-serif";
  g.font = `900 64px ${family}`;
  g.fillText("NORTHEASTERN", 256, 92);
  g.font = `700 38px ${family}`;
  g.fillText("RESEARCH LAB", 256, 156);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** The stair from the gate up the hill's north face to the top. */
const STEPS = Array.from({ length: 20 }, (_, i) => ({ z: -17.6 + i * 0.47, top: ((i + 1) / 20) * 4 }));
/** Trees round the hill's shoulders, so the lab "barely peeks over the trees". */
const TREES: [number, number, number][] = [
  [-9.5, -4, 1.1],
  [-10.5, 3, 1.25],
  [-7, 8.5, 1.05],
  [9.8, -5, 1.15],
  [10.2, 4, 1],
  [6.5, 9, 1.2],
  [0, 10.5, 1.1],
];

export function Lab() {
  const rotor = useRef<Group>(null);
  const gateL = useRef<Group>(null);
  const gateR = useRef<Group>(null);
  const windows = useRef<MeshLambertMaterial>(null);
  const light = useRef<MeshLambertMaterial>(null);
  const [sign, setSign] = useState<CanvasTexture | null>(null);
  useEffect(() => {
    let live = true;
    let made: CanvasTexture | null = null;
    document.fonts.ready.then(() => {
      if (!live) return;
      made = signTexture();
      setSign(made);
    });
    return () => {
      live = false;
      made?.dispose();
    };
  }, []);
  const open = useRef(0);
  const at = useMemo(() => ({ x: LAB.gate[0], z: LAB.gate[1] }), []);

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    if (rotor.current) rotor.current.rotation.z = t * 0.8;
    const n = town.uNight.value;
    if (windows.current) windows.current.emissiveIntensity = n * 1.4;
    if (light.current) light.current.emissiveIntensity = n * (t % 2 < 1 ? 2.2 : 0.1);
    // the gate swings open as the trainer comes up to it
    const { x, z } = game.player.trainer.position;
    const near = Math.hypot(x - at.x, z - at.z) < 6;
    open.current += ((near ? 1 : 0) - open.current) * Math.min(1, dt * 3);
    if (gateL.current) gateL.current.rotation.y = open.current * 1.2;
    if (gateR.current) gateR.current.rotation.y = -open.current * 1.2;
  });

  return (
    <group position={[LAB.at[0], 0, LAB.at[1]]} scale={LAB.scale}>
      <mesh geometry={hill} receiveShadow castShadow>
        <meshLambertMaterial color="#62b159" />
      </mesh>
      <mesh position-y={4.01} rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[8.5, 40]} />
        <meshLambertMaterial color="#94d57f" />
      </mesh>
      {TREES.map(([x, z, s]) => {
        const y = 4 - Math.max(0, Math.hypot(x, z) - 8.5) * 1.1;
        return (
          <group key={`${x}${z}`} position={[x, y, z]} scale={s}>
            <mesh position-y={1.1} castShadow>
              <cylinderGeometry args={[0.22, 0.32, 2.2, 8]} />
              <meshLambertMaterial color="#8a5a3b" />
            </mesh>
            <mesh position-y={3.2} scale={[2, 1.75, 2]} castShadow>
              <sphereGeometry args={[1, 18, 12]} />
              <meshLambertMaterial color="#47b04f" />
            </mesh>
          </group>
        );
      })}

      {/* the lab, on top of the hill, facing north (-z) */}
      <group position-y={4}>
        <mesh position={[0, 1.8, -1]} castShadow receiveShadow>
          <boxGeometry args={[9, 3.6, 12]} />
          <meshLambertMaterial color={CREAM} />
        </mesh>
        <mesh geometry={vault} position={[0, 3.6, -1]} castShadow>
          <meshLambertMaterial color={MAGENTA} />
        </mesh>
        <mesh geometry={halfDisc} position={[0, 3.6, -7.02]} rotation-y={Math.PI}>
          <meshLambertMaterial color={CREAM} />
        </mesh>
        <mesh position={[0, 3.6, -7.05]} rotation-y={Math.PI}>
          <ringGeometry args={[4.3, 4.55, 32, 1, 0, Math.PI]} />
          <meshLambertMaterial color="#ffffff" />
        </mesh>
        {/* three arched windows over a ribbon of four, and the door */}
        {[-1.6, 0, 1.6].map((x) => (
          <mesh key={x} geometry={archWindow} position={[x, 3.85, -7.08]} rotation-y={Math.PI} scale={0.9}>
            <meshLambertMaterial ref={x === 0 ? windows : undefined} color={GLASS} emissive="#ffc773" emissiveIntensity={0} />
          </mesh>
        ))}
        {[-3.3, -1.1, 1.1, 3.3].map((x) => (
          <mesh key={x} position={[x, 2.4, -7.04]}>
            <boxGeometry args={[1.3, 0.8, 0.05]} />
            <meshLambertMaterial color={GLASS} emissive="#ffc773" emissiveIntensity={0} />
          </mesh>
        ))}
        <mesh position={[0, 1.2, -7.08]}>
          <boxGeometry args={[1.4, 2.4, 0.1]} />
          <meshLambertMaterial color="#56648f" />
        </mesh>
        {/* the annex, lower, to the east */}
        <mesh position={[5.5, 1.7, 1]} castShadow receiveShadow>
          <boxGeometry args={[4, 3.4, 5]} />
          <meshLambertMaterial color={CREAM} />
        </mesh>
        <mesh position={[5.6, 3.6, 1]} rotation-z={-0.3} castShadow>
          <boxGeometry args={[4.6, 0.3, 5.4]} />
          <meshLambertMaterial color="#d18fc3" />
        </mesh>
        {/* the wind turbine behind the vault */}
        <mesh position={[2.5, 8, 6.5]} castShadow>
          <cylinderGeometry args={[0.35, 0.75, 16, 16]} />
          <meshLambertMaterial color="#d8e2ea" />
        </mesh>
        <group position={[2.5, 16.2, 6.5]}>
          <mesh position-z={0.3} castShadow>
            <boxGeometry args={[0.9, 0.9, 2.2]} />
            <meshLambertMaterial color="#d8e2ea" />
          </mesh>
          <mesh position={[0, 0.55, 0.9]}>
            <sphereGeometry args={[0.12, 8, 6]} />
            <meshLambertMaterial ref={light} color="#ff3a3a" emissive="#ff3a3a" emissiveIntensity={0} />
          </mesh>
          <group ref={rotor} position-z={-0.9}>
            <mesh>
              <sphereGeometry args={[0.45, 16, 12]} />
              <meshLambertMaterial color="#ffffff" />
            </mesh>
            {[0, 1, 2, 3].map((i) => (
              <mesh key={i} geometry={blade} rotation-z={(i / 4) * Math.PI * 2} position-z={-0.1} castShadow>
                <meshLambertMaterial color="#ece8b8" side={DoubleSide} />
              </mesh>
            ))}
          </group>
        </group>
      </group>

      {/* the stone stair up the north face, with hedges both sides */}
      {STEPS.map((s) => (
        <mesh key={s.z} position={[0, s.top / 2, s.z]} receiveShadow castShadow>
          <boxGeometry args={[2.2, s.top, 0.48]} />
          <meshLambertMaterial color="#dcdcde" />
        </mesh>
      ))}
      {STEPS.filter((_, i) => i % 3 === 0).map((s) =>
        [-1.6, 1.6].map((x) => (
          <mesh key={`${s.z}${x}`} position={[x, s.top + 0.3, s.z]} castShadow>
            <sphereGeometry args={[0.55, 12, 8]} />
            <meshLambertMaterial color="#3f9a4b" />
          </mesh>
        )),
      )}

      {/* the gate: two stone pillars with ball caps, an iron gate between, the slab sign beside */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 2.4, 0, -19]}>
          <mesh position-y={0.9} castShadow>
            <boxGeometry args={[0.7, 1.8, 0.7]} />
            <meshLambertMaterial color="#c6cfce" />
          </mesh>
          <mesh position-y={2.12}>
            <sphereGeometry args={[0.32, 14, 10]} />
            <meshLambertMaterial color="#c6cfce" />
          </mesh>
          <mesh position={[s * 3.2, 0.45, 0]} castShadow>
            <boxGeometry args={[5.6, 0.9, 0.5]} />
            <meshLambertMaterial color="#b8b2a6" />
          </mesh>
        </group>
      ))}
      {[-1, 1].map((s) => (
        <group key={s} ref={s < 0 ? gateL : gateR} position={[s * 2.05, 0, -19]}>
          <group position-x={-s * 1}>
            {Array.from({ length: 7 }, (_, i) => (
              <mesh key={i} position={[(i - 3) * 0.3, 0.85, 0]}>
                <boxGeometry args={[0.05, 1.6, 0.05]} />
                <meshLambertMaterial color="#2a2f2a" />
              </mesh>
            ))}
            {[0.15, 1.55].map((y) => (
              <mesh key={y} position-y={y}>
                <boxGeometry args={[2, 0.07, 0.07]} />
                <meshLambertMaterial color="#2a2f2a" />
              </mesh>
            ))}
          </group>
        </group>
      ))}
      <group position={[-5, 0, -19.4]} rotation-y={Math.PI}>
        <mesh position-y={0.35} rotation-x={-0.25} castShadow>
          <boxGeometry args={[1.8, 0.8, 0.3]} />
          <meshLambertMaterial color="#8b9597" />
        </mesh>
        {sign ? (
          <mesh position={[0, 0.4, -0.17]} rotation={[0.25, Math.PI, 0]}>
            <planeGeometry args={[1.62, 0.7]} />
            <meshLambertMaterial map={sign} />
          </mesh>
        ) : null}
      </group>
    </group>
  );
}
