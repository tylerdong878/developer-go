"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import type { MapObject } from "@/content";
import { EggIcon, GymIcon, RaidIcon, StopIcon } from "./markers";
import type { PlacedObject, PlacedSignpost } from "./objects";

export const objectKey = (o: MapObject) => `${o.kind}:${o.slug}`;

/**
 * Name, screen reader label, and zoom tier. Tier 1 always shows, tier 2 once
 * you zoom in a little, tier 3 at neighborhood zoom, like the game only
 * showing what's near you.
 */
function describe(o: MapObject): { name: string; label: string; tier: 1 | 2 | 3 } {
  switch (o.kind) {
    case "gym":
      return { name: o.org, label: `Gym: ${o.org}`, tier: 1 };
    case "stop":
      return {
        name: o.name,
        label: `PokéStop: ${o.name}${o.featured ? " (featured)" : ""}`,
        tier: o.featured ? 1 : 2,
      };
    case "raid":
      return { name: o.event, label: `Raid: ${o.event}, ${o.stars} star${o.stars > 1 ? "s" : ""}`, tier: 1 };
    case "spawn":
      return { name: o.pokemon.name, label: `Wild ${o.pokemon.name}`, tier: o.opensAbout ? 1 : 3 };
    case "egg":
      return { name: o.title, label: `Egg: ${o.title}, ${o.km} km`, tier: 3 };
  }
}

function Icon({ object }: { object: MapObject }) {
  switch (object.kind) {
    case "gym":
      return <GymIcon />;
    case "stop":
      return (
        <span className="relative block">
          <StopIcon />
          {object.featured ? (
            <span className="lure" aria-hidden>
              {Array.from({ length: 6 }, (_, i) => (
                <i key={i} style={{ "--i": i } as CSSProperties} />
              ))}
            </span>
          ) : null}
        </span>
      );
    case "raid":
      return <RaidIcon stars={object.stars} />;
    case "egg":
      return <EggIcon km={object.km} />;
    case "spawn":
      return (
        <span className="spawn block">
          <span className="spawn-shadow" />
          <Image
            src={`/sprites/${object.pokemon.dex}.webp`}
            alt=""
            width={60}
            height={60}
            unoptimized
            draggable={false}
            className="spawn-sprite"
          />
        </span>
      );
  }
}

const at = (x: number, y: number) =>
  ({ "--x": Math.round(x), "--y": Math.round(y) }) as CSSProperties;

type Props = {
  onMap: PlacedObject[];
  signposts: PlacedSignpost[];
  selected: string | null;
  onSelect: (key: string | null) => void;
};

export function ObjectLayer({ onMap, signposts, selected, onSelect }: Props) {
  const pick = (key: string) => onSelect(selected === key ? null : key);

  return (
    <div className="objects pointer-events-none absolute inset-0 overflow-hidden">
      {onMap.map(({ object, x, y }) => {
        const key = objectKey(object);
        const { name, label, tier } = describe(object);
        return (
          <button
            key={key}
            type="button"
            className="marker"
            data-kind={object.kind}
            data-tier={tier}
            data-selected={selected === key || undefined}
            style={at(x, y)}
            aria-label={label}
            aria-pressed={selected === key}
            onClick={() => pick(key)}
          >
            <span className="marker-art">
              <Icon object={object} />
            </span>
            {object.kind === "raid" ? (
              <span className="raid-stars" aria-hidden>
                {"★".repeat(object.stars)}
              </span>
            ) : null}
            <span className="marker-label">{name}</span>
          </button>
        );
      })}

      {signposts.map((post) => {
        const key = `signpost:${post.id}`;
        return (
          <button
            key={key}
            type="button"
            className="marker signpost"
            data-tier={1}
            data-selected={selected === key || undefined}
            style={at(post.x, post.y)}
            aria-label={`Signpost: ${post.label}, ${post.km.toLocaleString()} km away`}
            aria-pressed={selected === key}
            onClick={() => pick(key)}
          >
            <span className="signpost-board">
              <svg
                viewBox="0 0 24 24"
                className="size-4 shrink-0"
                style={{ rotate: `${post.bearing}deg` }}
                aria-hidden
              >
                <path d="M12 3 5 12h4.5v9h5v-9H19Z" fill="currentColor" />
              </svg>
              <span className="font-semibold">{post.label}</span>
              <span className="text-ink-soft">{post.km.toLocaleString()} km</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
