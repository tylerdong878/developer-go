// Surface nets over a recipe's field: positions, normals from the field, colors, skin weights, paint distances,
// and the face features snapped onto the surface. Runs in a worker (worker.ts).
import { compile, expandFace, hexToRgb, DARK } from "./sdf.js";

const { sqrt, abs, min, max, ceil } = Math;

const now = () => performance.now();

/**
 * Build the mesh. opts: grid (cells on the longest axis, default 64), project (snap vertices onto the surface, default true),
 * stride (coarse pass step, default 4; 1 = evaluate every grid point).
 */
export function buildMesh(recipe, opts = {}) {
  const grid = opts.grid ?? 64, project = opts.project ?? true, S = max(1, opts.stride ?? 4);
  const T = {};
  let t = now();
  const lap = (k) => {
    const n = now();
    T[k] = n - t;
    t = n;
  };

  const C = compile(recipe);
  const { dist, full, grad } = C;
  lap("compile");

  // ---- grid over the bounding box, padded for blends and 2.5 cells
  const bb = C.bbox;
  const ext = [bb[3] - bb[0], bb[4] - bb[1], bb[5] - bb[2]];
  const longest = max(...ext);
  const h = (longest + 0.5 * C.kmax) / (grid - 5);
  const pad = 2.5 * h + 0.25 * C.kmax;
  const dims = ext.map((e) => ceil((e + 2 * pad) / h) + 1);
  const org = [0, 1, 2].map((k) => (bb[k] + bb[k + 3]) / 2 - ((dims[k] - 1) * h) / 2);
  const [nx, ny, nz] = dims, nxy = nx * ny;
  const F = new Float32Array(nx * ny * nz);
  const done = new Uint8Array(nx * ny * nz);

  // coarse pass, then exact values only in blocks near the surface
  const cx = ceil((nx - 1) / S) + 1, cy = ceil((ny - 1) / S) + 1, cz = ceil((nz - 1) / S) + 1;
  const CF = new Float32Array(cx * cy * cz);
  for (let k = 0; k < cz; k++)
    for (let j = 0; j < cy; j++)
      for (let i = 0; i < cx; i++) CF[i + cx * (j + cy * k)] = dist(org[0] + i * S * h, org[1] + j * S * h, org[2] + k * S * h);
  const band = S * h * sqrt(3);
  let exact = 0;
  for (let bk = 0; bk < cz - 1; bk++)
    for (let bj = 0; bj < cy - 1; bj++)
      for (let bi = 0; bi < cx - 1; bi++) {
        const c0 = bi + cx * (bj + cy * bk);
        const v000 = CF[c0], v100 = CF[c0 + 1], v010 = CF[c0 + cx], v110 = CF[c0 + cx + 1];
        const v001 = CF[c0 + cx * cy], v101 = CF[c0 + cx * cy + 1], v011 = CF[c0 + cx * cy + cx], v111 = CF[c0 + cx * cy + cx + 1];
        const near = min(abs(v000), abs(v100), abs(v010), abs(v110), abs(v001), abs(v101), abs(v011), abs(v111)) < band;
        const i0 = bi * S, j0 = bj * S, k0 = bk * S;
        const i1 = min(i0 + S, nx - 1), j1 = min(j0 + S, ny - 1), k1 = min(k0 + S, nz - 1);
        for (let k = k0; k <= k1; k++)
          for (let j = j0; j <= j1; j++)
            for (let i = i0; i <= i1; i++) {
              const id = i + nx * (j + ny * k);
              if (done[id]) continue;
              if (near) {
                F[id] = dist(org[0] + i * h, org[1] + j * h, org[2] + k * h);
                done[id] = 1;
                exact++;
              } else {
                const fx = (i - i0) / S, fy = (j - j0) / S, fz = (k - k0) / S;
                const a = v000 + (v100 - v000) * fx, b = v010 + (v110 - v010) * fx;
                const c = v001 + (v101 - v001) * fx, d = v011 + (v111 - v011) * fx;
                const e = a + (b - a) * fy, f = c + (d - c) * fy;
                F[id] = e + (f - e) * fz;
              }
            }
      }
  lap("field");

  // ---- surface nets
  const cnx = nx - 1, cny = ny - 1, cnz = nz - 1, cnxy = cnx * cny;
  const cellV = new Int32Array(cnx * cny * cnz).fill(-1);
  const OFF = [0, 1, nx, nx + 1, nxy, nxy + 1, nxy + nx, nxy + nx + 1];
  const EA = [], EB = [];
  for (let c = 0; c < 8; c++)
    for (const b of [1, 2, 4])
      if (!(c & b)) {
        EA.push(c);
        EB.push(c | b);
      }
  const CXo = [0, 1, 0, 1, 0, 1, 0, 1], CYo = [0, 0, 1, 1, 0, 0, 1, 1], CZo = [0, 0, 0, 0, 1, 1, 1, 1];
  const P = [];
  const v = new Float64Array(8);
  for (let k = 0; k < cnz; k++)
    for (let j = 0; j < cny; j++)
      for (let i = 0; i < cnx; i++) {
        const base = i + nx * (j + ny * k);
        let mask = 0;
        for (let c = 0; c < 8; c++) if ((v[c] = F[base + OFF[c]]) < 0) mask |= 1 << c;
        if (mask === 0 || mask === 255) continue;
        let sx = 0, sy = 0, sz = 0, cnt = 0;
        for (let e = 0; e < 12; e++) {
          const a = EA[e], b = EB[e];
          if (v[a] < 0 === v[b] < 0) continue;
          const tt = v[a] / (v[a] - v[b]);
          sx += CXo[a] + (CXo[b] - CXo[a]) * tt;
          sy += CYo[a] + (CYo[b] - CYo[a]) * tt;
          sz += CZo[a] + (CZo[b] - CZo[a]) * tt;
          cnt++;
        }
        cellV[i + cnx * (j + cny * k)] = P.length / 3;
        P.push(org[0] + (i + sx / cnt) * h, org[1] + (j + sy / cnt) * h, org[2] + (k + sz / cnt) * h);
      }
  const nv = P.length / 3;
  const pos = new Float32Array(P);
  const I = [];
  const d2 = (a, b) => (pos[3 * a] - pos[3 * b]) ** 2 + (pos[3 * a + 1] - pos[3 * b + 1]) ** 2 + (pos[3 * a + 2] - pos[3 * b + 2]) ** 2;
  // the 4 cells around a crossing edge, in counterclockwise order seen from the edge's + end; flipped when the + end is inside
  const quad = (a, b, c, d, flip) => {
    a = cellV[a]; b = cellV[b]; c = cellV[c]; d = cellV[d];
    if (flip) [b, d] = [d, b];
    if (d2(a, c) <= d2(b, d)) I.push(a, b, c, a, c, d);
    else I.push(a, b, d, b, c, d);
  };
  for (let k = 0; k < cnz; k++)
    for (let j = 0; j < cny; j++)
      for (let i = 0; i < cnx; i++) {
        const c = i + cnx * (j + cny * k), p0 = i + nx * (j + ny * k), in0 = F[p0] < 0;
        if (j > 0 && k > 0 && F[p0 + 1] < 0 !== in0) quad(c, c - cnx, c - cnx - cnxy, c - cnxy, !in0);
        if (i > 0 && k > 0 && F[p0 + nx] < 0 !== in0) quad(c, c - cnxy, c - 1 - cnxy, c - 1, !in0);
        if (i > 0 && j > 0 && F[p0 + nxy] < 0 !== in0) quad(c, c - 1, c - 1 - cnx, c - cnx, !in0);
      }
  const idx = new Uint32Array(I);
  lap("nets");

  // ---- per-vertex attributes from the field
  const nb = C.bones.length, np = C.paint.length;
  const nrm = new Float32Array(nv * 3), col = new Float32Array(nv * 3);
  const skinI = new Uint8Array(nv * 4), skinW = new Float32Array(nv * 4);
  const paintD = new Float32Array(nv * max(1, np));
  const g = new Float64Array(3), rgb = new Float64Array(3), w = new Float64Array(nb);
  const eps = h * 0.35, maxStep = h * 0.6;
  const order = new Int32Array(nb);
  for (let q = 0; q < nv; q++) {
    let x = pos[3 * q], y = pos[3 * q + 1], z = pos[3 * q + 2];
    if (project) {
      // one Newton step onto the surface, skipped where the gradient is unreliable (inside thin plates, at tips)
      const f = dist(x, y, z);
      grad(x, y, z, eps, g);
      const gl = g[0] * g[0] + g[1] * g[1] + g[2] * g[2];
      if (gl > 0.4 * 0.4 && gl < 2 * 2) {
        let sx = (g[0] * f) / gl, sy = (g[1] * f) / gl, sz = (g[2] * f) / gl;
        const sl = sqrt(sx * sx + sy * sy + sz * sz);
        if (sl > maxStep) {
          sx *= maxStep / sl; sy *= maxStep / sl; sz *= maxStep / sl;
        }
        x -= sx; y -= sy; z -= sz;
        pos[3 * q] = x; pos[3 * q + 1] = y; pos[3 * q + 2] = z;
      }
    }
    grad(x, y, z, eps, g);
    const gl = sqrt(g[0] * g[0] + g[1] * g[1] + g[2] * g[2]) || 1;
    nrm[3 * q] = g[0] / gl; nrm[3 * q + 1] = g[1] / gl; nrm[3 * q + 2] = g[2] / gl;
    full(x, y, z, rgb, w);
    col[3 * q] = rgb[0]; col[3 * q + 1] = rgb[1]; col[3 * q + 2] = rgb[2];
    // top 4 bone weights
    let tot = 0;
    for (let b = 0; b < nb; b++) order[b] = b;
    const ord = Array.from(order).sort((a, b) => w[b] - w[a]);
    for (let s = 0; s < 4; s++) tot += s < nb ? w[ord[s]] : 0;
    for (let s = 0; s < 4; s++) {
      skinI[4 * q + s] = s < nb ? ord[s] : 0;
      skinW[4 * q + s] = s < nb && tot > 0 ? w[ord[s]] / tot : s === 0 ? 1 : 0;
    }
    // paint distances (negative inside), clamped
    let wsum = 0;
    for (let b = 0; b < nb; b++) wsum += w[b];
    for (let L = 0; L < np; L++) {
      const pl = C.paint[L];
      let d = pl.sd(x, y, z);
      if (pl.bones) {
        let on = 0;
        for (const b of pl.bones) on += w[b];
        if (on < 0.5 * (wsum || 1)) d = 0.1;
      }
      paintD[q * np + L] = d < -0.1 ? -0.1 : d > 0.1 ? 0.1 : d;
    }
  }
  // optional Taubin smoothing (positions only; normals and colors stay from the field): evens out thin-part wobble
  const passes = opts.smooth ?? 0;
  if (passes > 0) {
    const sum = new Float64Array(nv * 3), cnt = new Uint16Array(nv);
    const step = (lambda) => {
      sum.fill(0);
      cnt.fill(0);
      for (let f = 0; f < idx.length; f += 3) {
        const tri = [idx[f], idx[f + 1], idx[f + 2]];
        for (let e = 0; e < 3; e++) {
          const a = tri[e], b = tri[(e + 1) % 3];
          for (let k = 0; k < 3; k++) {
            sum[3 * a + k] += pos[3 * b + k];
            sum[3 * b + k] += pos[3 * a + k];
          }
          cnt[a]++;
          cnt[b]++;
        }
      }
      for (let q = 0; q < nv; q++) {
        if (!cnt[q]) continue;
        for (let k = 0; k < 3; k++) pos[3 * q + k] += lambda * (sum[3 * q + k] / cnt[q] - pos[3 * q + k]);
      }
    };
    for (let s = 0; s < passes; s++) {
      step(0.5);
      step(-0.53);
    }
  }
  // winding is topological (from the crossing edges), so it's right even where field normals are not; count disagreements
  let flipped = 0;
  for (let f = 0; f < idx.length; f += 3) {
    const a = idx[f], b = idx[f + 1], c = idx[f + 2];
    const ux = pos[3 * b] - pos[3 * a], uy = pos[3 * b + 1] - pos[3 * a + 1], uz = pos[3 * b + 2] - pos[3 * a + 2];
    const vx = pos[3 * c] - pos[3 * a], vy = pos[3 * c + 1] - pos[3 * a + 1], vz = pos[3 * c + 2] - pos[3 * a + 2];
    const gx = uy * vz - uz * vy, gy = uz * vx - ux * vz, gz = ux * vy - uy * vx;
    const sx = nrm[3 * a] + nrm[3 * b] + nrm[3 * c], sy = nrm[3 * a + 1] + nrm[3 * b + 1] + nrm[3 * c + 1], sz = nrm[3 * a + 2] + nrm[3 * b + 2] + nrm[3 * c + 2];
    if (gx * sx + gy * sy + gz * sz < 0) flipped++;
  }
  lap("attributes");

  // ---- face features, snapped onto the surface
  const face = resolveFace(C, h);
  lap("face");

  // ---- bounds
  const mb = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
  for (let q = 0; q < nv; q++)
    for (let k = 0; k < 3; k++) {
      const c = pos[3 * q + k];
      if (c < mb[k]) mb[k] = c;
      if (c > mb[k + 3]) mb[k + 3] = c;
    }
  T.total = Object.values(T).reduce((a, b) => a + b, 0);

  return {
    name: C.name,
    dex: C.dex,
    grid,
    cell: h,
    dims,
    exactPoints: exact,
    normalDisagree: flipped,
    bbox: mb,
    positions: pos,
    normals: nrm,
    colors: col,
    skinIndex: skinI,
    skinWeight: skinW,
    paint: { layers: C.paint.map((p) => ({ name: p.name, color: p.color, colorHex: p.colorHex, soft: p.soft })), dist: paintD },
    indices: idx,
    bones: C.bones,
    face,
    timings: T,
    compiled: C,
  };
}

// ---------- face ----------

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

function frameAt(C, f, h, what) {
  if (!Array.isArray(f.at) || f.at.length !== 3) throw new Error(`${what}.at: expected [x, y, z]`);
  const g = new Float64Array(3);
  let p = f.at.slice();
  if (f.snap !== false)
    for (let it = 0; it < 10; it++) {
      const d = C.dist(p[0], p[1], p[2]);
      C.grad(p[0], p[1], p[2], h * 0.35, g);
      const n = norm(g);
      p = [p[0] - n[0] * d, p[1] - n[1] * d, p[2] - n[2] * d];
      if (abs(d) < 1e-5) break;
    }
  const n = f.dir ? norm(f.dir) : norm(Array.from(C.grad(p[0], p[1], p[2], h * 0.5, g)));
  let u = cross([0, 1, 0], n);
  if (Math.hypot(...u) < 1e-4) u = [1, 0, 0];
  u = norm(u);
  let v = cross(n, u);
  const r = f.turn ?? 0;
  if (r) {
    const c = Math.cos(r), s = Math.sin(r);
    const u2 = [u[0] * c + v[0] * s, u[1] * c + v[1] * s, u[2] * c + v[2] * s];
    v = [-u[0] * s + v[0] * c, -u[1] * s + v[1] * c, -u[2] * s + v[2] * c];
    u = u2;
  }
  return { name: f.name ?? what, C: p, n, u, v, snapErr: Math.hypot(...sub(p, f.at)) };
}

const rgbOr = (c, d) => (c === undefined ? (d === null ? null : hexToRgb(d)) : c === null ? null : hexToRgb(c));

function resolveFace(C, h) {
  const F = expandFace(C.faceSrc);
  const out = [];
  F.spots.forEach((s, i) => {
    const what = `face.spots[${i}]`;
    const r = typeof s.r === "number" ? [s.r, s.r] : s.r;
    if (!Array.isArray(r)) throw new Error(`${what}.r: number or [rx, ry]`);
    out.push({ type: "spot", ...frameAt(C, s, h, what), rx: r[0], ry: r[1], color: rgbOr(s.color, "#ee5a42"), soft: s.soft ?? 0, lit: s.lit ?? true, reach: max(r[0], r[1]) });
  });
  F.mouths.forEach((m, i) => {
    const what = `face.mouth[${i}]`;
    const w = m.w ?? 0.06, hh = m.h ?? 0.03;
    out.push({
      type: "mouth",
      ...frameAt(C, m, h, what),
      kind: m.kind ?? "smile",
      w,
      h: hh,
      thick: m.thick ?? max(0.006, hh * 0.25),
      color: rgbOr(m.color, DARK),
      inner: rgbOr(m.inner, "#7f2a2a"),
      tongue: rgbOr(m.tongue, m.kind === "open" ? "#e87e78" : null),
      lit: m.lit ?? false,
      reach: max(w, hh * 2) * 0.75 + (m.thick ?? 0.01),
    });
  });
  F.eyes.forEach((e, i) => {
    const what = `face.eyes[${i}]`;
    const hh = e.h ?? e.size;
    const w = e.w ?? (hh !== undefined ? hh * (e.aspect ?? 0.85) : undefined);
    if (!(w > 0 && hh > 0)) throw new Error(`${what}: needs w and h (or size and aspect)`);
    const glints = e.glints ?? (e.glint ? [e.glint] : []);
    out.push({
      type: "eye",
      ...frameAt(C, e, h, what),
      w,
      h: hh,
      sclera: rgbOr(e.sclera, DARK),
      iris: rgbOr(e.iris, null),
      irisAt: e.irisAt ?? [0, -0.08],
      irisSize: e.irisSize ?? [0.72, 0.76],
      band: e.band ?? null,
      pupil: rgbOr(e.pupil, null),
      pupilSize: e.pupilSize ?? [0.34, 0.4],
      glints,
      glintColor: rgbOr(e.glintColor, "#ffffff"),
      lid: e.lid ?? 0,
      cut: e.cut ?? null,
      edge: e.edge ? { color: hexToRgb(e.edge.color ?? DARK), w: e.edge.w ?? 0.15 } : null,
      closed: e.closed,
      thick: e.thick ?? 0.18,
      lit: e.lit ?? false,
      reach: max(w, hh) * 0.75,
    });
  });
  return out;
}
