import { SoundToggle } from "@/components/SoundToggle";
import { TimeToggle } from "@/components/TimeToggle";
import { GameLoader } from "@/game/GameLoader";

export default function Home() {
  return (
    <main className="relative h-dvh w-full overflow-hidden bg-sky">
      <GameLoader />

      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4">
        <div className="pointer-events-auto rounded-full bg-surface/85 px-4 py-2 shadow-md backdrop-blur">
          <h1 className="font-display text-lg font-semibold text-ink">Tyler Dong</h1>
        </div>
        <div className="pointer-events-auto flex gap-2">
          <SoundToggle />
          <TimeToggle />
        </div>
      </header>
    </main>
  );
}
