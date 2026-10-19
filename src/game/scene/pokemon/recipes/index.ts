import bulbasaur from "./001-bulbasaur.js";
import pidgey from "./016-pidgey.js";
import pikachu from "./025-pikachu.js";
import oddish from "./043-oddish.js";
import machop from "./066-machop.js";
import magnemite from "./081-magnemite.js";
import ditto from "./132-ditto.js";
import snorlax from "./143-snorlax.js";

/**
 * Species built as smooth models (notes/research/gfx-characters.md 3): each
 * recipe is the species as blended shapes, bones, paint and a painted face,
 * checked against the official art, HOME and GO's own model from every side
 * (previews in .cache/research/models/previews). Meshed once, in a worker.
 */
export const RECIPES: Record<number, object> = {
  1: bulbasaur,
  16: pidgey,
  25: pikachu,
  43: oddish,
  66: machop,
  81: magnemite,
  132: ditto,
  143: snorlax,
};
