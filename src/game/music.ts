import { audioContext, muteStore } from "./sound";

/*
 * Map music in GO's spirit (notes/research/go-features.md 10): a bright,
 * bouncy loop by day, a softer, slower one at night, and during Halloween a
 * little music-box waltz after dark. All of it is our own, written here note
 * by note and played on Web Audio synths, never GO's tracks. It's quiet, it
 * follows the mute button, and Settings has its own switch.
 */

type Theme = {
  bpm: number;
  /** Steps in a bar (eighth notes, or three quarter-note beats for the waltz). */
  steps: number;
  /** One chord per bar, as MIDI notes. */
  chords: number[][];
  /** The melody, [MIDI note or 0 for a rest, length in steps], looping over all the bars. */
  melody: [number, number][];
  feel: "day" | "night" | "waltz";
};

const D = [62, 66, 69];
const Bm = [59, 62, 66];
const G = [59, 62, 67];
const A = [61, 64, 69];
const Fsm = [61, 66, 69];

export const THEMES: Record<"day" | "night" | "halloween", Theme> = {
  day: {
    bpm: 112,
    steps: 8,
    chords: [D, Bm, G, A, D, Fsm, G, A],
    melody: [
      [78, 2], [81, 1], [83, 1], [81, 2], [78, 2],
      [76, 2], [78, 1], [79, 1], [78, 2], [74, 2],
      [74, 1], [76, 1], [78, 2], [79, 2], [81, 2],
      [83, 3], [81, 1], [79, 2], [76, 2],
      [78, 2], [81, 1], [86, 1], [85, 2], [81, 2],
      [81, 2], [78, 1], [81, 1], [85, 2], [78, 2],
      [79, 2], [81, 1], [83, 1], [86, 2], [83, 2],
      [81, 4], [0, 2], [76, 1], [78, 1],
    ],
    feel: "day",
  },
  night: {
    bpm: 80,
    steps: 8,
    chords: [
      [55, 59, 62, 66],
      [54, 57, 61, 64],
      [52, 55, 59, 62],
      [57, 62, 64, 67],
      [55, 59, 62, 66],
      [54, 57, 61, 64],
      [52, 55, 59, 62],
      [57, 61, 64, 67],
    ],
    melody: [
      [74, 2], [78, 2], [79, 4],
      [76, 2], [73, 2], [69, 4],
      [71, 2], [74, 2], [76, 4],
      [74, 6], [0, 2],
      [79, 2], [81, 2], [83, 4],
      [81, 2], [78, 2], [76, 4],
      [74, 2], [76, 2], [71, 4],
      [69, 6], [0, 2],
    ],
    feel: "night",
  },
  halloween: {
    bpm: 138,
    steps: 3,
    chords: [
      [57, 60, 64],
      [56, 59, 64],
      [57, 60, 64],
      [57, 62, 65],
      [57, 60, 64],
      [57, 60, 65],
      [56, 59, 64],
      [57, 60, 64],
    ],
    melody: [
      [76, 1], [72, 1], [69, 1],
      [68, 1], [71, 1], [76, 1],
      [69, 1], [72, 1], [76, 1],
      [77, 2], [76, 1],
      [76, 1], [74, 1], [72, 1],
      [69, 1], [72, 1], [77, 1],
      [76, 2], [74, 1],
      [69, 3],
    ],
    feel: "waltz",
  },
};

const hz = (m: number) => 440 * 2 ** ((m - 69) / 12);

/** The melody laid out by step, so the scheduler can look a step up. */
function score(t: Theme) {
  const at = new Map<number, [number, number]>();
  let s = 0;
  for (const [note, len] of t.melody) {
    if (note) at.set(s, [note, len]);
    s += len;
  }
  return at;
}

let out: GainNode | null = null;
let theme: Theme | null = null;
let notes = new Map<number, [number, number]>();
let step = 0;
let next = 0;
let timer: number | null = null;
let wanted = true;
const LEVEL = 0.055;

const KEY = "developer-go:music";
try {
  wanted = typeof localStorage === "undefined" || localStorage.getItem(KEY) !== "0";
} catch {
  // storage blocked: music on
}
const listeners = new Set<() => void>();
export const musicStore = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  get: () => wanted,
  server: () => true,
};
export function setMusic(on: boolean) {
  wanted = on;
  try {
    localStorage.setItem(KEY, on ? "1" : "0");
  } catch {
    // still set for this visit
  }
  level();
  listeners.forEach((l) => l());
}

/** Fade the music to where it should be: off when muted or switched off. */
function level(seconds = 0.8) {
  const ctx = audioContext();
  if (!ctx || !out) return;
  const v = wanted && !muteStore.get() ? LEVEL : 0;
  out.gain.cancelScheduledValues(ctx.currentTime);
  out.gain.setTargetAtTime(v, ctx.currentTime, seconds / 3);
}

/** One synth note into the music bus, with its own soft attack and fade. */
function note(ctx: AudioContext, type: OscillatorType, f: number, t: number, len: number, vol: number, attack = 0.01) {
  if (!out) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + len + 0.05);
}

/** A soft tick of noise, for the day loop's hi-hat. */
function tick(ctx: AudioContext, t: number, vol: number) {
  if (!out) return;
  const b = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.04), ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = ctx.createBufferSource();
  src.buffer = b;
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 7000;
  const g = ctx.createGain();
  g.gain.value = vol;
  src.connect(hp).connect(g).connect(out);
  src.start(t);
}

function play(ctx: AudioContext, t: Theme, s: number, at: number) {
  const dur = 60 / t.bpm / (t.feel === "waltz" ? 1 : 2);
  const bars = t.chords.length;
  const bar = Math.floor(s / t.steps) % bars;
  const k = s % t.steps;
  const chord = t.chords[bar];
  const loop = s % (bars * t.steps);
  if (t.feel === "waltz") {
    // oom-pah-pah: the root low on one, short chords on two and three, a music box on top
    if (k === 0) note(ctx, "triangle", hz(chord[0] - 12), at, dur * 1.6, 0.5);
    else for (const n of chord) note(ctx, "triangle", hz(n), at, dur * 0.5, 0.13);
  } else {
    // a pad held through the bar
    if (k === 0) for (const n of chord) note(ctx, t.feel === "day" ? "triangle" : "sine", hz(n), at, dur * t.steps * 0.98, t.feel === "day" ? 0.09 : 0.11, t.feel === "day" ? 0.06 : 0.4);
    // the bass: one and three by day, just one at night
    if (k === 0 || (t.feel === "day" && k === 4)) note(ctx, "sine", hz(chord[0] - 12), at, dur * (t.feel === "day" ? 3 : 7), 0.42);
    // the arpeggio: every eighth by day, every quarter at night
    if (t.feel === "day" || k % 2 === 0) note(ctx, t.feel === "day" ? "square" : "triangle", hz(chord[k % chord.length] + 12), at, dur * 0.9, t.feel === "day" ? 0.025 : 0.05);
    if (t.feel === "day") {
      tick(ctx, at, k % 2 ? 0.05 : 0.09);
      if (k === 0 || k === 4) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.frequency.setValueAtTime(110, at);
        o.frequency.exponentialRampToValueAtTime(45, at + 0.16);
        g.gain.setValueAtTime(0.35, at);
        g.gain.exponentialRampToValueAtTime(0.0001, at + 0.2);
        if (out) o.connect(g).connect(out);
        o.start(at);
        o.stop(at + 0.22);
      }
    }
  }
  const m = notes.get(loop);
  if (m) {
    const [n, len] = m;
    const bell = t.feel === "waltz" ? 0.5 : len * dur * 0.95;
    note(ctx, "sine", hz(n), at, bell, t.feel === "waltz" ? 0.2 : 0.17, 0.008);
    // a quiet octave above, for the bell's shine
    note(ctx, "sine", hz(n + 12), at, bell * 0.6, 0.035, 0.008);
  }
}

function schedule() {
  const ctx = audioContext();
  if (!ctx || !theme) return;
  const t = theme;
  const dur = 60 / t.bpm / (t.feel === "waltz" ? 1 : 2);
  while (next < ctx.currentTime + 0.25) {
    play(ctx, t, step, next);
    next += dur;
    step += 1;
  }
}

/** Start (or switch) the loop, fading between themes. */
export function playTheme(name: keyof typeof THEMES) {
  const ctx = audioContext();
  if (!ctx) return;
  if (theme === THEMES[name]) return;
  if (!out) {
    out = ctx.createGain();
    out.gain.value = 0;
    out.connect(ctx.destination);
  }
  const swap = () => {
    theme = THEMES[name];
    notes = score(theme);
    step = 0;
    next = ctx.currentTime + 0.1;
    level(2);
  };
  if (theme) {
    // fade the old one out first
    out.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
    window.setTimeout(swap, 1200);
  } else swap();
  timer ??= window.setInterval(schedule, 100);
}

export function stopMusic() {
  if (timer !== null) window.clearInterval(timer);
  timer = null;
  theme = null;
  const ctx = audioContext();
  if (ctx && out) out.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
}

muteStore.subscribe(() => level());
