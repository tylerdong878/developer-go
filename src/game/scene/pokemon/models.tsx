"use client";

import type { ComponentType } from "react";
import { Bulbasaur } from "./species/Bulbasaur";
import { Charmander } from "./species/Charmander";
import { Jigglypuff } from "./species/Jigglypuff";
import { Pikachu } from "./species/Pikachu";
import { Snorlax } from "./species/Snorlax";
import { Squirtle } from "./species/Squirtle";
import { Voltorb } from "./species/Voltorb";
import type { ModelProps } from "./types";

export type { ModelProps } from "./types";

/**
 * Pokémon modeled in code, part by part, from the official artwork, HOME
 * renders and GO's own poses (measurements in notes/research/species-*.md),
 * one file each in ./species. Each one stands 1 unit tall with its feet at
 * y = 0 and faces +z; the map scales it to GO's size and turns it to face
 * you. Species without a model yet still use their sprite.
 */
export const POKEMON_3D: Record<number, ComponentType<ModelProps>> = {
  1: Bulbasaur,
  4: Charmander,
  7: Squirtle,
  25: Pikachu,
  39: Jigglypuff,
  100: Voltorb,
  143: Snorlax,
};
