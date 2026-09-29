"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import type { Gym as GymContent, Raid as RaidContent } from "@/content";
import { MYSTIC, MYSTIC_LIGHT, RAID_EGG as EGG } from "../../colors";
import { Shadow } from "../Shadow";
import { Nameplate } from "./Nameplate";
import { hover, tapObject } from "./tap";

/** Short names for the map, so nameplates stay small. */
const SHORT: Record<string, string> = {
  "Amazon Web Services (AWS)": "AWS",
  "Khoury College of Computer Sciences": "Khoury TA",
  "Quartzy Capital Advisors, LLC": "Quartzy",
};

type Props = { x: number; z: number } & ({ gym: GymContent } | { raid: RaidContent });

/**
 * A gym tower. Jobs are Team Mystic gyms (Tyler's team); hackathons are raids,
 * the same tower with a raid egg floating on top in its tier's color.
 */
export function Gym(props: Props) {
  const { x, z } = props;
  const crown = useRef<Group>(null);
  const egg = useRef<Group>(null);
  const raid = "raid" in props ? props.raid : null;
  const slug = "raid" in props ? props.raid.slug : props.gym.slug;
  const team = raid ? "#9aa5b4" : MYSTIC;
  const accent = raid ? "#c4ccd6" : MYSTIC_LIGHT;

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + x * 0.1;
    if (crown.current) crown.current.rotation.y = t * 0.35;
    if (egg.current) {
      egg.current.position.y = 5.9 + Math.sin(t * 1.8) * 0.12;
      egg.current.rotation.y = t * 0.5;
    }
  });

  const name = "raid" in props
    ? `${"★".repeat(props.raid.stars)} ${props.raid.event}`
    : (SHORT[props.gym.org] ?? props.gym.org);

  return (
    <group position={[x, 0, z]}>
      <group onClick={tapObject(slug)} {...hover} scale={1.4}>
        <Shadow size={4.2} opacity={0.5} />
        <mesh position-y={0.18}>
          <cylinderGeometry args={[1.55, 1.7, 0.36, 8]} />
          <meshStandardMaterial color="#e9eef3" roughness={0.6} />
        </mesh>
        <mesh position-y={0.46}>
          <cylinderGeometry args={[1.25, 1.35, 0.2, 8]} />
          <meshStandardMaterial color={team} roughness={0.5} />
        </mesh>
        <mesh position-y={2.2}>
          <cylinderGeometry args={[0.36, 0.48, 3.3, 12]} />
          <meshStandardMaterial color="#f4f7fa" roughness={0.5} />
        </mesh>
        {[1.3, 2.2, 3.1].map((y) => (
          <mesh key={y} position-y={y}>
            <cylinderGeometry args={[0.47 - y * 0.03, 0.49 - y * 0.03, 0.12, 12]} />
            <meshStandardMaterial color={team} roughness={0.5} />
          </mesh>
        ))}
        <mesh position-y={3.95}>
          <cylinderGeometry args={[1.15, 0.8, 0.3, 8]} />
          <meshStandardMaterial color={team} roughness={0.45} emissive={team} emissiveIntensity={0.12} />
        </mesh>
        {/* the crown: three fins turning slowly over the top */}
        <group ref={crown} position-y={4.35}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} rotation-y={(i / 3) * Math.PI * 2} position={[0, 0.35, 0]}>
              <boxGeometry args={[0.16, 0.9, 1.9]} />
              <meshStandardMaterial color={accent} roughness={0.4} transparent opacity={0.9} />
            </mesh>
          ))}
        </group>
        {raid ? (
          <group ref={egg} position-y={5.9}>
            <mesh scale={[1, 1.28, 1]}>
              <sphereGeometry args={[0.72, 24, 18]} />
              <meshStandardMaterial color={EGG[raid.stars]} roughness={0.35} emissive={EGG[raid.stars]} emissiveIntensity={0.18} />
            </mesh>
            <mesh rotation-x={Math.PI / 2} position-y={-0.05}>
              <torusGeometry args={[0.73, 0.07, 8, 32]} />
              <meshStandardMaterial color="#ffffff" roughness={0.4} />
            </mesh>
          </group>
        ) : null}
      </group>
      <Nameplate text={name} accent={raid ? EGG[raid.stars] : MYSTIC} x={x} z={z} y={raid ? 10.7 : 8.6} />
    </group>
  );
}
