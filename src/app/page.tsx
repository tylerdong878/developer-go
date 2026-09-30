import Link from "next/link";
import { SoundToggle } from "@/components/SoundToggle";
import { TimeToggle } from "@/components/TimeToggle";
import { GameLoader } from "@/game/GameLoader";

export default function Home() {
  return (
    <main className="relative h-dvh w-full overflow-hidden bg-sky">
      <GameLoader />

      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4">
        <div className="pointer-events-auto rounded-3xl bg-surface/85 px-4 py-2 shadow-md backdrop-blur">
          <h1 className="font-display text-lg font-semibold text-ink">Tyler Dong</h1>
          <Link href="/text" className="text-xs font-semibold text-ink-soft underline underline-offset-2">
            Text version
          </Link>
        </div>
        <div className="pointer-events-auto flex gap-2">
          <SoundToggle />
          <TimeToggle />
        </div>
      </header>
    </main>
  );
}
