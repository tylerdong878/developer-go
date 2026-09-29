"use client";

import { DoubleSide } from "three";
import { landmarks } from "../base";
import type { Vec2 } from "../geometry";
import { CastShadows } from "./Sun";

/** Flat paint on the ground: drawn after the ground layers, never z-fighting them. */
function Flat({ x, z, w, d, color, order = -36 }: { x: number; z: number; w: number; d: number; color: string; order?: number }) {
  return (
    <mesh position={[x, 0, z]} rotation-x={-Math.PI / 2} renderOrder={order}>
      <planeGeometry args={[w, d]} />
      <meshBasicMaterial color={color} side={DoubleSide} depthTest={false} depthWrite={false} />
    </mesh>
  );
}

/** White court lines: a rectangle outline plus any extra lines, 0.18 wide. */
function Lines({ x, z, w, d, extra = [] }: { x: number; z: number; w: number; d: number; extra?: [number, number, number, number][] }) {
  const t = 0.18;
  const all: [number, number, number, number][] = [
    [0, -d / 2, w, t],
    [0, d / 2, w, t],
    [-w / 2, 0, t, d],
    [w / 2, 0, t, d],
    ...extra,
  ];
  return (
    <>
      {all.map(([lx, lz, lw, ld], i) => (
        <Flat key={i} x={x + lx} z={z + lz} w={lw} d={ld} color="#ffffff" order={-34} />
      ))}
    </>
  );
}

/** Where I played soccer from 5 to 17: a striped pitch with goals. */
function Soccer({ at: [x, z] }: { at: Vec2 }) {
  const w = 44;
  const d = 28;
  return (
    <group>
      {Array.from({ length: 8 }, (_, i) => (
        <Flat key={i} x={x - w / 2 + (i + 0.5) * (w / 8)} z={z} w={w / 8} d={d} color={i % 2 ? "#6cc05f" : "#79c96b"} order={-35} />
      ))}
      <Lines x={x} z={z} w={w} d={d} extra={[[0, 0, 0.18, d]]} />
      <mesh position={[x, 0.01, z]} rotation-x={-Math.PI / 2} renderOrder={-34}>
        <ringGeometry args={[4, 4.18, 48]} />
        <meshBasicMaterial color="#ffffff" depthTest={false} depthWrite={false} />
      </mesh>
      <CastShadows>
        {[-1, 1].map((s) => (
          <group key={s} position={[x + s * (w / 2), 0, z]} rotation-y={s > 0 ? Math.PI : 0}>
            {[-3, 3].map((pz) => (
              <mesh key={pz} position={[0, 1.2, pz]}>
                <cylinderGeometry args={[0.1, 0.1, 2.4, 8]} />
                <meshStandardMaterial color="#ffffff" />
              </mesh>
            ))}
            <mesh position={[0, 2.4, 0]} rotation-x={Math.PI / 2}>
              <cylinderGeometry args={[0.1, 0.1, 6.2, 8]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
            <mesh position={[-0.9, 1.2, 0]}>
              <boxGeometry args={[1.8, 2.4, 6]} />
              <meshStandardMaterial color="#e8f1f5" transparent opacity={0.35} />
            </mesh>
          </group>
        ))}
      </CastShadows>
    </group>
  );
}

/** Where I captained varsity tennis: a blue hard court with a net. */
function Tennis({ at: [x, z] }: { at: Vec2 }) {
  return (
    <group>
      <Flat x={x} z={z} w={15} d={30} color="#3f8f5a" order={-35} />
      <Flat x={x} z={z} w={11} d={24} color="#3f7fc4" order={-34.5} />
      <Lines x={x} z={z} w={11} d={24} extra={[[0, 0, 11, 0.18], [0, -6.4, 8.2, 0.18], [0, 6.4, 8.2, 0.18], [0, 0, 0.18, 12.8]]} />
      <CastShadows>
        <mesh position={[x, 0.5, z]}>
          <boxGeometry args={[12, 1, 0.08]} />
          <meshStandardMaterial color="#1e2a38" transparent opacity={0.8} />
        </mesh>
        <mesh position={[x, 1, z]}>
          <boxGeometry args={[12, 0.12, 0.12]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        {[-6, 6].map((px) => (
          <mesh key={px} position={[x + px, 0.55, z]}>
            <cylinderGeometry args={[0.08, 0.08, 1.1, 8]} />
            <meshStandardMaterial color="#1e2a38" />
          </mesh>
        ))}
      </CastShadows>
    </group>
  );
}

/** A half court and a hoop, next to the NBA analyzer. */
function Hoops({ at: [x, z] }: { at: Vec2 }) {
  return (
    <group>
      <Flat x={x} z={z} w={15} d={14} color="#d99a5b" />
      <Lines x={x} z={z} w={15} d={14} extra={[[0, 3.3, 4.8, 0.18], [0, -1.5, 0.18, 9.6]]} />
      <mesh position={[x, 0.01, z + 7]} rotation-x={-Math.PI / 2} renderOrder={-34}>
        <ringGeometry args={[6.5, 6.68, 48, 1, 0, Math.PI]} />
        <meshBasicMaterial color="#ffffff" depthTest={false} depthWrite={false} side={DoubleSide} />
      </mesh>
      <CastShadows>
        <mesh position={[x, 1.8, z + 7.6]}>
          <cylinderGeometry args={[0.14, 0.18, 3.6, 10]} />
          <meshStandardMaterial color="#3a4250" />
        </mesh>
        <mesh position={[x, 3.4, z + 7.1]}>
          <boxGeometry args={[2.2, 1.4, 0.1]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[x, 3.0, z + 6.55]} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.42, 0.05, 8, 24]} />
          <meshStandardMaterial color="#f28a2e" />
        </mesh>
      </CastShadows>
    </group>
  );
}

/** A bouldering rock with colored holds, for climbing. */
function Rock({ at: [x, z] }: { at: Vec2 }) {
  const holds: [number, number, number, string][] = [
    [-1.2, 1.2, 2.3, "#f472b6"],
    [0.4, 2.3, 2.1, "#f6c453"],
    [1.5, 1.6, 1.9, "#5fc15a"],
    [-0.4, 3.2, 1.6, "#1ab6e8"],
    [0.9, 3.8, 1.1, "#a78bfa"],
    [-1.8, 2.5, 1.5, "#fb7185"],
  ];
  return (
    <CastShadows>
      <group position={[x, 0, z]}>
        <mesh position-y={2} scale={[3.2, 2.4, 2.6]}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#9aa3ad" roughness={0.95} flatShading />
        </mesh>
        <mesh position={[2.6, 0.9, -1]} scale={[1.4, 1, 1.2]}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#8a939c" roughness={0.95} flatShading />
        </mesh>
        {holds.map(([hx, hy, hz, c], i) => (
          <mesh key={i} position={[hx, hy, hz]}>
            <sphereGeometry args={[0.2, 8, 6]} />
            <meshStandardMaterial color={c} roughness={0.6} />
          </mesh>
        ))}
      </group>
    </CastShadows>
  );
}

/** The places from my life outside code, built into the base. */
export function Landmarks() {
  return (
    <>
      {landmarks.map((l, i) => {
        switch (l.kind) {
          case "soccer":
            return <Soccer key={i} at={l.at} />;
          case "tennis":
            return <Tennis key={i} at={l.at} />;
          case "hoops":
            return <Hoops key={i} at={l.at} />;
          case "rock":
            return <Rock key={i} at={l.at} />;
          default:
            return null;
        }
      })}
    </>
  );
}
