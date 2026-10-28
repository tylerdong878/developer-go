import { useId, useSyncExternalStore } from "react";
import type { BadgeTier, MapObject, Raid } from "@/content";
import { EGG_SPOTS, MYSTIC, MYSTIC_LIGHT, RAID_EGG } from "../colors";
import { progressStore } from "../progress";
import { RAID_BOSS } from "../raidBosses";

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

/** GO's gym badge frames (`GymBadgeFrame_1/2/3`): light, mid, rim. */
export const BADGE: Record<BadgeTier, { name: string; light: string; mid: string; rim: string }> = {
  basic: { name: "Basic", light: "#ffffff", mid: "#dfe5ec", rim: "#a9b4c0" },
  bronze: { name: "Bronze", light: "#f4c49c", mid: "#e4945c", rim: "#bc6434" },
  silver: { name: "Silver", light: "#cce4e4", mid: "#9cbccc", rim: "#8cb4c4" },
  gold: { name: "Gold", light: "#fcec54", mid: "#ecc43c", rim: "#c89a1c" },
};

/** A gym badge: GO's upright diamond, framed by its tier, with the gym inside where GO puts the gym's photo. */
export function GymBadge({ tier, size = 34 }: { tier: BadgeTier; size?: number }) {
  const id = useId().replace(/[^w-]/g, "");
  const c = BADGE[tier];
  return (
    <svg viewBox="0 0 40 56" width={size} height={size * 1.4} aria-hidden>
      <defs>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c.light} />
          <stop offset="1" stopColor={c.mid} />
        </linearGradient>
        <linearGradient id={`${id}p`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8fd8ff" />
          <stop offset="1" stopColor={MYSTIC} />
        </linearGradient>
      </defs>
      <path d="M20 1.5 38.5 28 20 54.5 1.5 28Z" fill={`url(#${id}f)`} stroke={c.rim} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M20 8 33.5 28 20 48 6.5 28Z" fill={`url(#${id}p)`} stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
      <g fill="#fff">
        <path d="M14 38.5 15.8 35h8.4l1.8 3.5Z" opacity=".9" />
        <rect x="17.7" y="24" width="4.6" height="11.5" rx="1" />
        <ellipse cx="20" cy="24" rx="6.6" ry="2.3" />
        <path d="M20 14.5c2.1 2.6 2.6 4.4 0 6.5-2.6-2.1-2.1-3.9 0-6.5Z" />
      </g>
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

/** A raid gym with its egg on top, or, once it's hatched, its boss (like GO's Nearby raid tab). */
export function RaidIcon({ stars, size = 34, boss }: { stars: 1 | 3 | 5; size?: number; boss?: number }) {
  const egg = RAID_EGG[stars];
  return (
    <svg viewBox="0 0 52 68" width={size} height={size * 1.3} aria-hidden>
      <path d="M11 66 15 53h22l4 13Z" fill="#6b7788" />
      <rect x="21" y="36" width="10" height="18" rx="2" fill="#dfe5ec" />
      <ellipse cx="26" cy="36" rx="14" ry="5" fill="#9aa5b4" />
      {boss ? (
        <image href={`/portraits/${boss}.webp`} x="3" y="-4" width="46" height="46" />
      ) : (
        <>
          <path d="M26 3c8 0 12 9 12 16 0 7-5.4 12-12 12S14 26 14 19c0-7 4-16 12-16Z" fill={egg} stroke="#fff" strokeWidth="2" />
          <path d="M20 10c1.6-2.4 3.6-3.6 6-3.8" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" opacity=".8" />
        </>
      )}
    </svg>
  );
}

/** A fact Pokémon: a dark silhouette until you've caught one, like GO's Pokédex. */
function FactIcon({ dex, size }: { slug: string; dex: number; size: number }) {
  const found = useSyncExternalStore(progressStore.subscribe, () => !!progressStore.get().caught[dex], () => false);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- tiny local portraits, already sized
    <img src={`/portraits/${dex}.webp`} alt="" width={size} height={size} className={`object-contain ${found ? "" : "brightness-0 opacity-45"}`} />
  );
}

/** A raid on the map, showing its boss once this visitor has hatched it. */
function RaidObjectIcon({ raid, size }: { raid: Raid; size: number }) {
  const hatched = useSyncExternalStore(
    progressStore.subscribe,
    () => progressStore.get().hatched.includes(raid.slug),
    () => false,
  );
  return <RaidIcon stars={raid.stars} size={size} boss={hatched ? RAID_BOSS[raid.slug]?.dex : undefined} />;
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

/** The right icon for any map object; Pokémon use their portrait (rendered from our own 3D model). */
export function ObjectIcon({ object, size = 36 }: { object: MapObject; size?: number }) {
  switch (object.kind) {
    case "gym":
      return <GymIcon size={size * 0.9} />;
    case "stop":
      return <StopIcon size={size * 0.75} lured={object.featured} />;
    case "raid":
      return <RaidObjectIcon raid={object} size={size * 0.85} />;
    case "egg":
      return <EggIcon km={object.km} size={size * 0.7} />;
    case "spawn":
      return <FactIcon slug={object.slug} dex={object.pokemon.dex} size={size} />;
  }
}

/** GO's items, drawn small: a Poké Ball, a Great Ball, and a Razz Berry. */
/** GO's Stardust: a pink-purple sparkle with two little ones. */
export function StardustIcon({ size = 24 }: { size?: number }) {
  const star = (x: number, y: number, r: number) => `M${x} ${y - r}C${x + r * 0.18} ${y - r * 0.18} ${x + r * 0.18} ${y - r * 0.18} ${x + r} ${y}C${x + r * 0.18} ${y + r * 0.18} ${x + r * 0.18} ${y + r * 0.18} ${x} ${y + r}C${x - r * 0.18} ${y + r * 0.18} ${x - r * 0.18} ${y + r * 0.18} ${x - r} ${y}C${x - r * 0.18} ${y - r * 0.18} ${x - r * 0.18} ${y - r * 0.18} ${x} ${y - r}Z`;
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden>
      <path d={star(14, 17, 12)} fill="#c86fe0" />
      <path d={star(14, 17, 6)} fill="#f6d9ff" />
      <path d={star(25, 8, 5)} fill="#e79cf5" />
      <path d={star(26, 24, 3.5)} fill="#e79cf5" />
    </svg>
  );
}

/** A species' Candy: GO's wrapped sweet in two colors (ours from a hash of the species, not GO's exact pairs). */
export function CandyIcon({ dex, size = 24 }: { dex: number; size?: number }) {
  const hue = (dex * 47) % 360;
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden>
      <path d="M5 10 1 6l2 9Zm22 12 4 4-2-9Z" fill={`hsl(${hue} 55% 45%)`} />
      <ellipse cx="16" cy="16" rx="11" ry="8" transform="rotate(-35 16 16)" fill={`hsl(${hue} 70% 62%)`} />
      <path d="M9 22a11 8 -35 0 0 16 -12Z" transform="rotate(0 16 16)" fill={`hsl(${(hue + 150) % 360} 65% 85%)`} />
      <ellipse cx="13" cy="12" rx="3" ry="1.5" transform="rotate(-35 13 12)" fill="#ffffff" opacity="0.6" />
    </svg>
  );
}

/** GO's Showcase trophy: a cup with two handles on a stepped base. */
export function Trophy({ color = "#f2c14e", size = 28 }: { color?: string; size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden>
      <path d="M9 5h14v6a7 7 0 0 1-14 0Z" fill={color} />
      <path d="M9 7H5.5a4 4 0 0 0 4 6M23 7h3.5a4 4 0 0 1-4 6" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M14 17.5h4l.8 5h-5.6Z" fill={color} />
      <rect x="10" y="22.5" width="12" height="3.2" rx="1" fill={color} />
      <rect x="8.5" y="25.7" width="15" height="2.6" rx="1" fill="#30555d" opacity="0.85" />
      <path d="M12 7.5v3.5a4 4 0 0 0 2.2 3.6" fill="none" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** Incense's pot: purple like GO's, or blue for the Daily Adventure Incense. */
const POT = {
  incense: ["#f3a6e8", "#b04ad0", "#d27ae8", "#7a2a96", "#e7a8f3"],
  adventure: ["#9fd4f5", "#2f86d6", "#6cb4ee", "#1c5a9a", "#a8d6f6"],
};

export function ItemIcon({ id, size = 32 }: { id: "ball" | "great" | "razz" | "incense" | "adventure"; size?: number }) {
  if (id === "incense" || id === "adventure") {
    const [smoke, pot, rim, hole, shine] = POT[id];
    return (
      <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
        <path d="M14 13c-3-3 1-6-1-9M21 12c-2-3 2-5 0-8M27 13c-3-3 1-6-1-9" fill="none" stroke={smoke} strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="20" cy="27" rx="12" ry="9" fill={pot} />
        <ellipse cx="20" cy="18.5" rx="9" ry="3.2" fill={rim} />
        <ellipse cx="20" cy="18" rx="5" ry="1.6" fill={hole} />
        <path d="M11 29c3 3 15 3 18 0" fill="none" stroke={shine} strokeWidth="1.6" strokeLinecap="round" />
        <rect x="14" y="35" width="12" height="2.5" rx="1.2" fill={hole} />
      </svg>
    );
  }
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
