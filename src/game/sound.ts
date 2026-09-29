/**
 * Sound, made in the browser with Web Audio instead of files: little synth
 * blips for taps, a whoosh for throws, clicks for the wiggle, a fanfare for
 * a catch, a chime for a spin. Browsers only allow audio after a tap, so the
 * start screen unlocks it. Muting is remembered.
 */
let context: AudioContext | null = null;
const KEY = "developer-go:muted";

const listeners = new Set<() => void>();
let muted = false;
try {
  muted = typeof localStorage !== "undefined" && localStorage.getItem(KEY) === "1";
} catch {
  // storage blocked: sound stays on
}

export const muteStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: () => muted,
  server: () => false,
};

export function setMuted(next: boolean) {
  muted = next;
  try {
    localStorage.setItem(KEY, next ? "1" : "0");
  } catch {
    // still muted for this visit
  }
  listeners.forEach((l) => l());
}

export function unlockSound() {
  try {
    context ??= new AudioContext();
    void context.resume();
  } catch {
    // No audio here; the game is silent.
  }
}

/** One synth note: a waveform sliding from one pitch to another with a quick fade. */
function tone(type: OscillatorType, from: number, to: number, length: number, volume = 0.12, delay = 0) {
  if (!context || muted) return;
  const t = context.currentTime + delay;
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(to, t + length);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
  osc.connect(gain).connect(context.destination);
  osc.start(t);
  osc.stop(t + length + 0.02);
}

/** Filtered noise, for whooshes. */
function whoosh(length: number, from: number, to: number, volume = 0.1) {
  if (!context || muted) return;
  const t = context.currentTime;
  const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * length), context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const source = context.createBufferSource();
  source.buffer = buffer;
  const filter = context.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = 1.2;
  filter.frequency.setValueAtTime(from, t);
  filter.frequency.exponentialRampToValueAtTime(to, t + length);
  const gain = context.createGain();
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
  source.connect(filter).connect(gain).connect(context.destination);
  source.start(t);
}

export const sfx = {
  tap: () => tone("triangle", 660, 880, 0.08, 0.07),
  open: () => {
    tone("sine", 520, 780, 0.12, 0.08);
    tone("sine", 780, 1040, 0.12, 0.06, 0.06);
  },
  throw: () => whoosh(0.45, 400, 2400, 0.14),
  wiggle: () => tone("square", 180, 120, 0.06, 0.05),
  catch: () => [523, 659, 784, 1047].forEach((f, i) => tone("triangle", f, f, 0.18, 0.1, i * 0.09)),
  breakFree: () => tone("sawtooth", 300, 90, 0.25, 0.07),
  spin: () => {
    whoosh(0.6, 800, 3000, 0.08);
    [880, 1175, 1568].forEach((f, i) => tone("sine", f, f, 0.25, 0.07, 0.25 + i * 0.07));
  },
  xp: () => tone("sine", 1318, 1760, 0.15, 0.05),
};
