"use client";

import { useEffect, useState } from "react";
import { SRGBColorSpace, type Texture, TextureLoader } from "three";

/** A loaded sprite and how much empty space sits under its feet (0 to 1). */
export type SpriteArt = { texture: Texture; feet: number };

const cache = new Map<number, Promise<SpriteArt>>();

/** Scans the image from the bottom for the first row with anything drawn in it. */
function measureFeet(image: CanvasImageSource & { width: number; height: number }) {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const g = canvas.getContext("2d", { willReadFrequently: true });
  if (!g) return 0;
  g.drawImage(image, 0, 0, size, size);
  const { data } = g.getImageData(0, 0, size, size);
  for (let y = size - 1; y >= 0; y--) {
    for (let x = 0; x < size; x++) if (data[(y * size + x) * 4 + 3] > 40) return (size - 1 - y) / size;
  }
  return 0;
}

/** A Pokémon's sprite from /public/sprites, loaded once and shared. */
export function useSpriteTexture(dex: number) {
  const [art, setArt] = useState<SpriteArt | null>(null);
  useEffect(() => {
    let live = true;
    let loading = cache.get(dex);
    if (!loading) {
      loading = new TextureLoader().loadAsync(`/sprites/${dex}.webp`).then((t) => {
        t.colorSpace = SRGBColorSpace;
        t.anisotropy = 4;
        return { texture: t, feet: measureFeet(t.image as HTMLImageElement) };
      });
      cache.set(dex, loading);
    }
    loading.then((a) => live && setArt(a)).catch(() => undefined);
    return () => {
      live = false;
    };
  }, [dex]);
  return art;
}
