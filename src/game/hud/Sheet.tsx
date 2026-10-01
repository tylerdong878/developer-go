"use client";

import { type ReactNode, type Ref, useEffect, useRef } from "react";

/** The one close button every panel uses. */
export function CloseButton({ label, onClick, ref }: { label: string; onClick: () => void; ref?: Ref<HTMLButtonElement> }) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid size-9 shrink-0 place-items-center rounded-full bg-ink/6 text-ink-soft outline-none transition hover:bg-ink/12 focus-visible:ring-2 focus-visible:ring-mystic-400 active:scale-90"
    >
      <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
        <path d="m3 3 10 10M13 3 3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  );
}

type Head = { art?: ReactNode; kicker?: string; accent?: string; subtitle?: string };

/**
 * Every panel on the base: cards, menu screens, all of them. One look: a
 * sheet from the bottom on phones, a centered panel on bigger screens, with
 * an optional icon, kicker, and subtitle. Escape or the × closes it.
 */
export function Sheet({
  title,
  onClose,
  children,
  art,
  kicker,
  accent,
  subtitle,
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
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button type="button" aria-label="Close" tabIndex={-1} onClick={onClose} className="scrim-in absolute inset-0 bg-mystic-900/25" />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="panel card-in relative flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-3xl sm:max-w-lg sm:rounded-3xl"
      >
        <header className="flex items-start gap-4 px-6 pt-6 pb-4">
          {art ? <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-ink/5">{art}</div> : null}
          <div className="min-w-0 flex-1 self-center">
            {kicker ? (
              <p className="text-xs font-bold tracking-wide" style={{ color: accent }}>
                {kicker}
              </p>
            ) : null}
            <h2 className="font-display text-2xl leading-tight font-semibold">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-sm text-ink-soft">{subtitle}</p> : null}
          </div>
          <CloseButton ref={close} label={`Close ${title}`} onClick={onClose} />
        </header>
        <div className="flex-1 overflow-y-auto px-6 pb-6">{children}</div>
      </section>
    </div>
  );
}
