import { describe, expect, it } from "vitest";
import { bag, stacks } from "./bag";
import { skills } from "./skills";

describe("bag", () => {
  it("has one item per skill", () => {
    expect(bag()).toHaveLength(Object.keys(skills).length);
  });

  it("never lists a skill twice in one stack", () => {
    for (const stack of stacks()) {
      expect(new Set(stack).size).toBe(stack.length);
    }
  });

  it("counts every stack entry exactly once", () => {
    const total = bag().reduce((sum, item) => sum + item.count, 0);
    const entries = stacks().reduce((sum, stack) => sum + stack.length, 0);
    expect(total).toBe(entries);
  });

  it("sorts by count, then name", () => {
    const items = bag();
    for (let i = 1; i < items.length; i++) {
      const [prev, next] = [items[i - 1], items[i]];
      expect(
        prev.count > next.count ||
          (prev.count === next.count && prev.name.localeCompare(next.name) <= 0),
      ).toBe(true);
    }
  });

  it("marks skills still being learned", () => {
    const lean = bag().find((item) => item.id === "lean");
    expect(lean?.learning).toBe(true);
  });
});
