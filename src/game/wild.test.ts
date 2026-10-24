import { beforeEach, describe, expect, it } from "vitest";
import { appearanceAt, buildPoints, CYCLE } from "./spawnPoints";
import { endWild, holdWild, LEAVE, refreshWild, resetWild, spawnPoints, wildStore } from "./wild";

const T = Date.UTC(2026, 9, 24, 15, 0, 0);
const env = { weather: null, night: false, at: T };
/** Somewhere with points round it: the park. */
const PARK: [number, number] = [-100, 10];

describe("spawn points", () => {
  it("are the same on every load, and the same Pokémon is on a point for everyone", () => {
    const a = buildPoints();
    const b = buildPoints();
    expect(a.length).toBeGreaterThan(200);
    expect(a.map((p) => [p.x, p.z])).toEqual(b.map((p) => [p.x, p.z]));
    for (const p of a.slice(0, 40)) expect(appearanceAt(p, T, env)).toEqual(appearanceAt(b[p.id], T, env));
  });

  it("fire once a cycle, out for half of it (the long kind for all of it)", () => {
    const p = spawnPoints.find((q) => !q.long)!;
    let out = 0;
    for (let s = 0; s < CYCLE; s++) if (appearanceAt(p, T + s * 1000, env)) out++;
    expect(out).toBe(CYCLE / 2);
  });

  it("put water types by the water", () => {
    const water = spawnPoints.filter((p) => p.habitat === "water");
    const seen = new Set<number>();
    for (const p of water) for (let k = 0; k < 20; k++) seen.add(appearanceAt(p, T + k * CYCLE * 1000, env)?.looks ?? 0);
    expect(seen.has(129) || seen.has(54) || seen.has(60)).toBe(true);
    expect(seen.has(74)).toBe(false); // no Geodude in the pond
  });
});

describe("the wild Pokémon round the trainer", () => {
  beforeEach(() => resetWild());

  it("shows what's out on the points near him", () => {
    refreshWild(...PARK, 0, { at: T });
    expect(wildStore.get().length).toBeGreaterThan(2);
    for (const s of wildStore.get()) if (!s.daily) expect(Math.hypot(s.x - PARK[0], s.z - PARK[1])).toBeLessThanOrEqual(27);
  });

  it("a caught one is gone for you, a run-from one stays", () => {
    refreshWild(...PARK, 0, { at: T });
    const [a, b] = wildStore.get().filter((s) => !s.daily);
    endWild(a.id, "caught");
    endWild(b.id, "ran");
    refreshWild(...PARK, 1, { at: T + 1000 });
    const ids = wildStore.get().map((s) => s.id);
    expect(ids).not.toContain(a.id);
    expect(ids).toContain(b.id);
  });

  it("leaves in a puff when its time is up, unless it's being caught", () => {
    refreshWild(...PARK, 0, { at: T });
    const [a, b] = wildStore.get().filter((s) => !s.daily);
    holdWild(b.id);
    const later = Math.max(a.until, b.until) + 1000;
    refreshWild(...PARK, 5, { at: later });
    expect(wildStore.get().find((s) => s.id === a.id)?.leaving).toBe(5);
    expect(wildStore.get().find((s) => s.id === b.id)?.leaving).toBe(null);
    refreshWild(...PARK, 5 + LEAVE + 0.1, { at: later + 1000 });
    expect(wildStore.get().find((s) => s.id === a.id)).toBeUndefined();
  });

  it("gives each visitor a Daily Encounter, Snorlax first", () => {
    refreshWild(0, 6, 0, { at: T, heading: Math.PI });
    const d = wildStore.get().find((s) => s.daily);
    expect(d?.species.dex).toBe(143);
    expect(d?.fact).toBe("snorlax");
  });
});
