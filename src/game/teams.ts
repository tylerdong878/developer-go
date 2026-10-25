import { INSTINCT, MYSTIC, VALOR } from "./colors";

/*
 * GO's three teams (notes/research/go-round-3.md 6). From level 5, the first
 * gym you tap asks you to pick one, after each leader has a word. The lines
 * are our own, in each leader's spirit, not GO's script. Tyler is Mystic, so
 * his gyms are friendly gyms for Mystic and rival gyms for the other two.
 */

export type TeamId = "mystic" | "valor" | "instinct";

export type Team = { name: string; color: string; ink: string; leader: string; they: string; bird: string; lines: string[]; welcome: string };

export const TEAMS: Record<TeamId, Team> = {
  mystic: {
    name: "Team Mystic",
    color: MYSTIC,
    ink: "#ffffff",
    leader: "Blanche",
    they: "they",
    bird: "Articuno",
    lines: [
      "There's a depth to Pokémon we've barely started to understand.",
      "I study evolution: what changes in a Pokémon, and why.",
      "We keep a cool head, read every situation, and plan our way to the win.",
    ],
    welcome: "Welcome to Team Mystic. Let's find out what Pokémon can teach us.",
  },
  valor: {
    name: "Team Valor",
    color: VALOR,
    ink: "#ffffff",
    leader: "Candela",
    they: "she",
    bird: "Moltres",
    lines: [
      "Pokémon have a strength people can only dream of, and big hearts to match.",
      "I'm working out how to bring that power all the way out.",
      "Train with us and your Pokémon will be the toughest in any battle.",
    ],
    welcome: "Welcome to Team Valor! Let's get fired up.",
  },
  instinct: {
    name: "Team Instinct",
    color: INSTINCT,
    ink: "#3a2a00",
    leader: "Spark",
    they: "he",
    bird: "Zapdos",
    lines: [
      "Pokémon just know things. Ever notice that?",
      "My hunch: it has something to do with how they hatch.",
      "Go with your gut and you'll do fine. That's how we roll.",
    ],
    welcome: "Welcome to Team Instinct! Trust your gut out there.",
  },
};

export const TEAM_ORDER: TeamId[] = ["mystic", "valor", "instinct"];

/** GO opens team choice, gyms and raids at level 5. */
export const TEAM_LEVEL = 5;
