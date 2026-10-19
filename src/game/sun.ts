/*
 * The real sun, from the visitor's clock (notes/research/gfx-art-direction.md 7.2).
 * GO follows the player's actual sunrise and sunset; we don't ask for a
 * location, so we guess latitude 40 N and take the longitude from the time
 * zone's meridian, which lands within about half an hour for most visitors.
 * NOAA's low-precision solar formulas.
 */

const RAD = Math.PI / 180;

export type Phase = "morning" | "day" | "dusk" | "night";

/** Today's sunrise and sunset in local minutes after midnight, the time now in minutes, and the sun's elevation and hour angle (degrees). */
export function sunNow(now: Date, lat = 40) {
  const y = now.getFullYear();
  const day = Math.floor((+now - +new Date(y, 0, 0)) / 864e5);
  const g = ((2 * Math.PI) / 365) * (day - 1 + (now.getHours() - 12) / 24);
  const eqt = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl =
    0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  // minutes east of UTC right now (with daylight time), and the zone's standard meridian
  const offset = -now.getTimezoneOffset();
  const std = Math.min(-new Date(y, 0, 1).getTimezoneOffset(), -new Date(y, 6, 1).getTimezoneOffset());
  const lng = std / 4;
  const phi = lat * RAD;
  const cosH = Math.cos(90.833 * RAD) / (Math.cos(phi) * Math.cos(decl)) - Math.tan(phi) * Math.tan(decl);
  const half = Math.acos(Math.min(1, Math.max(-1, cosH))) / RAD;
  const noon = 720 - 4 * lng - eqt + offset;
  const t = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const hourAngle = (t - noon) / 4;
  const elevation = Math.asin(Math.sin(phi) * Math.sin(decl) + Math.cos(phi) * Math.cos(decl) * Math.cos(hourAngle * RAD)) / RAD;
  return { sunrise: noon - 4 * half, sunset: noon + 4 * half, now: t, elevation, hourAngle };
}

/**
 * Which part of the day it is: morning for an hour and a half after sunrise,
 * dusk from an hour before sunset to 40 minutes after (GO's dusk window),
 * night from then until 45 minutes before sunrise.
 */
export function phaseAt(now: Date): Phase {
  const { sunrise, sunset, now: t } = sunNow(now);
  if (t < sunrise - 45 || t > sunset + 40) return "night";
  if (t < sunrise + 90) return "morning";
  if (t > sunset - 60) return "dusk";
  return "day";
}

/**
 * Which way the sun shines from, as a unit vector in the town (east is +x,
 * south is +z, up is +y): east at sunrise, south at noon, west at sunset. Its
 * height is kept between `low` and `high` degrees so shadows stay inside the
 * shadow box and the disc stays in the sky.
 */
export function sunDirection(now: Date, low = 22, high = 62): [number, number, number] {
  const { elevation, hourAngle } = sunNow(now);
  const el = Math.min(high, Math.max(low, elevation)) * RAD;
  // the hour angle sweeps the sun's bearing round from east (morning) through south to west
  const az = Math.max(-100, Math.min(100, hourAngle)) * RAD;
  // at our latitude the sun always stands a little to the south, even at sunrise and sunset
  const d = [-Math.sin(az) * Math.cos(el), Math.sin(el), (0.7 * Math.cos(az) + 0.3) * Math.cos(el)];
  const l = Math.hypot(d[0], d[1], d[2]);
  return [d[0] / l, d[1] / l, d[2] / l];
}
