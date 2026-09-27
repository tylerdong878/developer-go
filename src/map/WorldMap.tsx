"use client";

import { select } from "d3-selection";
import { zoom, zoomTransform, type ZoomTransform } from "d3-zoom";
import { useEffect, useRef, useState } from "react";
import near from "./data/near.json";
import { labels } from "./labels";
import { project } from "./projection";

/**
 * The first view, in map units: downtown from Cambridge to the Seaport. The
 * whole square is always visible ("meet"), so phones see it too, and wider
 * screens just see more around it.
 */
const START = { x: -900, y: 400, size: 5200 };
const MAX_ZOOM = 16;

type Layer = "land" | "water" | "parks" | "woods" | "highway" | "major" | "minor" | "street";
type Far = Partial<Record<Layer, string>>;

const r = near.world;
const placed = labels.map((l) => ({ ...l, ...project(l) }));

export function WorldMap() {
  const svgRef = useRef<SVGSVGElement>(null);
  const worldRef = useRef<SVGGElement>(null);
  const [far, setFar] = useState<Far>({});

  // The suburbs load right after first paint; downtown ships with the page.
  useEffect(() => {
    let cancelled = false;
    import("./data/far.json").then((m) => {
      if (!cancelled) setFar(m.default);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    const world = worldRef.current;
    if (!svg || !world) return;

    // Screen pixels per map unit at zoom 1, so labels and roads can stay the
    // same size on screen at any zoom.
    let pixelsPerUnit = svg.getScreenCTM()?.a ?? 1;
    const apply = (t: ZoomTransform) => {
      world.setAttribute("transform", t.toString());
      svg.style.setProperty("--unit", String(1 / (pixelsPerUnit * t.k)));
      svg.style.setProperty("--zoom", String(t.k));
      svg.dataset.detail = t.k < 0.8 ? "far" : t.k > 2.2 ? "high" : "low";
    };

    // The visible area in map units at zoom 1. With "meet" it can be bigger
    // than the viewBox, and d3-zoom needs the real size to clamp panning.
    const extent = (): [[number, number], [number, number]] => {
      const ctm = svg.getScreenCTM();
      const box = svg.getBoundingClientRect();
      if (!ctm) return [[0, 0], [box.width, box.height]];
      const inv = ctm.inverse();
      const corner = (x: number, y: number) => new DOMPoint(x, y).matrixTransform(inv);
      const a = corner(box.left, box.top);
      const b = corner(box.right, box.bottom);
      return [[a.x, a.y], [b.x, b.y]];
    };

    const behavior = zoom<SVGSVGElement, unknown>()
      .extent(extent)
      .scaleExtent([START.size / (2.3 * r), MAX_ZOOM])
      .translateExtent([
        [-r * 1.1, -r * 1.1],
        [r * 1.1, r * 1.1],
      ])
      .on("zoom", (event) => apply(event.transform));

    const selection = select(svg).call(behavior);
    const onResize = () => {
      pixelsPerUnit = svg.getScreenCTM()?.a ?? 1;
      apply(zoomTransform(svg));
    };
    window.addEventListener("resize", onResize);
    onResize();
    return () => {
      selection.on(".zoom", null);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const layer = (name: Layer, className: string) => (
    <>
      {far[name] ? <path d={far[name]} className={className} /> : null}
      <path d={near[name]} className={className} />
    </>
  );

  return (
    <svg
      ref={svgRef}
      viewBox={`${START.x - START.size / 2} ${START.y - START.size / 2} ${START.size} ${START.size}`}
      preserveAspectRatio="xMidYMid meet"
      className="world-map h-full w-full touch-none select-none bg-water"
      role="img"
      aria-label="Map of Greater Boston"
      data-detail="low"
    >
      <defs>
        <radialGradient id="fog" gradientUnits="userSpaceOnUse" cx="0" cy="0" r={r}>
          <stop offset="0.88" style={{ stopColor: "var(--sky)", stopOpacity: 0 }} />
          <stop offset="1" style={{ stopColor: "var(--sky)", stopOpacity: 1 }} />
        </radialGradient>
      </defs>
      <g ref={worldRef}>
        {layer("land", "fill-ground")}
        {layer("woods", "fill-grass-shade")}
        {layer("parks", "fill-grass")}
        {layer("water", "water fill-water")}
        <g className="roads">
          {layer("street", "road street")}
          {layer("minor", "road minor")}
          {layer("major", "road major")}
          {layer("highway", "road highway")}
        </g>
        <rect x={-r * 3} y={-r * 3} width={r * 6} height={r * 6} fill="url(#fog)" />
        <g className="labels">
          {placed.map((l) => (
            <text
              key={l.name}
              x={l.x}
              y={l.y}
              className={`label tier-${l.tier}${l.water ? " water-label" : ""}`}
            >
              {l.name}
            </text>
          ))}
        </g>
      </g>
    </svg>
  );
}
