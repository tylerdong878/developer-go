import bulbasaur from "./001-bulbasaur.js";
import charmander from "./004-charmander.js";
import caterpie from "./010-caterpie.js";
import weedle from "./013-weedle.js";
import pidgey from "./016-pidgey.js";
import rattata from "./019-rattata.js";
import pikachu from "./025-pikachu.js";
import oddish from "./043-oddish.js";
import meowth from "./052-meowth.js";
import growlithe from "./058-growlithe.js";
import machop from "./066-machop.js";
import geodude from "./074-geodude.js";
import magnemite from "./081-magnemite.js";
import chansey from "./113-chansey.js";
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
  4: charmander,
  10: caterpie,
  13: weedle,
  16: pidgey,
  19: rattata,
  25: pikachu,
  43: oddish,
  52: meowth,
  58: growlithe,
  66: machop,
  74: geodude,
  81: magnemite,
  113: chansey,
  132: ditto,
  143: snorlax,
};
