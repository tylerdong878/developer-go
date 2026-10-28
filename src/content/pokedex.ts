/**
 * One real Pokédex entry for each fact Pokémon, shown on its card and
 * credited to its game (from PokeAPI's flavor text, checked Oct 28, 2026;
 * notes/research/lore-audit.md). Whole sentences, in normal casing.
 */
export type DexEntry = { text: string; game: string };

export const pokedex: Record<number, DexEntry> = {
  143: { text: "Very lazy. Just eats and sleeps. As its rotund bulk builds, it becomes steadily more slothful.", game: "Red" },
  106: { text: "It is also called the Kick Master. It uses its elastic legs to execute every known kick.", game: "Crystal" },
  865: { text: "After deflecting attacks with its hard leaf shield, it strikes back with its sharp leek stalk. The leek stalk is both weapon and food.", game: "Shield" },
  95: { text: "Onix has a magnet in its brain. It acts as a compass so that this Pokémon does not lose direction while it is tunneling.", game: "Ruby" },
  137: { text: "A Pokémon that consists entirely of programming code. Capable of moving freely in cyberspace.", game: "Red" },
  479: { text: "One boy's invention led to the development of many different machines that take advantage of Rotom's unique capabilities.", game: "Sword" },
  255: { text: "Torchic has a place inside its body where it keeps its flame. Give it a hug - it will be glowing with warmth.", game: "Sapphire" },
  56: { text: "An agile Pokémon that lives in trees. It angers easily and will not hesitate to attack anything.", game: "Yellow" },
  133: { text: "Its genetic code is unstable, so it could evolve in a variety of ways. There are only a few alive.", game: "Yellow" },
  100: { text: "Usually found in power plants. Easily mistaken for a Poké Ball, they have zapped many people.", game: "Red" },
  869: { text: "When it trusts a Trainer, it will treat them to berries it's decorated with cream.", game: "Sword" },
  132: { text: "Its transformation ability is perfect. However, if made to laugh, it can't maintain its disguise.", game: "Silver" },
  81: { text: "Uses anti-gravity to stay suspended. Appears without warning and uses Thunder Wave and similar moves.", game: "Red" },
};

/** A Pokédex number the way the games write it: 143 is 0143. */
export const dexNo = (dex: number) => String(dex).padStart(4, "0");
