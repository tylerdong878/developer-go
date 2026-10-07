"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { CanvasTexture, DoubleSide, type Group, SRGBColorSpace } from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { Mover } from "../player";
import { parts } from "./parts";
import { Shadow } from "./Shadow";

const PARTS = ["body", "legL", "legR", "armL", "armR"] as const;

const SKIN = "#f2cfb0";
const HAIR = "#1c1818";
const JACKET = "#0b84d6";

/**
 * Tyler, built from simple shapes and matched to his photo: black hair parted
 * in the middle with the fringe down to his brows, a black tee under a Team
 * Mystic jacket, dark pants, white sneakers. He faces +z; `mover` places him.
 */
export function Trainer3D({ mover }: { mover: Mover }) {
  const root = useRef<Group>(null);
  const rig = useRef<ReturnType<typeof parts<(typeof PARTS)[number]>>>(null);
  const phase = useRef(0);

  const face = useMemo(() => faceTexture(), []);
  const torso = useMemo(() => new RoundedBoxGeometry(0.62, 0.74, 0.38, 3, 0.14), []);
  const shoe = useMemo(() => new RoundedBoxGeometry(0.2, 0.14, 0.34, 2, 0.06), []);

  useFrame((_, dt) => {
    if (!root.current) return;
    rig.current ??= parts(root.current, PARTS);
    const p = rig.current;
    if (!p) return;
    root.current.position.copy(mover.position);
    root.current.rotation.y = mover.heading;
    // Stride grows with speed; standing still, he just breathes.
    const stride = Math.min(mover.speed / 6, 1);
    phase.current += dt * (2.2 + mover.speed * 1.35);
    const swing = Math.sin(phase.current) * 0.7 * stride;
    p.legL.rotation.x = swing;
    p.legR.rotation.x = -swing;
    p.armL.rotation.x = -swing * 0.8;
    p.armR.rotation.x = swing * 0.8;
    // Leaning into a run.
    p.body.rotation.x += (Math.min(0.16, Math.max(0, mover.speed - 9) * 0.03) - p.body.rotation.x) * Math.min(1, dt * 8);
    p.body.position.y =
      Math.abs(Math.cos(phase.current)) * 0.05 * stride + Math.sin(phase.current * 0.45) * 0.012 * (1 - stride);
  });

  return (
    <group ref={root}>
      <Shadow size={1.7} opacity={0.5} />
      <group scale={0.9}>
        <group name="body">
          {["legL", "legR"].map((name, i) => (
            <group key={name} name={name} position={[i ? -0.14 : 0.14, 0.95, 0]}>
              <mesh position-y={-0.43}>
                <capsuleGeometry args={[0.13, 0.6, 4, 12]} />
                <meshStandardMaterial color={i ? "#343c48" : "#2b323d"} roughness={0.85} />
              </mesh>
              <mesh geometry={shoe} position={[0, -0.88, 0.05]}>
                <meshStandardMaterial color="#f7f7f5" roughness={0.6} />
              </mesh>
            </group>
          ))}

          <mesh geometry={torso} position-y={1.34}>
            <meshStandardMaterial color={JACKET} roughness={0.6} />
          </mesh>
          {/* the black tee showing through the open jacket, with light zipper edges */}
          <mesh position={[0, 1.33, 0.19]}>
            <boxGeometry args={[0.15, 0.62, 0.02]} />
            <meshStandardMaterial color="#1e2227" roughness={0.9} />
          </mesh>
          {[-0.088, 0.088].map((x) => (
            <mesh key={x} position={[x, 1.33, 0.193]}>
              <boxGeometry args={[0.024, 0.62, 0.022]} />
              <meshStandardMaterial color="#45a9ea" roughness={0.5} />
            </mesh>
          ))}
          {/* hood */}
          <mesh position={[0, 1.71, -0.13]} scale={[1.25, 0.5, 0.7]}>
            <sphereGeometry args={[0.24, 16, 12]} />
            <meshStandardMaterial color="#0a6fb3" roughness={0.7} />
          </mesh>

          {["armL", "armR"].map((name, i) => (
            <group key={name} name={name} position={[i ? -0.39 : 0.39, 1.63, 0]} rotation-z={i ? -0.08 : 0.08}>
              <mesh position-y={-0.3}>
                <capsuleGeometry args={[0.09, 0.5, 4, 10]} />
                <meshStandardMaterial color="#0a74bd" roughness={0.65} />
              </mesh>
              <mesh position-y={-0.6}>
                <cylinderGeometry args={[0.095, 0.095, 0.1, 12]} />
                <meshStandardMaterial color="#0a5a98" roughness={0.7} />
              </mesh>
              <mesh position-y={-0.72}>
                <sphereGeometry args={[0.085, 12, 10]} />
                <meshStandardMaterial color="#f0c8a6" roughness={0.8} />
              </mesh>
            </group>
          ))}

          <mesh position-y={1.76}>
            <cylinderGeometry args={[0.075, 0.085, 0.16, 12]} />
            <meshStandardMaterial color="#e6b994" roughness={0.8} />
          </mesh>

          <group position-y={2.05}>
            <mesh>
              <sphereGeometry args={[0.28, 40, 28]} />
              <meshStandardMaterial map={face} roughness={0.75} />
            </mesh>
            {[0.275, -0.275].map((x) => (
              <mesh key={x} position={[x, -0.02, 0]} scale={[0.55, 1, 0.8]}>
                <sphereGeometry args={[0.065, 10, 8]} />
                <meshStandardMaterial color="#ecc19e" roughness={0.8} />
              </mesh>
            ))}
            <Hair />
          </group>
        </group>
      </group>
    </group>
  );
}

/**
 * Pieces of shells just outside the head: a full cap, a band around the sides
 * and back, and two fringe curtains with a gap between them for the part.
 */
function Hair() {
  const front = Math.PI / 2; // +z on a three.js sphere
  return (
    <group>
      <mesh position={[0, 0.012, -0.006]} scale={[1.05, 1.13, 1.07]}>
        <sphereGeometry args={[0.3, 32, 8, 0, Math.PI * 2, 0, Math.PI * 0.3]} />
        <meshStandardMaterial color={HAIR} roughness={0.5} side={DoubleSide} />
      </mesh>
      <mesh scale={[1.03, 1.08, 1.04]}>
        <sphereGeometry args={[0.3, 32, 8, front + 1.1, Math.PI * 2 - 2.2, Math.PI * 0.26, Math.PI * 0.26]} />
        <meshStandardMaterial color={HAIR} roughness={0.5} side={DoubleSide} />
      </mesh>
      <mesh scale={[1.02, 1, 1.03]}>
        <sphereGeometry args={[0.3, 24, 8, front + 1.9, Math.PI * 2 - 3.8, Math.PI * 0.5, Math.PI * 0.2]} />
        <meshStandardMaterial color={HAIR} roughness={0.5} side={DoubleSide} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} rotation-z={side * -0.24} scale={[1.04, 1.08, 1.06]}>
          <sphereGeometry
            args={[0.305, 16, 8, side > 0 ? front + 0.1 : front - 1.28, 1.18, Math.PI * 0.22, Math.PI * 0.23]}
          />
          <meshStandardMaterial color={HAIR} roughness={0.5} side={DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

/** His face, painted onto the front of the head (a sphere's front sits at u = 0.25). */
function faceTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const g = canvas.getContext("2d")!;
  g.fillStyle = SKIN;
  g.fillRect(0, 0, 512, 256);
  const cx = 128;
  const cy = 128;
  const oval = (x: number, y: number, rx: number, ry: number, color: string) => {
    g.fillStyle = color;
    g.beginPath();
    g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    g.fill();
  };
  oval(cx - 38, cy + 21, 10, 5.5, "rgba(240, 168, 143, 0.35)");
  oval(cx + 38, cy + 21, 10, 5.5, "rgba(240, 168, 143, 0.35)");
  g.strokeStyle = HAIR;
  g.lineCap = "round";
  g.lineWidth = 5.5;
  for (const s of [-1, 1]) {
    g.beginPath();
    g.moveTo(cx + s * 13, cy - 16);
    g.lineTo(cx + s * 36, cy - 16);
    g.stroke();
  }
  oval(cx - 25, cy + 4, 5.8, 5.2, HAIR);
  oval(cx + 25, cy + 4, 5.8, 5.2, HAIR);
  oval(cx - 23.4, cy + 2.4, 1.6, 1.6, "#ffffff");
  oval(cx + 26.6, cy + 2.4, 1.6, 1.6, "#ffffff");
  oval(cx, cy + 15, 3.6, 2.1, "#e0ab89");
  g.strokeStyle = "#b5705a";
  g.lineWidth = 3.2;
  g.beginPath();
  g.moveTo(cx - 11, cy + 27);
  g.quadraticCurveTo(cx, cy + 35, cx + 11, cy + 27);
  g.stroke();
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
