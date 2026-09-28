import type { CSSProperties } from "react";

/**
 * Tyler's trainer, drawn from a photo: black hair parted in the middle with
 * the fringe down to his brows, and a black tee under a Team Mystic jacket.
 * The rings at his feet work like the game's: a white ping for what's close
 * and a pink ring for his reach.
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
        <rect x="13.6" y="42" width="6" height="15.5" rx="2.6" fill="#2b323d" />
        <rect x="12.2" y="55.2" width="8.6" height="5" rx="2.5" fill="#f5f5f3" />
        <rect x="12.2" y="58.8" width="8.6" height="1.4" rx="0.7" fill="#d5dae0" />
      </g>
      <g className="leg leg-right">
        <rect x="20.4" y="42" width="6" height="15.5" rx="2.6" fill="#343c48" />
        <rect x="19.2" y="55.2" width="8.6" height="5" rx="2.5" fill="#fff" />
        <rect x="19.2" y="58.8" width="8.6" height="1.4" rx="0.7" fill="#d5dae0" />
      </g>
      {/* sleeves, cuffs, hands */}
      <rect x="7.4" y="23.2" width="5" height="16" rx="2.5" fill="#0a74bd" />
      <rect x="27.6" y="23.2" width="5" height="16" rx="2.5" fill="#0a74bd" />
      <rect x="7.4" y="37" width="5" height="2.6" rx="1.3" fill="#0a5a98" />
      <rect x="27.6" y="37" width="5" height="2.6" rx="1.3" fill="#0a5a98" />
      <circle cx="9.9" cy="40.8" r="2.1" fill="#f0c8a6" />
      <circle cx="30.1" cy="40.8" r="2.1" fill="#f0c8a6" />
      {/* hood, open jacket, black tee */}
      <path d="M12.5 22.6C13 19.7 16 18.5 20 18.5s7 1.2 7.5 4.1Z" fill="#0a6fb3" />
      <path
        d="M11 25.5c0-3.7 3.8-5.3 9-5.3s9 1.6 9 5.3v15c0 1.5-1.2 2.7-2.7 2.7H13.7c-1.5 0-2.7-1.2-2.7-2.7Z"
        fill="#0b84d6"
      />
      <path d="M17.3 20.5Q20 22.7 22.7 20.5L22.3 43.2H17.7Z" fill="#1e2227" />
      <path d="M17.4 21 17.8 43M22.6 21 22.2 43" stroke="#45a9ea" strokeWidth="0.7" />
      <path d="M12.9 35.6h3M24.1 35.6h3" stroke="#0a6fb3" strokeWidth="0.9" strokeLinecap="round" />
      {/* neck, ears, face */}
      <rect x="17.6" y="17.6" width="4.8" height="3.4" rx="1" fill="#e6b994" />
      <ellipse cx="12.8" cy="13.2" rx="1.5" ry="2.1" fill="#ecc19e" />
      <ellipse cx="27.2" cy="13.2" rx="1.5" ry="2.1" fill="#ecc19e" />
      <ellipse cx="20" cy="12.2" rx="7.3" ry="7.9" fill="#f2cfb0" />
      <ellipse cx="15.7" cy="15.7" rx="1.3" ry="0.8" fill="#f0a88f" opacity=".35" />
      <ellipse cx="24.3" cy="15.7" rx="1.3" ry="0.8" fill="#f0a88f" opacity=".35" />
      {/* hair: parted in the middle, fringe down to the brows */}
      <path
        d="M12.1 14.6C10.9 9.8 11.9 4.4 16.4 2.4 18 1.7 19.4 1.9 20 2.8 20.6 1.9 22 1.7 23.6 2.4 28.1 4.4 29.1 9.8 27.9 14.6 27.4 12.4 26.8 11 25.6 10.3 24.2 9.6 23 9.9 22 10.2 21.2 8.6 20.6 6.8 20 5.2 19.4 6.8 18.8 8.6 18 10.2 17 9.9 15.8 9.6 14.4 10.3 13.2 11 12.6 12.4 12.1 14.6Z"
        fill="#1c1818"
      />
      <path
        d="M18.2 3.9C17 5 15.7 6.6 14.6 8.6M21.8 3.9C23 5 24.3 6.6 25.4 8.6"
        stroke="#3d3534"
        strokeWidth="0.7"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M15.3 11.2h2.9M21.8 11.2h2.9" stroke="#1c1818" strokeWidth="1.1" strokeLinecap="round" />
      <ellipse cx="17" cy="13" rx="1.15" ry="0.95" fill="#1c1818" />
      <ellipse cx="23" cy="13" rx="1.15" ry="0.95" fill="#1c1818" />
      <circle cx="17.4" cy="12.7" r="0.32" fill="#fff" />
      <circle cx="23.4" cy="12.7" r="0.32" fill="#fff" />
      <ellipse cx="20" cy="15" rx="0.9" ry="0.55" fill="#e0ab89" />
      <path d="M17.9 17q2.1 1.3 4.2 0" stroke="#b5705a" strokeWidth="0.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}
