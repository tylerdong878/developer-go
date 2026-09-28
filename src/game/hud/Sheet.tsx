"use client";

import { type ReactNode, useEffect, useRef } from "react";

/**
 * A GO-style menu screen: a sheet from the bottom on phones, a centered
 * panel on bigger screens. Escape or the × closes it.
 */
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
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
      <button type="button" aria-label="Close" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-mystic-900/35 backdrop-blur-[2px]" />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="card-in relative flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-surface text-ink shadow-2xl sm:max-w-xl sm:rounded-3xl"
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h2 className="font-display text-2xl font-semibold">{title}</h2>
          <button
            ref={close}
            type="button"
            onClick={onClose}
            aria-label={`Close ${title}`}
            className="grid size-10 place-items-center rounded-full bg-ink/8 text-2xl leading-none transition hover:bg-ink/15"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-6">{children}</div>
      </section>
    </div>
  );
}
