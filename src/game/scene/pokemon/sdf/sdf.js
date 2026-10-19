// SDF primitives, the recipe compiler, and the field (distance, color, bone weights).
// Recipes are data (see ../recipes); this turns one into a signed distance field with colors and bone weights.

const { sqrt, abs, min, max, cos, sin, sign } = Math;
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);

export const DARK = "#1c1620";
export const deg = (d) => (d * Math.PI) / 180;

export function hexToRgb(hex) {
  let h = String(hex).trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error(`bad color ${JSON.stringify(hex)} (want "#rrggbb")`);
  const n = parseInt(h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/** Rotation matrix (row-major 3x3) for euler angles in radians, three.js "XYZ" order (R = Rx * Ry * Rz). */
export function euler(turn) {
  const [x = 0, y = 0, z = 0] = turn || [];
  const a = cos(x), b = sin(x), c = cos(y), d = sin(y), e = cos(z), f = sin(z);
  const ae = a * e, af = a * f, be = b * e, bf = b * f;
  return [c * e, -c * f, d, af + be * d, ae - bf * d, -b * c, bf - ae * d, be + af * d, a * c];
}
/** Rotate a vector by a turn. */
export function rotate(turn, v) {
  const m = euler(turn);
  return [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
}
/** A local point of a frame (at, turn) in model space: handy for putting paint or a bone on a turned part. */
export function place(at, turn, v) {
  const r = rotate(turn, v);
  return [at[0] + r[0], at[1] + r[1], at[2] + r[2]];
}

function vec3(a, what) {
  if (!Array.isArray(a) || a.length !== 3 || a.some((n) => typeof n !== "number" || !Number.isFinite(n)))
    throw new Error(`${what}: expected [x, y, z], got ${JSON.stringify(a)}`);
  return a;
}
const num = (n, what, dflt) => {
  if (n === undefined) {
    if (dflt === undefined) throw new Error(`${what}: missing`);
    return dflt;
  }
  if (typeof n !== "number" || !Number.isFinite(n)) throw new Error(`${what}: expected a number, got ${JSON.stringify(n)}`);
  return n;
};

// ---------- 2D helpers ----------

/** Catmull-Rom resample (uniform). closed = loop. sub = points per segment. */
function catmull(pts, closed, sub = 5) {
  const n = pts.length;
  if (n < 3) return pts.slice();
  const out = [];
  const get = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    for (let s = 0; s < sub; s++) {
      const t = s / sub, t2 = t * t, t3 = t2 * t;
      const f = (k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
      out.push([f(0), f(1)]);
    }
  }
  if (!closed) out.push(pts[n - 1].slice());
  return out;
}

/** Exact signed distance to a closed polygon (IQ), negative inside. */
function polygon(pts) {
  const n = pts.length;
  if (n < 3) throw new Error("outline needs at least 3 points");
  const P = new Float64Array(n * 2), E = new Float64Array(n * 2), IE = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    P[2 * i] = pts[i][0];
    P[2 * i + 1] = pts[i][1];
  }
  for (let i = 0, j = n - 1; i < n; j = i, i++) {
    const ex = P[2 * j] - P[2 * i], ey = P[2 * j + 1] - P[2 * i + 1];
    E[2 * i] = ex;
    E[2 * i + 1] = ey;
    const l = ex * ex + ey * ey;
    IE[i] = l > 0 ? 1 / l : 0;
  }
  return (px, py) => {
    let d = (px - P[0]) ** 2 + (py - P[1]) ** 2, s = 1;
    for (let i = 0, j = n - 1; i < n; j = i, i++) {
      const vx = P[2 * i], vy = P[2 * i + 1], ex = E[2 * i], ey = E[2 * i + 1];
      const wx = px - vx, wy = py - vy;
      let t = (wx * ex + wy * ey) * IE[i];
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const bx = wx - ex * t, by = wy - ey * t, dd = bx * bx + by * by;
      if (dd < d) d = dd;
      const c1 = py >= vy, c2 = py < P[2 * j + 1], c3 = ex * wy > ey * wx;
      if ((c1 && c2 && c3) || (!c1 && !c2 && !c3)) s = -s;
    }
    return s * sqrt(d);
  };
}
function bounds2(pts) {
  let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity;
  for (const [u, v] of pts) {
    a = min(a, u); b = min(b, v); c = max(c, u); d = max(d, v);
  }
  return [a, b, c, d];
}

// ---------- primitives ----------
// Each primitive compiles to { sd(x, y, z) in model space, box: [minx, miny, minz, maxx, maxy, maxz] or null (unbounded),
// lip: how much the SDF may underestimate distance (1 = exact), used to cull safely }.

function framed(p, local, lbox, lip, what) {
  const [ax, ay, az] = p.at === undefined ? [0, 0, 0] : vec3(p.at, `${what}.at`);
  if (p.turn !== undefined) vec3(p.turn, `${what}.turn`);
  const m = euler(p.turn);
  let fn = local;
  if (p.scale !== undefined) {
    const s = typeof p.scale === "number" ? [p.scale, p.scale, p.scale] : vec3(p.scale, `${what}.scale`);
    const [sx, sy, sz] = s, ms = min(sx, sy, sz);
    const inner = local;
    fn = (x, y, z) => inner(x / sx, y / sy, z / sz) * ms;
    if (lbox) lbox = [lbox[0] * sx, lbox[1] * sy, lbox[2] * sz, lbox[3] * sx, lbox[4] * sy, lbox[5] * sz];
    lip *= ms / max(sx, sy, sz);
  }
  const [m0, m1, m2, m3, m4, m5, m6, m7, m8] = m;
  const sd = (x, y, z) => {
    const dx = x - ax, dy = y - ay, dz = z - az;
    return fn(m0 * dx + m3 * dy + m6 * dz, m1 * dx + m4 * dy + m7 * dz, m2 * dx + m5 * dy + m8 * dz);
  };
  let box = null;
  if (lbox) {
    box = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
    for (let c = 0; c < 8; c++) {
      const lx = c & 1 ? lbox[3] : lbox[0], ly = c & 2 ? lbox[4] : lbox[1], lz = c & 4 ? lbox[5] : lbox[2];
      const w = [ax + m0 * lx + m1 * ly + m2 * lz, ay + m3 * lx + m4 * ly + m5 * lz, az + m6 * lx + m7 * ly + m8 * lz];
      for (let k = 0; k < 3; k++) {
        box[k] = min(box[k], w[k]);
        box[k + 3] = max(box[k + 3], w[k]);
      }
    }
  }
  return { sd, box, lip };
}

/** Exact round cone between spheres (a, ra) and (b, rb) (IQ). */
function roundCone(a, b, r1, r2) {
  const [ax, ay, az] = a;
  const bax = b[0] - ax, bay = b[1] - ay, baz = b[2] - az;
  const l2 = bax * bax + bay * bay + baz * baz;
  const rr = r1 - r2, a2 = l2 - rr * rr;
  if (l2 < 1e-12 || a2 <= 1e-12) {
    // one sphere holds the other
    const [c, r] = r1 >= r2 ? [a, r1] : [b, r2];
    return (x, y, z) => sqrt((x - c[0]) ** 2 + (y - c[1]) ** 2 + (z - c[2]) ** 2) - r;
  }
  const il2 = 1 / l2, srr = sign(rr) * rr * rr;
  return (x, y, z) => {
    const px = x - ax, py = y - ay, pz = z - az;
    const yv = px * bax + py * bay + pz * baz, zv = yv - l2;
    const qx = px * l2 - bax * yv, qy = py * l2 - bay * yv, qz = pz * l2 - baz * yv;
    const x2 = qx * qx + qy * qy + qz * qz, y2 = yv * yv * l2, z2 = zv * zv * l2;
    const k = srr * x2;
    if (sign(zv) * a2 * z2 > k) return sqrt(x2 + z2) * il2 - r2;
    if (sign(yv) * a2 * y2 < k) return sqrt(x2 + y2) * il2 - r1;
    return (sqrt(x2 * a2 * il2) + yv * rr) * il2 - r1;
  };
}
const coneBox = (a, b, ra, rb) => [
  min(a[0] - ra, b[0] - rb), min(a[1] - ra, b[1] - rb), min(a[2] - ra, b[2] - rb),
  max(a[0] + ra, b[0] + rb), max(a[1] + ra, b[1] + rb), max(a[2] + ra, b[2] + rb),
];
const unionBox = (A, B) => [min(A[0], B[0]), min(A[1], B[1]), min(A[2], B[2]), max(A[3], B[3]), max(A[4], B[4]), max(A[5], B[5])];

export const KINDS = ["ellipsoid", "sphere", "cone", "chain", "slab", "box", "torus", "lathe", "half"];

/** Compile one primitive description to { sd, box, lip }. */
export function makePrim(p, what = "piece") {
  if (p.squash) return squashed(p, what);
  switch (p.kind) {
    case "sphere":
    case "ellipsoid": {
      const r = typeof p.r === "number" ? [p.r, p.r, p.r] : vec3(p.r, `${what}.r`);
      const [rx, ry, rz] = r;
      const rmin = min(rx, ry, rz), rmax = max(rx, ry, rz);
      const irx = 1 / rx, iry = 1 / ry, irz = 1 / rz;
      const local =
        rx === ry && ry === rz
          ? (x, y, z) => sqrt(x * x + y * y + z * z) - rx
          : (x, y, z) => {
              const a = x * irx, b = y * iry, c = z * irz;
              const k0 = sqrt(a * a + b * b + c * c);
              const d = a * irx, e = b * iry, f = c * irz;
              const k1 = sqrt(d * d + e * e + f * f);
              return k1 < 1e-12 ? -rmin : (k0 * (k0 - 1)) / k1;
            };
      return { ...framed(p, local, [-rx, -ry, -rz, rx, ry, rz], rmin / rmax, what), thin: 2 * rmin };
    }
    case "cone": {
      const a = vec3(p.a, `${what}.a`), b = vec3(p.b, `${what}.b`);
      const ra = num(p.ra ?? p.r, `${what}.ra`), rb = num(p.rb ?? p.r ?? p.ra, `${what}.rb`);
      return { sd: roundCone(a, b, ra, rb), box: coneBox(a, b, ra, rb), lip: 1, thin: 2 * min(ra, rb) };
    }
    case "chain": {
      const pts = p.points;
      if (!Array.isArray(pts) || pts.length < 2) throw new Error(`${what}.points: need 2+ [x, y, z, r] points`);
      pts.forEach((q, i) => {
        if (!Array.isArray(q) || q.length !== 4 || q.some((n) => !Number.isFinite(n))) throw new Error(`${what}.points[${i}]: expected [x, y, z, r]`);
      });
      const segs = [];
      let box = null;
      for (let i = 0; i + 1 < pts.length; i++) {
        const a = pts[i].slice(0, 3), b = pts[i + 1].slice(0, 3);
        segs.push(roundCone(a, b, pts[i][3], pts[i + 1][3]));
        const bb = coneBox(a, b, pts[i][3], pts[i + 1][3]);
        box = box ? unionBox(box, bb) : bb;
      }
      const k = num(p.smooth, `${what}.smooth`, 0);
      const sd =
        k > 0
          ? (x, y, z) => {
              let d = segs[0](x, y, z);
              for (let i = 1; i < segs.length; i++) {
                const di = segs[i](x, y, z), h = clamp01(0.5 + (0.5 * (d - di)) / k);
                d = d + (di - d) * h - k * h * (1 - h);
              }
              return d;
            }
          : (x, y, z) => {
              let d = segs[0](x, y, z);
              for (let i = 1; i < segs.length; i++) {
                const di = segs[i](x, y, z);
                if (di < d) d = di;
              }
              return d;
            };
      return { sd, box, lip: 1, thin: 2 * min(...pts.map((q) => q[3])) };
    }
    case "slab": {
      if (!Array.isArray(p.outline) || p.outline.length < 3) throw new Error(`${what}.outline: need 3+ [u, v] points`);
      const pts = p.smooth ? catmull(p.outline, true, p.smooth === true ? 5 : p.smooth) : p.outline;
      const poly = polygon(pts);
      const depth = num(p.depth, `${what}.depth`);
      const round = min(num(p.round, `${what}.round`, 0), depth / 2);
      const hz = depth / 2 - round;
      // taper: the plate thins over this distance in from the outline, down to the round edge (leaf/ear section)
      const taper = num(p.taper, `${what}.taper`, 0);
      let local, lip = 1, grow = 0;
      if (taper > 0) {
        // lens: full thickness deep inside, thinning to 0 at the outline over `taper`, then dilated by `round`
        // (so the outline grows by `round`; narrow tips end in a small round instead of a full-depth fin)
        const it = 1 / taper;
        lip = 1 / sqrt(1 + ((2 * hz) / taper) ** 2);
        grow = round;
        local = (x, y, z) => {
          const a = poly(x, y);
          let c = -a * it;
          c = c < 0 ? 0 : c > 1 ? 1 : c;
          const b = abs(z) - hz * c * (2 - c);
          const oa = a > 0 ? a : 0, ob = b > 0 ? b : 0;
          return min(max(a, b), 0) + sqrt(oa * oa + ob * ob) - round; // overestimates a little in the taper band (keep taper >= depth)
        };
      } else
        local = (x, y, z) => {
          const wx = poly(x, y) + round, wz = abs(z) - hz;
          const ox = wx > 0 ? wx : 0, oz = wz > 0 ? wz : 0;
          return min(max(wx, wz), 0) + sqrt(ox * ox + oz * oz) - round;
        };
      const [u0, v0, u1, v1] = bounds2(pts);
      return { ...framed(p, local, [u0 - grow, v0 - grow, -depth / 2, u1 + grow, v1 + grow, depth / 2], lip, what), thin: taper > 0 ? 2 * round : depth };
    }
    case "lathe": {
      if (!Array.isArray(p.profile) || p.profile.length < 2) throw new Error(`${what}.profile: need 2+ [r, y] points`);
      const prof = p.smooth === false ? p.profile : catmull(p.profile, false, typeof p.smooth === "number" ? p.smooth : 5);
      const mir = prof.slice().reverse().map(([r, y]) => [-r, y]);
      if (abs(prof[prof.length - 1][0]) < 1e-9) mir.shift();
      if (abs(prof[0][0]) < 1e-9) mir.pop();
      const poly = polygon(prof.concat(mir));
      const [, y0, r1, y1] = bounds2(prof.map(([r, y]) => [abs(r), y]));
      const local = (x, y, z) => poly(sqrt(x * x + z * z), y);
      return framed(p, local, [-r1, y0, -r1, r1, y1, r1], 1, what);
    }
    case "box": {
      const size = typeof p.size === "number" ? [p.size, p.size, p.size] : vec3(p.size, `${what}.size`);
      const round = min(num(p.round, `${what}.round`, 0), min(...size) / 2);
      const bx = size[0] / 2 - round, by = size[1] / 2 - round, bz = size[2] / 2 - round;
      const local = (x, y, z) => {
        const qx = abs(x) - bx, qy = abs(y) - by, qz = abs(z) - bz;
        const ox = qx > 0 ? qx : 0, oy = qy > 0 ? qy : 0, oz = qz > 0 ? qz : 0;
        return sqrt(ox * ox + oy * oy + oz * oz) + min(max(qx, qy, qz), 0) - round;
      };
      return { ...framed(p, local, [-size[0] / 2, -size[1] / 2, -size[2] / 2, size[0] / 2, size[1] / 2, size[2] / 2], 1, what), thin: min(...size) };
    }
    case "torus": {
      const R = num(p.R, `${what}.R`), r = num(p.r, `${what}.r`);
      const local = (x, y, z) => {
        const q = sqrt(x * x + y * y) - R;
        return sqrt(q * q + z * z) - r;
      };
      return { ...framed(p, local, [-R - r, -R - r, -r, R + r, R + r, r], 1, what), thin: 2 * r };
    }
    case "half": {
      const d = p.dir === undefined ? [0, 1, 0] : vec3(p.dir, `${what}.dir`);
      const l = Math.hypot(...d);
      const [dx, dy, dz] = d.map((c) => c / l);
      const off = num(p.offset, `${what}.offset`, 0);
      const f = framed(p, (x, y, z) => off - (x * dx + y * dy + z * dz), null, 1, what);
      return f;
    }
    default:
      throw new Error(`${what}: unknown kind ${JSON.stringify(p.kind)} (one of ${KINDS.join(", ")})`);
  }
}

/**
 * squash: { axis: [x, y, z], k: 0..1, at?: [x, y, z] } flattens any primitive along a model-space axis, by k, toward the
 * plane through `at` (default: the middle of the piece's box). Use it to make chains and cones flat (ears, tails, fins).
 */
function squashed(p, what) {
  const base = makePrim({ ...p, squash: undefined }, what);
  const q = p.squash;
  const ax = vec3(q.axis, `${what}.squash.axis`);
  const l = Math.hypot(...ax);
  const [nx, ny, nz] = ax.map((c) => c / l);
  const k = num(q.k, `${what}.squash.k`);
  if (!(k > 0 && k <= 1)) throw new Error(`${what}.squash.k: between 0 and 1`);
  const b = base.box;
  const at = q.at ? vec3(q.at, `${what}.squash.at`) : b ? [(b[0] + b[3]) / 2, (b[1] + b[4]) / 2, (b[2] + b[5]) / 2] : [0, 0, 0];
  const s = 1 / k - 1, inner = base.sd;
  const sd = (x, y, z) => {
    const t = s * ((x - at[0]) * nx + (y - at[1]) * ny + (z - at[2]) * nz);
    return inner(x + t * nx, y + t * ny, z + t * nz) * k;
  };
  return { sd, box: b, lip: base.lip * k, thin: base.thin === undefined ? undefined : base.thin * k };
}

// ---------- mirroring ----------

/** Swap a trailing side marker in a bone name: earL <-> earR, arm_l <-> arm_r, legLeft <-> legRight. */
export function swapSide(name) {
  const m = /^(.*?)(Left|Right|L|R|_l|_r|\.L|\.R)$/.exec(name);
  if (!m) return name;
  const s = { Left: "Right", Right: "Left", L: "R", R: "L", _l: "_r", _r: "_l", ".L": ".R", ".R": ".L" }[m[2]];
  return m[1] + s;
}
const fx = (v) => (v ? [-v[0], v[1], v[2]] : v);

/** The x-mirrored copy of a primitive (the Pokémon's other side). */
export function mirrorPrim(p) {
  const q = { ...p };
  delete q.mirror;
  if (q.at) q.at = fx(q.at);
  if (q.turn) q.turn = [q.turn[0], -q.turn[1], -q.turn[2]];
  if (q.a) q.a = fx(q.a);
  if (q.b) q.b = fx(q.b);
  if (q.points) q.points = q.points.map(([x, y, z, r]) => [-x, y, z, r]);
  if (q.outline) q.outline = q.outline.map(([u, v]) => [-u, v]);
  if (q.kind === "half" && q.dir) q.dir = fx(q.dir);
  if (q.squash) q.squash = { ...q.squash, axis: fx(q.squash.axis), at: q.squash.at && fx(q.squash.at) };
  return q;
}

/** Flatten nested arrays, drop falsy entries, and add mirrored copies right after anything with mirror: true. */
function expand(list, mirrorFn) {
  const out = [];
  const walk = (x) => {
    if (!x) return;
    if (Array.isArray(x)) return x.forEach(walk);
    out.push({ ...x, mirror: undefined, _side: x.mirror ? "a" : undefined });
    if (x.mirror) out.push({ ...mirrorFn(x), _side: "b" });
  };
  walk(list);
  return out;
}

// ---------- recipe compiler ----------

/**
 * Compile a recipe into flat arrays and the field functions.
 * Returns { name, dex, bones, pieces, paint, faceSrc, dist, full, grad, bbox }.
 */
export function compile(recipe) {
  if (!recipe || typeof recipe !== "object") throw new Error("recipe: the module must export a default object");
  // bones
  const bones = [];
  const bi = new Map();
  const addBone = (name, at, parent) => {
    bi.set(name, bones.length);
    bones.push({ name, at, parent });
  };
  for (const [name, val] of Object.entries(recipe.bones || {})) {
    if (Array.isArray(val)) addBone(name, vec3(val, `bones.${name}`), null);
    else addBone(name, vec3(val.at, `bones.${name}.at`), val.parent ?? null);
  }
  if (!bi.has("root")) {
    bi.set("root", bones.length);
    bones.push({ name: "root", at: [0, 0, 0], parent: null });
  }
  for (const b of bones) if (b.name !== "root" && b.parent === null) b.parent = "root";
  const boneOf = (name, mirrored, what) => {
    let n = name ?? "root";
    if (mirrored) {
      const s = swapSide(n);
      if (bi.has(s)) n = s;
    }
    if (!bi.has(n)) throw new Error(`${what}: unknown bone ${JSON.stringify(n)} (add it to bones)`);
    return bi.get(n);
  };

  // pieces
  const src = expand(recipe.pieces, mirrorPrim);
  if (!src.length) throw new Error("recipe.pieces: empty");
  const pieces = src.map((p, i) => {
    const what = `pieces[${i}]${p.name ? ` (${p.name})` : ""}`;
    const prim = makePrim(p, what);
    const blend = num(p.blend, `${what}.blend`, 0);
    const carve = blend < 0 || p.carve === true;
    if (!carve && !prim.box) throw new Error(`${what}: a "${p.kind}" is unbounded, use it only as a carve or paint`);
    return {
      name: p.name ?? `${p.kind}${i}`,
      kind: p.kind,
      ...prim,
      k: abs(blend),
      carve,
      color: p.color === undefined ? null : hexToRgb(p.color),
      bone: boneOf(p.bone, p._side === "b", what),
    };
  });
  if (pieces[0].carve) throw new Error("pieces[0]: the first piece can't be a carve");
  for (const p of pieces) if (!p.carve && !p.color) throw new Error(`piece ${p.name}: missing color`);

  // paint
  const otherSide = (b) => (bi.has(swapSide(b)) ? swapSide(b) : b);
  const paint = expand(recipe.paint, (x) => ({ ...x, shape: mirrorPrim(x.shape), bones: x.bones?.map(otherSide) })).map((p, i) => {
    const what = `paint[${i}]${p.name ? ` (${p.name})` : ""}`;
    if (!p.shape) throw new Error(`${what}: missing shape`);
    const prim = makePrim(p.shape, `${what}.shape`);
    return {
      name: p.name ?? `paint${i}`,
      color: hexToRgb(p.color ?? "#ff00ff"),
      colorHex: p.color,
      soft: num(p.soft, `${what}.soft`, 0),
      sd: prim.sd,
      bones: p.bones ? p.bones.map((b) => boneOf(b, false, `${what}.bones`)) : null,
    };
  });

  // field
  const n = pieces.length, nb = bones.length;
  const SD = pieces.map((p) => p.sd);
  const BOX = new Float64Array(n * 6), LIP = new Float64Array(n), K = new Float64Array(n), CARVE = new Uint8Array(n), BONE = new Int32Array(n);
  const COL = new Float64Array(n * 3), HASCOL = new Uint8Array(n);
  pieces.forEach((p, i) => {
    if (p.box) BOX.set(p.box, i * 6);
    else BOX.set([-1e9, -1e9, -1e9, 1e9, 1e9, 1e9], i * 6);
    LIP[i] = p.lip;
    K[i] = p.k;
    CARVE[i] = p.carve ? 1 : 0;
    BONE[i] = p.bone;
    if (p.color) {
      COL.set(p.color, i * 3);
      HASCOL[i] = 1;
    }
  });
  // lower bound of piece i's SDF at (x, y, z), from its box
  const lower = (i, x, y, z) => {
    const o = i * 6;
    const dx = max(BOX[o] - x, 0, x - BOX[o + 3]), dy = max(BOX[o + 1] - y, 0, y - BOX[o + 4]), dz = max(BOX[o + 2] - z, 0, z - BOX[o + 5]);
    return sqrt(dx * dx + dy * dy + dz * dz) * LIP[i];
  };

  /** Distance only. */
  const dist = (x, y, z) => {
    let d = 1e9;
    for (let i = 0; i < n; i++) {
      const k = K[i];
      if (!CARVE[i]) {
        if (lower(i, x, y, z) >= d + k) continue;
        const di = SD[i](x, y, z);
        if (k === 0) {
          if (di < d) d = di;
        } else {
          const h = clamp01(0.5 + (0.5 * (d - di)) / k);
          d = d + (di - d) * h - k * h * (1 - h);
        }
      } else {
        if (lower(i, x, y, z) >= k - d) continue;
        const di = SD[i](x, y, z);
        if (k === 0) {
          if (-di > d) d = -di;
        } else {
          const h = clamp01(0.5 - (0.5 * (d + di)) / k);
          d = d + (-di - d) * h + k * h * (1 - h);
        }
      }
    }
    return d;
  };

  /** Distance plus blended color (rgb, sRGB 0..1) and bone weights (length = bones). */
  const full = (x, y, z, rgb, w) => {
    let d = 1e9;
    rgb[0] = rgb[1] = rgb[2] = 0;
    w.fill(0);
    for (let i = 0; i < n; i++) {
      const k = K[i];
      let h;
      if (!CARVE[i]) {
        if (lower(i, x, y, z) >= d + k) continue;
        const di = SD[i](x, y, z);
        if (k === 0) h = di < d ? 1 : 0;
        else h = clamp01(0.5 + (0.5 * (d - di)) / k);
        d = d + (di - d) * h - k * h * (1 - h);
        if (h > 0) {
          const g = 1 - h;
          for (let b = 0; b < nb; b++) w[b] *= g;
          w[BONE[i]] += h;
        }
      } else {
        if (lower(i, x, y, z) >= k - d) continue;
        const di = SD[i](x, y, z);
        if (k === 0) h = -di > d ? 1 : 0;
        else h = clamp01(0.5 - (0.5 * (d + di)) / k);
        d = d + (-di - d) * h + k * h * (1 - h);
        if (!HASCOL[i]) continue;
      }
      if (h > 0) {
        const o = i * 3;
        rgb[0] += (COL[o] - rgb[0]) * h;
        rgb[1] += (COL[o + 1] - rgb[1]) * h;
        rgb[2] += (COL[o + 2] - rgb[2]) * h;
      }
    }
    return d;
  };

  /** Gradient by 4 taps (tetrahedron). Writes the unnormalized gradient (df/dx...) into out. */
  const grad = (x, y, z, e, out) => {
    const a = dist(x + e, y - e, z - e), b = dist(x - e, y - e, z + e), c = dist(x - e, y + e, z - e), d = dist(x + e, y + e, z + e);
    const s = 1 / (4 * e);
    out[0] = (a - b - c + d) * s;
    out[1] = (-a - b + c + d) * s;
    out[2] = (-a + b - c + d) * s;
    return out;
  };

  // bounding box of the solid pieces (carves only remove)
  let bbox = null;
  let kmax = 0;
  for (const p of pieces)
    if (!p.carve) {
      bbox = bbox ? unionBox(bbox, p.box) : p.box.slice();
      kmax = max(kmax, p.k);
    }

  return {
    name: recipe.name ?? "unnamed",
    dex: recipe.dex ?? null,
    height: recipe.height ?? 1,
    bones,
    pieces,
    paint,
    faceSrc: recipe.face ?? null,
    dist,
    full,
    grad,
    bbox,
    kmax,
  };
}

/** Expand face features (mirror: true adds the other side). */
export function expandFace(face) {
  if (!face) return { eyes: [], mouths: [], spots: [] };
  const mEye = (e) => {
    const q = { ...e, at: fx(e.at) };
    if (q.dir) q.dir = fx(q.dir);
    if (q.turn) q.turn = -q.turn;
    if (q.glint) q.glint = [-q.glint[0], q.glint[1], q.glint[2]];
    if (q.glints) q.glints = q.glints.map(([u, v, s]) => [-u, v, s]);
    if (q.irisAt) q.irisAt = [-q.irisAt[0], q.irisAt[1]];
    if (q.cut) q.cut = [q.cut[0], -q.cut[1]];
    return q;
  };
  const mSpot = (s) => {
    const q = { ...s, at: fx(s.at) };
    if (q.dir) q.dir = fx(q.dir);
    if (q.turn) q.turn = -q.turn;
    return q;
  };
  const mouths = face.mouth ? (Array.isArray(face.mouth) ? face.mouth : [face.mouth]) : face.mouths ?? [];
  return { eyes: expand(face.eyes ?? [], mEye), mouths: expand(mouths, mSpot), spots: expand(face.spots ?? [], mSpot) };
}

export { clamp01 };
