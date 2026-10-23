"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useSyncExternalStore } from "react";
import { CanvasTexture, type Group, type Sprite, SRGBColorSpace } from "three";
import type { Spawn as SpawnContent } from "@/content";
import { discover, foundStore } from "../../discovered";
import { sfx } from "../../sound";
import { boosted } from "../../species";
import { game } from "../../state";
import { weatherStore } from "../../weather";
import { REACH } from "../Rings";
import { type Appearing, AppearFx, bodyScale } from "./appear";
import { Critter, critterLift, critterSize } from "./Critter";
import { Nameplate } from "./Nameplate";
import { tapObject } from "./tap";

/** You find a fact Pokémon the first time you come this close: GO's draw range at our scale. */
const REVEAL = 24;

/**
 * A rare Pokémon at a fixed spot, one per fun fact about me, like GO's Daily
 * Encounter: it waits unseen until you first come close, then leaves rustle,
 * it pops out, and it stays, on a brighter pulsing ring. It glows softly so it
 * stands out from the everyday wild ones (no sparkles: on GO's map those would
 * read as shiny, and shinies never show on the map). Ditto hides as a Pidgey,
 * the way GO's only ever appears disguised. Snorlax is asleep, so it gets Zzz's instead. Its name shows once
 * you're about at your ring, since GO doesn't label Pokémon from afar.
 */
export function Spawn({ spawn, x, z, grass }: { spawn: SpawnContent; x: number; z: number; grass: string }) {
  // a disguised one (Ditto) looks and is named like its disguise on the map
  const { dex, name } = spawn.disguise ?? spawn.pokemon;
  const size = critterSize(dex);
  const lift = critterLift(dex);
  const asleep = dex === 143;
  const found = useSyncExternalStore(foundStore.subscribe, () => foundStore.get().has(spawn.slug), () => asleep);
  const body = useRef<Group>(null);
  const fx = useRef<Appearing>({ age: -1, going: -1, size: Math.max(0.6, size * 0.85), boost: false, daily: true });
  /** When it popped out (on the clock); far in the past if it was already found. */
  const since = useRef<number | null>(null);

  useFrame(({ clock }) => {
    const now = clock.elapsedTime;
    if (since.current === null) {
      if (foundStore.get().has(spawn.slug)) since.current = -1e6;
      else if (!game.input.locked) {
        const { position } = game.player.trainer;
        if (Math.hypot(position.x - x, position.z - z) < REVEAL) {
          discover(spawn.slug);
          since.current = now;
          sfx.appear();
        }
      }
    }
    fx.current.age = since.current === null ? -1 : Math.min(now - since.current, 1e3);
    fx.current.boost = boosted(dex, weatherStore.get());
    if (body.current) body.current.scale.setScalar(bodyScale(fx.current));
  });

  return (
    <group position={[x, 0, z]}>
      <group ref={body} scale={0}>
        <Critter dex={dex} grass={grass} asleep={asleep} onClick={tapObject(spawn.slug)} seed={x} />
        {asleep ? <Zzz y={size * 0.9} /> : <Glow height={size} lift={lift} />}
      </group>
      <AppearFx state={fx} />
      {found ? <Nameplate text={name} accent="#f6c453" x={x} z={z} y={size + lift + 1.1} within={REACH + 3} /> : null}
    </group>
  );
}

function canvasTexture(draw: (g: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  draw(canvas.getContext("2d")!);
  const t = new CanvasTexture(canvas);
  t.colorSpace = SRGBColorSpace;
  return t;
}

let zTexture: CanvasTexture | null = null;
let starTexture: CanvasTexture | null = null;

const zzz = () =>
  (zTexture ??= canvasTexture((g) => {
    g.font = "800 52px sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.lineWidth = 8;
    g.strokeStyle = "#0a2a4a";
    g.strokeText("Z", 32, 34);
    g.fillStyle = "#ffffff";
    g.fillText("Z", 32, 34);
  }));

const glow = () =>
  (starTexture ??= canvasTexture((g) => {
    const halo = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    halo.addColorStop(0, "rgba(255, 238, 170, 0.75)");
    halo.addColorStop(0.45, "rgba(255, 222, 120, 0.32)");
    halo.addColorStop(1, "rgba(255, 210, 100, 0)");
    g.fillStyle = halo;
    g.fillRect(0, 0, 64, 64);
  }));

/** Three Z's drifting up off a sleeping Pokémon. */
function Zzz({ y }: { y: number }) {
  const group = useRef<Group>(null);
  const map = useMemo(() => zzz(), []);
  useFrame(({ clock }) => {
    group.current?.children.forEach((child, i) => {
      const t = (clock.elapsedTime * 0.45 + i / 3) % 1;
      child.position.set(0.6 + t * 1.2, y + t * 1.8, 0);
      child.scale.setScalar(0.45 + t * 0.4);
      (child as Sprite).material.opacity = Math.sin(t * Math.PI);
    });
  });
  return (
    <group ref={group}>
      {[0, 1, 2].map((i) => (
        <sprite key={i}>
          <spriteMaterial map={map} transparent depthWrite={false} />
        </sprite>
      ))}
    </group>
  );
}

/** A soft, steady golden glow round a fact Pokémon, breathing slowly (like Sword and Shield's Brilliant Pokémon), with no star shapes. */
function Glow({ height, lift }: { height: number; lift: number }) {
  const group = useRef<Group>(null);
  const map = useMemo(() => glow(), []);
  useFrame(({ clock }) => {
    const s = group.current?.children[0] as Sprite | undefined;
    if (!s) return;
    const k = 0.5 + Math.sin(clock.elapsedTime * 1.6) * 0.5;
    s.scale.setScalar(Math.max(1, height * 2.1) * (0.94 + k * 0.08));
    s.material.opacity = 0.55 + k * 0.2;
  });
  return (
    <group ref={group} position-y={lift + height * 0.5}>
      {[0].map((i) => (
        <sprite key={i} renderOrder={-1}>
          <spriteMaterial map={map} transparent depthWrite={false} />
        </sprite>
      ))}
    </group>
  );
}
