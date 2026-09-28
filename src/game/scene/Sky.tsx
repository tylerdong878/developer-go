"use client";

import { useEffect, useMemo } from "react";
import { BackSide, BufferGeometry, Color, Float32BufferAttribute, ShaderMaterial } from "three";
import { random } from "../geometry";

const vertexShader = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

// Horizon color at eye level fading up to the top color, like GO's sky.
// The fog uses the horizon color, so the ground melts into the sky.
const fragmentShader = /* glsl */ `
  uniform vec3 top;
  uniform vec3 horizon;
  varying vec3 vWorld;
  void main() {
    float h = normalize(vWorld - cameraPosition).y;
    gl_FragColor = vec4(mix(horizon, top, pow(clamp(h * 1.8, 0.0, 1.0), 0.7)), 1.0);
    #include <colorspace_fragment>
  }
`;

export function Sky({ top, horizon, stars }: { top: string; horizon: string; stars: boolean }) {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { top: { value: new Color() }, horizon: { value: new Color() } },
        vertexShader,
        fragmentShader,
        side: BackSide,
        depthWrite: false,
      }),
    [],
  );
  useEffect(() => {
    material.uniforms.top.value.set(top);
    material.uniforms.horizon.value.set(horizon);
  }, [material, top, horizon]);

  return (
    <>
      <mesh material={material} renderOrder={-100} frustumCulled={false}>
        <sphereGeometry args={[900, 32, 16]} />
      </mesh>
      {stars ? <Stars /> : null}
    </>
  );
}

function Stars() {
  const geometry = useMemo(() => {
    const rand = random(74);
    const positions: number[] = [];
    for (let i = 0; i < 420; i++) {
      const a = rand() * Math.PI * 2;
      const up = 0.08 + rand() * 0.92; // above the horizon only
      const flat = Math.sqrt(1 - up * up);
      positions.push(850 * flat * Math.cos(a), 850 * up, 850 * flat * Math.sin(a));
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(positions, 3));
    return g;
  }, []);
  return (
    <points geometry={geometry} renderOrder={-99} frustumCulled={false}>
      <pointsMaterial size={2.2} sizeAttenuation={false} color="#ffffff" transparent opacity={0.8} depthWrite={false} fog={false} />
    </points>
  );
}
