"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CanvasTexture, Color, type Group, type InstancedMesh, type MeshLambertMaterial, Object3D, SRGBColorSpace } from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { random } from "../geometry";
import { town } from "./fade";
import { useOutOfTheWay } from "./objects/outOfTheWay";

/*
 * The working harbor (notes/research/gfx-landmarks.md 1.3, 1.5): a ferry in
 * the S.S. Anne's style berthed along the pier's deck (white tiered decks,
 * orange pinstripes, one orange funnel with a dark top, smoke drifting up),
 * Hulbury's little white fishing boats moored at a pontoon with orange and
 * blue sail covers, and at the Seaport's working edge an orange gantry crane
 * in Slateport's colors over a yard of containers in the town's roof colors.
 * Everything rides the swell a little. The ferry's windows light at night.
 */

const WHITE = "#f4f1ea";
const ORANGE = "#e8743a";
const GLASS = "#6ab4c4";
const rounded = (w: number, h: number, d: number, r: number) => new RoundedBoxGeometry(w, h, d, 3, r);

/** The ferry's name on its bow, in white on the hull. */
function nameTexture(name: string) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 96;
  const g = c.getContext("2d")!;
  g.fillStyle = "#ffffff";
  g.textAlign = "center";
  g.textBaseline = "middle";
  const family = getComputedStyle(document.documentElement).getPropertyValue("--font-lato") || "sans-serif";
  g.font = `900 64px ${family}`;
  g.fillText(name, 256, 50);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

/** The ferry is the S.S. Anne, Vermilion's own (include then prune: an original name works too). */
const FERRY_NAME = "S.S. ANNE";

function Ferry() {
  const root = useRef<Group>(null);
  const ship = useRef<Group>(null);
  const smoke = useRef<Group>(null);
  const windows = useRef<(MeshLambertMaterial | null)[]>([]);
  const [label, setLabel] = useState<CanvasTexture | null>(null);
  useEffect(() => {
    let live = true;
    let made: CanvasTexture | null = null;
    document.fonts.ready.then(() => {
      if (!live) return;
      made = nameTexture(FERRY_NAME);
      setLabel(made);
    });
    return () => {
      live = false;
      made?.dispose();
    };
  }, []);
  const geo = useMemo(
    () => ({
      hull: rounded(34, 3.2, 8.5, 1.4),
      tier: [rounded(26, 1.8, 6.5, 0.6), rounded(19, 1.8, 5.5, 0.6), rounded(11, 1.8, 4.5, 0.6)],
    }),
    [],
  );
  // it's big: it dithers away when it's between the camera and the trainer, like the gyms
  useOutOfTheWay(root, 108, 10.8, 5.5, 30);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (ship.current) {
      ship.current.position.y = Math.sin((t / 7) * Math.PI * 2) * 0.03;
      ship.current.rotation.x = Math.sin((t / 7) * Math.PI * 2 + 1) * 0.01;
    }
    smoke.current?.children.forEach((p, i) => {
      const k = ((t * 0.25 + i / 6) % 1 + 1) % 1;
      p.position.set(-k * 1.5, k * 3.2, Math.sin(i * 2.1) * 0.3 * k);
      p.scale.setScalar(0.4 + k * 1.2);
      ((p as unknown as { material: MeshLambertMaterial }).material).opacity = 0.55 * (1 - k);
    });
    for (const w of windows.current) if (w) w.emissiveIntensity = town.uNight.value * 1.3;
  });
  return (
    <group ref={root} position={[108, 0, 10.8]}>
      <group ref={ship}>
        {/* the hull: white, a blue waterline band, an orange pinstripe */}
        <mesh geometry={geo.hull} position-y={0.6} castShadow receiveShadow>
          <meshLambertMaterial color={WHITE} />
        </mesh>
        <mesh position-y={-0.55}>
          <boxGeometry args={[33.4, 0.5, 8.3]} />
          <meshLambertMaterial color="#3a6fc0" />
        </mesh>
        <mesh position-y={1.7}>
          <boxGeometry args={[34.05, 0.14, 8.55]} />
          <meshLambertMaterial color={ORANGE} />
        </mesh>
        {/* the wood bow deck */}
        <mesh position={[12, 2.21, 0]}>
          <boxGeometry args={[9, 0.04, 7.2]} />
          <meshLambertMaterial color="#c8935f" />
        </mesh>
        {/* three tiers of rounded superstructure, set in from the hull */}
        {geo.tier.map((g, i) => (
          <group key={i} position={[-2 - i * 2.2, 3.1 + i * 1.8, 0]}>
            <mesh geometry={g} castShadow>
              <meshLambertMaterial color={WHITE} />
            </mesh>
            <mesh position-y={0.25}>
              <boxGeometry args={[g.parameters.width - 0.6, 0.5, g.parameters.depth + 0.04]} />
              <meshLambertMaterial ref={(m) => {
                  windows.current[i] = m;
                }} color={GLASS} emissive="#ffd38a" emissiveIntensity={0} />
            </mesh>
            <mesh position-y={-0.82}>
              <boxGeometry args={[g.parameters.width + 0.04, 0.1, g.parameters.depth + 0.04]} />
              <meshLambertMaterial color={ORANGE} />
            </mesh>
          </group>
        ))}
        {/* the funnel, 60% of the way back, and its smoke */}
        <group position={[-8.4, 8.4, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[1.6, 2, 3, 24]} />
            <meshLambertMaterial color={ORANGE} />
          </mesh>
          <mesh position-y={1.6}>
            <cylinderGeometry args={[1.62, 1.62, 0.5, 24]} />
            <meshLambertMaterial color="#2a2a30" />
          </mesh>
          <group ref={smoke} position-y={2}>
            {Array.from({ length: 6 }, (_, i) => (
              <mesh key={i}>
                <sphereGeometry args={[0.6, 12, 8]} />
                <meshLambertMaterial color="#e8e8ec" transparent opacity={0.4} depthWrite={false} />
              </mesh>
            ))}
          </group>
        </group>
        {/* the name on the bow, both sides */}
        {label
          ? [1, -1].map((s) => (
              <mesh key={s} position={[11, 0.8, s * 4.27]} rotation-y={s > 0 ? 0 : Math.PI}>
                <planeGeometry args={[7, 1.3]} />
                <meshBasicMaterial map={label} alphaTest={0.5} />
              </mesh>
            ))
          : null}
      </group>
      {/* the gangway, from the pier's deck up to the ship's, with its rails */}
      <group position={[-2, 1.15, -4.95]} rotation-x={-0.59}>
        <mesh>
          <boxGeometry args={[1.2, 0.1, 4.1]} />
          <meshLambertMaterial color="#e6ecec" />
        </mesh>
        {[-0.58, 0.58].map((x) => (
          <group key={x} position-x={x}>
            <mesh position-y={0.5}>
              <boxGeometry args={[0.06, 0.06, 4.1]} />
              <meshLambertMaterial color={WHITE} />
            </mesh>
            {[-1.9, 0, 1.9].map((z) => (
              <mesh key={z} position={[0, 0.25, z]}>
                <boxGeometry args={[0.05, 0.5, 0.05]} />
                <meshLambertMaterial color={WHITE} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </group>
  );
}

/** Five little Hulbury boats moored at a pontoon north of the pier, bows out. */
const SLIPS = [-15, -20, -25, -30, -35];

function FishingBoats() {
  const boats = useRef<Group>(null);
  const geo = useMemo(() => ({ hull: rounded(5.4, 0.9, 2, 0.4), cabin: rounded(1.6, 0.75, 1.3, 0.15) }), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    boats.current?.children.forEach((b, i) => {
      const k = (t / 3.4) * Math.PI * 2 + i * 1.3;
      b.position.y = Math.sin(k) * 0.06;
      b.rotation.z = Math.sin(k + 0.5) * 0.035;
      b.rotation.x = Math.sin(k * 0.7) * 0.02;
    });
  });
  return (
    <group>
      {/* the pontoon, planked like the pier, and the walk out to it */}
      <mesh position={[91, 0.12, -25]} receiveShadow>
        <boxGeometry args={[1.6, 0.24, 26]} />
        <meshLambertMaterial color="#c8935f" />
      </mesh>
      <mesh position={[87.6, 0.12, -25]} receiveShadow>
        <boxGeometry args={[5.4, 0.24, 1.4]} />
        <meshLambertMaterial color="#c8935f" />
      </mesh>
      <group ref={boats}>
        {SLIPS.map((z, i) => (
          <group key={z} position={[94.6, 0, z]}>
            <mesh geometry={geo.hull} position-y={0.35} castShadow>
              <meshLambertMaterial color={WHITE} />
            </mesh>
            <mesh position-y={0.02}>
              <boxGeometry args={[5.2, 0.12, 1.9]} />
              <meshLambertMaterial color="#3a6fc0" />
            </mesh>
            <mesh position-y={0.82}>
              <boxGeometry args={[4.8, 0.06, 1.7]} />
              <meshLambertMaterial color="#c8935f" />
            </mesh>
            <mesh geometry={geo.cabin} position={[-0.4, 1.2, 0]} castShadow>
              <meshLambertMaterial color={WHITE} />
            </mesh>
            <mesh position={[-0.4, 1.25, 0]}>
              <boxGeometry args={[1.62, 0.25, 1.32]} />
              <meshLambertMaterial color={GLASS} />
            </mesh>
            <mesh position={[0.6, 2.4, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 3.2, 6]} />
              <meshLambertMaterial color="#d8d8d0" />
            </mesh>
            {/* the colored sail cover on the boom: what reads from above */}
            <mesh position={[-0.45, 1.7, 0]} rotation-z={Math.PI / 2}>
              <capsuleGeometry args={[0.13, 1.9, 4, 8]} />
              <meshLambertMaterial color={i % 2 ? "#3a7fd0" : "#e88a3a"} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

/** Slateport's orange gantry crane on the quay, its trolley running out over the water and back. */
function Crane() {
  const trolley = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (trolley.current) trolley.current.position.x = 4 + (Math.sin((clock.elapsedTime / 20) * Math.PI * 2) * 0.5 + 0.5) * 9;
  });
  const legs: [number, number][] = [
    [-3, -2.5],
    [3, -2.5],
    [-3, 2.5],
    [3, 2.5],
  ];
  return (
    <group position={[81, 0, -108]}>
      {legs.map(([x, z]) => (
        <group key={`${x}${z}`} position={[x, 0, z]}>
          <mesh position-y={4.5} castShadow>
            <boxGeometry args={[0.6, 9, 0.6]} />
            <meshLambertMaterial color="#d65a24" />
          </mesh>
          {[0.25, 0.75, 1.25].map((y, i) => (
            <mesh key={y} position-y={y}>
              <boxGeometry args={[0.64, 0.5, 0.64]} />
              <meshLambertMaterial color={i % 2 ? "#f1ece6" : "#e0453a"} />
            </mesh>
          ))}
        </group>
      ))}
      {[-2.5, 2.5].map((z) => (
        <mesh key={z} position={[0, 9, z]} castShadow>
          <boxGeometry args={[6.6, 0.8, 0.8]} />
          <meshLambertMaterial color="#d65a24" />
        </mesh>
      ))}
      <mesh position={[5, 10, 0]} castShadow>
        <boxGeometry args={[24, 0.9, 0.9]} />
        <meshLambertMaterial color="#d65a24" />
      </mesh>
      <mesh position={[-5.5, 11, 0]} castShadow>
        <boxGeometry args={[3, 2, 3]} />
        <meshLambertMaterial color="#f1ece6" />
      </mesh>
      <group ref={trolley} position={[8, 9.2, 0]}>
        <mesh>
          <boxGeometry args={[1.4, 1, 1.4]} />
          <meshLambertMaterial color="#3d4655" />
        </mesh>
        {[-0.3, 0.3].map((z) => (
          <mesh key={z} position={[0, -2.5, z]}>
            <cylinderGeometry args={[0.03, 0.03, 4.4, 4]} />
            <meshLambertMaterial color="#3d4655" />
          </mesh>
        ))}
        <mesh position-y={-4.8}>
          <boxGeometry args={[2.6, 0.4, 1.2]} />
          <meshLambertMaterial color="#f2c230" />
        </mesh>
      </group>
    </group>
  );
}

/** A yard of containers by the crane, stacked one to three high, in the town's roof colors. */
function Containers() {
  const mesh = useRef<InstancedMesh>(null);
  const boxes = useMemo(() => {
    const rand = random(31);
    const out: { x: number; y: number; z: number; c: string }[] = [];
    const colors = ["#b24c49", "#2a6fa6", "#4d745d", "#e88e47", "#e8e2d4"];
    for (let row = 0; row < 3; row++)
      for (let col = 0; col < 3; col++) {
        const h = 1 + Math.floor(rand() * 3);
        for (let k = 0; k < h; k++) out.push({ x: 66 + col * 2.7, y: 1.2 + k * 2.42, z: -114 + row * 6.4, c: colors[Math.floor(rand() * colors.length)] });
      }
    return out;
  }, []);
  const ribbed = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 8;
    const g = c.getContext("2d")!;
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, 64, 8);
    g.fillStyle = "#d8d8d8";
    for (let x = 0; x < 64; x += 4) g.fillRect(x, 0, 2, 8);
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    return t;
  }, []);
  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const o = new Object3D();
    const c = new Color();
    boxes.forEach((b, i) => {
      o.position.set(b.x, b.y, b.z);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, c.set(b.c));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [boxes]);
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, boxes.length]} castShadow receiveShadow>
      <boxGeometry args={[2.4, 2.4, 6]} />
      <meshLambertMaterial map={ribbed} />
    </instancedMesh>
  );
}

export function Harbor() {
  return (
    <>
      <Ferry />
      <FishingBoats />
      <Crane />
      <Containers />
    </>
  );
}
