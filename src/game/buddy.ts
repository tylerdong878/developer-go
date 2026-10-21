/** Petting Teddy: the scene floats hearts, and the HUD opens his buddy screen. */
let petted = 0;
let lastPet = -Infinity;
const listeners = new Set<() => void>();

export const buddyStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: () => petted,
  server: () => 0,
};

/** When he was last petted (performance.now), so the hearts know when to float. */
export const lastPetAt = () => lastPet;

/** Hearts float off him without opening his screen (he earned one, say). */
export function cheer() {
  lastPet = performance.now();
}

export function pet() {
  petted += 1;
  lastPet = performance.now();
  listeners.forEach((l) => l());
}
