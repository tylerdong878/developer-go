# developer-go

My portfolio, built like Pokémon GO. Walk my trainer around a 3D home base: gyms are jobs, PokéStops are projects, raids are hackathons, and the glowing Pokémon are facts about me.

**Live:** https://developer-go.vercel.app, a plain [text version](https://developer-go.vercel.app/text), and my [resume](https://developer-go.vercel.app/resume)

## The idea
- **The base:** a small hand-built 3D neighborhood with some Boston in it. Every job's gym stands in front of its own building (an AWS tower in the Seaport, red brick for Khoury), with offices downtown, Northeastern as Professor Oak's lab on a hill, houses on the south side, a park with a pond, a harbor with a ferry and a crane, and courts. The sky follows the visitor's own sunrise and sunset, and Boston's real weather rains, snows or fogs on it.
- **Playing:** WASD or the arrows walk, Shift runs; click or tap the ground to walk there. Walk up to anything and press E (or tap the prompt) to open it. Drag to spin the camera, scroll or pinch to zoom. The minimap in the corner opens a full map that takes you anywhere.
- **Around town:** trainers walk the streets and point you at things, wild Pokémon wander and notice you, and Teddy follows you everywhere.
- **Catching:** like GO, wild Pokémon trickle in around you once you start: leaves rustle, they pop out, and they leave when their time's up. The weather boosts types the way GO's does. The catch follows GO's real formula with each species' capture and flee rates, and you can throw curveballs while they attack and dodge. The 13 glowing ones each hold a fact about me, and they wait hidden until you find them.
- **Game stuff:** every catch has a CP and lands on your Pokémon screen. Spin stops for Poké Balls and berries, earn XP and levels, fill in the Pokédex, earn medals, and kick balls around. Raids hatch into real GO raid bosses you can catch with Premier Balls, jobs earn gym badges by how long I was there, and Teddy earns buddy hearts as you walk together. Your progress stays in your browser.
- **Community:** every visitor's catches, spins, and visits add up on the Community screen, with a live feed of what people just caught, the strongest catch, and the most-caught species.
- **Reading:** walk up to anything to open its card. Highlights and Nearby list everything and dash you straight to it. Every job, project and hackathon has its own page (like `/w/aws`) to share, `/text` has it all on one plain page, and `/resume` is one printable page.
- **Content:** every job, project, hackathon, and fact is typed data in [`src/content`](src/content).

## Stack
Next.js, TypeScript, Tailwind, three.js with React Three Fiber, Convex, and Vitest. Everything in the world is built in code: the town and its buildings from our own kit (rounded boxes with facades drawn by a shader), and every Pokémon, my trainer, Teddy and the townspeople as smooth models, blended shapes meshed in a Web Worker at load with painted faces and bones. No ripped game assets. Sounds are made with Web Audio. The images are portraits rendered from those same models (`public/portraits`) and pictures of my own projects (`public/media`).

## Run it
```bash
npm install
npm run dev        # http://localhost:3000
npm test
npm run typecheck
npm run links      # check every outside link (also runs weekly in CI)
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
- [`src/game/wild.ts`](src/game/wild.ts), [`species.ts`](src/game/species.ts), [`progress.ts`](src/game/progress.ts): wild spawns, GO's data for each species (types, capture and flee rates), and what each visitor has caught, spun, visited, and carries
- [`src/game/scene/pokemon`](src/game/scene/pokemon): the smooth models: a signed-distance compiler and mesher (`sdf/`) and a recipe per character (`recipes/`)
- [`src/app`](src/app): the game page, `/text`, `/resume`, and a page per job, project and hackathon (`w/[slug]`)
- [`src/game/community.ts`](src/game/community.ts), [`convex/`](convex): the community totals and catch feed

## Credits
Pokémon and all respective names are trademark and © of Nintendo, Creatures Inc., and GAME FREAK inc. This is a fan-made portfolio, not affiliated with, sponsored by, or endorsed by The Pokémon Company, Nintendo, Niantic, or Scopely.
