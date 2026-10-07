/**
 * Phones and small touch screens get a lighter render: fewer pixels, a
 * smaller shadow map, no shadows from street furniture, and fewer walkers. They look nearly the same on a small screen and keep
 * the frame rate up and the battery cooler.
 */
export function isLightDevice() {
  if (typeof window === "undefined") return false;
  const touch = window.matchMedia("(pointer: coarse)").matches;
  const small = Math.min(window.innerWidth, window.innerHeight) < 700;
  return touch && small;
}

export const renderBudget = () =>
  isLightDevice()
    ? { dpr: [1, 1.5] as [number, number], shadowMap: 1024, light: true }
    : { dpr: [1, 2] as [number, number], shadowMap: 2048, light: false };
