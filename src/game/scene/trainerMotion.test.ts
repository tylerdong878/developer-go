import { Object3D } from "three";
import { describe, expect, it } from "vitest";
import { BONES, type Bones, newMotion, pose, strideRate } from "./trainerMotion";

const rig = () => Object.fromEntries(BONES.map((n) => [n, new Object3D()])) as Bones;

describe("trainer motion", () => {
  it("matches the feet at a walk and caps the cadence when running", () => {
    expect(strideRate(1.4)).toBeCloseTo(1.13, 2);
    expect(strideRate(8)).toBe(2);
    expect(strideRate(90)).toBe(2.4);
  });

  it("bends the knees while walking and stands nearly straight when still", () => {
    const b = rig();
    const m = newMotion();
    let most = 0;
    for (let i = 0; i < 120; i++) {
      pose(b, m, 8, false, i / 60, 1 / 60);
      most = Math.max(most, b.shinL.rotation.x);
    }
    expect(most).toBeGreaterThan(0.8);
    for (let i = 0; i < 240; i++) pose(b, m, 0, false, 2 + i / 60, 1 / 60);
    expect(Math.abs(b.legL.rotation.x)).toBeLessThan(0.05);
  });
});
