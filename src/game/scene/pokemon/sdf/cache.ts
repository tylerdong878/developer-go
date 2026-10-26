/*
 * Meshes kept between visits (notes/research/perf.md 5). Meshing is the same
 * every time for the same recipe and grid, so the worker keeps what it makes
 * in IndexedDB, one entry per species and grid, and on the next visit hands it
 * straight back. Each entry carries a signature: the worker's own script (in
 * production its name changes with any change to the mesher or the recipes)
 * plus the recipe itself, functions and all, so a changed model never comes
 * back stale. Private mode, or anything else going wrong, just means meshing
 * as before.
 */

const DB = "developer-go-meshes";
const STORE = "meshes";

let opening: Promise<IDBDatabase | null> | null = null;
/** The cache, opened once. */
export function openCache() {
  opening ??= new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return opening;
}

/** A short hash of a string (FNV-1a, twice for 64 bits' worth). */
function hash(s: string) {
  let a = 2166136261;
  let b = 0x811c9dc5 ^ 0x5bd1e995;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    a = Math.imul(a ^ c, 16777619);
    b = Math.imul(b ^ c, 0x01000193) ^ (b >>> 13);
  }
  return `${(a >>> 0).toString(36)}${(b >>> 0).toString(36)}`;
}

/** What a cached mesh must match: this build of the worker, and the recipe. */
export function signature(recipe: unknown, grid: number) {
  const source = JSON.stringify(recipe, (_, v) => (typeof v === "function" ? String(v) : v));
  return hash(`${self.location.href}|${grid}|${source}`);
}

export function readMesh<T>(d: IDBDatabase | null, key: string, sig: string): Promise<T | null> {
  if (!d) return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = d.transaction(STORE, "readonly").objectStore(STORE).get(key);
      req.onsuccess = () => resolve(req.result && req.result.sig === sig ? (req.result.mesh as T) : null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/** Keeps a mesh. It's copied as this is called (no waiting first), so its buffers can be handed off right after. */
export function writeMesh(d: IDBDatabase | null, key: string, sig: string, mesh: unknown) {
  if (!d) return;
  try {
    d.transaction(STORE, "readwrite").objectStore(STORE).put({ sig, mesh }, key);
  } catch {
    // out of space or blocked: no cache this time
  }
}
