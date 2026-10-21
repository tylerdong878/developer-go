"use client";

import { useFrame } from "@react-three/fiber";
import { type RefObject, useRef } from "react";
import { DoubleSide, type Group, type Mesh, type MeshBasicMaterial, MeshLambertMaterial, RingGeometry, Shape, ShapeGeometry } from "three";
import { RUSTLE } from "../../wild";

/*
 * How a Pokémon appears on the map, like GO (notes/research/spawns.md 3):
 * leaves rustle over the spot, it pops out with three white ripples, then it
 * stands in faint rings that pulse every 2 s (a weather-boosted one in GO's
 * cyan swirl instead), and when it goes it shrinks into a puff. Shared by the
 * wild ones and the fact Pokémon.
 */

/** What the effects need each frame: seconds since the rustle began (-1 before), how far through leaving (-1 if not), its size and boost. */
export type Appearing = { age: number; going: number; size: number; boost: boolean; daily?: boolean; lured?: boolean };

/** GO's pop: overshoots a little and settles. */
export const backOut = (k: number) => (k <= 0 ? 0 : k >= 1 ? 1 : 1 + 2.70158 * (k - 1) ** 3 + 1.70158 * (k - 1) ** 2);

/** How big the body is right now: hidden while rustling, popping out, shrinking as it goes. */
export const bodyScale = ({ age, going }: Appearing) => (going >= 0 ? Math.max(0, 1 - going * going) : age < 0 ? 0 : backOut((age - RUSTLE) / 0.35));

const leafShape = new Shape();
leafShape.moveTo(0, -0.26);
leafShape.quadraticCurveTo(0.2, 0, 0, 0.26);
leafShape.quadraticCurveTo(-0.2, 0, 0, -0.26);
const leafGeometry = new ShapeGeometry(leafShape, 4);
const leafMaterials = ["#4ccd63", "#27ae54", "#8fdc5a"].map((c) => new MeshLambertMaterial({ color: c, side: DoubleSide }));
const LEAVES = 12;
const ringGeometry = new RingGeometry(0.92, 1, 48).rotateX(-Math.PI / 2);
const PULSE = 2;
const arcGeometry = new RingGeometry(0.84, 1, 24, 1, 0, 1.5).rotateX(-Math.PI / 2);

/** Leaves whirling low over the spot, then flung out when it pops up. */
function rustle(group: Group, age: number) {
  const burst = age - RUSTLE;
  group.visible = age >= 0 && burst < 0.9;
  if (!group.visible) return;
  group.children.forEach((leaf, i) => {
    const a = (i / LEAVES) * Math.PI * 2;
    if (burst < 0) {
      // a small whirl, picking up as it nears the pop
      const spin = a + age * (5 + age * 3);
      const r = 0.45 + Math.sin(age * 7 + i) * 0.15;
      leaf.position.set(Math.cos(spin) * r, 0.15 + Math.abs(Math.sin(age * 6 + i * 1.7)) * (0.3 + age * 0.25), Math.sin(spin) * r);
      leaf.rotation.set(age * 9 + i, age * 7, i);
      leaf.scale.setScalar(Math.min(1, age * 3));
    } else {
      // flung out and drifting down as they shrink away
      const r = 0.6 + burst * 3.2;
      leaf.position.set(Math.cos(a + 0.3) * r, 0.5 + burst * 2.2 - burst * burst * 3.4, Math.sin(a + 0.3) * r);
      leaf.rotation.set(burst * 12 + i, burst * 8, i);
      leaf.scale.setScalar(Math.max(0, 1 - burst / 0.9));
    }
  });
}

/** Three quick ripples on the pop, then the faint pulse while it's out (GO's Daily Encounter pulses brighter, a lured one is pink). */
function ripples(group: Group, { age, going, size, boost, daily, lured }: Appearing) {
  const since = age - RUSTLE;
  group.visible = going < 0 && since > 0;
  if (!group.visible) return;
  group.children.forEach((ring, i) => {
    const m = (ring as Mesh).material as MeshBasicMaterial;
    m.color.set(lured ? "#ff8fc8" : "#ffffff");
    const pop = (since - i * 0.14) / 0.75;
    if (pop < 1) {
      const k = Math.max(0, pop);
      ring.scale.setScalar(size * (0.3 + k * 0.9));
      m.opacity = pop < 0 ? 0 : 0.8 * (1 - k);
      return;
    }
    if (boost) {
      m.opacity = 0;
      return;
    }
    const k = ((((since - 1.2 - i * 0.25) / PULSE) % 1) + 1) % 1;
    ring.scale.setScalar(size * (0.25 + k * 0.45));
    m.opacity = (daily || lured ? 0.6 : 0.3) * Math.sin(k * Math.PI);
  });
}

/** The leaves, ripples, swirl and puff round one Pokémon, driven by `state` (which its owner updates every frame). */
export function AppearFx({ state }: { state: RefObject<Appearing> }) {
  const leaves = useRef<Group>(null);
  const rings = useRef<Group>(null);
  const swirl = useRef<Group>(null);
  const puff = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    const s = state.current;
    if (leaves.current) rustle(leaves.current, s.age);
    if (rings.current) ripples(rings.current, s);
    if (swirl.current) {
      swirl.current.visible = s.boost && s.going < 0 && s.age > RUSTLE + 0.6;
      swirl.current.rotation.y = -clock.elapsedTime * Math.PI;
      swirl.current.scale.setScalar(s.size);
    }
    if (puff.current) {
      puff.current.visible = s.going >= 0 && s.going < 1;
      if (puff.current.visible) {
        puff.current.scale.setScalar(0.6 + s.going * 1.6);
        (puff.current.material as MeshBasicMaterial).opacity = 0.75 * (1 - s.going);
      }
    }
  });

  return (
    <>
      <group ref={leaves} visible={false}>
        {Array.from({ length: LEAVES }, (_, i) => (
          <mesh key={i} geometry={leafGeometry} material={leafMaterials[i % leafMaterials.length]} scale={0} />
        ))}
      </group>
      <group ref={rings} position-y={0.05} visible={false}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} geometry={ringGeometry} renderOrder={-16}>
            <meshBasicMaterial color="#ffffff" transparent opacity={0} depthWrite={false} />
          </mesh>
        ))}
      </group>
      <group ref={swirl} position-y={0.06} visible={false}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} geometry={arcGeometry} rotation-y={(i / 3) * Math.PI * 2} renderOrder={-16}>
            <meshBasicMaterial color={i ? "#bff4ff" : "#ffffff"} transparent opacity={0.85} depthWrite={false} />
          </mesh>
        ))}
      </group>
      <mesh ref={puff} position-y={0.7} visible={false}>
        <sphereGeometry args={[0.8, 16, 12]} />
        <meshBasicMaterial color="#ffffff" transparent depthWrite={false} />
      </mesh>
    </>
  );
}
