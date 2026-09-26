import { places } from "./places";
import type { Trainer } from "./types";

export const trainer: Trainer = {
  name: "Tyler Dong",
  about: [
    "I'm Tyler, a CS + Computer Engineering student at Northeastern (class of 2028).",
    "I like building things that have to be fast and correct: disk encryption at AWS, market data pipelines, and payments in a production app with 26k+ users.",
    "Outside of code I play competitive Tetris, climb, play intramural tennis and pickleball, edit gaming montages, and reached top 103 globally in Pokémon GO. And I have a dog named Teddy.",
  ],
  school: {
    name: "Northeastern University",
    degree: "B.S. Computer Science + Computer Engineering",
    graduation: "May 2028",
    gpa: "3.976",
  },
  email: "tylerdong878@gmail.com",
  links: [
    { label: "GitHub", href: "https://github.com/tylerdong878" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/tylerdong" },
    { label: "Devpost", href: "https://devpost.com/dong-ty" },
    { label: "X", href: "https://x.com/tyler878_" },
    { label: "Instagram", href: "https://www.instagram.com/tylerdong_" },
  ],
  go: {
    level: 74,
    team: "mystic",
    since: "2016-07-17",
    xp: 276_321_499,
    km: 13_650,
    caught: 184_565,
    stopsVisited: 66_471,
    dex: 863,
    favorite: "Snorlax",
  },
  buddy: {
    name: "Teddy",
    kind: "Shih-Poo",
    blurb: "My dog Teddy, a Shih-Poo. On this map he's my buddy.",
  },
  home: places.westwood,
};
