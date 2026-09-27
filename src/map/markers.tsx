/* Original marker art, drawn in the spirit of the game's map objects. */

const RAID_EGG = { 1: "#f472b6", 3: "#f6c453", 5: "#7c5cf0" } as const;
const EGG_SPOTS = {
  2: "#6fcf5e",
  5: "#f5a623",
  7: "#f6d743",
  10: "#9b6bd8",
  12: "#e5484d",
} as const;

const Shadow = ({ cx, cy, rx }: { cx: number; cy: number; rx: number }) => (
  <ellipse cx={cx} cy={cy} rx={rx} ry={rx / 4} fill="#0a2a4a" opacity=".2" />
);

/** A Team Mystic gym: a blue tower with an ice-drop emblem on top. */
export function GymIcon() {
  return (
    <svg viewBox="0 0 48 64" width="44" height="58" aria-hidden>
      <Shadow cx={24} cy={60} rx={16} />
      <path d="M9 58 13 44h22l4 14Z" fill="#0a5a98" />
      <path d="M13 44h22l-1.6 5H14.6Z" fill="#0b84d6" />
      <rect x="18.5" y="21" width="11" height="24" rx="2" fill="#0b84d6" />
      <rect x="18.5" y="21" width="4" height="24" rx="2" fill="#1ab6e8" opacity=".7" />
      <ellipse cx="24" cy="21" rx="15" ry="5.5" fill="#1ab6e8" stroke="#eafbff" strokeWidth="1.5" />
      <path d="M24 3c4.5 5.5 5.6 9.5 0 14-5.6-4.5-4.5-8.5 0-14Z" fill="#eafbff" stroke="#0b84d6" strokeWidth="1.2" />
    </svg>
  );
}

/** A PokéStop: a floating blue diamond on a pole. */
export function StopIcon() {
  return (
    <svg viewBox="0 0 40 60" width="34" height="51" aria-hidden>
      <Shadow cx={20} cy={57} rx={9} />
      <rect x="18.5" y="22" width="3" height="34" rx="1.5" fill="#78b8e6" />
      <g transform="rotate(45 20 14)">
        <rect x="9" y="3" width="22" height="22" rx="5" fill="#29aef0" stroke="#fff" strokeWidth="2.5" />
      </g>
      <circle cx="20" cy="14" r="4" fill="#fff" />
    </svg>
  );
}

/** A raid: a gym with a glowing egg, colored by stars like the game. */
export function RaidIcon({ stars }: { stars: 1 | 3 | 5 }) {
  const egg = RAID_EGG[stars];
  return (
    <svg viewBox="0 0 52 74" width="46" height="66" aria-hidden>
      <Shadow cx={26} cy={70} rx={17} />
      <path d="M11 68 15 55h22l4 13Z" fill="#0a5a98" />
      <rect x="21" y="38" width="10" height="18" rx="2" fill="#0b84d6" />
      <ellipse cx="26" cy="38" rx="14" ry="5" fill="#1ab6e8" />
      <ellipse cx="26" cy="20" rx="14" ry="17" fill={egg} opacity=".25" />
      <path d="M26 5c8 0 12 9 12 16 0 7-5.4 12-12 12S14 28 14 21c0-7 4-16 12-16Z" fill={egg} stroke="#fff" strokeWidth="2" />
      <path d="M20 12c1.6-2.4 3.6-3.6 6-3.8" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" opacity=".8" />
    </svg>
  );
}

/** An egg, spotted by distance like the game's eggs. */
export function EggIcon({ km }: { km: keyof typeof EGG_SPOTS }) {
  const spot = EGG_SPOTS[km];
  return (
    <svg viewBox="0 0 30 40" width="28" height="37" aria-hidden>
      <Shadow cx={15} cy={37} rx={9} />
      <path d="M15 2c7 0 11 10 11 18 0 7.7-4.9 13-11 13S4 27.7 4 20C4 12 8 2 15 2Z" fill="#fdfdfb" stroke="#d9d3c3" strokeWidth="1.2" />
      <circle cx="11" cy="14" r="3" fill={spot} />
      <circle cx="19" cy="20" r="3.6" fill={spot} />
      <circle cx="12.5" cy="26" r="2.4" fill={spot} />
    </svg>
  );
}
