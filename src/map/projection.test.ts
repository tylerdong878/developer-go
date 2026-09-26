import { describe, expect, it } from "vitest";
import { mapCenter, near, places } from "@/content/places";
import {
  distanceMeters,
  metersPerDegree,
  project,
  unproject,
} from "./projection";

const radius = (p: { x: number; y: number }) => Math.hypot(p.x, p.y);

describe("projection", () => {
  it("puts the State House at the origin", () => {
    expect(project(mapCenter)).toEqual({ x: 0, y: 0 });
  });

  it("keeps north up and east right", () => {
    const north = project(near(mapCenter, 1000, 0));
    const east = project(near(mapCenter, 0, 1000));
    expect(north.y).toBeLessThan(0);
    expect(Math.abs(north.x)).toBeLessThan(1);
    expect(east.x).toBeGreaterThan(0);
    expect(Math.abs(east.y)).toBeLessThan(1);
  });

  it("stays close to true scale downtown", () => {
    const p = near(mapCenter, 0, 300);
    const real = distanceMeters(mapCenter, p);
    expect(radius(project(p)) / real).toBeGreaterThan(0.99);
  });

  it("keeps bearings exact", () => {
    const m = metersPerDegree(mapCenter.lat);
    for (const place of [places.westwood, places.harvardSoch, places.awsSeaport]) {
      const east = (place.lon - mapCenter.lon) * m.lon;
      const north = (place.lat - mapCenter.lat) * m.lat;
      const p = project(place);
      expect(Math.atan2(p.y, p.x)).toBeCloseTo(Math.atan2(-north, east), 6);
    }
  });

  it("pulls the suburbs in without flipping the order", () => {
    const harvard = radius(project(places.harvardSoch));
    const westwood = radius(project(places.westwood));
    const realRatio =
      distanceMeters(mapCenter, places.westwood) /
      distanceMeters(mapCenter, places.harvardSoch);
    const mapRatio = westwood / harvard;
    expect(realRatio).toBeGreaterThan(3);
    expect(mapRatio).toBeGreaterThan(1.5);
    expect(mapRatio).toBeLessThan(realRatio * 0.7);
  });

  it("round-trips through unproject", () => {
    for (const place of Object.values(places)) {
      const back = unproject(project(place));
      expect(back.lat).toBeCloseTo(place.lat, 6);
      expect(back.lon).toBeCloseTo(place.lon, 6);
    }
  });

  it("measures real distance in meters", () => {
    // State House to the AWS office in the Seaport is about 1.77 km.
    expect(distanceMeters(mapCenter, places.awsSeaport)).toBeCloseTo(1770, -2);
  });
});
