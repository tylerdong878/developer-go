import { places } from "./places";
import type { Raid } from "./types";

const devpost = (slug: string) => ({
  label: "Devpost",
  href: `https://devpost.com/software/${slug}`,
});

export const raids: Raid[] = [
  {
    kind: "raid",
    slug: "bostonhacks-2024",
    event: "BostonHacks 2024",
    dates: "Nov 2-3, 2024",
    venue: "Boston University, George Sherman Union",
    stars: 5,
    result: "1st of 49, Interstellar Intelligence (AI/ML) track",
    featured: false,
    project: {
      name: "SVS Lunar Client",
      tagline:
        "Unity simulations for training reinforcement learning agents to control space vehicles.",
      team: ["Ray Xu", "Justin Cai"],
      built: [
        "Built and trained a 2D PPO agent in Unity ML-Agents: 23 training runs, with the best ones near the max reward.",
        "My first hackathon and my first ML project.",
      ],
      stack: ["unity", "csharp", "ml-agents", "pytorch"],
      links: [
        devpost("jtr"),
        { label: "GitHub", href: "https://github.com/Bruvato/svs-lunar-client" },
        { label: "Video", href: "https://www.youtube.com/watch?v=O3WRU3QGNM0" },
      ],
    },
    where: places.buGsu,
  },
  {
    kind: "raid",
    slug: "hack-at-brown-2025",
    event: "Hack@Brown 2025",
    dates: "Feb 1-2, 2025",
    venue: "Brown University, Providence",
    stars: 1,
    featured: false,
    project: {
      name: "Noblo Asteroids",
      tagline: "Asteroids meets Space Invaders, in 3D, in Unity.",
      team: ["Ray Xu", "Justin Cai"],
      built: ["The main menu, scene loading, and effects."],
      stack: ["unity", "csharp"],
      links: [
        devpost("no-bloat-asteroids"),
        { label: "GitHub", href: "https://github.com/Bruvato/noblo-asteroids" },
        { label: "Video", href: "https://www.youtube.com/watch?v=YDvMAyzYZhM" },
      ],
    },
    where: { signpost: "providence" },
  },
  {
    kind: "raid",
    slug: "hackbeanpot-2025",
    event: "HackBeanpot 2025",
    dates: "Feb 7-9, 2025",
    venue: "Northeastern University",
    stars: 1,
    featured: true,
    project: {
      name: "RoadToad",
      tagline:
        "AI road-trip planner: routes, stops along the way, weather, a packing list, a custom Spotify playlist, and car bingo.",
      team: ["Ray Xu", "Aidan Szeto"],
      built: [
        "Majority author: 69% of the code that shipped.",
        "Spotify login and AI playlists: Gemini picks genres for the start and end regions, and Spotify search fills the playlist.",
        "Finding stops along a route: sample leg ends, long-step midpoints, and sharp turns, dedupe them on a grid, then run Places searches in parallel.",
        "Route alternatives, editable stops, map pins, weather, the packing list, and bingo seeded with the route's attractions.",
      ],
      stack: [
        "nextjs",
        "typescript",
        "react",
        "tailwind",
        "google-maps",
        "gemini",
        "spotify-api",
      ],
      links: [
        { label: "Live", href: "https://roadtoad.vercel.app" },
        { label: "Video", href: "https://youtu.be/X_MCxgd-IWA" },
        devpost("roadtoad"),
        { label: "GitHub", href: "https://github.com/Bruvato/road-toad" },
      ],
    },
    where: places.northeastern,
  },
  {
    kind: "raid",
    slug: "civic-tech-2025",
    event: "Civic Tech Hackathon 2025",
    dates: "Feb 22-23, 2025",
    venue: "BU Spark!, Boston University",
    stars: 5,
    result: "Best Design of 40",
    featured: false,
    project: {
      name: "AnimaGo",
      tagline:
        "Pokémon GO for real wildlife: photograph animals, build your Biodex, and climb the leaderboard.",
      team: ["Shresht Bhowmick", "Ray Xu", "Ketan Keshav", "Nagalekha Ramesh"],
      built: [
        "The achievements screen and a Firebase leaderboard with profile drill-down.",
        "A sticker feature that uses Segment Anything to cut the animal out into a transparent PNG.",
      ],
      stack: ["python", "fastapi", "firebase", "opencv"],
      links: [
        devpost("animago"),
        { label: "GitHub", href: "https://github.com/Tetraslam/AnimaGo" },
      ],
    },
    where: places.buCds,
  },
  {
    kind: "raid",
    slug: "hackillinois-2025",
    event: "HackIllinois 2025",
    dates: "Feb 27 - Mar 2, 2025",
    venue: "University of Illinois Urbana-Champaign",
    stars: 3,
    result: "HackOlympian Finalist, top 5 of 105",
    featured: false,
    project: {
      name: "SpendShield",
      tagline:
        "A gamified social finance app: curb impulse spending and compete with friends on savings.",
      team: ["Ari Zukerman", "Ray Xu"],
      built: [
        "The whole signed-in app: dashboard, analytics, reports, impulse-control tools, goals, a social feed, a savings leaderboard, and 12 charts.",
      ],
      stack: ["nextjs", "typescript", "react", "tailwind"],
      links: [
        { label: "Live", href: "https://spend-shield.vercel.app" },
        { label: "Video", href: "https://youtu.be/_oXCg3yg9Y0" },
        devpost("spendshield"),
        { label: "GitHub", href: "https://github.com/Bruvato/spend-shield" },
      ],
    },
    where: { signpost: "urbana" },
  },
  {
    kind: "raid",
    slug: "sthacks-2025",
    event: "STHacks 2025",
    dates: "Mar 28-30, 2025",
    venue: "Stetson East, Northeastern",
    stars: 3,
    result: "4th place",
    featured: false,
    project: {
      name: "ManImTired",
      tagline: "Type a prompt, get an LLM-generated Manim math animation.",
      team: ["Shresht Bhowmick", "Ray Xu", "Bensen Wang"],
      built: ["Rewrote the code-generation prompt to cut down on render failures."],
      stack: ["python", "langchain"],
      links: [
        devpost("manimtired"),
        { label: "GitHub", href: "https://github.com/Tetraslam/manimtired" },
        { label: "Video", href: "https://www.youtube.com/watch?v=TYJ02Z1lQR0" },
      ],
    },
    where: places.stetsonEast,
  },
  {
    kind: "raid",
    slug: "hackharvard-2025",
    event: "HackHarvard 2025",
    dates: "Oct 3-5, 2025",
    venue: "Harvard University",
    stars: 1,
    featured: true,
    project: {
      name: "FIREBALL",
      tagline:
        "A real-time multiplayer wizard duel you control with body gestures through your webcam.",
      team: ["Shresht Bhowmick", "Benson Zheng"],
      built: [
        "The in-browser MediaPipe Pose pipeline and 7 real-time gesture recognizers (5 shipped).",
        "Reworked the WebRTC peer video: a fixed offerer, waiting for camera tracks before answering, and clean teardown each round.",
        "Self-signed HTTPS so cameras work over LAN, the lobby and rules UI, and the 13-move interaction design.",
      ],
      stack: ["react", "typescript", "mediapipe", "webrtc"],
      links: [
        devpost("fireball-7g2zl9"),
        { label: "GitHub", href: "https://github.com/tetraslam/hackharvard2025" },
      ],
    },
    where: places.harvardSoch,
  },
  {
    kind: "raid",
    slug: "babson-buildathon-2026",
    event: "Babson Buildathon 2026",
    dates: "Apr 2026",
    venue: "Babson College",
    stars: 1,
    featured: false,
    project: {
      name: "Scout",
      tagline:
        "Brain-engagement analytics for athletes, built on Meta's TRIBE v2 model.",
      team: ["Benson Zheng"],
      built: [
        "About half the app: session setup, reports, insights, the AI coach prompt, and an animated 3D brain in react-three-fiber.",
      ],
      stack: ["nextjs", "react", "typescript", "r3f", "fastapi", "python"],
      links: [],
    },
    where: places.babson,
  },
];
