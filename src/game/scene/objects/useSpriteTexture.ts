"use client";

import { useEffect, useState } from "react";
import { SRGBColorSpace, type Texture, TextureLoader } from "three";

const cache = new Map<number, Promise<Texture>>();

/** A Pokémon's sprite from /public/sprites, loaded once and shared. */
export function useSpriteTexture(dex: number) {
  const [texture, setTexture] = useState<Texture | null>(null);
  useEffect(() => {
    let live = true;
    let loading = cache.get(dex);
    if (!loading) {
      loading = new TextureLoader().loadAsync(`/sprites/${dex}.webp`).then((t) => {
        t.colorSpace = SRGBColorSpace;
        t.anisotropy = 4;
        return t;
      });
      cache.set(dex, loading);
    }
    loading.then((t) => live && setTexture(t)).catch(() => undefined);
    return () => {
      live = false;
    };
  }, [dex]);
  return texture;
}
