import { describe, expect, it } from "vitest";
import { HOLD, progressWith, receive, taskFor } from "./field";

describe("field research", () => {
  it("gives each stop the same task for everyone on a day", () => {
    expect(taskFor("etf-pipeline", "2026-10-24")).toEqual(taskFor("etf-pipeline", "2026-10-24"));
  });

  it("holds three at most, one per stop a day", () => {
    let tasks = receive([], "etf-pipeline", "2026-10-24")!;
    expect(receive(tasks, "etf-pipeline", "2026-10-24")).toBeNull();
    tasks = receive(tasks, "matching-engine", "2026-10-24")!;
    tasks = receive(tasks, "ofi-regime-study", "2026-10-24")!;
    expect(tasks).toHaveLength(HOLD);
    expect(receive(tasks, "snakerl", "2026-10-24")).toBeNull();
  });

  it("counts what fits", () => {
    const t = { ...taskFor("etf-pipeline", "2026-10-24"), task: "water2", text: "Catch 2 Water-type Pokémon", need: 2 };
    let tasks = progressWith([t], { kind: "catch", dex: 16, throw: null, curve: false, boosted: false });
    expect(tasks[0].have).toBe(0);
    tasks = progressWith(tasks, { kind: "catch", dex: 129, throw: null, curve: false, boosted: false });
    tasks = progressWith(tasks, { kind: "catch", dex: 54, throw: "Nice", curve: false, boosted: false });
    expect(tasks[0].have).toBe(2);
  });
});
