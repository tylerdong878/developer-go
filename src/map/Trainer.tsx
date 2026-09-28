import type { CSSProperties } from "react";

/**
 * Tyler's trainer: a simple placeholder figure in a Team Mystic hoodie until
 * there's a photo to draw him from. The rings at his feet work like the
 * game's: a white ping for what's close and a pink ring for his reach.
 */
export function Trainer({ x, y }: { x: number; y: number }) {
  return (
    <div
      className="trainer"
      style={{ "--x": Math.round(x), "--y": Math.round(y) } as CSSProperties}
      aria-hidden
    >
      <span className="rings">
        <span className="ring-reach" />
        <span className="ring-ping" />
        <span className="ring-feet" />
      </span>
      <TrainerFigure />
    </div>
  );
}

function TrainerFigure() {
  return (
    <svg viewBox="0 0 40 66" width="40" height="66" className="trainer-figure">
      <g className="leg leg-left">
        <rect x="13.5" y="40" width="6" height="18" rx="3" fill="#2c3440" />
        <rect x="12" y="55" width="9" height="5" rx="2.5" fill="#f4f4f2" />
      </g>
      <g className="leg leg-right">
        <rect x="20.5" y="40" width="6" height="18" rx="3" fill="#353f4d" />
        <rect x="19" y="55" width="9" height="5" rx="2.5" fill="#fff" />
      </g>
      <rect x="7.5" y="22" width="5" height="17" rx="2.5" fill="#0a74bd" />
      <rect x="27.5" y="22" width="5" height="17" rx="2.5" fill="#0a74bd" />
      <path d="M11 24c0-4 4-7 9-7s9 3 9 7v16c0 1.8-1.4 3-3 3H14c-1.6 0-3-1.2-3-3Z" fill="#0b84d6" />
      <path d="M20 19v23" stroke="#0a5a98" strokeWidth="1.2" />
      <rect x="15" y="31" width="10" height="5" rx="2" fill="#0a5a98" opacity=".55" />
      <circle cx="20" cy="11" r="8" fill="#f0cba8" />
      <path d="M12 10.5c0-5.2 3.6-8.5 8-8.5s8 3.3 8 8.5c-2.2-2-5-3-8-3s-5.8 1-8 3Z" fill="#1f1a19" />
      <circle cx="17" cy="12.5" r="1.1" fill="#1f1a19" />
      <circle cx="23" cy="12.5" r="1.1" fill="#1f1a19" />
    </svg>
  );
}
