"use client";

import { useMemo } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";

let shared: CanvasTexture | null = null;

/** A soft round shadow texture, shared by everything that stands on the ground. */
function shadowTexture() {
  if (shared) return shared;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const g = canvas.getContext("2d")!;
  const gradient = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(10, 42, 74, 0.42)");
  gradient.addColorStop(0.6, "rgba(10, 42, 74, 0.2)");
  gradient.addColorStop(1, "rgba(10, 42, 74, 0)");
  g.fillStyle = gradient;
  g.fillRect(0, 0, 128, 128);
  shared = new CanvasTexture(canvas);
  shared.colorSpace = SRGBColorSpace;
  return shared;
}

/** A blob shadow on the ground under whatever it's placed in. */
export function Shadow({ size, opacity = 1 }: { size: number; opacity?: number }) {
  const map = useMemo(() => shadowTexture(), []);
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={0.02} renderOrder={-10}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial map={map} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
}
