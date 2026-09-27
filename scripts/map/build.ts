/**
 * Turns the cached OpenStreetMap data into the map the site draws:
 *   src/map/data/near.json   layers around downtown, sent with the page
 *   src/map/data/far.json    the rest of the world, loaded after first paint
 *   src/map/data/graph.json  the road graph the trainer walks on
 *
 *   npm run map:build              # needs npm run map:fetch first
 *   npm run map:build -- --preview # also writes .cache/map-preview.svg
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { mapObjects } from "@/content";
import { distanceMeters, project, squash } from "@/map/projection";
import { CACHE_DIR, DATA_DIR, WORLD_RADIUS, worldBox } from "./config";
import {
  type Box,
  type Coord,
  clipLine,
  clipRing,
  densify,
  landPolygons,
  signedArea,
  simplify,
  stitch,
  toPath,
} from "./geometry";

type OsmPoint = { lat: number; lon: number } | null;
type OsmWay = {
  type: "way";
  id: number;
  nodes: number[];
  geometry: OsmPoint[];
  tags?: Record<string, string>;
};
type OsmRelation = {
  type: "relation";
  id: number;
  members: { type: string; role: string; geometry?: OsmPoint[] }[];
  tags?: Record<string, string>;
};
type OsmElement = OsmWay | OsmRelation;

const WORLD = squash(WORLD_RADIUS);
/** Past this map radius everything is under the fog. */
const FOG_EDGE = WORLD * 1.02;
const EDGE = Math.ceil(WORLD * 1.05);
const clipBox: Box = { west: -EDGE, south: -EDGE, east: EDGE, north: EDGE };
/** Shapes that reach inside this map radius ship with the page. */
const NEAR = 6500;

// Simplification tolerance and smallest shape kept, in map units (meters downtown).
const POLYGON_TOLERANCE = 5;
const ROAD_TOLERANCE = 4;
const BEND_TOLERANCE = 3;
const MIN_AREA = { water: 2500, parks: 5000, woods: 15000 };
/** Longest straight segment before projecting, in degrees (about 250 m). */
const DENSIFY_STEP = 0.003;
/** Edges are merged through plain bends, but never past this real length. */
const MAX_EDGE = 300;

const WALKABLE = new Set([
  "trunk",
  "primary",
  "secondary",
  "tertiary",
  "residential",
  "unclassified",
  "living_street",
]);
type RoadClass = "highway" | "major" | "minor" | "street";
const ROAD_CLASS: Record<string, RoadClass> = {
  motorway: "highway",
  trunk: "highway",
  primary: "major",
  secondary: "major",
  tertiary: "minor",
  residential: "street",
  unclassified: "street",
  living_street: "street",
};

async function load(name: string): Promise<OsmElement[]> {
  return JSON.parse(await readFile(`${CACHE_DIR}/${name}.json`, "utf8")).elements;
}

const lonLat = (geometry: OsmPoint[] = []): Coord[] =>
  geometry
    .filter((p): p is { lat: number; lon: number } => p !== null)
    .map((p) => [p.lon, p.lat]);

const toMap = ([lon, lat]: Coord): Coord => {
  const p = project({ lat, lon });
  return [p.x, p.y];
};

/** Densifies in lon/lat, then projects, so long straight edges bend with the map. */
const lineToMap = (line: Coord[]) => densify(line, DENSIFY_STEP).map(toMap);

const radius = ([x, y]: Coord) => Math.hypot(x, y);
const closed = (line: Coord[]) =>
  line.length > 3 &&
  line[0][0] === line[line.length - 1][0] &&
  line[0][1] === line[line.length - 1][1];

/** Outer and inner rings (in lon/lat) from closed ways and multipolygon relations. */
function rings(elements: OsmElement[]) {
  const outer: Coord[][] = [];
  const inner: Coord[][] = [];
  for (const el of elements) {
    if (el.type === "way") {
      const line = lonLat(el.geometry);
      if (closed(line)) outer.push(line);
      continue;
    }
    for (const role of ["outer", "inner"] as const) {
      const lines = el.members
        .filter((m) => m.type === "way" && (m.role || "outer") === role)
        .map((m) => lonLat(m.geometry))
        .filter((line) => line.length > 1);
      for (const ring of stitch(lines, false)) {
        if (closed(ring)) (role === "outer" ? outer : inner).push(ring);
      }
    }
  }
  return { outer, inner };
}

/**
 * Projects, simplifies, and clips rings, then orients them so outers and
 * inners wind opposite ways. With fill-rule nonzero, overlapping outers stay
 * filled and inners cut holes.
 */
function polygons({ outer, inner }: { outer: Coord[][]; inner: Coord[][] }, minArea: number) {
  const out: Coord[][] = [];
  const add = (ring: Coord[], isOuter: boolean) => {
    const clipped = clipRing(simplify(lineToMap(ring), POLYGON_TOLERANCE), clipBox);
    if (clipped.length < 4 || clipped.every((c) => radius(c) > FOG_EDGE)) return;
    const area = signedArea(clipped);
    if (Math.abs(area) < minArea) return;
    out.push(area > 0 === isOuter ? clipped : clipped.slice().reverse());
  };
  outer.forEach((r) => add(r, true));
  inner.forEach((r) => add(r, false));
  return out;
}

/** Road lines by class, split around the parts hidden under the fog. */
function roadLines(roads: OsmWay[]) {
  const byClass: Record<RoadClass, Coord[][]> = { highway: [], major: [], minor: [], street: [] };
  for (const way of roads) {
    const cls = ROAD_CLASS[way.tags?.highway ?? ""];
    if (!cls) continue;
    for (const piece of clipLine(lineToMap(lonLat(way.geometry)), clipBox)) {
      let run: Coord[] = [];
      for (const point of [...piece.points, null]) {
        if (point && radius(point) <= FOG_EDGE) {
          run.push(point);
          continue;
        }
        if (run.length > 1) byClass[cls].push(simplify(run, ROAD_TOLERANCE));
        run = [];
      }
    }
  }
  return byClass;
}

/** Splits shapes into the part that ships with the page and the part loaded later. */
function split(lines: Coord[][]) {
  const near: Coord[][] = [];
  const far: Coord[][] = [];
  for (const line of lines) (line.some((c) => radius(c) < NEAR) ? near : far).push(line);
  return { near, far };
}

type Edge = { a: number; b: number; length: number; via: Coord[] };

/**
 * Merges edges through vertices that only continue one road into the next
 * (exactly two edges, to different neighbors), up to MAX_EDGE long. Fewer
 * vertices, same roads.
 */
function contract(edges: Edge[], points: Coord[]): Edge[] {
  const vertexCount = points.length;
  const alive = edges.map(() => true);
  const incident: number[][] = Array.from({ length: vertexCount }, () => []);
  edges.forEach((e, i) => {
    incident[e.a].push(i);
    incident[e.b].push(i);
  });
  const live = (v: number) => incident[v].filter((i) => alive[i]);

  for (let v = 0; v < vertexCount; v++) {
    const around = live(v);
    if (around.length !== 2) continue;
    const [e1, e2] = around.map((i) => edges[i]);
    const a = e1.a === v ? e1.b : e1.a;
    const b = e2.a === v ? e2.b : e2.a;
    if (a === b || e1.length + e2.length > MAX_EDGE) continue;
    // Walk a -> v -> b, flipping each edge's bends into that direction.
    const first = e1.a === a ? e1.via : e1.via.slice().reverse();
    const second = e2.a === v ? e2.via : e2.via.slice().reverse();
    const merged: Edge = {
      a,
      b,
      length: e1.length + e2.length,
      via: [...first, points[v], ...second],
    };
    alive[around[0]] = false;
    alive[around[1]] = false;
    edges.push(merged);
    alive.push(true);
    incident[a].push(edges.length - 1);
    incident[b].push(edges.length - 1);
  }
  return edges.filter((_, i) => alive[i]);
}

/**
 * The road graph: vertices at intersections and dead ends, edges along the
 * roads between them with real length in meters. Only the largest connected
 * piece is kept, so every walk has a route.
 */
function roadGraph(roads: OsmWay[]) {
  const walkable = roads.filter((w) => WALKABLE.has(w.tags?.highway ?? ""));
  const uses = new Map<number, number>();
  for (const way of walkable) {
    way.nodes.forEach((id, i) => {
      const end = i === 0 || i === way.nodes.length - 1;
      uses.set(id, (uses.get(id) ?? 0) + (end ? 2 : 1));
    });
  }

  const index = new Map<number, number>();
  const vertexLonLat: Coord[] = [];
  const vertex = (id: number, at: Coord) => {
    let i = index.get(id);
    if (i === undefined) {
      i = vertexLonLat.length;
      index.set(id, i);
      vertexLonLat.push(at);
    }
    return i;
  };

  let edges: Edge[] = [];
  for (const way of walkable) {
    let start = 0;
    for (let i = 1; i < way.nodes.length; i++) {
      if ((uses.get(way.nodes[i]) ?? 0) < 2 && i !== way.nodes.length - 1) continue;
      const run = way.geometry.slice(start, i + 1);
      if (run.some((p) => p === null)) {
        start = i;
        continue;
      }
      const line = lonLat(run);
      let length = 0;
      for (let k = 1; k < line.length; k++) {
        length += distanceMeters(
          { lon: line[k - 1][0], lat: line[k - 1][1] },
          { lon: line[k][0], lat: line[k][1] },
        );
      }
      const a = vertex(way.nodes[start], line[0]);
      const b = vertex(way.nodes[i], line[line.length - 1]);
      if (a !== b) edges.push({ a, b, length, via: line.slice(1, -1) });
      start = i;
    }
  }
  const rawVertices = vertexLonLat.length;
  edges = contract(edges, vertexLonLat);

  // Keep the largest connected component (union-find).
  const parent = vertexLonLat.map((_, i) => i);
  const find = (i: number): number => {
    while (parent[i] !== i) i = parent[i] = parent[parent[i]];
    return i;
  };
  for (const e of edges) parent[find(e.a)] = find(e.b);
  const touched = new Set(edges.flatMap((e) => [e.a, e.b]));
  const size = new Map<number, number>();
  for (const v of touched) size.set(find(v), (size.get(find(v)) ?? 0) + 1);
  const biggest = [...size.entries()].sort((x, y) => y[1] - x[1])[0][0];

  const keep = new Map<number, number>();
  for (const v of [...touched].sort((x, y) => x - y)) {
    if (find(v) === biggest) keep.set(v, keep.size);
  }

  // Map positions only. The walker gets real positions back with unproject().
  const nodes: number[] = [];
  for (const [v] of keep) {
    const [x, y] = toMap(vertexLonLat[v]);
    nodes.push(Math.round(x), Math.round(y));
  }

  // One edge per pair of vertices (the shortest), with its bends in map units.
  const best = new Map<string, Edge>();
  for (const e of edges) {
    if (!keep.has(e.a) || !keep.has(e.b)) continue;
    const k = e.a < e.b ? `${e.a}-${e.b}` : `${e.b}-${e.a}`;
    const current = best.get(k);
    if (!current || e.length < current.length) best.set(k, e);
  }
  const edgeList = [...best.values()].map((e) => {
    const from = toMap(vertexLonLat[e.a]);
    const to = toMap(vertexLonLat[e.b]);
    const bends = simplify([from, ...e.via.map(toMap), to], BEND_TOLERANCE).slice(1, -1);
    return [
      keep.get(e.a)!,
      keep.get(e.b)!,
      Math.round(e.length),
      ...bends.flatMap(([x, y]) => [Math.round(x), Math.round(y)]),
    ];
  });

  return {
    graph: { nodes, edges: edgeList },
    stats: { rawVertices, vertices: keep.size, edges: edgeList.length },
  };
}

function preview(all: Record<string, Coord[][]>): string {
  const r = EDGE;
  const path = (name: string, closedPath: boolean) => toPath(all[name] ?? [], closedPath);
  const dots = mapObjects
    .filter((o) => "lat" in o.where)
    .map((o) => {
      const p = project(o.where as { lat: number; lon: number });
      const color = {
        gym: "#0b84d6",
        stop: "#2fd3c6",
        raid: "#e43127",
        spawn: "#ffcc00",
        egg: "#ffffff",
      }[o.kind];
      return `<circle cx="${Math.round(p.x)}" cy="${Math.round(p.y)}" r="70" fill="${color}" stroke="#0a2a4a" stroke-width="20"/>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-r} ${-r} ${2 * r} ${2 * r}" width="2000" height="2000">
<rect x="${-r}" y="${-r}" width="${2 * r}" height="${2 * r}" fill="#5ac8e0"/>
<path d="${path("land", true)}" fill="#f3ecd8"/>
<path d="${path("woods", true)}" fill="#6fbf62"/>
<path d="${path("parks", true)}" fill="#7bc96f"/>
<path d="${path("water", true)}" fill="#5ac8e0"/>
<g fill="none" stroke-linecap="round" stroke-linejoin="round">
<path d="${path("street", false)}" stroke="#ffffff" stroke-width="8"/>
<path d="${path("minor", false)}" stroke="#ffffff" stroke-width="14"/>
<path d="${path("major", false)}" stroke="#fdf6e3" stroke-width="22"/>
<path d="${path("highway", false)}" stroke="#ffe8a8" stroke-width="30"/>
</g>
${dots}
<circle r="${Math.round(WORLD)}" fill="none" stroke="#0a2a4a" stroke-width="30" stroke-dasharray="120 80"/>
<circle r="${NEAR}" fill="none" stroke="#e43127" stroke-width="20" stroke-dasharray="60 60"/>
</svg>`;
}

async function main() {
  const els = Object.fromEntries(
    await Promise.all(
      ["coastline", "water", "green", "roads"].map(async (n) => [n, await load(n)] as const),
    ),
  );
  const roads = els.roads.filter((e): e is OsmWay => e.type === "way");
  const coast = els.coastline
    .filter((e): e is OsmWay => e.type === "way")
    .map((w) => lonLat(w.geometry));
  const isPark = (el: OsmElement) =>
    /^(park|golf_course)$/.test(el.tags?.leisure ?? "") ||
    /^(cemetery|recreation_ground)$/.test(el.tags?.landuse ?? "");

  const shapes = {
    land: polygons({ outer: landPolygons(coast, worldBox), inner: [] }, 0),
    water: polygons(rings(els.water), MIN_AREA.water),
    parks: polygons(rings(els.green.filter(isPark)), MIN_AREA.parks),
    woods: polygons(rings(els.green.filter((el) => !isPark(el))), MIN_AREA.woods),
    ...roadLines(roads),
  };

  const near: Record<string, string> = {};
  const far: Record<string, string> = {};
  for (const [name, lines] of Object.entries(shapes)) {
    const isArea = ["land", "water", "parks", "woods"].includes(name);
    const parts = split(lines);
    near[name] = toPath(parts.near, isArea);
    far[name] = toPath(parts.far, isArea);
  }
  const { graph, stats } = roadGraph(roads);

  await mkdir(DATA_DIR, { recursive: true });
  const files = {
    near: JSON.stringify({ world: Math.round(WORLD), edge: EDGE, ...near }),
    far: JSON.stringify(far),
    graph: JSON.stringify(graph),
  };
  for (const [name, json] of Object.entries(files)) {
    await writeFile(`${DATA_DIR}/${name}.json`, json + "\n");
  }

  const kb = (n: number) => `${(n / 1024).toFixed(0)} KB`.padStart(7);
  console.log(`near ${kb(files.near.length)}   far ${kb(files.far.length)}   graph ${kb(files.graph.length)}`);
  for (const name of Object.keys(shapes)) {
    console.log(`  ${name.padEnd(8)} near ${kb(near[name].length)}   far ${kb(far[name].length)}`);
  }
  console.log("graph:", stats);

  if (process.argv.includes("--preview")) {
    await writeFile(".cache/map-preview.svg", preview(shapes));
    console.log("preview: .cache/map-preview.svg");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
