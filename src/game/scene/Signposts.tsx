"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { BoxGeometry, CanvasTexture, CylinderGeometry, type InstancedMesh, Object3D, SRGBColorSpace, SphereGeometry } from "three";
import { fences, type Signpost, signposts } from "../props";

const FRAME = "#e6ecec";
const box = new BoxGeometry(1, 1, 1);
const knob = new SphereGeometry(1, 12, 8);
const crest = new CylinderGeometry(1, 1, 1, 24, 1, false, -Math.PI / 2, Math.PI).rotateX(-Math.PI / 2); // a half disc, rounded side up

/** Wraps text into lines that fit a width. */
function wrap(g: CanvasRenderingContext2D, text: string, width: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (g.measureText(next).width > width && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  return [...lines, line];
}

/** The sign's face: the games' two-line format, title on a band (cream for the town, blue for routes and tips). */
function drawFace(sign: Signpost) {
  const family = getComputedStyle(document.documentElement).getPropertyValue("--font-lato") || "sans-serif";
  const town = sign.kind === "town";
  const c = document.createElement("canvas");
  c.width = town ? 640 : 400;
  c.height = town ? 300 : 320;
  const g = c.getContext("2d")!;
  g.fillStyle = "#eef0ec";
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = town ? "#ece8d2" : "#3a6fc0";
  g.fillRect(0, 0, c.width, town ? 92 : 80);
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillStyle = town ? "#5a4a2a" : "#ffffff";
  g.font = `900 ${town ? 52 : 46}px ${family}`;
  g.fillText(sign.title, c.width / 2, town ? 48 : 42);
  g.fillStyle = "#2f3c3e";
  g.font = `700 ${town ? 46 : 36}px ${family}`;
  const lines = wrap(g, sign.text, c.width - 50);
  const top = (town ? 92 : 80) + (c.height - (town ? 92 : 80)) / 2 - ((lines.length - 1) * (town ? 54 : 42)) / 2;
  lines.forEach((l, i) => g.fillText(l, c.width / 2, top + i * (town ? 54 : 42)));
  if (town) {
    // the little colored tags along the bottom
    ["#e05a4e", "#3a6fc0", "#4f9a45"].forEach((color, i) => {
      g.fillStyle = color;
      g.fillRect(c.width / 2 - 90 + i * 64, c.height - 40, 52, 16);
    });
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function Sign({ sign }: { sign: Signpost }) {
  const [face, setFace] = useState<CanvasTexture | null>(null);
  useEffect(() => {
    let live = true;
    let made: CanvasTexture | null = null;
    document.fonts.ready.then(() => {
      if (!live) return;
      made = drawFace(sign);
      setFace(made);
    });
    return () => {
      live = false;
      made?.dispose();
    };
  }, [sign]);

  if (sign.kind === "town") {
    // a wide board on two square posts with knob caps, an arched crest with a gold band over the middle
    const W = 3.2;
    const H = 1.5;
    const y = 1.55;
    return (
      <group position={[sign.at[0], 0, sign.at[1]]} rotation-y={sign.turn}>
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh geometry={box} position={[(s * (W + 0.25)) / 2, 1.2, 0]} scale={[0.22, 2.4, 0.22]} castShadow>
              <meshLambertMaterial color={FRAME} />
            </mesh>
            <mesh geometry={knob} position={[(s * (W + 0.25)) / 2, 2.48, 0]} scale={0.15}>
              <meshLambertMaterial color={FRAME} />
            </mesh>
          </group>
        ))}
        <mesh geometry={box} position={[0, y, -0.02]} scale={[W + 0.2, H + 0.2, 0.14]} castShadow>
          <meshLambertMaterial color={FRAME} />
        </mesh>
        <mesh geometry={crest} position={[0, y + H / 2 + 0.05, -0.02]} scale={[0.75, 0.55, 0.14]}>
          <meshLambertMaterial color={FRAME} />
        </mesh>
        <mesh geometry={crest} position={[0, y + H / 2 + 0.05, 0.06]} scale={[0.52, 0.38, 0.02]}>
          <meshLambertMaterial color="#cdb66c" />
        </mesh>
        {face ? (
          <mesh position={[0, y, 0.06]}>
            <planeGeometry args={[W, H]} />
            <meshLambertMaterial map={face} />
          </mesh>
        ) : null}
      </group>
    );
  }
  // route signs and Trainer Tips: a white plate with a blue header on a single post
  return (
    <group position={[sign.at[0], 0, sign.at[1]]} rotation-y={sign.turn}>
      <mesh geometry={box} position={[0, 0.7, 0]} scale={[0.16, 1.4, 0.16]} castShadow>
        <meshLambertMaterial color={FRAME} />
      </mesh>
      <mesh geometry={box} position={[0, 1.75, -0.02]} scale={[1.6, 1.3, 0.1]} castShadow>
        <meshLambertMaterial color={FRAME} />
      </mesh>
      {face ? (
        <mesh position={[0, 1.75, 0.04]}>
          <planeGeometry args={[1.45, 1.16]} />
          <meshLambertMaterial map={face} />
        </mesh>
      ) : null}
    </group>
  );
}

/** Kanto's white post-and-rail fence: square posts with round caps, two rails. */
function Fences() {
  const posts = useRef<InstancedMesh>(null);
  const caps = useRef<InstancedMesh>(null);
  const rails = useRef<InstancedMesh>(null);
  const layout = useMemo(() => {
    const p: [number, number][] = [];
    const r: { x: number; z: number; len: number; turn: number; y: number }[] = [];
    for (const [a, b] of fences) {
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const n = Math.max(1, Math.round(len / 1.6));
      for (let i = 0; i <= n; i++) p.push([a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n]);
      const turn = Math.atan2(b[0] - a[0], b[1] - a[1]);
      for (const y of [0.42, 0.78]) r.push({ x: (a[0] + b[0]) / 2, z: (a[1] + b[1]) / 2, len, turn, y });
    }
    return { p, r };
  }, []);
  useLayoutEffect(() => {
    const o = new Object3D();
    layout.p.forEach(([x, z], i) => {
      o.position.set(x, 0.5, z);
      o.scale.set(0.16, 1, 0.16);
      o.rotation.set(0, 0, 0);
      o.updateMatrix();
      posts.current?.setMatrixAt(i, o.matrix);
      o.position.set(x, 1.02, z);
      o.scale.setScalar(0.11);
      o.updateMatrix();
      caps.current?.setMatrixAt(i, o.matrix);
    });
    layout.r.forEach(({ x, z, len, turn, y }, i) => {
      o.position.set(x, y, z);
      o.rotation.set(0, turn, 0);
      o.scale.set(0.08, 0.1, len);
      o.updateMatrix();
      rails.current?.setMatrixAt(i, o.matrix);
    });
    for (const m of [posts.current, caps.current, rails.current]) {
      if (!m) continue;
      m.instanceMatrix.needsUpdate = true;
      m.computeBoundingSphere();
    }
  }, [layout]);
  return (
    <>
      <instancedMesh ref={posts} args={[box, undefined, layout.p.length]} castShadow>
        <meshLambertMaterial color="#e6efea" />
      </instancedMesh>
      <instancedMesh ref={caps} args={[knob, undefined, layout.p.length]}>
        <meshLambertMaterial color="#e6efea" />
      </instancedMesh>
      <instancedMesh ref={rails} args={[box, undefined, layout.r.length]} castShadow>
        <meshLambertMaterial color="#e6efea" />
      </instancedMesh>
    </>
  );
}

/** The town sign, route signs, Trainer Tips, and the white fences at home. */
export function Signposts() {
  return (
    <>
      {signposts.map((s) => (
        <Sign key={`${s.title}${s.at[0]}`} sign={s} />
      ))}
      <Fences />
    </>
  );
}
