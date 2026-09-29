"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useSyncExternalStore } from "react";
import { DoubleSide, type Group, type Mesh } from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { Stop as StopContent } from "@/content";
import { progressStore } from "../../progress";
import { game } from "../../state";
import { REACH } from "../Rings";
import { Shadow } from "../Shadow";
import { Nameplate } from "./Nameplate";
import { hover, tapObject } from "./tap";

const BLUE = "#1ab6e8";

/**
 * A PokéStop, one per project. Out of reach it's a blue cube turning on top
 * of a pole; step into reach and it opens into a spinning disc, like GO.
 * Featured projects are lured: pink petals drift around them.
 */
export function Stop({ stop, x, z }: { stop: StopContent; x: number; z: number }) {
  const top = useRef<Group>(null);
  const icon = useRef<Mesh>(null);
  const petals = useRef<Group>(null);
  const open = useRef(0);
  const cube = useMemo(() => new RoundedBoxGeometry(0.85, 0.85, 0.85, 3, 0.2), []);
  // Spun stops turn purple, like GO.
  const spun = useSyncExternalStore(progressStore.subscribe, progressStore.get, progressStore.server).spun.includes(stop.slug);
  const color = spun ? "#a46bf5" : BLUE;

  useFrame(({ clock }, dt) => {
    if (!top.current || !icon.current) return;
    const t = clock.elapsedTime;
    const { position } = game.player.trainer;
    const near = Math.hypot(position.x - x, position.z - z) < REACH;
    open.current += ((near ? 1 : 0) - open.current) * (1 - Math.exp(-6 * dt));
    const o = open.current;
    top.current.position.y = 2.9 + Math.sin(t * 1.6 + x) * 0.08;
    top.current.rotation.y = t * (0.6 + o * 1.8);
    // cube -> disc
    icon.current.scale.set(1 + o * 0.9, 1 - o * 0.82, 1 + o * 0.9);
    icon.current.rotation.set((1 - o) * 0.62, 0, (1 - o) * 0.62);
    if (petals.current) petals.current.rotation.y = -t * 0.7;
  });

  return (
    <group position={[x, 0, z]}>
      <group onClick={tapObject(stop.slug)} {...hover} scale={1.3}>
        <Shadow size={1.6} />
        <mesh position-y={0.05}>
          <cylinderGeometry args={[0.36, 0.42, 0.1, 16]} />
          <meshStandardMaterial color="#d6e6f2" roughness={0.6} />
        </mesh>
        <mesh position-y={1.25}>
          <cylinderGeometry args={[0.06, 0.07, 2.4, 10]} />
          <meshStandardMaterial color="#c9dcec" roughness={0.5} />
        </mesh>
        <group ref={top} position-y={2.9}>
          <mesh ref={icon} geometry={cube}>
            <meshStandardMaterial color={color} roughness={0.35} emissive={spun ? "#7b3fd6" : "#0b84d6"} emissiveIntensity={0.25} />
          </mesh>
          <mesh rotation-x={Math.PI / 2}>
            <torusGeometry args={[0.68, 0.05, 8, 40]} />
            <meshStandardMaterial color="#ffffff" roughness={0.4} />
          </mesh>
        </group>
      </group>

      {stop.featured ? (
        <group ref={petals} position-y={3.8} scale={1.3}>
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(a) * 1.35, Math.sin(a * 3) * 0.35, Math.sin(a) * 1.35]} rotation={[a, a * 2, 0.7]}>
                <planeGeometry args={[0.22, 0.14]} />
                <meshBasicMaterial color="#f9a8d4" side={DoubleSide} />
              </mesh>
            );
          })}
        </group>
      ) : null}

      <Nameplate text={shortName(stop.name)} accent={stop.featured ? "#f472b6" : BLUE} x={x} z={z} y={5.5} />
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
