"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { CanvasTexture, type PerspectiveCamera, type Sprite, SRGBColorSpace, Vector3 } from "three";
import { game } from "../../state";

/** Plate height as a share of the camera's view, so names read the same near and far. */
const HEIGHT = 0.036;
/** Names only show once you're close enough to walk over, so the map stays clean. */
const SHOW_WITHIN = 22;

type Plate = { sprite: Sprite; x: number; y: number; z: number; aspect: number; shown: number };
const plates = new Set<Plate>();

/** A white pill with the name, drawn once into a texture in the site's display font. */
async function drawPlate(text: string, accent: string) {
  const family = getComputedStyle(document.documentElement).getPropertyValue("--font-fredoka") || "sans-serif";
  const font = `600 44px ${family}`;
  await document.fonts.load(font, text).catch(() => undefined);
  const canvas = document.createElement("canvas");
  const g = canvas.getContext("2d")!;
  g.font = font;
  const width = Math.ceil(g.measureText(text).width) + 64;
  canvas.width = width;
  canvas.height = 72;
  g.font = font;
  g.fillStyle = "rgba(255, 255, 255, 0.94)";
  g.beginPath();
  g.roundRect(2, 2, width - 4, 68, 34);
  g.fill();
  g.fillStyle = accent;
  g.beginPath();
  g.arc(30, 36, 9, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#0a2a4a";
  g.textBaseline = "middle";
  g.fillText(text, 48, 38);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return { texture, aspect: width / 72 };
}

/**
 * A name floating over a map object, always the same size on screen. It
 * fades in as the trainer gets close, and <PlateLayout> hides it if it would
 * cover a nearer one. It goes inside the object's group (so it draws at
 * height y over it); x and z are the object's spot on the map, for the layout.
 */
export function Nameplate({ text, accent, x, z, y }: { text: string; accent: string; x: number; z: number; y: number }) {
  const sprite = useRef<Sprite>(null);
  const [plate, setPlate] = useState<{ texture: CanvasTexture; aspect: number } | null>(null);

  useEffect(() => {
    let live = true;
    let made: CanvasTexture | null = null;
    drawPlate(text, accent).then((p) => {
      made = p.texture;
      if (live) setPlate(p);
      else p.texture.dispose();
    });
    return () => {
      live = false;
      made?.dispose();
    };
  }, [text, accent]);

  useEffect(() => {
    if (!plate || !sprite.current) return;
    const entry: Plate = { sprite: sprite.current, x, y, z, aspect: plate.aspect, shown: 0 };
    plates.add(entry);
    return () => {
      plates.delete(entry);
    };
  }, [plate, x, y, z]);

  if (!plate) return null;
  return (
    <sprite ref={sprite} position={[0, y, 0]} scale={[HEIGHT * plate.aspect, HEIGHT, 1]} renderOrder={5} visible={false}>
      <spriteMaterial map={plate.texture} transparent depthWrite={false} sizeAttenuation={false} opacity={0} />
    </sprite>
  );
}

/**
 * Lays out every nameplate each frame, like map labels: nearest first, and a
 * plate that would overlap one already placed fades out instead.
 */
export function PlateLayout() {
  const size = useThree((s) => s.size);
  const point = useRef(new Vector3());

  useFrame(({ camera }, dt) => {
    const { position } = game.player.trainer;
    const fov = (camera as PerspectiveCamera).fov ?? 56;
    const tall = (HEIGHT / (2 * Math.tan((fov * Math.PI) / 360))) * size.height;
    const placed: [number, number, number, number][] = [];
    const order = [...plates]
      .map((p) => ({ p, d: Math.hypot(position.x - p.x, position.z - p.z) }))
      .sort((a, b) => a.d - b.d);
    for (const { p, d } of order) {
      let want = Math.min(1, Math.max(0, (SHOW_WITHIN - d) / 5));
      if (want > 0) {
        const v = point.current.set(p.x, p.y, p.z).project(camera);
        const onScreen = v.z < 1 && Math.abs(v.x) < 1.2 && Math.abs(v.y) < 1.2;
        const cx = ((v.x + 1) / 2) * size.width;
        const cy = ((1 - v.y) / 2) * size.height;
        const w = tall * p.aspect + 8;
        const h = tall + 6;
        const hit = placed.some(([x, y, pw, ph]) => Math.abs(cx - x) * 2 < w + pw && Math.abs(cy - y) * 2 < h + ph);
        if (!onScreen || hit) want = 0;
        else placed.push([cx, cy, w, h]);
      }
      p.shown += (want - p.shown) * (1 - Math.exp(-10 * dt));
      p.sprite.visible = p.shown > 0.02;
      p.sprite.material.opacity = p.shown;
    }
  });

  return null;
}
