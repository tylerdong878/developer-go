import { GameLoader } from "@/game/GameLoader";

export default function Home() {
  return (
    <main className="relative h-dvh w-full overflow-hidden bg-sky">
      <h1 className="sr-only">Tyler Dong, software engineer</h1>
      <GameLoader />
    </main>
  );
}
