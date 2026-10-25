/*
 * GO's PokéStop Showcases (notes/research/go-round-4.md 3), for Tyler's
 * hackathon placings: each raid he placed at shows its category and where his
 * team finished, in GO's leaderboard style ("Rank 1", the trophy, the
 * showcase teal). The numbers are the ones on his
 * results (src/content/hackathons.ts), nothing more.
 */

export type Showcase = { category: string; place: string; rank: number | null; of: number | null };

export const SHOWCASES: Record<string, Showcase> = {
  "bostonhacks-2024": { category: "Interstellar Intelligence (AI/ML) track", place: "1st", rank: 1, of: 49 },
  "civic-tech-2025": { category: "Best Design", place: "1st", rank: 1, of: 40 },
  "hackillinois-2025": { category: "HackOlympian", place: "Finalist, top 5", rank: null, of: 105 },
  "sthacks-2025": { category: "Overall", place: "4th", rank: 4, of: null },
};

/** GO's trophy colors for the top three, and plain for the rest. */
export const TROPHY: Record<number, string> = { 1: "#f2c14e", 2: "#c3ccd4", 3: "#d0925a" };
