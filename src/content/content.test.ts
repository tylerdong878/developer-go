import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { mapObjects, medals, signposts, trainer } from ".";
import type { LatLon, Where } from "./types";

/** Every string anywhere inside a value. */
function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(strings);
  }
  return [];
}

const text = strings([trainer, mapObjects, medals]);

const isOnMap = (where: Where): where is LatLon => "lat" in where;

describe("content", () => {
  it("gives every map object a unique slug within its kind", () => {
    const keys = mapObjects.map((o) => `${o.kind}:${o.slug}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("gives every medal a unique slug", () => {
    const slugs = medals.map((m) => m.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("keeps map objects in Greater Boston or on a signpost", () => {
    for (const o of mapObjects) {
      if (!isOnMap(o.where)) {
        expect(signposts, o.slug).toHaveProperty(o.where.signpost);
        continue;
      }
      const { lat, lon } = o.where;
      expect(lat > 42.1 && lat < 42.5 && lon > -71.4 && lon < -70.9, o.slug).toBe(
        true,
      );
    }
  });

  it("never uses em or en dashes", () => {
    expect(text.filter((s) => /[–—]/.test(s))).toEqual([]);
  });

  it("keeps phone numbers off the site", () => {
    const phone = /\(?\b\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/;
    expect(text.filter((s) => phone.test(s))).toEqual([]);
  });

  it("only links over https", () => {
    const urls = text.filter((s) => /^[a-z]+:\/\//i.test(s));
    expect(urls.length).toBeGreaterThan(0);
    expect(urls.filter((url) => !url.startsWith("https://"))).toEqual([]);
  });

  it("uses real national Pokédex numbers", () => {
    for (const o of mapObjects) {
      if (o.kind !== "spawn") continue;
      expect(o.pokemon.dex, o.slug).toBeGreaterThanOrEqual(1);
      expect(o.pokemon.dex, o.slug).toBeLessThanOrEqual(1025);
    }
  });

  it("gives each stop at most four item bubbles", () => {
    for (const o of mapObjects) {
      if (o.kind === "stop") expect(o.stats.length, o.slug).toBeLessThanOrEqual(4);
    }
  });

  // Topics that must never appear live in a git-ignored local file, so the
  // list itself isn't published. CI has no such file and skips this check.
  const bannedFile = "notes/banned-terms.txt";
  const banned = existsSync(bannedFile)
    ? readFileSync(bannedFile, "utf8")
        .split(/\r?\n/)
        .map((term) => term.trim().toLowerCase())
        .filter(Boolean)
    : [];

  it.skipIf(banned.length === 0)("never mentions locally banned topics", () => {
    const lower = text.map((s) => s.toLowerCase());
    expect(banned.filter((term) => lower.some((s) => s.includes(term)))).toEqual(
      [],
    );
  });
});
