import type { MapObject } from "@/content";
import { EGG_SPOTS, MYSTIC, MYSTIC_LIGHT, RAID_EGG } from "../colors";

/* Small flat versions of the map objects, for lists, buttons, and cards. */

export function GymIcon({ size = 36 }: { size?: number }) {
  return (
    <svg viewBox="0 0 48 60" width={size} height={size * 1.25} aria-hidden>
      <path d="M9 57 13 43h22l4 14Z" fill="#0a5a98" />
      <path d="M13 43h22l-1.6 5H14.6Z" fill={MYSTIC} />
      <rect x="18.5" y="20" width="11" height="24" rx="2" fill="#f4f7fa" />
      <rect x="18.5" y="27" width="11" height="3" fill={MYSTIC} />
      <rect x="18.5" y="35" width="11" height="3" fill={MYSTIC} />
      <ellipse cx="24" cy="20" rx="15" ry="5.5" fill={MYSTIC} stroke="#eafbff" strokeWidth="1.5" />
      <path d="M24 3c4.5 5.5 5.6 9.5 0 14-5.6-4.5-4.5-8.5 0-14Z" fill={MYSTIC_LIGHT} stroke="#eafbff" strokeWidth="1.2" />
    </svg>
  );
}

export function StopIcon({ size = 30, lured = false }: { size?: number; lured?: boolean }) {
  return (
    <svg viewBox="0 0 40 56" width={size} height={size * 1.4} aria-hidden>
      {lured ? <circle cx="20" cy="14" r="17" fill="#f9a8d4" opacity=".45" /> : null}
      <rect x="18.5" y="22" width="3" height="32" rx="1.5" fill="#9cc4e4" />
      <g transform="rotate(45 20 14)">
        <rect x="9" y="3" width="22" height="22" rx="5" fill={MYSTIC_LIGHT} stroke="#fff" strokeWidth="2.5" />
      </g>
      <circle cx="20" cy="14" r="4" fill="#fff" />
    </svg>
  );
}

export function RaidIcon({ stars, size = 34 }: { stars: 1 | 3 | 5; size?: number }) {
  const egg = RAID_EGG[stars];
  return (
    <svg viewBox="0 0 52 68" width={size} height={size * 1.3} aria-hidden>
      <path d="M11 66 15 53h22l4 13Z" fill="#6b7788" />
      <rect x="21" y="36" width="10" height="18" rx="2" fill="#dfe5ec" />
      <ellipse cx="26" cy="36" rx="14" ry="5" fill="#9aa5b4" />
      <path d="M26 3c8 0 12 9 12 16 0 7-5.4 12-12 12S14 26 14 19c0-7 4-16 12-16Z" fill={egg} stroke="#fff" strokeWidth="2" />
      <path d="M20 10c1.6-2.4 3.6-3.6 6-3.8" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" opacity=".8" />
    </svg>
  );
}

export function EggIcon({ km, size = 26 }: { km: keyof typeof EGG_SPOTS; size?: number }) {
  const spot = EGG_SPOTS[km];
  return (
    <svg viewBox="0 0 30 36" width={size} height={size * 1.2} aria-hidden>
      <path d="M15 2c7 0 11 10 11 18 0 7.7-4.9 13-11 13S4 27.7 4 20C4 12 8 2 15 2Z" fill="#fdfdfb" stroke="#d9d3c3" strokeWidth="1.2" />
      <circle cx="11" cy="14" r="3" fill={spot} />
      <circle cx="19" cy="20" r="3.6" fill={spot} />
      <circle cx="12.5" cy="26" r="2.4" fill={spot} />
    </svg>
  );
}

/** The right icon for any map object; wild Pokémon use their real sprite. */
export function ObjectIcon({ object, size = 36 }: { object: MapObject; size?: number }) {
  switch (object.kind) {
    case "gym":
      return <GymIcon size={size * 0.9} />;
    case "stop":
      return <StopIcon size={size * 0.75} lured={object.featured} />;
    case "raid":
      return <RaidIcon stars={object.stars} size={size * 0.85} />;
    case "egg":
      return <EggIcon km={object.km} size={size * 0.7} />;
    case "spawn":
      return (
        // eslint-disable-next-line @next/next/no-img-element -- tiny local sprites, already sized
        <img src={`/sprites/${object.pokemon.dex}.webp`} alt="" width={size} height={size} className="object-contain" />
      );
  }
}

/** GO's items, drawn small: a Poké Ball, a Great Ball, and a Razz Berry. */
export function ItemIcon({ id, size = 32 }: { id: "ball" | "great" | "razz"; size?: number }) {
  if (id === "razz")
    return (
      <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
        <path d="M20 9c2-4 6-5 9-4-1 3-4 5-8 5Z" fill="#4fae4a" />
        <path d="M20 10C11 10 7 17 8 24c1 7 6 12 12 12s11-5 12-12c1-7-3-14-12-14Z" fill="#e0457b" />
        {[[14, 18], [20, 16], [26, 18], [12, 24], [18, 23], [24, 23], [29, 25], [15, 30], [21, 29], [26, 30]].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="1.3" fill="#ffd1e1" />
        ))}
      </svg>
    );
  const top = id === "great" ? "#2b6fd6" : "#e3350d";
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
      <circle cx="20" cy="20" r="17" fill="#fff" />
      <path d="M3 20a17 17 0 0 1 34 0Z" fill={top} />
      {id === "great" ? (
        <>
          <path d="M8 12c3 1 5 3 6 6l-6 1Z" fill="#e3350d" />
          <path d="M32 12c-3 1-5 3-6 6l6 1Z" fill="#e3350d" />
        </>
      ) : null}
      <circle cx="20" cy="20" r="17" fill="none" stroke="#1c1c24" strokeWidth="2.4" />
      <path d="M3 20h34" stroke="#1c1c24" strokeWidth="3" />
      <circle cx="20" cy="20" r="5" fill="#fff" stroke="#1c1c24" strokeWidth="2.6" />
    </svg>
  );
}
