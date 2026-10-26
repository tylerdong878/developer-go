"use client";

import { type CSSProperties, useState, useSyncExternalStore } from "react";
import { type Raid, raids, spawns } from "@/content";
import { RAID_EGG } from "../colors";
import { type Catch, HISTORY_MAX, levelFor, powerUp, progressStore, statsOf } from "../progress";
import { hpOf, powerCap, powerCost } from "../power";
import { type PokeType, SPECIES } from "../species";
import { sfx } from "../sound";
import { Appraisal } from "./Appraisal";
import { CandyIcon, StardustIcon } from "./icons";
import { portrait } from "../shiny";
import { Sheet } from "./Sheet";

const SORTS = [
  ["recent", "Recent"],
  ["cp", "CP"],
  ["number", "Number"],
] as const;
type Sort = (typeof SORTS)[number][0];

const factDex = new Set(spawns.map((s) => s.pokemon.dex));
const when = (at: number) =>
  new Date(at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

function sorted(list: Catch[], by: Sort) {
  if (by === "cp") return [...list].sort((a, b) => b.cp - a.cp);
  if (by === "number") return [...list].sort((a, b) => a.dex - b.dex || b.cp - a.cp);
  return list; // already newest first
}

/** GO's backdrop for a Pokémon's page, by its first type. */
const BAND: Partial<Record<PokeType, [string, string]>> = {
  water: ["#0c6898", "#1a9eae"],
  grass: ["#3e8f4a", "#7cc66a"],
  fire: ["#c9582e", "#f2a03c"],
  electric: ["#c9a21e", "#f4d74a"],
  bug: ["#6c8f2a", "#a8c94a"],
  poison: ["#6e3f8f", "#a86ac9"],
  normal: ["#7f8c8a", "#b9c4bf"],
  flying: ["#5f86c9", "#9cc3f2"],
  psychic: ["#b0417a", "#ee82b4"],
  ghost: ["#3f3a78", "#7b6ac0"],
  fighting: ["#9c3f2e", "#d97a5a"],
  rock: ["#7d6a4a", "#bfa77a"],
  ground: ["#9a7a42", "#d8b46a"],
  steel: ["#5f7480", "#a7b9c3"],
  ice: ["#4f9fbf", "#a6e2ef"],
  dragon: ["#3f5aa8", "#7c93e8"],
  fairy: ["#c46a9a", "#f2b0d0"],
};

/**
 * GO's Location Card (Pokémon from some events and raids carry one): the
 * place drawn behind the Pokémon on its page, with its name on a ribbon. Ours
 * are the hackathons, a skyline at dusk in the raid's color.
 */
function LocationCard({ raid }: { raid: Raid }) {
  const sky = RAID_EGG[raid.stars];
  return (
    <>
      <svg viewBox="0 0 400 224" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 size-full" aria-hidden>
        <defs>
          <linearGradient id="lc-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={sky} />
            <stop offset="1" stopColor="#f6c27a" />
          </linearGradient>
        </defs>
        <rect width="400" height="224" fill="url(#lc-sky)" />
        <circle cx="318" cy="70" r="26" fill="#fff4d6" opacity="0.85" />
        <path
          d="M0 224V150h28v-22h22v30h18v-46h30v38h20v-60h34v52h16v-28h26v40h22v-70h30v62h20v-34h28v46h22v-24h32v54h24v-40h28v66Z"
          fill="#24324a"
          opacity="0.85"
        />
        <path d="M0 224v-30h400v30Z" fill="#1a2436" />
        {[40, 112, 186, 252, 330].map((x) => (
          <rect key={x} x={x} y={140} width="6" height="8" fill="#ffd27a" opacity="0.9" />
        ))}
      </svg>
      <span className="absolute bottom-3 left-3 rounded-md bg-white/90 px-2 py-1 text-left shadow">
        <span className="block text-[9px] font-black tracking-[0.14em] text-ink-soft uppercase">Location Card</span>
        <span className="block text-xs font-bold text-ink">{raid.event}</span>
        <span className="block max-w-48 truncate text-[10px] text-ink-soft">{raid.venue}</span>
      </span>
    </>
  );
}

/** One Pokémon up close, GO's page: CP over its level arc, HP, its types, your Stardust and its Candy, and POWER UP. */
function Detail({ c, onBack, onAppraise }: { c: Catch; onBack: () => void; onAppraise: () => void }) {
  const p = useSyncExternalStore(progressStore.subscribe, progressStore.get, progressStore.server);
  const [bump, setBump] = useState(0);
  const stats = statsOf(c);
  const card = c.card ? raids.find((r) => r.slug === c.card) : undefined;
  const types = SPECIES[c.dex]?.types ?? ["normal"];
  const [from, to] = BAND[types[0]] ?? ["#7f8c8a", "#b9c4bf"];
  const cap = powerCap(levelFor(p.xp));
  const cost = powerCost(stats.level);
  const candy = p.candy[c.dex] ?? 0;
  const atCap = !cost || stats.level >= cap;
  const short = cost ? { dust: p.stardust < cost.dust, candy: candy < cost.candy } : { dust: false, candy: false };
  const hp = hpOf(c.dex, stats);
  // the arc runs from level 1 to the most you can power it to, like GO's
  const t = Math.min(1, (stats.level - 1) / Math.max(1, cap - 1));
  const angle = Math.PI * (1 - t);
  const up = () => {
    if (!powerUp(c.id)) return;
    sfx.spinBall();
    setBump((n) => n + 1);
  };
  return (
    <div className="card-in -mx-1 overflow-hidden rounded-3xl bg-surface text-center shadow-[0_2px_10px_rgba(48,85,93,0.12)]">
      <div className="relative h-56 overflow-hidden" style={{ background: `linear-gradient(180deg, ${from}, ${to})` }}>
        {card ? <LocationCard raid={card} /> : null}
        <svg viewBox="0 0 200 110" className="absolute inset-x-6 top-10" aria-hidden>
          <path d="M10 100a90 90 0 0 1 180 0" fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="2" />
          <circle cx={100 + 90 * Math.cos(angle)} cy={100 - 90 * Math.sin(angle)} r="5" fill="#ffffff" />
        </svg>
        <p key={bump} className={`absolute inset-x-0 top-4 font-display text-white drop-shadow ${bump ? "item-pop" : ""}`}>
          CP <span className="text-4xl font-semibold">{c.cp}</span>
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element -- tiny local sprite */}
        <img src={portrait(c.dex, c.shiny)} alt={c.name} width={170} height={170} className="absolute inset-x-0 bottom-[-28px] mx-auto size-[170px] object-contain drop-shadow-lg" />
        {bump ? (
          <span key={`s${bump}`} className="pointer-events-none absolute inset-x-0 top-1/2" aria-hidden>
            {Array.from({ length: 8 }, (_, k) => (
              <span key={k} className="catch-star" style={{ "--a": `${k * 45}deg` } as CSSProperties}>
                ★
              </span>
            ))}
          </span>
        ) : null}
      </div>
      <div className="px-5 pt-9 pb-5">
        <p className="font-display text-2xl font-semibold text-[#30555d]">
          {c.shiny ? (
            <span className="text-[#2bb5a8]" title="Shiny">
              ✧{" "}
            </span>
          ) : null}
          {c.name}
        </p>
        <span className="mx-auto mt-2 block h-1.5 w-40 overflow-hidden rounded-full bg-ink/10">
          <span className="block h-full w-full rounded-full bg-[#66ecb3]" />
        </span>
        <p className="mt-1 text-xs text-ink-soft tabular-nums">
          {hp} / {hp} HP
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 border-y border-ink/8 py-3">
          {[
            [types.map((x) => x[0].toUpperCase() + x.slice(1)).join(" / "), "Type"],
            [`${stats.level}`, "Level"],
            [`No. ${String(c.dex).padStart(4, "0")}`, "Pokédex"],
          ].map(([v, l]) => (
            <span key={l}>
              <span className="block text-sm font-semibold text-[#3d5e62]">{v}</span>
              <span className="block text-[10px] font-bold tracking-[0.12em] text-[#9db0b0] uppercase">{l}</span>
            </span>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <span className="flex items-center justify-center gap-1.5 text-sm font-semibold tabular-nums">
            <StardustIcon size={20} />
            {p.stardust.toLocaleString("en-US")}
          </span>
          <span className="flex items-center justify-center gap-1.5 text-sm font-semibold tabular-nums">
            <CandyIcon dex={c.dex} size={20} />
            {candy} {c.name} Candy
          </span>
        </div>
        {/* GO's POWER UP: a green pill with what it costs beside it, the short one in red */}
        <div className="mt-4 flex items-stretch gap-2">
          <button
            type="button"
            disabled={atCap || short.dust || short.candy}
            onClick={up}
            className="flex-1 rounded-full bg-linear-to-r from-[#a0db96] to-[#2ccda9] py-2.5 font-display text-sm font-black tracking-wide text-white uppercase shadow disabled:from-[#bfded9] disabled:to-[#cde0e5] disabled:shadow-none"
          >
            Power up
          </button>
          {cost && !atCap ? (
            <span className="flex items-center gap-2.5 rounded-full bg-[#ddeade] px-3.5 text-xs font-bold tabular-nums">
              <span className={`flex items-center gap-1 ${short.dust ? "text-[#e0452f]" : ""}`}>
                <StardustIcon size={16} />
                {cost.dust.toLocaleString("en-US")}
              </span>
              <span className={`flex items-center gap-1 ${short.candy ? "text-[#e0452f]" : ""}`}>
                <CandyIcon dex={c.dex} size={16} />
                {cost.candy}
              </span>
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-xs text-ink-soft">
          {atCap ? `As strong as you can make it for now: level ${cap} is your limit until you level up.` : `You can power it up to level ${cap}, your level plus 10.`}
        </p>
        <p className="mt-5 text-xs font-bold tracking-[0.14em] text-ink-soft uppercase">Caught</p>
        <p className="text-sm text-ink-soft">
          {when(c.at)}
          {c.throw ? ` with ${c.throw === "Excellent" ? "an" : "a"} ${c.throw} throw` : ""}
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <button type="button" onClick={onBack} className="rounded-full bg-ink/6 px-5 py-2.5 font-display font-semibold transition hover:bg-ink/12">
            Back
          </button>
          <button type="button" onClick={onAppraise} className="go-pill rounded-full px-5 py-2.5 text-sm">
            Appraise
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * GO's Pokémon screen: what this visitor has caught, newest first, with its
 * CP. It's only theirs: catches live in their own browser, nobody else sees
 * or touches them (the Community screen only adds up totals), so there's no
 * transferring, just a keepsake of the visit. It keeps the last 300.
 */
export function PokemonPanel({ onClose }: { onClose: () => void }) {
  const { history } = useSyncExternalStore(progressStore.subscribe, progressStore.get, progressStore.server);
  const [by, setBy] = useState<Sort>("recent");
  const [open, setOpen] = useState<number | null>(null);
  const [appraising, setAppraising] = useState(false);
  const picked = history.find((c) => c.id === open);

  return (
    <Sheet
      title="Your Pokémon"
      subtitle={`${history.length >= HISTORY_MAX ? `Your last ${HISTORY_MAX}` : `${history.length} caught`}, saved on this device`}
      onClose={onClose}
    >
      {picked ? (
        <>
          <Detail c={picked} onBack={() => setOpen(null)} onAppraise={() => setAppraising(true)} />
          {appraising ? <Appraisal c={picked} onDone={() => setAppraising(false)} /> : null}
        </>
      ) : history.length ? (
        <>
          <div role="tablist" aria-label="Sort by" className="mb-4 flex gap-1.5">
            {SORTS.map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={by === id}
                onClick={() => setBy(id)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                  by === id ? "go-chip-on" : "bg-ink/6 text-ink-soft hover:bg-ink/12"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {sorted(history, by).map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setOpen(c.id)}
                  className="flex w-full flex-col items-center rounded-2xl bg-ink/5 px-1 pt-2 pb-2.5 transition hover:bg-ink/10"
                >
                  <span className="font-display text-xs text-ink-soft">
                    CP <span className="text-sm font-semibold text-ink">{c.cp}</span>
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element -- tiny local sprite */}
                  <img src={portrait(c.dex, c.shiny)} alt="" width={64} height={64} loading="lazy" className="size-16 object-contain" />
                  <span className="max-w-full truncate text-sm font-semibold">
                    {factDex.has(c.dex) ? "✦ " : ""}
                    {c.shiny ? <span className="text-[#2bb5a8]" title="Shiny">✧ </span> : null}
                    {c.name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="py-10 text-center text-ink-soft">Nothing yet. Walk up to a wild Pokémon to catch it.</p>
      )}
    </Sheet>
  );
}
