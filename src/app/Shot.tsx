import type { Media } from "@/content";

/** A project's picture: the animated one moves, and anyone who asked for less motion gets its still frame. */
export function Shot({ m, className = "" }: { m: Media; className?: string }) {
  return (
    <picture className="block">
      {m.still ? <source srcSet={m.still} media="(prefers-reduced-motion: reduce)" /> : null}
      {/* eslint-disable-next-line @next/next/no-img-element -- small local webp, already sized */}
      <img src={m.src} alt={m.alt} width={m.width} height={m.height} loading="lazy" decoding="async" className={`h-auto w-full ${className}`} />
    </picture>
  );
}
