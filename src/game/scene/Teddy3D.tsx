"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import { random } from "../geometry";
import type { Mover } from "../player";
import { parts } from "./parts";
import { Shadow } from "./Shadow";

const PARTS = ["body", "tail", "eyes", "leg0", "leg1", "leg2", "leg3"] as const;

const CREAMS = ["#f3e8d3", "#f6eddc", "#efe2c8"];
const EARS = "#e6cfa9";
const BLACK = "#1a1310";

/** Curls over the top and sides of an ellipsoid body, so he reads as fluffy. */
const bodyCurls = (() => {
  const rand = random(8);
  const curls: { p: [number, number, number]; r: number; c: string }[] = [];
  for (let i = 0; i < 30; i++) {
    const u = -0.85 + rand() * 1.7;
    const a = -0.35 + rand() * (Math.PI + 0.7);
    const ring = Math.sqrt(1 - u * u);
    curls.push({
      p: [0.27 * ring * Math.cos(a), 0.44 + 0.22 * ring * Math.sin(a), 0.4 * u],
      r: 0.09 + rand() * 0.045,
      c: CREAMS[i % 3],
    });
  }
  return curls;
})();

/**
 * Teddy, Tyler's Shih-Poo: a cream curly body, floppy apricot ears, black
 * button eyes and nose, and a plume of a tail curled over his back. He wags
 * every few seconds and blinks. Faces +z; `mover` places him.
 */
export function Teddy3D({ mover }: { mover: Mover }) {
  const root = useRef<Group>(null);
  const rig = useRef<ReturnType<typeof parts<(typeof PARTS)[number]>>>(null);
  const phase = useRef(0);

  useFrame(({ clock }, dt) => {
    if (!root.current) return;
    rig.current ??= parts(root.current, PARTS);
    const p = rig.current;
    if (!p) return;
    const t = clock.elapsedTime;
    root.current.position.copy(mover.position);
    root.current.rotation.y = mover.heading;
    const trot = Math.min(mover.speed / 5, 1);
    phase.current += dt * (3 + mover.speed * 2.2);
    // diagonal pairs move together, like a trot
    const step = Math.sin(phase.current) * 0.6 * trot;
    p.leg0.rotation.x = step;
    p.leg3.rotation.x = step;
    p.leg1.rotation.x = -step;
    p.leg2.rotation.x = -step;
    p.body.position.y = Math.abs(Math.sin(phase.current)) * 0.04 * trot;
    // A happy burst of wagging every few seconds, and nonstop while walking.
    const burst = t % 3.4 < 1.1 ? 1 : 0;
    p.tail.rotation.y = Math.sin(t * 16) * 0.45 * Math.max(burst, trot);
    p.eyes.scale.y = t % 4.6 > 4.45 ? 0.12 : 1;
  });

  return (
    <group ref={root}>
      <Shadow size={1.2} />
      <group scale={0.85}>
        <group name="body">
          {[
            [0.13, 0.24],
            [-0.13, 0.24],
            [0.13, -0.24],
            [-0.13, -0.24],
          ].map(([x, z], i) => (
            <group key={i} name={`leg${i}`} position={[x, 0.3, z]}>
              <mesh position-y={-0.14}>
                <cylinderGeometry args={[0.09, 0.085, 0.28, 10]} />
                <meshStandardMaterial color={CREAMS[1]} roughness={0.95} />
              </mesh>
              <mesh position={[0, -0.25, 0.02]}>
                <sphereGeometry args={[0.09, 12, 10]} />
                <meshStandardMaterial color={CREAMS[0]} roughness={0.95} />
              </mesh>
            </group>
          ))}

          <mesh position-y={0.44} scale={[0.27, 0.22, 0.4]}>
            <sphereGeometry args={[1, 20, 16]} />
            <meshStandardMaterial color={CREAMS[0]} roughness={0.95} />
          </mesh>
          {bodyCurls.map((curl, i) => (
            <mesh key={i} position={curl.p}>
              <sphereGeometry args={[curl.r, 10, 8]} />
              <meshStandardMaterial color={curl.c} roughness={0.95} />
            </mesh>
          ))}

          <group name="tail" position={[0, 0.56, -0.36]}>
            {[
              [0, 0.06, -0.06, 0.12],
              [0, 0.19, -0.05, 0.115],
              [0, 0.3, 0.02, 0.1],
              [0, 0.35, 0.12, 0.085],
            ].map(([x, y, z, r], i) => (
              <mesh key={i} position={[x, y, z]}>
                <sphereGeometry args={[r, 12, 10]} />
                <meshStandardMaterial color={CREAMS[(i + 1) % 3]} roughness={0.95} />
              </mesh>
            ))}
          </group>

          <group position={[0, 0.74, 0.36]}>
            <mesh>
              <sphereGeometry args={[0.24, 20, 16]} />
              <meshStandardMaterial color={CREAMS[1]} roughness={0.95} />
            </mesh>
            {[
              [-0.11, 0.18, -0.02, 0.1],
              [0, 0.22, -0.04, 0.11],
              [0.11, 0.18, -0.02, 0.1],
              [-0.06, 0.16, 0.1, 0.085],
              [0.06, 0.16, 0.1, 0.085],
            ].map(([x, y, z, r], i) => (
              <mesh key={i} position={[x, y, z]}>
                <sphereGeometry args={[r, 12, 10]} />
                <meshStandardMaterial color={CREAMS[i % 3]} roughness={0.95} />
              </mesh>
            ))}
            {[-1, 1].map((s) => (
              <mesh key={s} position={[s * 0.22, -0.06, 0.01]} rotation-z={s * 0.28} scale={[0.55, 1.55, 0.8]}>
                <sphereGeometry args={[0.1, 12, 10]} />
                <meshStandardMaterial color={EARS} roughness={0.95} />
              </mesh>
            ))}
            <mesh position={[0, -0.075, 0.18]} scale={[1.1, 0.85, 0.9]}>
              <sphereGeometry args={[0.12, 14, 12]} />
              <meshStandardMaterial color="#fbf6ec" roughness={0.95} />
            </mesh>
            <mesh position={[0, -0.035, 0.29]}>
              <sphereGeometry args={[0.045, 12, 10]} />
              <meshStandardMaterial color={BLACK} roughness={0.3} />
            </mesh>
            <mesh position={[0, -0.15, 0.25]} scale={[1, 0.55, 1]}>
              <sphereGeometry args={[0.04, 10, 8]} />
              <meshStandardMaterial color="#ef8a8f" roughness={0.6} />
            </mesh>
            <group name="eyes" position={[0, 0.045, 0]}>
              {[-1, 1].map((s) => (
                <group key={s} position={[s * 0.095, 0, 0.2]}>
                  <mesh>
                    <sphereGeometry args={[0.042, 12, 10]} />
                    <meshStandardMaterial color={BLACK} roughness={0.25} />
                  </mesh>
                  <mesh position={[0.012, 0.015, 0.035]}>
                    <sphereGeometry args={[0.012, 8, 6]} />
                    <meshBasicMaterial color="#ffffff" />
                  </mesh>
                </group>
              ))}
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
