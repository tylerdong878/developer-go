# developer-go

My portfolio, built like Pokémon GO. Walk my trainer around a 3D home base: gyms are jobs, PokéStops are projects, raids are hackathons, and the sparkly Pokémon are facts about me.

**Live:** https://developer-go.vercel.app (and a plain [text version](https://developer-go.vercel.app/text))

## The idea
- **The base:** a small hand-designed GO neighborhood with some Boston in it: downtown gyms, a park with a pond, a financial plaza by the harbor, a campus quad, a soccer field, tennis and basketball courts, a climbing rock, day and night.
- **Playing:** WASD or the arrows walk; click or tap the ground to walk there. Drag to spin the camera, scroll or pinch to zoom.
- **Catching:** wild Pokémon spawn around you just for fun. Flick a Poké Ball to catch them, with Nice, Great, and Excellent throws. The 13 sparkly ones each hold a fact about me.
- **Game stuff:** spin stops for items, earn XP and levels, fill in the Pokédex, earn medals, pet Teddy, and kick balls around. Progress stays in your browser.
- **Reading:** walk up to anything to open its card. Nearby lists everything and dashes you straight to it, every card has its own link (like `/#aws`), and `/text` has it all on one plain page.
- **Content:** every job, project, hackathon, and fact is typed data in [`src/content`](src/content).

## Stack
Next.js, TypeScript, Tailwind, three.js with React Three Fiber, and Vitest. The base, my trainer, and Teddy are all built from simple shapes in code, sounds are made with Web Audio, and the only images are the Pokémon sprites.

## Run it
```bash
npm install
npm run dev        # http://localhost:3000
npm test
npm run typecheck
npm run sprites:fetch   # download any missing Pokémon sprites
```

## Where things are
- [`src/game/base.ts`](src/game/base.ts): the layout of the base, and where every map object stands
- [`src/game/scene`](src/game/scene): the 3D world, the characters, shadows, and the follow camera
- [`src/game/hud`](src/game/hud): GO's menus, Nearby, the cards, and the catch screen
- [`src/game/wild.ts`](src/game/wild.ts), [`progress.ts`](src/game/progress.ts): wild spawns, and what each visitor has caught, spun, and visited

## Credits
Pokémon and all respective names are trademark and © of Nintendo, Creatures Inc., and GAME FREAK inc. This is a fan-made portfolio, not affiliated with, sponsored by, or endorsed by The Pokémon Company, Nintendo, Niantic, or Scopely.
