"use client";

import { type ReactNode, type Ref, useEffect, useRef } from "react";

const X = (
  <svg viewBox="0 0 16 16" className="size-[45%]" aria-hidden>
    <path d="m3 3 10 10M13 3 3 13" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

/** GO's close button: a solid teal circle with a white X (small, for toasts and pop-ups). */
export function CloseButton({ label, onClick, ref }: { label: string; onClick: () => void; ref?: Ref<HTMLButtonElement> }) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-label={label}
      className="go-close grid size-9 shrink-0 place-items-center rounded-full outline-none transition focus-visible:ring-2 focus-visible:ring-[#24828b] focus-visible:ring-offset-2 active:scale-90"
    >
      {X}
    </button>
  );
}

type Head = { art?: ReactNode; kicker?: string; accent?: string; subtitle?: string; side?: boolean };

/**
 * Every screen on the base, in Pokémon GO's style: a light mint sheet with
 * a thin green edge, dark slate-teal text, the title small, uppercase and
 * letter-spaced at the top with a count under it, and the big teal X at
 * the bottom center, in thumb reach. Full screen on phones; a full-height
 * phone-width column on bigger screens, docked to the side for things on
 * the map (with their art, kicker and name), so the thing stays in view.
 * Escape or the X closes it.
 */
export function Sheet({
  title,
  onClose,
  children,
  art,
  kicker,
  accent,
  subtitle,
  side = false,
}: { title: string; onClose: () => void; children: ReactNode } & Head) {
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    close.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className={`fixed inset-0 z-50 flex justify-center sm:p-4 ${side ? "sm:justify-end" : ""}`}>
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className={`scrim-in absolute inset-0 ${side ? "sm:bg-linear-to-l sm:from-[#0a2a4a]/25 sm:to-transparent" : "bg-[#0a2a4a]/25"}`}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="go-sheet sheet-in relative flex h-full w-full flex-col overflow-hidden sm:max-w-[430px] sm:rounded-[28px]"
      >
        {art ? (
          <header className="flex flex-col items-center px-6 pt-8 pb-4 text-center">
            <div className="grid size-24 place-items-center rounded-full bg-white shadow-[0_6px_18px_rgb(48_85_93/0.12)]">{art}</div>
            {kicker ? (
              <p className="go-title mt-4 text-[0.68rem]" style={{ color: accent }}>
                {kicker}
              </p>
            ) : null}
            <h2 className="mt-1 text-[1.6rem] leading-tight font-black">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm text-ink-soft">{subtitle}</p> : null}
          </header>
        ) : (
          <header className="px-6 pt-7 pb-4 text-center">
            {kicker ? (
              <p className="go-title text-[0.65rem]" style={{ color: accent }}>
                {kicker}
              </p>
            ) : null}
            <h2 className="go-title text-[0.95rem]">{title}</h2>
            {subtitle ? <p className="mt-1 text-xs font-bold text-ink-soft tabular-nums">{subtitle}</p> : null}
          </header>
        )}
        <div className="flex-1 overflow-y-auto px-6 pb-28">{children}</div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-linear-to-t from-[#e9f8e6] via-[#e9f8e6]/80 to-transparent pt-8 pb-5">
          <button
            ref={close}
            type="button"
            onClick={onClose}
            aria-label={`Close ${title}`}
            className="go-close pointer-events-auto grid size-14 place-items-center rounded-full outline-none transition focus-visible:ring-2 focus-visible:ring-[#24828b] focus-visible:ring-offset-2 active:scale-90"
          >
            {X}
          </button>
        </div>
      </section>
    </div>
  );
}
