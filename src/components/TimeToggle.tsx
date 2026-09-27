"use client";

/** Flips the map between day and night and remembers the choice. */
export function TimeToggle() {
  const toggle = () => {
    const root = document.documentElement;
    const next = root.dataset.time === "night" ? "day" : "night";
    root.dataset.time = next;
    try {
      localStorage.setItem("time", next);
    } catch {
      // Private mode: the switch still works, it just won't be remembered.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Switch between day and night"
      className="grid size-11 place-items-center rounded-full bg-surface/85 text-ink shadow-md backdrop-blur transition hover:scale-105 active:scale-95"
    >
      {/* Moon by day (tap for night), sun by night (tap for day). */}
      <svg viewBox="0 0 24 24" className="size-5 night:hidden" aria-hidden>
        <path
          d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"
          fill="currentColor"
        />
      </svg>
      <svg viewBox="0 0 24 24" className="hidden size-5 night:block" aria-hidden>
        <circle cx="12" cy="12" r="4.5" fill="currentColor" />
        <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
        </g>
      </svg>
    </button>
  );
}
