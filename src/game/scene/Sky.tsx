"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import { BackSide, Color, ShaderMaterial, Vector2, Vector3 } from "three";

/*
 * GO's sky (notes/research/gfx-art-direction.md): a fog line at the horizon
 * that rises into a bright haze band, then a mid blue, then the zenith. A
 * stylized sun disc with a soft glow, the real moon's phase at night with
 * twinkling stars, and a band of cartoon clouds hugging the horizon. One
 * draw. The fog uses the same horizon color, so the ground melts into it.
 *
 * Every color lives in `skyLook` and is eased toward the time of day each
 * frame by the World, so switching day and night glides instead of snapping.
 */

export const skyLook = {
  uTop: { value: new Color("#3fa4ee") },
  uMid: { value: new Color("#7cc0f2") },
  uHaze: { value: new Color("#e4f6ff") },
  uFog: { value: new Color("#c6ecf6") },
  uCloudLit: { value: new Color("#ffffff") },
  uCloudShade: { value: new Color("#bccde6") },
  uSunDir: { value: new Vector3(30, 60, 20).normalize() },
  uMoonDir: { value: new Vector3(-0.35, 0.42, -1).normalize() },
  uSunDisc: { value: new Color("#fffbe8") },
  uMoonColor: { value: new Color("#fcf6e0") },
  uNight: { value: 0 },
  uTime: { value: 0 },
  uCloudCover: { value: 0.18 },
  uCloudOffset: { value: new Vector2() },
  uMoonPhase: { value: moonPhase(Date.now()) },
};

/** Where the real moon is in its cycle: 0 new, 0.5 full (reference new moon 2000-01-06). */
function moonPhase(ms: number) {
  const p = (ms / 864e5 - 10962.76) / 29.530588853;
  return p - Math.floor(p);
}

const vertexShader = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uTop, uMid, uHaze, uFog, uSunDir, uMoonDir, uSunDisc, uMoonColor, uCloudLit, uCloudShade;
  uniform float uNight, uTime, uCloudCover, uMoonPhase;
  uniform vec2 uCloudOffset;
  varying vec3 vWorld;

  float hash13(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
  vec2 grad2(vec2 i) { vec3 p = fract(i.xyx * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yzx + 33.33);
    return fract((p.xx + p.yz) * p.zy) * 2.0 - 1.0; }
  float gnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p), u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    return mix(mix(dot(grad2(i), f), dot(grad2(i + vec2(1, 0)), f - vec2(1, 0)), u.x),
               mix(dot(grad2(i + vec2(0, 1)), f - vec2(0, 1)), dot(grad2(i + vec2(1, 1)), f - vec2(1, 1)), u.x), u.y) * 1.6;
  }
  float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int k = 0; k < 4; k++) { s += a * gnoise(p); p = p * 2.03 + 11.7; a *= 0.5; } return s; }

  vec3 skyGradient(vec3 d) {
    float h = max(d.y, 0.0);
    vec3 c = mix(uFog, uHaze, smoothstep(0.0, 0.035, h));
    c = mix(c, uMid, smoothstep(0.035, 0.26, h));
    return mix(c, uTop, smoothstep(0.26, 0.9, h));
  }

  vec3 stars(vec3 d) {
    vec3 p = d * 60.0, cell = floor(p), f = fract(p) - 0.5;
    float h = hash13(cell);
    if (h < 0.94) return vec3(0.0);
    vec3 o = vec3(hash13(cell + 1.7), hash13(cell + 3.1), hash13(cell + 5.3)) - 0.5;
    float r = length(f - o * 0.6), size = mix(0.05, 0.11, hash13(cell + 7.7));
    float twinkle = 0.75 + 0.25 * sin(uTime * (1.3 + 2.0 * h) + h * 50.0);
    vec3 tint = mix(vec3(0.75, 0.85, 1.0), vec3(1.0, 0.94, 0.82), hash13(cell + 9.1));
    return tint * smoothstep(size, 0.0, r) * twinkle * smoothstep(0.04, 0.25, d.y);
  }

  vec4 clouds(vec3 d) {
    if (d.y <= 0.0) return vec4(0.0);
    vec2 uv = d.xz / (d.y + 0.06) * 0.9 + uCloudOffset;
    float n = fbm(uv) * 0.7 + 0.5;
    float edge = 1.0 - uCloudCover;
    float a = smoothstep(edge, edge + 0.08, n);
    float toward = fbm(uv + normalize(uSunDir.xz + 1e-4) * 0.12) * 0.7 + 0.5;
    float shade = clamp((toward - n) * 5.0 + 0.45, 0.0, 1.0);
    shade = max(shade, 1.0 - smoothstep(edge + 0.02, edge + 0.3, n)) * 0.85;
    vec3 col = mix(uCloudLit, uCloudShade, shade);
    float band = smoothstep(0.0, 0.03, d.y) * (1.0 - smoothstep(0.3, 0.75, d.y) * (1.0 - uCloudCover));
    return vec4(col, a * band);
  }

  void main() {
    vec3 d = normalize(vWorld - cameraPosition);
    vec3 c = skyGradient(d);
    float day = 1.0 - uNight;
    // the sun: bigger than life, a soft glow, no lens flare
    float cs = dot(d, uSunDir);
    c += uSunDisc * (0.30 * pow(max(cs, 0.0), 24.0) + 0.55 * pow(max(cs, 0.0), 400.0)) * day;
    c = mix(c, uSunDisc, smoothstep(0.99920, 0.99930, cs) * day);
    // the moon, lit to tonight's phase
    float md = dot(d, uMoonDir);
    if (md > 0.99 && uNight > 0.0) {
      vec3 mx = normalize(cross(vec3(0.0, 1.0, 0.0), uMoonDir)), my = cross(uMoonDir, mx);
      vec2 mp = vec2(dot(d, mx), dot(d, my)) / 0.045;
      float r = length(mp), disc = 1.0 - smoothstep(0.94, 1.0, r);
      vec3 n = vec3(mp, sqrt(max(0.0, 1.0 - r * r)));
      float a = 6.2831853 * uMoonPhase;
      float lit = smoothstep(-0.05, 0.12, dot(n, vec3(sin(a), 0.0, -cos(a))));
      float maria = 0.9 + 0.1 * gnoise(mp * 3.0 + 4.0);
      c = mix(c, uMoonColor * mix(0.12, 1.0, lit) * maria, disc * uNight);
    }
    c += uMoonColor * 0.12 * pow(max(md, 0.0), 900.0) * uNight;
    c += stars(d) * uNight;
    vec4 cl = clouds(d);
    c = mix(c, cl.rgb, cl.a);
    gl_FragColor = vec4(c, 1.0);
    #include <colorspace_fragment>
  }
`;

export function Sky() {
  const material = useMemo(
    () => new ShaderMaterial({ uniforms: skyLook, vertexShader, fragmentShader, side: BackSide, depthWrite: false }),
    [],
  );
  useFrame((_, dt) => {
    skyLook.uTime.value += dt;
    // the clouds drift with a light breeze
    skyLook.uCloudOffset.value.x += dt * 0.004;
    skyLook.uCloudOffset.value.y += dt * 0.0015;
  });
  return (
    <mesh material={material} renderOrder={-100} frustumCulled={false}>
      <sphereGeometry args={[900, 48, 24]} />
    </mesh>
  );
}
