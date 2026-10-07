"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { type InstancedMesh, Object3D } from "three";
import { game, RUN_SPEED } from "../state";

const COUNT = 24;
const LIFE = 0.55;
const scratch = new Object3D();

/** Little puffs kicked up at the trainer's heels while he runs. */
export function Dust() {
  const mesh = useRef<InstancedMesh>(null);
  const puffs = useRef(Array.from({ length: COUNT }, () => ({ x: 0, z: 0, age: LIFE, size: 1 })));
  const next = useRef(0);
  const timer = useRef(0);

  useFrame((_, frame) => {
    const m = mesh.current;
    if (!m) return;
    const dt = Math.min(frame, 0.05);
    const { trainer } = game.player;
    const running = !game.input.dash && trainer.speed > RUN_SPEED * 0.75;
    timer.current -= dt;
    if (running && timer.current <= 0) {
      timer.current = 0.07;
      const p = puffs.current[next.current];
      next.current = (next.current + 1) % COUNT;
      const side = next.current % 2 ? 0.16 : -0.16;
      const hx = Math.sin(trainer.heading);
      const hz = Math.cos(trainer.heading);
      p.x = trainer.position.x - hx * 0.35 + hz * side;
      p.z = trainer.position.z - hz * 0.35 - hx * side;
      p.age = 0;
      p.size = 0.7 + Math.random() * 0.5;
    }
    puffs.current.forEach((p, i) => {
      p.age = Math.min(LIFE, p.age + dt);
      const k = p.age / LIFE;
      const s = k >= 1 ? 0.0001 : p.size * (0.25 + k * 0.5) * (1 - k * k);
      scratch.position.set(p.x, 0.12 + k * 0.35, p.z);
      scratch.scale.setScalar(s);
      scratch.updateMatrix();
      m.setMatrixAt(i, scratch.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <icosahedronGeometry args={[0.45, 1]} />
      <meshLambertMaterial color="#f4efe4" flatShading />
    </instancedMesh>
  );
}
