"use client";

import type { ComponentType } from "react";
import { Bulbasaur } from "./species/Bulbasaur";
import { Caterpie } from "./species/Caterpie";
import { Charmander } from "./species/Charmander";
import { Jigglypuff } from "./species/Jigglypuff";
import { Magikarp } from "./species/Magikarp";
import { Oddish } from "./species/Oddish";
import { Pidgey } from "./species/Pidgey";
import { Pikachu } from "./species/Pikachu";
import { Poliwag } from "./species/Poliwag";
import { Psyduck } from "./species/Psyduck";
import { Rattata } from "./species/Rattata";
import { Snorlax } from "./species/Snorlax";
import { Squirtle } from "./species/Squirtle";
import { Voltorb } from "./species/Voltorb";
import { Weedle } from "./species/Weedle";
import { Zubat } from "./species/Zubat";
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
  10: Caterpie,
  13: Weedle,
  16: Pidgey,
  19: Rattata,
  25: Pikachu,
  39: Jigglypuff,
  41: Zubat,
  43: Oddish,
  54: Psyduck,
  60: Poliwag,
  100: Voltorb,
  129: Magikarp,
  143: Snorlax,
};
