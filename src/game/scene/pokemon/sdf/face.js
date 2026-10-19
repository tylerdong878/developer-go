// How each face feature (eye, mouth, spot) looks in its own little plane, in model units: drawn into the decal atlas.

const { sqrt, abs, min, max } = Math;
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smooth = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
// ---------- face features ----------

function darken(c, k) {
  return [c[0] * (1 - k), c[1] * (1 - k), c[2] * (1 - k)];
}
function lighten(c, k) {
  return [c[0] + (1 - c[0]) * k, c[1] + (1 - c[1]) * k, c[2] + (1 - c[2]) * k];
}
export function prepFeature(f) {
  if (f.type === "eye" && f.iris) {
    f._irisTop = darken(f.iris, 0.45);
    f._irisBot = lighten(f.iris, 0.35);
  }
  return f;
}

/** Distance from (x, y) to the parabola y = yc + a (x - xc)^2 on [x0, x1] (approximate, fine for strokes). */
function parabolaDist(x, y, xc, a, yc, x0, x1) {
  if (x < x0 || x > x1) {
    const ex = x < x0 ? x0 : x1, ey = yc + a * (ex - xc) ** 2;
    return Math.hypot(x - ex, y - ey);
  }
  const dy = y - (yc + a * (x - xc) ** 2), sl = 2 * a * (x - xc);
  return abs(dy) / sqrt(1 + sl * sl);
}

/** Shade one face feature at local coords (x along u, y along v, model units). Writes rgb to out, returns alpha 0..1. */
export function featureAt(f, x, y, out) {
  if (f.type === "spot") {
    const a = x / f.rx, b = y / f.ry, r = sqrt(a * a + b * b);
    if (r > 1) return 0;
    out[0] = f.color[0]; out[1] = f.color[1]; out[2] = f.color[2];
    return f.soft > 0 ? 1 - smooth(1 - f.soft, 1, r) : 1;
  }
  if (f.type === "mouth") {
    const w2 = f.w / 2, h = f.h, th = f.thick / 2, c = f.color;
    const set = (col) => {
      out[0] = col[0]; out[1] = col[1]; out[2] = col[2];
      return 1;
    };
    switch (f.kind) {
      case "line":
      case "flat": {
        const ex = max(abs(x) - w2, 0);
        return Math.hypot(ex, y) < th ? set(c) : 0;
      }
      case "smile":
      case "frown": {
        const s = f.kind === "smile" ? 1 : -1;
        return parabolaDist(x, y, 0, (s * h) / (w2 * w2), (-s * h) / 2, -w2, w2) < th ? set(c) : 0;
      }
      case "w":
      case "cat": {
        const q = w2 / 2, a = h / (q * q);
        const d = x < 0 ? parabolaDist(x, y, -q, a, -h / 2, -w2, 0) : parabolaDist(x, y, q, a, -h / 2, 0, w2);
        return d < th ? set(c) : 0;
      }
      case "open":
      case "o": {
        // open: a half-ellipse hanging from a top line; o: a full ellipse
        const s = x / w2, t = y / (h / 2);
        let e, inside, edge;
        if (f.kind === "open") {
          e = sqrt(s * s + ((t - 1) / 2) ** 2);
          inside = e <= 1 && t <= 1;
          edge = min((1 - e) * min(w2, h), (1 - t) * (h / 2));
        } else {
          e = sqrt(s * s + t * t);
          inside = e <= 1;
          edge = (1 - e) * min(w2, h / 2);
        }
        if (!inside) return 0;
        if (edge < th) return set(c);
        if (f.tongue) {
          const a = s / 0.62, b = (t + (f.kind === "open" ? 0.75 : 0.6)) / 0.6;
          if (a * a + b * b < 1) return set(f.tongue);
        }
        return set(f.inner);
      }
      default:
        throw new Error(`mouth kind ${JSON.stringify(f.kind)}: use smile, frown, w, line, open, o`);
    }
  }
  // eye
  const hw = f.w / 2, hh = f.h / 2;
  const s = x / hw, t = y / hh;
  if (f.closed !== undefined && f.closed !== false) {
    const c = f.closed === true ? 1 : f.closed; // curvature: 1 = happy arc, 0 = line, -1 = sleepy cup
    const a = (-c * hh) / (hw * hw), yc = (c * hh) / 2;
    if (parabolaDist(x, y, 0, a, yc, -hw, hw) < f.thick * hh) {
      out[0] = f.sclera[0]; out[1] = f.sclera[1]; out[2] = f.sclera[2];
      return 1;
    }
    return 0;
  }
  if (f.cut && t > f.cut[0] + f.cut[1] * s) return 0;
  const r2 = s * s + t * t;
  if (r2 > 1) return 0;
  let col = f.sclera;
  if (f.edge && r2 > (1 - f.edge.w) ** 2) col = f.edge.color;
  else if (f.iris) {
    let inIris, top, bot;
    if (f.band !== null) {
      inIris = t < f.band;
      top = f.band;
      bot = -1;
    } else {
      const a = (s - f.irisAt[0]) / f.irisSize[0], b = (t - f.irisAt[1]) / f.irisSize[1];
      inIris = a * a + b * b < 1;
      top = f.irisAt[1] + f.irisSize[1];
      bot = f.irisAt[1] - f.irisSize[1];
    }
    if (inIris) {
      const k = clamp01((top - t) / (top - bot));
      const k1 = smooth(0, 0.6, k), k2 = smooth(0.6, 1, k);
      col = [0, 1, 2].map((i) => {
        const m = f._irisTop[i] + (f.iris[i] - f._irisTop[i]) * k1;
        return m + (f._irisBot[i] - m) * k2;
      });
      if (f.pupil) {
        const a = (s - f.irisAt[0]) / f.pupilSize[0], b = (t - f.irisAt[1]) / f.pupilSize[1];
        if (a * a + b * b < 1) col = f.pupil;
      }
    }
  }
  let dk = 0;
  if (f.lid > 0) dk = smooth(1 - 2 * f.lid, 1, t) * 0.45;
  out[0] = col[0] * (1 - dk); out[1] = col[1] * (1 - dk); out[2] = col[2] * (1 - dk);
  for (const g of f.glints) {
    const dx = (s - g[0]) * hw, dy = (t - g[1]) * hh, r = (g[2] * f.h) / 2;
    if (dx * dx + dy * dy < r * r) {
      out[0] = f.glintColor[0]; out[1] = f.glintColor[1]; out[2] = f.glintColor[2];
      break;
    }
  }
  return 1;
}
