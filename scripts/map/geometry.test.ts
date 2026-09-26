import { describe, expect, it } from "vitest";
import {
  type Box,
  type Coord,
  clipLine,
  landPolygons,
  signedArea,
  simplify,
  stitch,
  toPath,
} from "./geometry";

const box: Box = { west: -1, south: -1, east: 1, north: 1 };

/** Rotates a closed ring to start at its smallest point, for comparisons. */
function canonical(ring: Coord[]): string {
  const open = ring.slice(0, -1).map((c) => c.map((n) => Math.round(n * 1e6) / 1e6).join(","));
  const start = open.indexOf([...open].sort()[0]);
  return open.slice(start).concat(open.slice(0, start)).join(" ");
}

describe("stitch", () => {
  it("joins lines end to start", () => {
    const chains = stitch(
      [
        [[1, 0], [2, 0]],
        [[0, 0], [1, 0]],
      ],
      true,
    );
    expect(chains).toEqual([[[0, 0], [1, 0], [2, 0]]]);
  });

  it("won't flip lines when directed", () => {
    expect(stitch([[[0, 0], [1, 0]], [[2, 0], [1, 0]]], true)).toHaveLength(2);
  });

  it("flips lines to close rings when undirected", () => {
    const [ring] = stitch(
      [
        [[0, 0], [1, 0], [1, 1]],
        [[0, 0], [0, 1], [1, 1]],
      ],
      false,
    );
    expect(ring[0]).toEqual(ring[ring.length - 1]);
    expect(ring).toHaveLength(5);
  });
});

describe("clipLine", () => {
  it("marks where a line enters and leaves the box", () => {
    const [piece] = clipLine([[-2, 0], [2, 0]], box);
    expect(piece.points).toEqual([[-1, 0], [1, 0]]);
    expect(piece).toMatchObject({ entered: true, exited: true });
  });

  it("splits a line that leaves and comes back", () => {
    const pieces = clipLine([[0, 0], [0, 2], [0.5, 2], [0.5, 0]], box);
    expect(pieces).toHaveLength(2);
    expect(pieces[0]).toMatchObject({ entered: false, exited: true });
    expect(pieces[1]).toMatchObject({ entered: true, exited: false });
  });
});

describe("landPolygons", () => {
  it("keeps the land on the left of a coastline heading north", () => {
    const [land] = landPolygons([[[0, -2], [0, 2]]], box);
    expect(canonical(land)).toBe(canonical([[0, -1], [0, 1], [-1, 1], [-1, -1], [0, -1]]));
  });

  it("puts the land on the east side when the coast heads south", () => {
    const [land] = landPolygons([[[0, 2], [0, -2]]], box);
    expect(canonical(land)).toBe(canonical([[0, 1], [0, -1], [1, -1], [1, 1], [0, 1]]));
  });

  it("keeps islands as they are", () => {
    const island: Coord[] = [[0, 0], [0.5, 0], [0.5, 0.5], [0, 0]];
    expect(landPolygons([island], box)).toEqual([island]);
  });

  it("splits land on both sides of a channel into two rings", () => {
    const westCoast: Coord[] = [[-0.5, -2], [-0.5, 2]]; // land to the west
    const eastCoast: Coord[] = [[0.5, 2], [0.5, -2]]; // land to the east
    const rings = landPolygons([westCoast, eastCoast], box);
    expect(rings.map((r) => Math.abs(signedArea(r)))).toEqual([1, 1]);
  });

  it("walks the edge to join two coasts of the same land", () => {
    // Land fills the box except bays cut in from the north and south edges.
    const northBay: Coord[] = [[0.25, 2], [0.25, 0.5], [-0.25, 0.5], [-0.25, 2]];
    const southBay: Coord[] = [[-0.25, -2], [-0.25, -0.5], [0.25, -0.5], [0.25, -2]];
    const rings = landPolygons([northBay, southBay], box);
    expect(rings).toHaveLength(1);
    expect(Math.abs(signedArea(rings[0]))).toBeCloseTo(3.5);
  });
});

describe("simplify", () => {
  it("drops points that don't change the shape", () => {
    expect(simplify([[0, 0], [1, 0.01], [2, 0], [3, 5]], 0.1)).toEqual([
      [0, 0],
      [2, 0],
      [3, 5],
    ]);
  });
});

describe("toPath", () => {
  it("writes compact relative path data", () => {
    expect(toPath([[[10, 20], [14, 18], [14, 25]]], false)).toBe("M10 20l4-2 0 7");
  });

  it("closes rings with z and drops the repeated point", () => {
    expect(toPath([[[0, 0], [5, 0], [5, 5], [0, 0]]], true)).toBe("M0 0l5 0 0 5z");
  });

  it("skips lines that round to a single point", () => {
    expect(toPath([[[0.1, 0.1], [0.2, 0.2]]], false)).toBe("");
  });
});
