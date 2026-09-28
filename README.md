# developer-go

My portfolio, built like Pokémon GO. Walk my trainer around a 3D home base: gyms are jobs, PokéStops are projects, raids are hackathons, and wild Pokémon are fun facts.

**Status:** in progress, built step by step.

## The idea
- **The base:** a small hand-designed GO neighborhood with some Boston in it: downtown gyms, a park with a pond, a financial plaza by the harbor, a campus quad, day and night.
- **Playing:** WASD or the arrows walk; click or tap the ground to walk there. Drag to spin the camera, scroll or pinch to zoom.
- **Reading:** walk up to anything to open its card. Nearby lists everything and dashes you straight to it, and every card has its own link, like `/#aws`.
- **Content:** every job, project, hackathon, and fact is typed data in [`src/content`](src/content).
- **Coming:** catching, spinning stops, and visitor stats that add up with everyone else's.

## Stack
Next.js, TypeScript, Tailwind, three.js with React Three Fiber, and Vitest. The base, my trainer, and Teddy are all built from simple shapes in code; the only images are the Pokémon sprites.

## Run it
```bash
npm install
npm run dev        # http://localhost:3000
npm test
npm run typecheck
```

## Where things are
- [`src/game/base.ts`](src/game/base.ts): the layout of the base, and where every map object stands
- [`src/game/scene`](src/game/scene): the 3D world, the characters, and the follow camera
- [`src/game/hud`](src/game/hud): GO's on-screen menus, Nearby, and the cards

## Credits
Pokémon and all respective names are trademark and © of Nintendo, Creatures Inc., and GAME FREAK inc. This is a fan-made portfolio, not affiliated with, sponsored by, or endorsed by The Pokémon Company, Nintendo, Niantic, or Scopely.
