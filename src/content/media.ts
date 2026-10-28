/**
 * A picture of each project and hackathon, from my own repos, demos and old
 * site (made by .cache/media/tools, never official Pokémon art). `src` may be
 * animated; `still` is a frame of it for reduced motion; `disc` is a square
 * crop for the PokéStop's Photo Disc, like the photo in GO's.
 */
export type Media = { src: string; still?: string; disc: string; width: number; height: number; alt: string };

export const media: Record<string, Media> = {
  "etf-pipeline": {"src":"/media/etf-pipeline.webp","disc":"/media/etf-pipeline-disc.webp","width":960,"height":600,"alt":"Top of a weekly ETF brief: a blue Weekly Market Brief header for week 38 and the first ETF industry headlines."},
  "ofi-regime-study": {"src":"/media/ofi-regime-study.webp","disc":"/media/ofi-regime-study-disc.webp","width":624,"height":390,"alt":"Line chart of OFI's R² by forecast horizon, 1 to 30 seconds. The low-volatility line sits well above the high-volatility line at every horizon."},
  "matching-engine": {"src":"/media/matching-engine.webp","disc":"/media/matching-engine-disc.webp","width":960,"height":600,"alt":"Terminal: a session of three sell orders at 100, 101 and 102 and one buy for 12 at 102, then the engine's output, four ACKs and three trades at 100, 101 and 102."},
  "imc-prosperity-4": {"src":"/media/imc-prosperity-4.webp","disc":"/media/imc-prosperity-4-disc.webp","width":960,"height":600,"alt":"Bar chart of profit by round in IMC Prosperity 4: +184,222, +265,162, +68,858, −46,900 and +92,228 XIRECs for rounds 1 to 5. Qualifying made +449,383 and the three ranked rounds +114,186."},
  "developer-go": {"src":"/media/developer-go.webp","disc":"/media/developer-go-disc.webp","width":960,"height":600,"alt":"This site: a 3D town from above, a fountain roundabout with the Pokémon Center and Poké Mart behind it, gyms on blue courts, houses and autumn trees, under a Pokémon GO style HUD."},
  "snake-and-pacman": {"src":"/media/snake-and-pacman.webp","disc":"/media/snake-and-pacman-disc.webp","width":960,"height":600,"alt":"Side by side: Snake, a short blue snake and a red piece of food on a white board, and Pac-Man in a blue maze full of dots with the ghosts in the middle."},
  "snakerl": {"src":"/media/snakerl.webp","still":"/media/snakerl-still.webp","disc":"/media/snakerl-disc.webp","width":800,"height":450,"alt":"A grid of Snake games training at once: short green snakes and red food on black boards."},
  "marine-radar-scanner": {"src":"/media/marine-radar-scanner.webp","still":"/media/marine-radar-scanner-still.webp","disc":"/media/marine-radar-scanner-disc.webp","width":960,"height":600,"alt":"Radar display: a cyan sweep turns over a polar grid while orange blips trace nearby objects."},
  "polar-glide": {"src":"/media/polar-glide.webp","disc":"/media/polar-glide-disc.webp","width":960,"height":538,"alt":"Top-down photo of the marble maze: a light blue 3D-printed maze in a painted wood frame with a servo on each axis, next to a joystick box painted with arrows."},
  "nba-analyzer": {"src":"/media/nba-analyzer.webp","disc":"/media/nba-analyzer-disc.webp","width":960,"height":540,"alt":"The Player Consistency Analyzer: inputs for games, points, rebounds and assists, and a live progress log scanning 535 players."},
  "bostonhacks-2024": {"src":"/media/bostonhacks-2024.webp","still":"/media/bostonhacks-2024-still.webp","disc":"/media/bostonhacks-2024-disc.webp","width":505,"height":284,"alt":"Unity simulation of Earth from space with small objects orbiting it."},
  "hack-at-brown-2025": {"src":"/media/hack-at-brown-2025.webp","still":"/media/hack-at-brown-2025-still.webp","disc":"/media/hack-at-brown-2025-disc.webp","width":640,"height":360,"alt":"Gameplay: a ship fires glowing shots at enemy ships among asteroids, with a red planet on the left."},
  "hackbeanpot-2025": {"src":"/media/hackbeanpot-2025.webp","disc":"/media/hackbeanpot-2025-disc.webp","width":960,"height":600,"alt":"RoadToad home page: a frog mascot, Plan Your Perfect Road Trip Adventure, and a start, destination and date search form."},
  "civic-tech-2025": {"src":"/media/civic-tech-2025.webp","disc":"/media/civic-tech-2025-disc.webp","width":960,"height":538,"alt":"AnimaGo start screen: Ready to discover wildlife?, a framed giraffe photo, drawn animal heads and a Capture button."},
  "hackillinois-2025": {"src":"/media/hackillinois-2025.webp","disc":"/media/hackillinois-2025-disc.webp","width":960,"height":540,"alt":"SpendShield dashboard with sample data: weekly spending totals, a savings leaderboard among friends and a category breakdown."},
  "sthacks-2025": {"src":"/media/sthacks-2025.webp","still":"/media/sthacks-2025-still.webp","disc":"/media/sthacks-2025-disc.webp","width":695,"height":391,"alt":"A generated Manim animation: a green 3D surface turning over labeled axes."},
  "hackharvard-2025": {"src":"/media/hackharvard-2025.webp","disc":"/media/hackharvard-2025-disc.webp","width":960,"height":600,"alt":"FIREBALL rules screen in a pixel font: seven gesture moves with their damage, and the game rules."},
};
