import { TimeToggle } from "@/components/TimeToggle";
import { WorldMap } from "@/map/WorldMap";

export default function Home() {
  return (
    <main className="relative h-dvh w-full overflow-hidden">
      <WorldMap />

      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4">
        <div className="pointer-events-auto rounded-full bg-surface/85 px-4 py-2 shadow-md backdrop-blur">
          <h1 className="font-display text-lg font-semibold text-ink">Tyler Dong</h1>
        </div>
        <div className="pointer-events-auto">
          <TimeToggle />
        </div>
      </header>

      <p className="absolute right-2 bottom-2 rounded bg-surface/80 px-2 py-0.5 text-[11px] text-ink-soft">
        Map data ©{" "}
        <a
          href="https://www.openstreetmap.org/copyright"
          className="underline underline-offset-2"
        >
          OpenStreetMap
        </a>{" "}
        contributors
      </p>
    </main>
  );
}
