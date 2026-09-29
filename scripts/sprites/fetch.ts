/**
 * Downloads a sprite for every fact and wild Pokémon into public/sprites as a small
 * WebP. They're Pokémon HOME renders from the PokeAPI sprites repo, which
 * look closest to Pokémon GO. Saved into the site, never hotlinked.
 *
 *   npm run sprites:fetch            # skips sprites that already exist
 *   npm run sprites:fetch -- --force # downloads them all again
 */
import { existsSync } from "node:fs";
import { mkdir, stat } from "node:fs/promises";
import sharp from "sharp";
import { spawns, wild } from "@/content";

const SOURCE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home";
const OUT_DIR = "public/sprites";
const SIZE = 256;

async function main() {
  const force = process.argv.includes("--force");
  await mkdir(OUT_DIR, { recursive: true });
  const dexes = [...new Set([...spawns.map((s) => s.pokemon.dex), ...wild.map((w) => w.dex)])];

  for (const dex of dexes) {
    const out = `${OUT_DIR}/${dex}.webp`;
    if (existsSync(out) && !force) {
      console.log(`${dex}: exists`);
      continue;
    }
    const res = await fetch(`${SOURCE}/${dex}.png`);
    if (!res.ok) throw new Error(`sprite ${dex}: ${res.status}`);
    await sharp(Buffer.from(await res.arrayBuffer()))
      .trim()
      .resize(SIZE, SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 82, alphaQuality: 90 })
      .toFile(out);
    const name = spawns.find((s) => s.pokemon.dex === dex)?.pokemon.name ?? wild.find((w) => w.dex === dex)?.name;
    console.log(`${dex} ${name}: ${((await stat(out)).size / 1024).toFixed(1)} KB`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
