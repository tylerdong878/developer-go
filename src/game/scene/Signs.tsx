"use client";

import { useEffect, useState } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";
import { buildings, slots, START } from "../base";
import type { Building } from "../lots";

/** What each signature building says over its door. */
const NAMES: Record<string, string> = {
  aws: "AWS",
  tetracorp: "Tetracorp",
  philips: "Philips",
  khoury: "Khoury College",
  outamation: "Outamation",
  quartzy: "Quartzy",
  homegoods: "HomeGoods",
  home: "Tyler's house",
  center: "POKéMON CENTER",
  mart: "MART",
};

/** Sign colors: navy for most, and the games' own for the Center and Mart. */
const STYLE: Record<string, { bg: string; fg: string }> = {
  center: { bg: "#ffffff", fg: "#d42a26" },
  mart: { bg: "#ffffff", fg: "#2f6fd6" },
};

type Sign = { text: string; x: number; y: number; z: number; turn: number; width: number; slug: string };

/** A sign goes on the wall facing its gym (or, for home, facing the roundabout). */
function signFor(b: Building): Sign | null {
  if (!b.slug || !(b.slug in NAMES)) return null;
  if (b.kind === "center" || b.kind === "mart") {
    // over the doors, on the front wall
    return { text: NAMES[b.slug], slug: b.slug, x: b.x, y: b.h - 0.95, z: b.z + b.d / 2 + 0.08, turn: 0, width: b.kind === "center" ? 6.5 : 4.2 };
  }
  const [tx, tz] = b.slug === "home" ? START : slots[b.slug];
  const dx = tx - b.x;
  const dz = tz - b.z;
  const y = b.kind === "house" ? b.h + 1.2 : Math.min(b.h - 2, 7); // houses: up on the gable
  if (Math.abs(dx) > Math.abs(dz)) {
    const side = Math.sign(dx);
    return { text: NAMES[b.slug], slug: b.slug, x: b.x + side * (b.w / 2 + 0.06), y, z: b.z, turn: (side * Math.PI) / 2, width: Math.min(b.d * 0.7, 7) };
  }
  const side = Math.sign(dz);
  return { text: NAMES[b.slug], slug: b.slug, x: b.x, y, z: b.z + side * (b.d / 2 + 0.06), turn: side > 0 ? 0 : Math.PI, width: Math.min(b.w * 0.7, 7) };
}

function drawSign(text: string, slug: string) {
  const style = STYLE[slug] ?? { bg: "#0a2a4a", fg: "#ffffff" };
  const family = getComputedStyle(document.documentElement).getPropertyValue("--font-fredoka") || "sans-serif";
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const g = canvas.getContext("2d")!;
  g.fillStyle = style.bg;
  g.beginPath();
  g.roundRect(4, 4, 504, 120, 28);
  g.fill();
  g.fillStyle = style.fg;
  let size = 72;
  g.font = `600 ${size}px ${family}`;
  while (g.measureText(text).width > 450 && size > 30) g.font = `600 ${(size -= 4)}px ${family}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, 256, 68);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** Name signs on the job buildings and Tyler's house, so you can tell them apart from the street. */
export function Signs() {
  const [signs, setSigns] = useState<{ sign: Sign; texture: CanvasTexture }[]>([]);
  useEffect(() => {
    let made: CanvasTexture[] = [];
    let live = true;
    document.fonts.ready.then(() => {
      if (!live) return;
      const list = buildings.map(signFor).filter((s): s is Sign => s !== null);
      const next = list.map((sign) => ({ sign, texture: drawSign(sign.text, sign.slug) }));
      made = next.map((n) => n.texture);
      setSigns(next);
    });
    return () => {
      live = false;
      made.forEach((t) => t.dispose());
    };
  }, []);

  return (
    <>
      {signs.map(({ sign, texture }) => (
        <mesh key={sign.text} position={[sign.x, sign.y, sign.z]} rotation-y={sign.turn}>
          <planeGeometry args={[sign.width, sign.width / 4]} />
          <meshBasicMaterial map={texture} transparent toneMapped={false} />
        </mesh>
      ))}
    </>
  );
}
