import type { SkillId } from "./skills";

/** A real-world point. The map projection handles the "not to scale" part. */
export type LatLon = { lat: number; lon: number };

/** Off-map places, drawn as signposts at the edge of the map. */
export type SignpostId = "nyc" | "providence" | "urbana";

export type Where = LatLon | { signpost: SignpostId };

export type Link = { label: string; href: string };

/** A headline number. Stops pop these out as item bubbles when spun. */
export type Stat = { value: string; label: string };

export type TeamId = "mystic" | "valor" | "instinct";

export type MedalTier = "bronze" | "silver" | "gold" | "platinum";

/** "YYYY-MM" */
export type Month = `${number}-${number}`;

export type Role = {
  title: string;
  team?: string;
  start: Month;
  /** null while it's ongoing */
  end: Month | null;
  bullets: string[];
};

/** A job. */
export type Gym = {
  kind: "gym";
  slug: string;
  org: string;
  location: string;
  roles: Role[];
  stack: SkillId[];
  where: Where;
};

/** A project. Featured stops get a lure. */
export type Stop = {
  kind: "stop";
  slug: string;
  name: string;
  tagline: string;
  featured: boolean;
  period: string;
  role: string;
  stats: Stat[];
  highlights: string[];
  stack: SkillId[];
  links: Link[];
  image?: string;
  where: Where;
};

/** A hackathon. Stars are the result: 5 won, 3 placed, 1 competed. */
export type Raid = {
  kind: "raid";
  slug: string;
  event: string;
  dates: string;
  venue: string;
  stars: 1 | 3 | 5;
  result?: string;
  featured: boolean;
  project: {
    name: string;
    tagline: string;
    /** Teammates, credited the way they appear on Devpost. */
    team: string[];
    /** What Tyler built. */
    built: string[];
    stack: SkillId[];
    links: Link[];
    image?: string;
  };
  where: Where;
};

/** A wild Pokémon. Catching it reveals a fact about Tyler. */
export type Spawn = {
  kind: "spawn";
  slug: string;
  pokemon: { name: string; dex: number };
  title: string;
  body: string;
  /** Snorlax: waking it opens the About card. */
  opensAbout?: boolean;
  where: LatLon;
};

/** Work in progress. It hatches when it ships. */
export type Egg = {
  kind: "egg";
  slug: string;
  km: 2 | 5 | 7 | 10 | 12;
  title: string;
  body: string;
  stack: SkillId[];
  where: LatLon;
};

export type MapObject = Gym | Stop | Raid | Spawn | Egg;

export type Medal = {
  slug: string;
  title: string;
  detail: string;
  tier: MedalTier;
  group: "go" | "award" | "honor";
  date?: string;
  link?: Link;
};

export type Trainer = {
  name: string;
  about: string[];
  school: { name: string; degree: string; graduation: string; gpa: string };
  email: string;
  links: Link[];
  go: {
    level: number;
    team: TeamId;
    /** ISO date */
    since: string;
    xp: number;
    km: number;
    caught: number;
    stopsVisited: number;
    dex: number;
    favorite: string;
  };
  buddy: { name: string; kind: string; blurb: string };
  /** Town level only, never a street address. */
  home: LatLon;
};
