# developer-go

My portfolio, built like Pokémon GO. Walk around my Boston: gyms are jobs, PokéStops are projects, raids are hackathons, and wild Pokémon are fun facts you can catch.

**Status:** in progress, built step by step.

## The idea
- **Map:** a stylized Greater Boston built from OpenStreetMap data, with day and night.
- **Walking:** click anything and your trainer walks there along real roads (A* pathfinding).
- **Content:** every job, project, hackathon, and fact is typed data in [`src/content`](src/content), and everything on the map is also one tap away in a list.
- **Visitor stats:** your km walked and Pokémon caught add up with everyone else's.

## Stack
Next.js, TypeScript, Tailwind, and Vitest.

## Run it
```bash
npm install
npm run dev        # http://localhost:3000
npm test
npm run typecheck
```

## Credits
Pokémon and all respective names are trademark and © of Nintendo, Creatures Inc., and GAME FREAK inc. This is a fan-made portfolio, not affiliated with, sponsored by, or endorsed by The Pokémon Company, Nintendo, Niantic, or Scopely.
