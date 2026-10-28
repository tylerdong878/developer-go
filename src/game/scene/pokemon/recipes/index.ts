import bulbasaur from "./001-bulbasaur.js";
import charmander from "./004-charmander.js";
import squirtle from "./007-squirtle.js";
import caterpie from "./010-caterpie.js";
import weedle from "./013-weedle.js";
import pidgey from "./016-pidgey.js";
import rattata from "./019-rattata.js";
import pikachu from "./025-pikachu.js";
import jigglypuff from "./039-jigglypuff.js";
import zubat from "./041-zubat.js";
import oddish from "./043-oddish.js";
import meowth from "./052-meowth.js";
import psyduck from "./054-psyduck.js";
import mankey from "./056-mankey.js";
import growlithe from "./058-growlithe.js";
import poliwag from "./060-poliwag.js";
import abra from "./063-abra.js";
import machop from "./066-machop.js";
import geodude from "./074-geodude.js";
import magnemite from "./081-magnemite.js";
import gastly from "./092-gastly.js";
import onix from "./095-onix.js";
import voltorb from "./100-voltorb.js";
import hitmonlee from "./106-hitmonlee.js";
import chansey from "./113-chansey.js";
import magikarp from "./129-magikarp.js";
import lapras from "./131-lapras.js";
import ditto from "./132-ditto.js";
import eevee from "./133-eevee.js";
import porygon from "./137-porygon.js";
import snorlax from "./143-snorlax.js";
import articuno from "./144-articuno.js";
import dratini from "./147-dratini.js";
import torchic from "./255-torchic.js";
import wingull from "./278-wingull.js";
import duskull from "./355-duskull.js";
import rotom from "./479-rotom.js";
import cresselia from "./488-cresselia.js";
import swanna from "./581-swanna.js";
import litwick from "./607-litwick.js";
import pawniard from "./624-pawniard.js";
import sirfetchd from "./865-sirfetchd.js";
import alcremie from "./869-alcremie.js";
import greavard from "./971-greavard.js";
import swannaBoat from "./boat-swanna.js";
import chanseyNurse from "./chansey-nurse.js";
import npcAceTrainer from "./npc-ace-trainer.js";
import npcBlackBelt from "./npc-black-belt.js";
import npcBugCatcher from "./npc-bug-catcher.js";
import npcFisherman from "./npc-fisherman.js";
import npcMartClerk from "./npc-mart-clerk.js";
import npcNurseJoy from "./npc-nurse-joy.js";
import npcYoungster from "./npc-youngster.js";
import teddy from "./teddy.js";
import trainerTyler from "./trainer-tyler.js";

/**
 * Species built as smooth models (notes/research/gfx-characters.md 3): each
 * recipe is the species as blended shapes, bones, paint and a painted face,
 * checked against the official art, HOME and GO's own model from every side
 * (previews in .cache/research/models/previews). Meshed once, in a worker.
 */
export const RECIPES: Record<number | string, object> = {
  1: bulbasaur,
  4: charmander,
  7: squirtle,
  10: caterpie,
  13: weedle,
  16: pidgey,
  19: rattata,
  25: pikachu,
  39: jigglypuff,
  41: zubat,
  43: oddish,
  52: meowth,
  54: psyduck,
  56: mankey,
  58: growlithe,
  60: poliwag,
  63: abra,
  66: machop,
  74: geodude,
  81: magnemite,
  92: gastly,
  95: onix,
  100: voltorb,
  106: hitmonlee,
  113: chansey,
  129: magikarp,
  131: lapras,
  132: ditto,
  133: eevee,
  137: porygon,
  143: snorlax,
  144: articuno,
  147: dratini,
  255: torchic,
  278: wingull,
  355: duskull,
  479: rotom,
  488: cresselia,
  581: swanna,
  607: litwick,
  624: pawniard,
  865: sirfetchd,
  869: alcremie,
  971: greavard,
  "boat-swanna": swannaBoat,
  "chansey-nurse": chanseyNurse,
  "npc-ace-trainer": npcAceTrainer,
  "npc-black-belt": npcBlackBelt,
  "npc-bug-catcher": npcBugCatcher,
  "npc-fisherman": npcFisherman,
  "npc-mart-clerk": npcMartClerk,
  "npc-nurse-joy": npcNurseJoy,
  "npc-youngster": npcYoungster,
  "teddy": teddy,
  "trainer-tyler": trainerTyler,
};
