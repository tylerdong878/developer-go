"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import {
  AdditiveBlending,
  CanvasTexture,
  CylinderGeometry,
  DoubleSide,
  type Group,
  LatheGeometry,
  type Mesh,
  type MeshBasicMaterial,
  type MeshLambertMaterial,
  OctahedronGeometry,
  SRGBColorSpace,
  type Sprite,
  TorusGeometry,
  Vector2,
} from "three";
import type { Gym as GymContent, Raid as RaidContent } from "@/content";
import { INSTINCT, MYSTIC, MYSTIC_GLOW, RAID_EGG as EGG, VALOR } from "../../colors";
import { progressStore } from "../../progress";
import { HATCH, RAID_BOSS } from "../../raidBosses";
import { POKEMON_3D } from "../pokemon/models";
import { Shadow } from "../Shadow";
import { critterSize } from "./Critter";
import { Nameplate } from "./Nameplate";
import { useOutOfTheWay } from "./outOfTheWay";
import { hover, tapObject } from "./tap";

/*
 * GO's gym, rebuilt from captures (notes/research/gfx-go-gyms-stops.md 3.x).
 * Top to bottom: a team-colored diamond floating high (the gym's Photo Disc),
 * the defender standing on a dish platform, four curved team fins around its
 * rim, broken white rings orbiting, three team pillars round a dark core
 * (the tall form), then a wide white drum like a spinning top, with a team
 * band, lamps throwing short beams and the green Poké Ball "target" on top,
 * all floating on one thin team-colored pole. Built in stop-pole units and
 * scaled up, so the platform sits about 5.5 up.
 *
 * Jobs are Team Mystic gyms (Tyler's team) with a defender on top. Raids
 * (hackathons) sit on gyms of all three teams: the egg stands on the platform
 * where the defender would, with a round orange raid badge over it. The first
 * time you walk up, it hatches, and its boss stays on the platform after.
 */

const G = 2.3;
const WHITE = "#ffffff";
const CORE = "#374049";

/** Which of Tyler's Pokémon defends each job's gym (include then prune). */
const DEFENDER: Record<string, number> = { aws: 25, philips: 7, khoury: 1, tetracorp: 4, quartzy: 54, outamation: 100, homegoods: 39 };
/** The big jobs get the tall form with pillars; the rest are compact. */
const TALL = new Set(["aws", "philips", "khoury"]);
const RAID_TEAMS = [VALOR, INSTINCT, MYSTIC];

/** Short names for the map, so nameplates stay small. */
const SHORT: Record<string, string> = {
  "Amazon Web Services (AWS)": "AWS",
  "Khoury College of Computer Sciences": "Khoury TA",
  "Quartzy Capital Advisors, LLC": "Quartzy",
};

const smooth = 56;
const ringArc = (r: number, tube: number) => new TorusGeometry(r, tube, 6, 40, 1.7);
const ARCS = { a: ringArc(1.25, 0.025), b: ringArc(0.8, 0.02), mid: new TorusGeometry(0.6, 0.02, 6, 64, 5.2) };
const finGeometry = new CylinderGeometry(0.72, 0.55, 0.45, 12, 1, true, -0.3, 0.6);
const diamond = new OctahedronGeometry(1, 0);
/** GO's raid egg: blunt on top, widest a bit under the middle (width 0.84 of the height). */
const eggGeometry = new LatheGeometry(
  [
    [0, 0],
    [0.28, 0.1],
    [0.36, 0.2],
    [0.4, 0.3],
    [0.42, 0.4],
    [0.41, 0.5],
    [0.38, 0.6],
    [0.34, 0.7],
    [0.28, 0.8],
    [0.21, 0.9],
    [0.1, 0.97],
    [0, 1],
  ].map(([r, y]) => new Vector2(Math.max(r, 0.001), y)),
  40,
);

const canvasTexture = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  return t;
};
const cache = new Map<string, CanvasTexture>();
const cached = (key: string, make: () => CanvasTexture) => {
  let t = cache.get(key);
  if (!t) cache.set(key, (t = make()));
  return t;
};

/** The drum's emblem: a dark green disc with a white Poké Ball and small yellow triangles round it. */
const emblemTexture = () =>
  cached("emblem", () =>
    canvasTexture(256, 256, (g) => {
      g.fillStyle = "#f3f3f3";
      g.beginPath();
      g.arc(128, 128, 128, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#0a5410";
      g.beginPath();
      g.arc(128, 128, 116, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#fffa39";
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        g.save();
        g.translate(128 + Math.cos(a) * 92, 128 + Math.sin(a) * 92);
        g.rotate(a + Math.PI / 2);
        g.beginPath();
        g.moveTo(0, -12);
        g.lineTo(11, 9);
        g.lineTo(-11, 9);
        g.fill();
        g.restore();
      }
      g.strokeStyle = "#f3f3f3";
      g.lineWidth = 12;
      g.beginPath();
      g.arc(128, 128, 54, 0, Math.PI * 2);
      g.stroke();
      g.beginPath();
      g.moveTo(74, 128);
      g.lineTo(182, 128);
      g.stroke();
      g.fillStyle = "#f3f3f3";
      g.beginPath();
      g.arc(128, 128, 16, 0, Math.PI * 2);
      g.fill();
    }),
  );

/** GO's gym symbol: a Poké Ball whose right side runs out into a point, white with the team color on top. */
const symbolTexture = (team: string) =>
  cached(`symbol${team}`, () =>
    canvasTexture(256, 256, (g) => {
      const ball = () => {
        g.beginPath();
        g.arc(116, 128, 76, Math.PI * 0.25, Math.PI * 1.75);
        g.lineTo(230, 128);
        g.closePath();
      };
      g.fillStyle = "#ffffff";
      ball();
      g.fill();
      g.save();
      ball();
      g.clip();
      g.fillStyle = team;
      g.fillRect(0, 0, 256, 128);
      g.restore();
      g.strokeStyle = "#1f2a3a";
      g.lineWidth = 10;
      ball();
      g.stroke();
      g.beginPath();
      g.moveTo(40, 128);
      g.lineTo(230, 128);
      g.stroke();
      g.fillStyle = "#ffffff";
      g.beginPath();
      g.arc(116, 128, 22, 0, Math.PI * 2);
      g.fill();
      g.stroke();
    }),
  );

/** A raid egg's painted shell, per tier: pink waves, white clouds on gold, silver swirls on navy. */
const eggTexture = (stars: 1 | 3 | 5) =>
  cached(`egg${stars}`, () =>
    canvasTexture(256, 256, (g) => {
      const look = {
        1: { base: ["#f1bfd2", "#ed6698"], mark: "#ef1184" },
        3: { base: ["#efc348", "#dbb90b"], mark: "#f4f2e8" },
        5: { base: ["#5b7a94", "#243443"], mark: "#dddff0" },
      }[stars];
      const grad = g.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0, look.base[0]);
      grad.addColorStop(1, look.base[1]);
      g.fillStyle = grad;
      g.fillRect(0, 0, 256, 256);
      g.fillStyle = look.mark;
      g.strokeStyle = look.mark;
      if (stars === 1) {
        g.lineWidth = 14;
        for (const y of [70, 130, 190]) {
          g.globalAlpha = 0.55;
          g.beginPath();
          for (let x = 0; x <= 256; x += 8) g.lineTo(x, y + Math.sin((x / 256) * Math.PI * 4) * 12);
          g.stroke();
        }
      } else if (stars === 3) {
        for (let i = 0; i < 9; i++) {
          const x = (i * 61) % 256;
          const y = 40 + ((i * 97) % 180);
          g.beginPath();
          for (const [dx, dy, r] of [
            [0, 0, 20],
            [18, 4, 15],
            [-16, 6, 13],
          ])
            g.arc(x + dx, y + dy, r, 0, Math.PI * 2);
          g.fill();
        }
      } else {
        g.lineWidth = 10;
        for (let i = 0; i < 4; i++) {
          g.globalAlpha = 0.75;
          g.beginPath();
          for (let x = 0; x <= 256; x += 6) g.lineTo(x, 30 + i * 60 + Math.sin((x / 256) * Math.PI * 2 + i) * 22);
          g.stroke();
        }
      }
      g.globalAlpha = 1;
    }),
  );

/** The round raid badge over a raid gym, with its placing (or the stars) in a pill under it. */
const badgeTexture = (label: string) =>
  cached(`badge${label}`, () =>
    canvasTexture(256, 320, (g) => {
      g.fillStyle = "#f16130";
      g.beginPath();
      g.arc(128, 118, 104, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#f7793f";
      g.beginPath();
      g.arc(128, 118, 90, 0, Math.PI * 2);
      g.fill();
      // the raid face: a horned mask
      g.fillStyle = "#ffffff";
      g.beginPath();
      g.moveTo(70, 70);
      g.quadraticCurveTo(84, 104, 104, 100);
      g.lineTo(152, 100);
      g.quadraticCurveTo(172, 104, 186, 70);
      g.quadraticCurveTo(196, 130, 170, 162);
      g.quadraticCurveTo(128, 190, 86, 162);
      g.quadraticCurveTo(60, 130, 70, 70);
      g.fill();
      g.fillStyle = "#f7793f";
      g.beginPath();
      g.ellipse(104, 132, 13, 9, -0.3, 0, Math.PI * 2);
      g.ellipse(152, 132, 13, 9, 0.3, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#f16130";
      g.beginPath();
      g.roundRect(28, 236, 200, 66, 33);
      g.fill();
      g.fillStyle = "#ffffff";
      g.font = "900 40px sans-serif";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(label, 128, 271);
    }),
  );

/** GO's pop: overshoots a little and settles. */
const backOut = (k: number) => (k <= 0 ? 0 : k >= 1 ? 1 : 1 + 2.70158 * (k - 1) ** 3 + 1.70158 * (k - 1) ** 2);

/** "1st of 49" reads "1ST", "Best Design" reads "WIN", "top 5" reads "TOP 5"; otherwise the stars. */
function placing(raid: RaidContent) {
  const r = raid.result ?? "";
  const nth = r.match(/\b(\d+)(st|nd|rd|th)\b/i);
  if (nth) return `${nth[1]}${nth[2]}`.toUpperCase();
  const top = r.match(/top (\d+)/i);
  if (top) return `TOP ${top[1]}`;
  if (/best|winner|won/i.test(r)) return "WIN";
  return "★".repeat(raid.stars);
}

type Props = { x: number; z: number; index?: number } & ({ gym: GymContent } | { raid: RaidContent });

export function Gym(props: Props) {
  const { x, z } = props;
  const raid = "raid" in props ? props.raid : null;
  const slug = raid ? raid.slug : "gym" in props ? props.gym.slug : "";
  const team = raid ? RAID_TEAMS[(props.index ?? 0) % RAID_TEAMS.length] : MYSTIC;
  const tall = !raid && TALL.has(slug);
  const dex = raid ? null : (DEFENDER[slug] ?? 25);
  const Defender = dex ? POKEMON_3D[dex] : null;
  const boss = raid ? RAID_BOSS[raid.slug] : undefined;
  const Boss = boss ? POKEMON_3D[boss.dex] : null;
  // bosses stand bigger than defenders, like GO's, with a floor so small ones still read as bosses and a cap so the camera still sees the top
  const bossScale = boss ? Math.min(Math.max(critterSize(boss.dex) * 1.5, 3.4), 4.6) / G : 1;
  const bossBadge = Math.max(3.75, 2.45 + (boss?.hover ?? 0) + bossScale + 0.45);
  /** How far the top (platform, crown, rings, marker) sits above the drum. */
  const top = tall ? 0 : -1.13;
  const marker = (tall ? 3.9 : 2.9) + (raid ? 0.3 : 0);

  const root = useRef<Group>(null);
  useOutOfTheWay(root, x, z, 3.2);
  const spin = useRef<Group>(null);
  const counter = useRef<Group>(null);
  const gem = useRef<Group>(null);
  const defender = useRef<Group>(null);
  const symbol = useRef<Group>(null);
  const egg = useRef<Group>(null);
  const shell = useRef<MeshLambertMaterial>(null);
  const flash = useRef<Mesh>(null);
  const bossRef = useRef<Group>(null);
  const badge = useRef<Sprite>(null);
  /** When this raid hatched (on the clock), or -Infinity if it already had before this visit. */
  const hatch = useRef<{ from: number | null; seen: boolean | null }>({ from: null, seen: null });
  // the boss only loads once its egg hatches, so the map doesn't mesh eight bosses nobody's seen yet
  const [hatched, setHatched] = useState(false);

  const textures = useMemo(
    () => ({
      emblem: emblemTexture(),
      symbol: symbolTexture(team),
      egg: raid ? eggTexture(raid.stars) : null,
      badge: raid ? badgeTexture(placing(raid)) : null,
    }),
    [team, raid],
  );

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + x * 0.13;
    if (spin.current) spin.current.rotation.y = t * 0.45;
    if (counter.current) counter.current.rotation.y = -t * 0.3;
    if (gem.current) {
      gem.current.rotation.y = t * 1.2;
      gem.current.position.y = marker + Math.sin(t * 1.6) * 0.05;
    }
    // the top swaps the defender and the gym symbol now and then, like GO
    const showSymbol = (t % 9) > 7.6;
    const k = showSymbol ? 1 : 0;
    if (defender.current) defender.current.scale.setScalar(1 - k);
    if (symbol.current) symbol.current.scale.setScalar(Defender ? k : 1);
    // GO's hatch (notes/research/gfx-go-gyms-stops.md 4.4): the egg shakes harder and glows, a white flash, the boss pops up
    const h = hatch.current;
    const done = !!Boss && progressStore.get().hatched.includes(slug);
    if (h.seen !== done) {
      h.from = done ? (h.seen === null ? -Infinity : clock.elapsedTime) : null;
      h.seen = done;
      if (done) setHatched(true);
    }
    const since = h.from === null ? -1 : clock.elapsedTime - h.from;
    const shake = since >= 0 && since < HATCH.shake ? since / HATCH.shake : 0;
    if (egg.current) {
      egg.current.visible = since < HATCH.shake;
      const s = shake > 0 ? since : 0;
      egg.current.rotation.set(Math.sin(s * 26) * 0.18 * shake, t * 0.4, Math.cos(s * 21) * 0.14 * shake);
      egg.current.position.y = 2.45 + Math.abs(Math.sin(t * 1.3)) * 0.04 + shake * 0.06;
    }
    if (shell.current) shell.current.emissiveIntensity = 0.12 + shake * shake * 1.4;
    const f = (since - HATCH.shake) / HATCH.flash;
    if (flash.current) {
      flash.current.visible = f > 0 && f < 1;
      if (flash.current.visible) {
        flash.current.scale.setScalar(0.5 + f * 1.8);
        (flash.current.material as MeshBasicMaterial).opacity = 1 - f * f;
      }
    }
    const rise = Math.min(1, Math.max(0, (since - HATCH.shake - HATCH.flash * 0.3) / HATCH.rise));
    if (bossRef.current) {
      bossRef.current.visible = rise > 0;
      bossRef.current.scale.setScalar(backOut(rise));
      bossRef.current.position.y = 2.45 + (boss?.hover ? boss.hover + Math.sin(t * 1.4) * 0.05 : 0);
    }
    if (badge.current) badge.current.position.y = 3.75 + (bossBadge - 3.75) * rise;
  });

  const name = raid ? `${"★".repeat(raid.stars)} ${raid.event}` : "gym" in props ? (SHORT[props.gym.org] ?? props.gym.org) : "";
  const defenderScale = dex ? (critterSize(dex) * 1.25) / G : 1;

  return (
    <group position={[x, 0, z]}>
      <group ref={root} onClick={tapObject(slug)} {...hover}>
        <Shadow size={4.6} opacity={0.55} />
        <group scale={G}>
          {/* the foot and the thin pole it all floats on */}
          <mesh position-y={0.01}>
            <cylinderGeometry args={[0.06, 0.06, 0.02, 24]} />
            <meshLambertMaterial color={team} emissive={team} emissiveIntensity={0.2} />
          </mesh>
          <mesh position-y={0.31}>
            <cylinderGeometry args={[0.024, 0.024, 0.62, 10]} />
            <meshLambertMaterial color={team} />
          </mesh>
          {/* the drum, like the underside of a spinning top */}
          {[
            [0.28, 0.62, "#ffffff"],
            [0.45, 0.7, "#c8c8c8"],
            [0.65, 0.8, "#ffffff"],
          ].map(([r, y, c]) => (
            <mesh key={y as number} position-y={y as number}>
              <cylinderGeometry args={[r as number, (r as number) * 0.9, 0.06, smooth]} />
              <meshLambertMaterial color={c as string} />
            </mesh>
          ))}
          <mesh position-y={0.92}>
            <cylinderGeometry args={[0.92, 0.88, 0.12, smooth]} />
            <meshLambertMaterial color={WHITE} />
          </mesh>
          <mesh position-y={0.92} rotation-x={Math.PI / 2}>
            <torusGeometry args={[0.9, 0.045, 8, 72]} />
            <meshLambertMaterial color={team} emissive={team} emissiveIntensity={0.3} />
          </mesh>
          <mesh position-y={1.05}>
            <cylinderGeometry args={[0.7, 0.75, 0.1, smooth]} />
            <meshLambertMaterial color="#d8d8d8" />
          </mesh>
          <mesh position-y={1.102} rotation-x={-Math.PI / 2}>
            <circleGeometry args={[0.34, 48]} />
            <meshLambertMaterial map={textures.emblem} />
          </mesh>
          {/* lamps round the rim, throwing short beams */}
          {[0.25, 0.75, 1.25, 1.75].map((a) => (
            <group key={a} rotation-y={a * Math.PI}>
              <mesh position={[0, 0.95, 0.94]}>
                <boxGeometry args={[0.13, 0.08, 0.08]} />
                <meshLambertMaterial color={WHITE} emissive={WHITE} emissiveIntensity={0.6} />
              </mesh>
              <mesh position={[0, 0.95, 1.3]} rotation-x={-Math.PI / 2}>
                <planeGeometry args={[0.16, 0.65]} />
                <meshBasicMaterial color="#f8f8f8" transparent opacity={0.28} blending={AdditiveBlending} depthWrite={false} side={DoubleSide} />
              </mesh>
            </group>
          ))}
          {/* the tall form: three team pillars round a dark core, and a broken ring at the middle */}
          {tall ? (
            <>
              <mesh position-y={1.78}>
                <cylinderGeometry args={[0.22, 0.25, 1.05, 24]} />
                <meshLambertMaterial color={CORE} />
              </mesh>
              {[0, 1, 2].map((i) => (
                <group key={i} rotation-y={(i / 3) * Math.PI * 2}>
                  <mesh position={[0, 1.78, 0.3]}>
                    <boxGeometry args={[0.25, 1.05, 0.04]} />
                    <meshLambertMaterial color={team} emissive={team} emissiveIntensity={0.15} />
                  </mesh>
                  <mesh position={[0, 1.76, 0.323]}>
                    <boxGeometry args={[0.08, 0.86, 0.006]} />
                    <meshLambertMaterial color={WHITE} />
                  </mesh>
                </group>
              ))}
              <mesh geometry={ARCS.mid} position-y={1.8} rotation={[Math.PI / 2 + 0.1, 0, 0]}>
                <meshLambertMaterial color={WHITE} emissive={MYSTIC_GLOW} emissiveIntensity={0.2} />
              </mesh>
            </>
          ) : null}
          <group position-y={top}>
            {/* the dish platform */}
            <mesh position-y={2.38}>
              <cylinderGeometry args={[0.5, 0.42, 0.12, smooth]} />
              <meshLambertMaterial color="#f8f8f8" />
            </mesh>
            <mesh position-y={2.442} rotation-x={-Math.PI / 2}>
              <circleGeometry args={[0.44, 48]} />
              <meshLambertMaterial color="#a8c8d8" />
            </mesh>
            {/* four curved team fins standing round the rim, leaning out */}
            <group ref={spin}>
              {[0, 1, 2, 3].map((i) => (
                <mesh key={i} geometry={finGeometry} position-y={2.5} rotation-y={(i / 4) * Math.PI * 2}>
                  <meshLambertMaterial color={team} emissive={team} emissiveIntensity={0.2} side={DoubleSide} />
                </mesh>
              ))}
              {[0, 1, 2].map((i) => (
                <mesh key={i} geometry={ARCS.a} position-y={2.45} rotation={[Math.PI / 2 + 0.08, 0, (i / 3) * Math.PI * 2]}>
                  <meshLambertMaterial color={WHITE} emissive={MYSTIC_GLOW} emissiveIntensity={0.25} />
                </mesh>
              ))}
            </group>
            <group ref={counter}>
              {[0, 1, 2].map((i) => (
                <mesh key={i} geometry={ARCS.b} position-y={2.56} rotation={[Math.PI / 2 - 0.12, 0, (i / 3) * Math.PI * 2 + 0.6]}>
                  <meshLambertMaterial color="#e8e8e8" emissive={MYSTIC_GLOW} emissiveIntensity={0.2} />
                </mesh>
              ))}
            </group>
            {/* the defender, swapping now and then with the gym symbol */}
            {Defender ? (
              <group ref={defender} position-y={2.45}>
                <group scale={defenderScale} userData={{ noShadow: true }}>
                  <Defender seed={x} />
                </group>
              </group>
            ) : null}
            {!raid ? (
              <group ref={symbol} position-y={2.9}>
                <sprite scale={[0.62, 0.62, 1]}>
                  <spriteMaterial map={textures.symbol} transparent depthWrite={false} />
                </sprite>
              </group>
            ) : null}
            {/* a raid: the egg stands where the defender would, with the raid badge over it */}
            {raid && textures.egg ? (
              <group ref={egg} position-y={2.45}>
                <mesh geometry={eggGeometry} scale={[0.82, 0.82, 0.82]}>
                  <meshLambertMaterial ref={shell} map={textures.egg} emissive={EGG[raid.stars]} emissiveIntensity={0.12} />
                </mesh>
              </group>
            ) : null}
            {Boss ? (
              <>
                <mesh ref={flash} position-y={2.8} visible={false}>
                  <sphereGeometry args={[0.6, 24, 16]} />
                  <meshBasicMaterial color="#ffffff" transparent depthWrite={false} />
                </mesh>
                {hatched ? (
                  <group ref={bossRef} position-y={2.45} visible={false}>
                    <group scale={bossScale} userData={{ noShadow: true }}>
                      <Boss seed={x} />
                    </group>
                  </group>
                ) : null}
              </>
            ) : null}
            {raid && textures.badge ? (
              <sprite ref={badge} position-y={3.75} scale={[0.62, 0.775, 1]}>
                <spriteMaterial map={textures.badge} transparent depthWrite={false} />
              </sprite>
            ) : null}
          </group>
          {/* the gym's marker: a team diamond floating high, spinning */}
          {!raid ? (
            <group ref={gem} position-y={marker}>
              <mesh geometry={diamond} scale={[0.12, 0.21, 0.12]}>
                <meshLambertMaterial color={team} emissive={team} emissiveIntensity={0.45} />
              </mesh>
            </group>
          ) : null}
        </group>
      </group>
      <Nameplate text={name} accent={raid ? EGG[raid.stars] : MYSTIC} x={x} z={z} y={(raid ? bossBadge + 0.75 + top : marker + 0.55) * G} />
    </group>
  );
}
