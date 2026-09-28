"use client";

import { select } from "d3-selection";
import { zoom, zoomIdentity, type ZoomTransform } from "d3-zoom";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { near as offset, places } from "@/content/places";
import near from "./data/near.json";
import { labels } from "./labels";
import { ObjectLayer } from "./ObjectLayer";
import { placeObjects } from "./objects";
import { project } from "./projection";
import { Trainer } from "./Trainer";

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
const placedLabels = labels.map((l) => ({ ...l, ...project(l) }));
const { onMap, signposts } = placeObjects(r);

/** Where the trainer starts: at school, in the middle of the Northeastern cluster. */
const TRAINER_START = project(offset(places.northeastern, 250, 480));

/** How much to show at a zoom level: far, low, mid, or high. */
function detailAt(k: number) {
  if (k < 0.8) return "far";
  if (k < 1.8) return "low";
  if (k < 3.5) return "mid";
  return "high";
}

export function WorldMap() {
  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const worldRef = useRef<SVGGElement>(null);
  const [far, setFar] = useState<Far>({});
  const [selected, setSelected] = useState<string | null>(null);

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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    const svg = svgRef.current;
    const world = worldRef.current;
    if (!stage || !svg || !world) return;

    // How the viewBox sits on the stage: stage pixel = scale * map unit + offset.
    let scale = 1;
    let ox = 0;
    let oy = 0;
    const measure = () => {
      const ctm = svg.getScreenCTM();
      const box = stage.getBoundingClientRect();
      if (!ctm) return;
      scale = ctm.a;
      ox = ctm.e - box.left;
      oy = ctm.f - box.top;
    };

    // d3-zoom runs on the whole stage in pixels, so wheel, drag, and pinch
    // work over markers too. This turns its pixel transform into map units:
    // scale * m' + o = k * (scale * m + o) + t  =>  m' = k * m + (k * o + t - o) / scale
    let view = { k: 1, x: 0, y: 0 };
    const apply = (t: ZoomTransform) => {
      const tx = (t.k * ox + t.x - ox) / scale;
      const ty = (t.k * oy + t.y - oy) / scale;
      view = { k: t.k, x: tx, y: ty };
      world.setAttribute("transform", `translate(${tx},${ty}) scale(${t.k})`);
      svg.style.setProperty("--unit", String(1 / (scale * t.k)));
      svg.style.setProperty("--zoom", String(t.k));
      // Markers position themselves in CSS from these three numbers.
      stage.style.setProperty("--k", String(t.k));
      stage.style.setProperty("--tx", String(tx));
      stage.style.setProperty("--ty", String(ty));
      stage.dataset.detail = detailAt(t.k);
    };

    const behavior = zoom<HTMLDivElement, unknown>()
      .scaleExtent([START.size / (2.3 * r), MAX_ZOOM])
      .on("zoom", (event) => apply(event.transform));

    const selection = select(stage).call(behavior);
    const onResize = () => {
      measure();
      // Keep panning inside the world, in the stage's pixel space.
      behavior.translateExtent([
        [scale * -r * 1.1 + ox, scale * -r * 1.1 + oy],
        [scale * r * 1.1 + ox, scale * r * 1.1 + oy],
      ]);
      // Same view in map units, in the new pixels, so the map holds still.
      const { k, x, y } = view;
      const t = zoomIdentity.translate(x * scale - (k - 1) * ox, y * scale - (k - 1) * oy);
      selection.call(behavior.transform, t.scale(k));
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
    <div
      ref={stageRef}
      className="map-stage relative h-full w-full touch-none select-none"
      data-detail="low"
      style={{ "--view": START.size, "--cx": START.x, "--cy": START.y } as CSSProperties}
    >
      <svg
        ref={svgRef}
        viewBox={`${START.x - START.size / 2} ${START.y - START.size / 2} ${START.size} ${START.size}`}
        preserveAspectRatio="xMidYMid meet"
        className="world-map h-full w-full bg-water"
        role="img"
        aria-label="Map of Greater Boston"
        onClick={() => setSelected(null)}
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
            {placedLabels.map((l) => (
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
      <ObjectLayer
        onMap={onMap}
        signposts={signposts}
        selected={selected}
        onSelect={setSelected}
      />
      <Trainer x={TRAINER_START.x} y={TRAINER_START.y} />
    </div>
  );
}
