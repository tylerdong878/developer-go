// Each species' shiny colors, mapped onto our recipes' own hexes (notes/research/shiny.md, from the
// HOME and GO renders): `map` swaps every matching color in the recipe, and `parts` sets named
// pieces or paint that share a color with something that doesn't change. Only species with a shiny in
// GO are here (Alcremie isn't in GO). Made from .cache/research/shiny/shiny.json.

const HEX = /^#[0-9a-fA-F]{6}$/;

/** @type {Record<number, { map: Record<string, string>, parts?: { pieces?: Record<string, string>, paint?: Record<string, string> } }>} */
export const SHINY = {
  1: {"map":{"#74c8a8":"#98d888","#4c9b7e":"#6fbd62","#5ba35a":"#7cba92","#3a6e3c":"#557c65"}},
  4: {"map":{"#f4883a":"#efbd4c","#f9de8e":"#efe6a0","#8a3a3a":"#8b5c62","#f08a80":"#e4979e"}},
  7: {"map":{"#74c6e8":"#b7dbe8","#3f93b8":"#7fa9bb","#a0663a":"#6e9878","#7e4c28":"#557054","#f3e0a8":"#f7eeaa","#7a5a30":"#7a6a36"}},
  10: {"map":{"#7cc95e":"#f6df5e","#5a9a44":"#c9ad46","#ecea98":"#fbefb0","#ffe060":"#fff6b0","#3d5a2c":"#7a682e","#e65f43":"#d84e30"}},
  13: {"map":{"#c49560":"#e2cb5e","#e86a9e":"#f5c4d6","#e0609a":"#ecbed1"}},
  16: {"map":{"#b07a3c":"#bfb96b","#9a6232":"#a79b5c","#f4ecb4":"#dedb96","#f3e6a8":"#e3da92","#d8a8b6":"#dcab3e","#c98f9e":"#c99a34","#2a2228":"#4a4644"}},
  19: {"map":{"#a878c0":"#c4cf96","#b058b8":"#aab77d","#efdcb4":"#f0dcd2","#dcb898":"#ccb6a2","#8a2f3c":"#6b5583","#e57c88":"#a69ce8","#d0203a":"#5b63dc"}},
  25: {"map":{"#f7d02c":"#f2a72a","#8c5a2b":"#c8701e"},"parts":{"paint":{"earTip":"#55524c"}}},
  39: {"map":{"#f4c4cf":"#eec4dc","#00788a":"#1d9a2a"}},
  41: {"map":{"#3f8fc0":"#5a9636","#8f5c9e":"#b4a487","#86549a":"#aa9a76"}},
  43: {"map":{"#5f9fc8":"#71be4a","#4f86ad":"#63aa43","#45a83a":"#b0e03c","#a8e878":"#dcf07a","#2f7a2a":"#80a02f"}},
  52: {"map":{"#f5e9c4":"#e9dab6","#f8f0d4":"#f0e0b4","#c08a48":"#de7d8e","#9c6a36":"#b8586a","#b07a45":"#c06a78"}},
  54: {"map":{"#f7cd4c":"#90d2d8","#fbf3d9":"#e4f6f2","#efe5bf":"#c8e8e6"}},
  56: {"map":{"#f1dfcc":"#c4deab"}},
  58: {"map":{"#f2994e":"#eac052","#fbe2b2":"#dde0a6","#9c8470":"#9d9064","#a8764c":"#a99a5c"}},
  60: {"map":{"#6198cf":"#7aaff0","#5b90c6":"#72a8f0","#4f83c1":"#6699e6"}},
  63: {"map":{"#f9dc3c":"#f6eb9a","#f2e4b4":"#f6efcb","#e4d49c":"#e2d6b4"}},
  66: {"map":{"#9fcadb":"#b9bb80","#46606c":"#5a5c3c"}},
  74: {"map":{"#a4a39a":"#e1b648","#5e5a58":"#7a5e22"}},
  81: {"map":{"#a9cbd6":"#dbd6a6","#dd5a50":"#3c3b3d","#3fb0e6":"#363638"}},
  92: {"map":{"#3b3442":"#6a2a6e","#f4f1f6":"#d8d4ec","#4a2630":"#6d3254","#8e3a44":"#ab6d77","#6b3444":"#8c4e65","#806a92":"#687599","#6c5880":"#556390"}},
  95: {"map":{"#a3a3ae":"#9da14c","#8e8c9b":"#898a43","#b0b0ba":"#a9ae52","#a0a0ab":"#9a9e4b","#9d9ca9":"#979a49","#9a99a6":"#949748","#9796a3":"#929447","#9493a0":"#8f9146","#918f9e":"#8c8d44"}},
  100: {"map":{"#e0284e":"#4d8be6"}},
  106: {"map":{"#b8998b":"#a6bf88","#6f5f43":"#5a7e4c","#d8cd96":"#e4dbab","#dfbd3c":"#dcdc6a"}},
  113: {"map":{"#f5b9cf":"#e6dcbc","#f08ea4":"#99cf9b","#6e3e56":"#536054"}},
  129: {"map":{"#f2603a":"#e8bd68","#f6d36a":"#efb25e","#ee8a9a":"#e6dfa0","#5a1e26":"#6e4e2a","#7a2418":"#8a6a34","#9a3420":"#9a7b4e"}},
  131: {"map":{"#5ab3e0":"#a789e7","#ecdfbd":"#f2d6c4","#3d86b8":"#8a68be","#2f6fae":"#6a55a6"}},
  132: {"map":{"#cdb0f0":"#94d4f6"}},
  133: {"map":{"#cf9150":"#d8d2be","#f3e2b3":"#d3d9e8","#73441c":"#5e5a50","#6b3418":"#554c43","#3a2414":"#363430"}},
  137: {"map":{"#5ecfd8":"#b28aba","#f25d72":"#5f6cd4","#1c1620":"#4c4a4e"}},
  143: {"map":{"#1f7896":"#2a519d","#f1eadb":"#eee7cc","#7d6b5b":"#ab9375"}},
  144: {"map":{"#6cc4f0":"#bbd8f5","#1590cc":"#94cbe6","#5cb2e2":"#a6c4e6","#86d0f2":"#cde6f5"}},
  147: {"map":{"#a4c2f4":"#e4b2e6","#241a30":"#2c0c2a","#5e2f68":"#7a2a6a"}},
  255: {"map":{"#f5911f":"#f5e070","#f8d84a":"#f5a03a","#f6e48a":"#ecbfae","#f3e48c":"#d4b8a6"}},
  278: {"map":{"#8fd3f2":"#bef4a8"}},
  355: {"map":{"#5e5d5b":"#a85a58","#4b4a49":"#8e4a49"}},
  479: {"map":{"#ee7a3e":"#ee4468","#1f6fd8":"#56c4e6","#9fdde6":"#f2c9a8","#eef6f7":"#fbf3ee"}},
  488: {"map":{"#8fbdee":"#9767a6","#cb7aac":"#6cbcd3","#9c4a7e":"#3f8fa6","#e690be":"#8dd4e6","#5b2242":"#1f4f5e","#c0508e":"#3fa6c4","#e286bf":"#a2dcb0","#fff3fa":"#fdfbd6","#f9cde8":"#d4f8d4","#ee99cb":"#9fe6b4"}},
  607: {"map":{"#6f6bd2":"#5f8fd8","#7fa6ea":"#7fd0ee","#cbd7fb":"#d4f2fb","#c4c2ee":"#b9def0","#f3c632":"#86c83c","#a77a12":"#4f8a1e"}},
  581: {"map":{"#8ec4ea":"#927bd5","#505660":"#485278","#4a5056":"#434d6f","#fbdc4f":"#f9ec48"}},
  971: {"map":{"#9aabc6":"#d7b44a","#8495b2":"#bd9a36","#d6deeb":"#f3efe2","#7f8aa0":"#8a7444"}},
  865: {"map":{"#f3f2ef":"#f5d762","#f6cd3f":"#cfae22","#e3b733":"#b89b1b","#f2c23a":"#c4a41f"},"parts":{"pieces":{"cuff":"#f3f2ef","swordFeather0":"#f3f2ef","swordFeather1":"#f3f2ef","swordFeather2":"#f3f2ef","swordFeather3":"#f3f2ef","swordFeather4":"#f3f2ef"}}},
};

/** A deep copy with every mapped hex swapped. */
function swap(obj, map) {
  if (typeof obj === "string") return HEX.test(obj) && map[obj.toLowerCase()] ? map[obj.toLowerCase()] : obj;
  if (Array.isArray(obj)) return obj.map((v) => swap(v, map));
  if (obj && typeof obj === "object") return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, swap(v, map)]));
  return obj;
}

/** Named pieces or paint that need their own color, after the swap (mirrored copies share the name). */
function applyParts(r, parts) {
  if (!parts) return r;
  const set = (list, names) => (Array.isArray(list) ? list.map((x) => (Array.isArray(x) ? set(x, names) : x && names[x.name] ? { ...x, color: names[x.name] } : x)) : list);
  return { ...r, pieces: set(r.pieces, parts.pieces ?? {}), paint: set(r.paint, parts.paint ?? {}) };
}

/** The shiny version of a species' recipe, or null if it has none in GO. */
export function shinyRecipe(dex, recipe) {
  const e = SHINY[dex];
  return e ? applyParts(swap(recipe, e.map), e.parts) : null;
}
