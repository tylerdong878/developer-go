/**
 * Sound, made in the browser with Web Audio instead of files. Browsers only
 * allow audio after a tap, so the start screen unlocks it.
 */
let context: AudioContext | null = null;

export function unlockSound() {
  try {
    context ??= new AudioContext();
    void context.resume();
  } catch {
    // No audio here; the game is silent.
  }
}
