/**
 * What every Pokémon model takes. Each one stands 1 unit tall with its feet
 * at y = 0 and faces +z; the map scales it to the right size and turns it to
 * face you.
 */
export type ModelProps = { asleep?: boolean; seed?: number };
