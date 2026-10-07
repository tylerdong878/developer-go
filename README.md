# developer-go

My portfolio, built like Pokémon GO. Walk my trainer around a 3D home base: gyms are jobs, PokéStops are projects, raids are hackathons, and the sparkly Pokémon are facts about me.

**Live:** https://developer-go.vercel.app (and a plain [text version](https://developer-go.vercel.app/text))

## The idea
- **The base:** a small hand-built 3D neighborhood with some Boston in it. Every job's gym stands in front of its own building (a glass tower for AWS, red brick for Khoury), with offices downtown, campus halls by the quad, houses on the south side, a park with a pond, a harbor walk, courts, and a climbing rock. At night the windows and streetlights come on.
- **Playing:** WASD or the arrows walk, Shift runs; click or tap the ground to walk there. Walk up to anything and press E (or tap the prompt) to open it. Drag to spin the camera, scroll or pinch to zoom. The minimap in the corner opens a full map that takes you anywhere.
- **Around town:** trainers walk the streets and point you at things, wild Pokémon wander and notice you, and Teddy follows you everywhere.
- **Catching:** wild Pokémon spawn around you just for fun. Flick a Poké Ball to catch them, with Nice, Great, and Excellent throws. The 13 sparkly ones each hold a fact about me.
- **Game stuff:** every catch has a CP and lands on your Pokémon screen (sort it, or transfer one). Spin stops for Poké Balls and berries (throws use them up), earn XP and levels, fill in the Pokédex, earn medals, pet Teddy, and kick balls around. Your progress stays in your browser.
- **Community:** every visitor's catches, spins, and visits add up on the Community screen, with a live feed of what people just caught, the strongest catch, and the most-caught species.
- **Reading:** walk up to anything to open its card. Nearby lists everything and dashes you straight to it, every card has its own link (like `/#aws`), and `/text` has it all on one plain page.
- **Content:** every job, project, hackathon, and fact is typed data in [`src/content`](src/content).

## Stack
Next.js, TypeScript, Tailwind, three.js with React Three Fiber, and Vitest. The town, my trainer, and Teddy are all built from simple shapes in code (every building is one instanced box with windows drawn by a shader), sounds are made with Web Audio, and the only images are the Pokémon sprites.

## Run it
```bash
npm install
npm run dev        # http://localhost:3000
npm test
npm run typecheck
npm run sprites:fetch   # download any missing Pokémon sprites
```

## Community (Convex)
The Community screen runs on a free [Convex](https://convex.dev) backend in [`convex/`](convex). Until it's connected, the site plays the same and the screen stays hidden. To connect it:
1. `npx convex dev` and log in (free account). It creates the project, pushes the functions, and writes `NEXT_PUBLIC_CONVEX_URL` to `.env.local`.
2. `npx convex deploy` to push the functions to production.
3. In Vercel, add `NEXT_PUBLIC_CONVEX_URL` (the production URL from step 2) and redeploy.

Visitors are anonymous (a random id per browser; the feed only keeps the species and CP), and reports are capped and rate-limited so nobody can pump the numbers.

## Where things are
- [`src/game/base.ts`](src/game/base.ts), [`lots.ts`](src/game/lots.ts), [`props.ts`](src/game/props.ts): the layout of the base, where every map object stands, the buildings, and the street furniture
- [`src/game/scene`](src/game/scene): the 3D world, the characters, shadows, and the follow camera
- [`src/game/hud`](src/game/hud): GO's menus, Nearby, the cards, the catch screen, and the Pokémon, Items, and Community screens
- [`src/game/wild.ts`](src/game/wild.ts), [`progress.ts`](src/game/progress.ts): wild spawns, and what each visitor has caught, spun, visited, and carries
- [`src/game/community.ts`](src/game/community.ts), [`convex/`](convex): the community totals and catch feed

## Credits
Pokémon and all respective names are trademark and © of Nintendo, Creatures Inc., and GAME FREAK inc. This is a fan-made portfolio, not affiliated with, sponsored by, or endorsed by The Pokémon Company, Nintendo, Niantic, or Scopely.
