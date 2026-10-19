import { useSyncExternalStore } from "react";
import { random } from "./geometry";

/*
 * The weather, like GO's: the map follows the real weather where you are. The
 * base is Tyler's Boston, so it's Boston's weather (Open-Meteo, no key, no
 * visitor location), refreshed hourly. If that can't be reached, a "weather
 * of the hour" stands in, the same for every visitor that hour.
 * Looks per weather: notes/research/gfx-art-direction.md 2.3, 8.
 */

export type Weather = "clear" | "partly" | "cloudy" | "rain" | "snow" | "fog" | "windy";

export const WEATHER_LABEL: Record<Weather, string> = {
  clear: "Clear",
  partly: "Partly cloudy",
  cloudy: "Cloudy",
  rain: "Rain",
  snow: "Snow",
  fog: "Fog",
  windy: "Windy",
};

/** Open-Meteo's WMO weather code (and the wind, km/h) as one of GO's seven weathers. */
export function fromWmo(code: number, wind = 0): Weather {
  if (code === 45 || code === 48) return "fog";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) return "rain";
  if (wind >= 28) return "windy";
  if (code === 3) return "cloudy";
  if (code === 2) return "partly";
  return "clear";
}

/** A weather for the hour, the same for everyone: mostly fair, snow only in winter. */
export function seededWeather(at: Date): Weather {
  const hour = Math.floor(at.getTime() / 3_600_000);
  const r = random(hour)();
  const winter = [11, 0, 1, 2].includes(at.getMonth());
  const table: [Weather, number][] = [
    ["clear", 0.45],
    ["partly", 0.2],
    ["cloudy", 0.15],
    ["rain", 0.08],
    ["windy", 0.05],
    ["fog", 0.04],
    [winter ? "snow" : "clear", 0.03],
  ];
  let acc = 0;
  for (const [w, p] of table) if (r < (acc += p)) return w;
  return "clear";
}

let weather: Weather = "clear";
let loaded = false;
const listeners = new Set<() => void>();

function set(next: Weather) {
  if (next === weather) return;
  weather = next;
  listeners.forEach((l) => l());
}

/** `?weather=rain` in the URL shows any weather, to preview it. */
function fromUrl(): Weather | null {
  const w = new URLSearchParams(window.location.search).get("weather");
  return w && w in WEATHER_LABEL ? (w as Weather) : null;
}

async function refresh() {
  const pick = fromUrl();
  if (pick) return set(pick);
  try {
    const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=42.36&longitude=-71.06&current=weather_code,wind_speed_10m");
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as { current?: { weather_code?: number; wind_speed_10m?: number } };
    if (typeof data.current?.weather_code !== "number") throw new Error("no code");
    set(fromWmo(data.current.weather_code, data.current.wind_speed_10m ?? 0));
  } catch {
    set(seededWeather(new Date()));
  }
}

export const weatherStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    if (!loaded) {
      loaded = true;
      void refresh();
      window.setInterval(refresh, 3_600_000);
    }
    return () => listeners.delete(listener);
  },
  get: () => weather,
  server: (): Weather => "clear",
};

export function useWeather(): Weather {
  return useSyncExternalStore(weatherStore.subscribe, weatherStore.get, weatherStore.server);
}
