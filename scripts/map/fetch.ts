/**
 * Downloads the raw OpenStreetMap data for the Boston map from the Overpass
 * API into .cache/osm. Run it once; the build step only reads the cache.
 *
 *   npm run map:fetch            # skips files that are already cached
 *   npm run map:fetch -- --force # downloads everything again
 */
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { mapCenter } from "@/content/places";
import {
  CACHE_DIR,
  SECONDARY_RADIUS,
  STREET_RADIUS,
  TERTIARY_RADIUS,
  WORLD_RADIUS,
  worldBox,
} from "./config";

const ENDPOINT = "https://overpass-api.de/api/interpreter";
const USER_AGENT = "developer-go map build (https://github.com/tylerdong878/developer-go)";

const around = (r: number) => `(around:${r},${mapCenter.lat},${mapCenter.lon})`;
const box = `(${worldBox.south},${worldBox.west},${worldBox.north},${worldBox.east})`;
const world = around(WORLD_RADIUS);

const queries: Record<string, string> = {
  coastline: `way["natural"="coastline"]${box};`,
  water: `(
    way["natural"="water"]${world};
    relation["natural"="water"]${world};
    way["waterway"="riverbank"]${world};
    relation["waterway"="riverbank"]${world};
  );`,
  green: `(
    way["leisure"~"^(park|nature_reserve|golf_course)$"]${world};
    relation["leisure"~"^(park|nature_reserve|golf_course)$"]${world};
    way["landuse"~"^(forest|cemetery|recreation_ground)$"]${world};
    relation["landuse"="forest"]${world};
    way["natural"="wood"]${world};
    relation["natural"="wood"]${world};
  );`,
  roads: `(
    way["highway"~"^(motorway|trunk|primary)$"]${world};
    way["highway"="secondary"]${around(SECONDARY_RADIUS)};
    way["highway"="tertiary"]${around(TERTIARY_RADIUS)};
    way["highway"~"^(residential|unclassified|living_street)$"]${around(STREET_RADIUS)};
  );`,
};

async function overpass(query: string): Promise<string> {
  const body = new URLSearchParams({ data: `[out:json][timeout:600];${query}out geom;` });
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "User-Agent": USER_AGENT },
      body,
    });
    if (res.ok) return res.text();
    // Overpass asks for a pause when it's busy.
    if ((res.status === 429 || res.status >= 500) && attempt < 5) {
      const wait = 30 * attempt;
      console.log(`  Overpass said ${res.status}, retrying in ${wait}s`);
      await new Promise((r) => setTimeout(r, wait * 1000));
      continue;
    }
    throw new Error(`Overpass request failed: ${res.status} ${await res.text()}`);
  }
}

async function main() {
  const force = process.argv.includes("--force");
  await mkdir(CACHE_DIR, { recursive: true });
  for (const [name, query] of Object.entries(queries)) {
    const file = `${CACHE_DIR}/${name}.json`;
    if (existsSync(file) && !force) {
      console.log(`${name}: cached`);
      continue;
    }
    const started = Date.now();
    const text = await overpass(query);
    await writeFile(file, text);
    const count = JSON.parse(text).elements.length;
    const seconds = ((Date.now() - started) / 1000).toFixed(1);
    console.log(`${name}: ${count} elements, ${(text.length / 1e6).toFixed(1)} MB, ${seconds}s`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
