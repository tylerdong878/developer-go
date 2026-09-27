import { near, places } from "./places";
import type { Stop } from "./types";

const gh = (repo: string) => ({
  label: "GitHub",
  href: `https://github.com/tylerdong878/${repo}`,
});

export const stops: Stop[] = [
  // Featured (lured) stops. The quant work clusters in the Financial District.
  {
    kind: "stop",
    slug: "etf-pipeline",
    name: "ETF Market Intelligence Pipeline",
    tagline:
      "Tracks every fund from 26 ETF issuers each trading day and emails a weekly brief.",
    featured: true,
    period: "Mar 2026 - present",
    role: "Solo",
    stats: [
      { value: "26", label: "issuers" },
      { value: "~1,490", label: "funds tracked" },
      { value: "$535B", label: "AUM tracked" },
      { value: "268", label: "tests" },
    ],
    highlights: [
      "Runs unattended on GitHub Actions every trading day since March 2026: scrape, diff against the last snapshot, and send a weekly HTML + PDF brief.",
      "Cloudflare started challenging headless Chrome, while plain HTTP in the same run kept working. Those pages render server-side, so they moved to plain HTTP with Chromium only as a fallback, and the sweep went from ~5 minutes to seconds.",
      "Every run writes a health record and CI fails on a real outage, after fallbacks had kept the build green while the data quietly got worse.",
      "Runs are dated by the trading session they captured, not the wall clock, so a late GitHub run can't file Thursday's close under Friday.",
    ],
    stack: ["python", "playwright", "pandas", "github-actions", "pytest"],
    links: [],
    where: near(places.financialDistrict, 380, -250),
  },
  {
    kind: "stop",
    slug: "ofi-regime-study",
    name: "Order Flow Imbalance Across Volatility Regimes",
    tagline:
      "Does order flow predict short-term price moves, and does that change with volatility?",
    featured: true,
    period: "May 2026 - Sep 2026",
    role: "Solo",
    stats: [
      { value: "20.5 days", label: "of live BTC-USD order book" },
      { value: "1.77M", label: "one-second observations" },
      { value: "t = 18.7 vs 2.9", label: "calm vs volatile markets" },
      { value: "17 / 17", label: "calm days significant" },
    ],
    highlights: [
      "A C++ collector rebuilt the Coinbase L2 book from WebSocket deltas and ran 24/7 on EC2 under systemd, writing Parquet files every hour.",
      "Replicates Cont, Kukanov & Stoikov (2014) with Newey-West errors and volatility regimes labeled without lookahead.",
      "OFI explains about 5x to 16x more of the return variance in calm markets, across 1 to 30 second horizons.",
      "A 2-hour sample suggested the effect, a 16-hour sample reversed it, and only the full 20 days settled it.",
    ],
    stack: ["cpp", "python", "arrow", "aws", "pandas", "statsmodels"],
    links: [gh("ofi-regime-study")],
    where: near(places.financialDistrict, 150, 330),
  },
  {
    kind: "stop",
    slug: "matching-engine",
    name: "Limit Order Book Matching Engine",
    tagline:
      "A deterministic price-time priority matching engine in Java 21. Orders in, trades out.",
    featured: true,
    period: "Aug - Sep 2026",
    role: "Solo",
    stats: [
      { value: "97", label: "tests" },
      { value: "10", label: "invariants checked after every command" },
      { value: "~20,000", label: "randomized commands" },
      { value: "0", label: "dependencies" },
    ],
    highlights: [
      "O(1) cancels with doubly-linked lists stored on each order. Prices are scaled 64-bit integers, never doubles.",
      "Sealed command and event types, so the compiler proves every case is handled.",
      "Hand-rolled mutation testing (~15 planted bugs) found 3 real gaps in the tests, including a livelock JUnit's timeout never caught.",
    ],
    stack: ["java", "gradle", "junit", "docker", "github-actions"],
    links: [gh("matching-engine")],
    where: near(places.financialDistrict, -330, 60),
  },
  {
    kind: "stop",
    slug: "imc-prosperity-4",
    name: "IMC Prosperity 4",
    tagline:
      "IMC's global algorithmic trading competition. Ranked 1,757th of 18,803 teams (top ~9.3%).",
    featured: true,
    period: "Apr 2026",
    role: "Team of 2 with Benson Zheng",
    stats: [
      { value: "1,757 / 18,803", label: "final rank" },
      { value: "105 of 107", label: "algorithm versions I wrote" },
      { value: "5", label: "rounds" },
    ],
    highlights: [
      "Wrote 105 of our 107 algorithm versions, the backtester, the analysis tools, and the manual-round math. Benson designed the round 2 market maker, our best round (algo rank 149).",
      "Built a local backtester with exact fills for aggressive orders, estimated passive fills, position limits, and an overfit check.",
      "Strategies: market making with microprice and order flow signals, options (shorting rich implied vol, deep in-the-money arbitrage), exotic option pricing with Monte Carlo, basket arbitrage, and pair trades.",
      "Biggest lesson: pin down the simulator's conventions on day 1. A time-to-expiry mismatch cost us a round.",
    ],
    stack: ["python", "numpy", "pandas"],
    links: [],
    where: near(places.financialDistrict, -60, -420),
  },
  {
    kind: "stop",
    slug: "bluffs",
    name: "Bluffs",
    tagline:
      "Real-money iMessage games between friends. 26,000+ users, top 40 in App Store Strategy.",
    featured: true,
    period: "Jan 2026 - May 2026",
    role: "Engineer at Tetracorp, team of about 7",
    stats: [
      { value: "26,000+", label: "users" },
      { value: "Top 40", label: "App Store Strategy" },
      { value: "#2", label: "contributor" },
    ],
    highlights: [
      "Owned the wallet and payments backend on Convex: a three-balance ledger where only winnings can ever be withdrawn.",
      "Withdrawals that never lose money when the payout API fails: debit first, idempotent payouts keyed to our own transaction ID, and a re-credit on every failure path.",
      "Deposit limits that parallel checkouts can't double-spend, chargeback recovery for money locked in live games, self-exclusion, and CCPA and Global Privacy Control support.",
    ],
    stack: ["typescript", "convex", "flutter", "dart", "react-native"],
    links: [
      { label: "Website", href: "https://bluffs.app" },
      {
        label: "App Store",
        href: "https://apps.apple.com/us/app/bluffs/id6760742352",
      },
    ],
    where: near(places.westwood, -2300, 2600),
  },

  // More projects
  {
    kind: "stop",
    slug: "snakerl",
    name: "SnakeRL",
    tagline:
      "A PPO agent learns Snake while a live grid shows every parallel training game at once.",
    featured: false,
    period: "Aug 2025",
    role: "Solo",
    stats: [
      { value: "36", label: "games training at once" },
      { value: "PPO", label: "algorithm" },
    ],
    highlights: [
      "Vectorized parallel environments with a live grid that renders every game as it trains.",
      "Optional reward shaping: distance to food, a length-scaled food reward, and an efficiency bonus. Logged to TensorBoard.",
      "My first program was a JavaScript Snake game in 2021. This is me coming back to it with RL.",
    ],
    stack: ["python", "pytorch", "stable-baselines3", "gymnasium"],
    links: [gh("SnakeRL")],
    // Next to the 2021 Snake game at home base.
    where: near(places.westwood, 3400, -3700),
  },
  {
    kind: "stop",
    slug: "sentiment-aura",
    name: "sentiment-aura",
    tagline:
      "Talk, and a generative art canvas shifts with your sentiment in real time.",
    featured: false,
    period: "Nov 2025",
    role: "Solo, built in one day",
    stats: [
      { value: "1 day", label: "to build" },
      { value: "25", label: "visual modes" },
    ],
    highlights: [
      "Mic audio streams to Deepgram over WebSocket for live transcripts. A FastAPI backend asks an LLM for sentiment, energy, and keywords.",
      "A p5.js Perlin-noise canvas with 25 modes and 6 palettes reacts to it, with reconnect backoff and a fallback when the LLM is slow.",
    ],
    stack: ["typescript", "react", "p5js", "fastapi", "python"],
    links: [gh("sentiment-aura")],
    where: near(places.northeastern, -250, -120),
  },
  {
    kind: "stop",
    slug: "pathfinding-visualizer",
    name: "Pathfinding Visualizer",
    tagline:
      "How game characters find you in 16.7 milliseconds: A* vs breadth-first search.",
    featured: false,
    period: "2026",
    role: "Solo",
    stats: [
      { value: "16.7 ms", label: "per frame at 60fps" },
      { value: "~2 ms", label: "budget for pathfinding" },
    ],
    highlights: [
      "An interactive explainer that runs A* and breadth-first search side by side on the same grid.",
      "The same A* idea is what walks you around this map.",
    ],
    stack: ["typescript", "nextjs", "react", "tailwind"],
    links: [gh("pathfinding-visualizer")],
    where: near(places.northeastern, -150, 200),
  },
  {
    kind: "stop",
    slug: "marine-radar-scanner",
    name: "Marine Radar Scanner",
    tagline:
      "An Arduino sweeps an ultrasonic sensor 180° and draws a live radar display.",
    featured: false,
    period: "Jul 2025",
    role: "Solo",
    stats: [
      { value: "180°", label: "sweep" },
      { value: "~4 m", label: "range" },
    ],
    highlights: [
      "A servo-mounted HC-SR04 streams angle and distance over serial.",
      "The Processing dashboard draws a sweep afterglow, fading blips, a rolling distance graph, and an adjustable range.",
    ],
    stack: ["arduino", "cpp", "processing"],
    links: [gh("Marine-Radar-Scanner")],
    // On the harbor, naturally.
    where: near(places.awsSeaport, 480, -200),
  },
  {
    kind: "stop",
    slug: "polar-glide",
    name: "Polar Glide",
    tagline:
      "A joystick-controlled marble maze built for a Boston Children's Museum exhibit.",
    featured: false,
    period: "First year at Northeastern",
    role: "Team of 4",
    stats: [
      { value: "40", label: "games in the exhibit" },
      { value: "15-20 s", label: "average run" },
    ],
    highlights: [
      "A servo-tilted, 3D-printed maze with a laser-cut frame and a marble-return ramp, for kids ages 4 to 6.",
      "A servo died an hour into the exhibit, and the smaller replacement actually worked better.",
    ],
    stack: ["arduino", "cpp", "3d-printing", "autocad"],
    links: [
      {
        label: "Team site",
        href: "https://sites.google.com/view/funlabsprojectarcticsea/home",
      },
      gh("Polar-Glide"),
    ],
    where: places.childrensMuseum,
  },
  {
    kind: "stop",
    slug: "nba-analyzer",
    name: "NBA Player Consistency Analyzer",
    tagline:
      "Finds which NBA players hit your thresholds in every one of their last N games.",
    featured: false,
    period: "Mar - May 2025",
    role: "Solo",
    stats: [{ value: "~535", label: "players scanned" }],
    highlights: [
      "Scans every active player and streams progress to the browser live with server-sent events.",
      "Box score modal and PDF export.",
    ],
    stack: ["python", "flask", "pandas", "javascript"],
    links: [
      gh("Sports-Information"),
      { label: "Demo", href: "https://www.youtube.com/watch?v=LeAjQcq6EeM" },
    ],
    where: places.tdGarden,
  },
  {
    kind: "stop",
    slug: "spotify-playlist-updater",
    name: "Spotify Playlist Updater",
    tagline:
      "Fills a playlist with every song from the artists you pick, minus remixes and live versions.",
    featured: false,
    period: "Late 2024 - early 2025",
    role: "Solo",
    stats: [],
    highlights: [
      "Keeps playlists in sync and filters out alternate versions, keeping the original or the most popular one.",
    ],
    stack: ["python", "spotify-api"],
    links: [gh("Spotify-Playlist-Updater")],
    where: near(places.fenway, 90, 180),
  },
  {
    kind: "stop",
    slug: "finance-scripts",
    name: "Finance scripts",
    tagline:
      "Small market tools: drawdown analysis to Excel, an interactive stock chart, and a Monte Carlo price simulation.",
    featured: false,
    period: "2025",
    role: "Solo",
    stats: [],
    highlights: [
      "A Google Finance style chart in matplotlib and a 1,000-path Monte Carlo simulation.",
    ],
    stack: ["python", "pandas", "numpy", "matplotlib"],
    links: [
      gh("Stock-Graphs"),
      {
        label: "Monte Carlo",
        href: "https://github.com/tylerdong878/basic-monte-carlo-simulation",
      },
    ],
    where: near(places.financialDistrict, -420, 380),
  },
  {
    kind: "stop",
    slug: "snake-and-pacman",
    name: "Snake and Pac-Man",
    tagline: "Where it started: browser games built from tutorials in summer 2021.",
    featured: false,
    period: "Summer 2021",
    role: "Solo",
    stats: [],
    highlights: ["My first programs, in plain HTML, CSS, and JavaScript."],
    stack: ["javascript", "html-css"],
    links: [
      gh("Snake"),
      { label: "Pac-Man", href: "https://github.com/tylerdong878/Pac-Man" },
    ],
    where: near(places.westwood, 2900, -3200),
  },
];
