import type { CSSProperties } from "react";

/**
 * Teddy, Tyler's Shih-Poo, out on the map as his buddy. He stands at the
 * trainer's side facing him, a few pixels over at any zoom. Drawn from photos:
 * cream curls, floppy ears, and a fluffy tail curled up over his back.
 */
export function Buddy({ x, y }: { x: number; y: number }) {
  return (
    <div
      className="buddy"
      data-facing="left"
      style={{ "--x": Math.round(x), "--y": Math.round(y) } as CSSProperties}
      aria-hidden
    >
      <TeddyFigure />
    </div>
  );
}

/** Drawn facing right; data-facing flips him. */
function TeddyFigure() {
  return (
    <svg viewBox="0 0 40 33" width="40" height="33" overflow="visible" className="buddy-figure">
      <defs>
        {/* a thin warm outline so a cream dog still shows up on cream ground */}
        <filter id="teddy-outline" x="-10%" y="-10%" width="120%" height="120%">
          <feMorphology in="SourceAlpha" operator="dilate" radius="0.6" result="thick" />
          <feFlood floodColor="#a88f6c" />
          <feComposite in2="thick" operator="in" result="outline" />
          <feMerge>
            <feMergeNode in="outline" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <ellipse cx="19" cy="30.8" rx="12" ry="1.8" fill="#0a2a4a" opacity=".18" />
      <g filter="url(#teddy-outline)">
        {/* far legs */}
        <rect x="11.8" y="21.5" width="4" height="8.3" rx="2" fill="#e2d1b3" />
        <rect x="24.8" y="21.5" width="4" height="8.3" rx="2" fill="#e2d1b3" />
        <ellipse cx="13.8" cy="29.6" rx="2.3" ry="1.3" fill="#e2d1b3" />
        <ellipse cx="26.8" cy="29.6" rx="2.3" ry="1.3" fill="#e2d1b3" />
        <g className="teddy-tail">
          <path
            d="M9.5 18.5C5.2 17.6 3.2 13 4.6 9.2 5.8 6 9.4 5 11.6 6.9c1.8 1.6 1.3 4.5-.6 5.4-.8.4-.9 1.5 0 2.3Z"
            fill="#f7efdf"
          />
          <path d="M6.3 12.5c-.4-2.4.9-4.4 3-4.5" stroke="#e3d2b4" strokeWidth=".7" strokeLinecap="round" fill="none" />
        </g>
        {/* curly body */}
        <ellipse cx="18.5" cy="20" rx="10.5" ry="6.8" fill="#f2e7d2" />
        <circle cx="10.5" cy="17" r="3.4" fill="#f2e7d2" />
        <circle cx="14.5" cy="14.6" r="3.2" fill="#f2e7d2" />
        <circle cx="19" cy="14" r="3.2" fill="#f2e7d2" />
        <circle cx="23.5" cy="15" r="3.1" fill="#f2e7d2" />
        <path
          d="M12.5 20.5q1.2-1.4 2.4 0M16.8 23q1.2-1.4 2.4 0M18.5 18.2q1.2-1.4 2.4 0M22 21.6q1.2-1.4 2.4 0M13.8 16.8q1.2-1.4 2.4 0"
          stroke="#dfccad"
          strokeWidth=".7"
          strokeLinecap="round"
          fill="none"
        />
        {/* near legs */}
        <rect x="8.6" y="22.4" width="4.6" height="8" rx="2.3" fill="#f1e5cf" />
        <rect x="21.8" y="22.4" width="4.6" height="8" rx="2.3" fill="#f1e5cf" />
        <ellipse cx="10.9" cy="30" rx="2.7" ry="1.5" fill="#f1e5cf" />
        <ellipse cx="24.1" cy="30" rx="2.7" ry="1.5" fill="#f1e5cf" />
        {/* chest, floppy ears, fluffy head */}
        <ellipse cx="27" cy="19.5" rx="4.6" ry="5.2" fill="#f6efe1" />
        <path d="M25.6 8c-3.2.6-3.8 5.6-2.6 9.2.9 2.4 3.8 1.8 4-1.2.2-3 .6-6.4-1.4-8Z" fill="#e6cfa9" />
        <path d="M34.4 8c3.2.6 3.8 5.6 2.6 9.2-.9 2.4-3.8 1.8-4-1.2-.2-3-.6-6.4 1.4-8Z" fill="#e6cfa9" />
        <circle cx="30" cy="11.6" r="7.2" fill="#f5ebd8" />
        <circle cx="26.6" cy="6.2" r="2.6" fill="#f5ebd8" />
        <circle cx="30.2" cy="5.1" r="2.8" fill="#f5ebd8" />
        <circle cx="33.7" cy="6.3" r="2.5" fill="#f5ebd8" />
        <path
          d="M24.4 9.6c-1.5 1.8-1.6 5-.6 7.4M35.6 9.6c1.5 1.8 1.6 5 .6 7.4"
          stroke="#d9c09a"
          strokeWidth=".7"
          strokeLinecap="round"
          fill="none"
        />
        {/* face */}
        <ellipse cx="30" cy="14.9" rx="3.6" ry="2.7" fill="#fbf6ec" />
        <g className="teddy-eyes">
          <circle cx="27.3" cy="11.3" r="1.4" fill="#1a1310" />
          <circle cx="32.7" cy="11.3" r="1.4" fill="#1a1310" />
          <circle cx="27.8" cy="10.8" r=".5" fill="#fff" />
          <circle cx="33.2" cy="10.8" r=".5" fill="#fff" />
        </g>
        <path d="M28.6 13.4Q30 12.6 31.4 13.4 31.2 14.8 30 15 28.8 14.8 28.6 13.4Z" fill="#1a1310" />
        <path d="M30 15v.7M28.7 15.8q1.3.9 2.6 0" stroke="#1a1310" strokeWidth=".6" strokeLinecap="round" fill="none" />
        <ellipse cx="30" cy="16.7" rx=".9" ry=".75" fill="#ef8a8f" />
      </g>
    </svg>
  );
}
