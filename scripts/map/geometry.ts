/**
 * Geometry helpers for turning OpenStreetMap data into map layers. Works on
 * plain [x, y] pairs, so the same code runs on lon/lat and on map units.
 */
export type Coord = [number, number];
export type Box = { west: number; south: number; east: number; north: number };

const same = (a: Coord, b: Coord) =>
  Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9;
const key = (c: Coord) => `${c[0].toFixed(7)},${c[1].toFixed(7)}`;
const isClosed = (line: Coord[]) =>
  line.length > 2 && same(line[0], line[line.length - 1]);

/**
 * Joins lines that share endpoints into longer chains. `directed` only joins
 * one line's end to another's start (coastlines, where direction means
 * "land on the left"); undirected also flips lines to fit (polygon rings).
 */
export function stitch(lines: Coord[][], directed: boolean): Coord[][] {
  const used = new Array<boolean>(lines.length).fill(false);
  const byEnd = new Map<string, number[]>();
  const add = (c: Coord, i: number) => {
    const k = key(c);
    byEnd.set(k, [...(byEnd.get(k) ?? []), i]);
  };
  lines.forEach((line, i) => {
    add(line[0], i);
    add(line[line.length - 1], i);
  });

  // Finds an unused line touching `at` that can continue the chain.
  const next = (at: Coord, forward: boolean): Coord[] | undefined => {
    for (const i of byEnd.get(key(at)) ?? []) {
      if (used[i]) continue;
      const line = lines[i];
      const startsHere = same(line[0], at);
      const endsHere = same(line[line.length - 1], at);
      let piece: Coord[] | undefined;
      if (forward) {
        if (startsHere) piece = line;
        else if (endsHere && !directed) piece = line.slice().reverse();
      } else {
        if (endsHere) piece = line;
        else if (startsHere && !directed) piece = line.slice().reverse();
      }
      if (piece) {
        used[i] = true;
        return piece;
      }
    }
    return undefined;
  };

  const chains: Coord[][] = [];
  for (let i = 0; i < lines.length; i++) {
    if (used[i]) continue;
    used[i] = true;
    let chain = lines[i].slice();
    for (let piece; !isClosed(chain) && (piece = next(chain[chain.length - 1], true)); ) {
      chain = chain.concat(piece.slice(1));
    }
    for (let piece; !isClosed(chain) && (piece = next(chain[0], false)); ) {
      chain = piece.slice(0, -1).concat(chain);
    }
    chains.push(chain);
  }
  return chains;
}

export type Piece = { points: Coord[]; entered: boolean; exited: boolean };

const inside = (c: Coord, b: Box) =>
  c[0] >= b.west && c[0] <= b.east && c[1] >= b.south && c[1] <= b.north;

/** Liang-Barsky: the part of segment a-b inside the box, as [t0, t1]. */
function clipSegment(a: Coord, b: Coord, box: Box): [number, number] | null {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  let t0 = 0;
  let t1 = 1;
  const edges: [number, number][] = [
    [-dx, a[0] - box.west],
    [dx, box.east - a[0]],
    [-dy, a[1] - box.south],
    [dy, box.north - a[1]],
  ];
  for (const [p, q] of edges) {
    if (p === 0) {
      if (q < 0) return null;
      continue;
    }
    const t = q / p;
    if (p < 0) {
      if (t > t1) return null;
      t0 = Math.max(t0, t);
    } else {
      if (t < t0) return null;
      t1 = Math.min(t1, t);
    }
  }
  return [t0, t1];
}

const lerp = (a: Coord, b: Coord, t: number): Coord => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
];

/** The parts of a polyline inside the box, noting where each crosses in or out. */
export function clipLine(line: Coord[], box: Box): Piece[] {
  const pieces: Piece[] = [];
  let current: Piece | null = null;
  for (let i = 0; i < line.length - 1; i++) {
    const a = line[i];
    const b = line[i + 1];
    const t = clipSegment(a, b, box);
    if (!t) continue;
    const [t0, t1] = t;
    if (!current) {
      current = { points: [lerp(a, b, t0)], entered: t0 > 0 || !inside(a, box), exited: false };
      pieces.push(current);
    }
    current.points.push(lerp(a, b, t1));
    if (t1 < 1) {
      current.exited = true;
      current = null;
    }
  }
  return pieces;
}

/** Position along the box edge, counterclockwise from the south-west corner. */
function perimeter(c: Coord, b: Box): number {
  const w = b.east - b.west;
  const h = b.north - b.south;
  const eps = 1e-9 * Math.max(w, h);
  if (Math.abs(c[1] - b.south) <= eps) return c[0] - b.west;
  if (Math.abs(c[0] - b.east) <= eps) return w + (c[1] - b.south);
  if (Math.abs(c[1] - b.north) <= eps) return w + h + (b.east - c[0]);
  return 2 * w + h + (b.north - c[1]);
}

/** Nearest point on the box edge, for coastline ends that stop short of it. */
function toEdge(c: Coord, b: Box): Coord {
  const d = [c[0] - b.west, b.east - c[0], c[1] - b.south, b.north - c[1]];
  const m = Math.min(...d);
  if (m === d[0]) return [b.west, c[1]];
  if (m === d[1]) return [b.east, c[1]];
  if (m === d[2]) return [c[0], b.south];
  return [c[0], b.north];
}

/**
 * Land polygons inside the box from OSM coastlines, which run with land on
 * the left. Each piece crossing the box leaves through the edge; walking the
 * edge counterclockwise from there reaches the next piece of the same land.
 */
export function landPolygons(coastlines: Coord[][], box: Box): Coord[][] {
  const rings: Coord[][] = [];
  const pieces: Piece[] = [];

  for (const chain of stitch(coastlines, true)) {
    if (isClosed(chain) && chain.every((c) => inside(c, box))) {
      rings.push(chain); // an island
      continue;
    }
    let line = chain;
    if (isClosed(chain)) {
      // A ring crossing the edge: start it outside so it clips cleanly.
      const out = chain.findIndex((c) => !inside(c, box));
      line = chain.slice(out, -1).concat(chain.slice(0, out + 1));
    }
    for (const piece of clipLine(line, box)) {
      if (!piece.entered) piece.points.unshift(toEdge(piece.points[0], box));
      if (!piece.exited) piece.points.push(toEdge(piece.points[piece.points.length - 1], box));
      pieces.push(piece);
    }
  }

  const w = box.east - box.west;
  const h = box.north - box.south;
  const total = 2 * (w + h);
  const corners: [number, Coord][] = [
    [0, [box.west, box.south]],
    [w, [box.east, box.south]],
    [w + h, [box.east, box.north]],
    [2 * w + h, [box.west, box.north]],
  ];
  const entryT = pieces.map((p) => perimeter(p.points[0], box));
  const exitT = pieces.map((p) => perimeter(p.points[p.points.length - 1], box));
  const used = new Array<boolean>(pieces.length).fill(false);
  const ahead = (from: number, to: number) => (to - from + total) % total;

  for (let start = 0; start < pieces.length; start++) {
    if (used[start]) continue;
    const ring: Coord[] = [];
    let i = start;
    for (let guard = 0; guard <= pieces.length; guard++) {
      used[i] = true;
      ring.push(...pieces[i].points);
      // The next entry counterclockwise along the edge from this exit.
      let best = -1;
      for (let j = 0; j < pieces.length; j++) {
        if (used[j] && j !== start) continue;
        if (best < 0 || ahead(exitT[i], entryT[j]) < ahead(exitT[i], entryT[best])) best = j;
      }
      const gap = ahead(exitT[i], entryT[best]);
      for (const [t, corner] of corners
        .map(([t, c]) => [ahead(exitT[i], t), c] as [number, Coord])
        .sort((a, b) => a[0] - b[0])) {
        if (t > 0 && t < gap) ring.push(corner);
      }
      if (best === start) break;
      i = best;
    }
    ring.push(ring[0]);
    rings.push(ring);
  }
  return rings;
}

/**
 * Sutherland-Hodgman: the part of a ring inside the box, still closed.
 * Returns an empty array if nothing is left.
 */
export function clipRing(ring: Coord[], box: Box): Coord[] {
  const edges: [(c: Coord) => boolean, (a: Coord, b: Coord) => Coord][] = [
    [(c) => c[0] >= box.west, (a, b) => lerp(a, b, (box.west - a[0]) / (b[0] - a[0]))],
    [(c) => c[0] <= box.east, (a, b) => lerp(a, b, (box.east - a[0]) / (b[0] - a[0]))],
    [(c) => c[1] >= box.south, (a, b) => lerp(a, b, (box.south - a[1]) / (b[1] - a[1]))],
    [(c) => c[1] <= box.north, (a, b) => lerp(a, b, (box.north - a[1]) / (b[1] - a[1]))],
  ];
  let points = isClosed(ring) ? ring.slice(0, -1) : ring.slice();
  for (const [keep, cross] of edges) {
    const input = points;
    points = [];
    for (let i = 0; i < input.length; i++) {
      const a = input[(i + input.length - 1) % input.length];
      const b = input[i];
      if (keep(b)) {
        if (!keep(a)) points.push(cross(a, b));
        points.push(b);
      } else if (keep(a)) {
        points.push(cross(a, b));
      }
    }
    if (points.length === 0) return [];
  }
  return points.concat([points[0]]);
}

/**
 * Adds points so no segment is longer than `step`. Needed before a curved
 * projection: a long straight edge (like the edge of the data box) should
 * bend on the map, and it can only bend at points.
 */
export function densify(line: Coord[], step: number): Coord[] {
  const out: Coord[] = [line[0]];
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1];
    const b = line[i];
    const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step);
    for (let k = 1; k < n; k++) out.push(lerp(a, b, k / n));
    out.push(b);
  }
  return out;
}

/** Douglas-Peucker simplification. Keeps the endpoints. */
export function simplify(points: Coord[], tolerance: number): Coord[] {
  if (points.length < 3) return points.slice();
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack: [number, number][] = [[0, points.length - 1]];
  const tol2 = tolerance * tolerance;
  while (stack.length) {
    const [first, last] = stack.pop()!;
    let maxDist = 0;
    let index = -1;
    for (let i = first + 1; i < last; i++) {
      const d = segmentDistance2(points[i], points[first], points[last]);
      if (d > maxDist) {
        maxDist = d;
        index = i;
      }
    }
    if (index >= 0 && maxDist > tol2) {
      keep[index] = 1;
      stack.push([first, index], [index, last]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

function segmentDistance2(p: Coord, a: Coord, b: Coord): number {
  let [x, y] = a;
  let dx = b[0] - x;
  let dy = b[1] - y;
  if (dx !== 0 || dy !== 0) {
    const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) [x, y] = b;
    else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }
  dx = p[0] - x;
  dy = p[1] - y;
  return dx * dx + dy * dy;
}

/** Signed area (shoelace). Positive is counterclockwise in y-up space. */
export function signedArea(ring: Coord[]): number {
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    sum += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  return sum / 2;
}

/**
 * Compact SVG path data with integer coordinates and relative moves, e.g.
 * "M12 30l4-2 7 0z". Rings are closed with z; polylines are left open.
 */
export function toPath(lines: Coord[][], closed: boolean): string {
  let d = "";
  for (const line of lines) {
    const pts = line.map(([x, y]) => [Math.round(x), Math.round(y)] as Coord);
    if (closed && pts.length > 1 && same(pts[0], pts[pts.length - 1])) pts.pop();
    let moves = "";
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i][0] - pts[i - 1][0];
      const dy = pts[i][1] - pts[i - 1][1];
      if (dx === 0 && dy === 0) continue;
      moves += (moves ? num(dx) : `${dx}`) + num(dy);
    }
    if (!moves) continue;
    d += `M${pts[0][0]}${num(pts[0][1])}l${moves}${closed ? "z" : ""}`;
  }
  return d;
}

/** A number with a separator only when it's needed (a minus sign is one). */
const num = (n: number) => (n < 0 ? `${n}` : ` ${n}`);
