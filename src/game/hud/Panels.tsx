"use client";

import { useSyncExternalStore } from "react";
import { bag, medals, type MedalTier, spawns, trainer, wild } from "@/content";
import { buddyStore } from "../buddy";
import { progressStore } from "../progress";
import { Portrait } from "./Portrait";
import { Sheet } from "./Sheet";

const n = (v: number) => v.toLocaleString("en-US");
const since = new Date(`${trainer.go.since}T12:00:00`).toLocaleDateString("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

/** GO's trainer profile, with the real stats from Tyler's account and everything about him. */
export function TrainerPanel({ onClose }: { onClose: () => void }) {
  const stats = [
    ["Total XP", n(trainer.go.xp)],
    ["Distance walked", `${n(trainer.go.km)} km`],
    ["Pokémon caught", n(trainer.go.caught)],
    ["PokéStops visited", n(trainer.go.stopsVisited)],
    ["Pokédex entries", n(trainer.go.dex)],
    ["Start date", since],
  ];
  return (
    <Sheet title="Trainer" onClose={onClose}>
      <div className="flex items-center gap-4 rounded-3xl bg-linear-to-br from-mystic-500 to-mystic-400 p-4 text-white">
        <div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-full bg-white/90">
          <Portrait size={88} />
        </div>
        <div>
          <p className="font-display text-2xl font-semibold">{trainer.name}</p>
          <p className="text-sm font-semibold opacity-95">Level {trainer.go.level}, Team Mystic</p>
          <p className="text-sm opacity-90">Favorite: {trainer.go.favorite}</p>
        </div>
      </div>

      <div className="mt-5 space-y-3 leading-relaxed">
        {trainer.about.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>

      <h3 className="mt-6 text-xs font-bold tracking-wider text-ink-soft uppercase">My real Pokémon GO stats</h3>
      <dl className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-ink/5 px-3 py-2.5">
            <dt className="text-xs font-semibold text-ink-soft">{label}</dt>
            <dd className="font-display text-lg font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <h3 className="mt-6 text-xs font-bold tracking-wider text-ink-soft uppercase">School</h3>
      <p className="mt-1">
        <span className="font-semibold">{trainer.school.name}</span>, {trainer.school.degree}, {trainer.school.graduation}.
        GPA {trainer.school.gpa}.
      </p>

      <h3 className="mt-6 text-xs font-bold tracking-wider text-ink-soft uppercase">Buddy</h3>
      <p className="mt-1">{trainer.buddy.blurb}</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <a href={`mailto:${trainer.email}`} className="rounded-full bg-teal px-4 py-2 text-sm font-bold text-mystic-900 shadow">
          Email me
        </a>
        {trainer.links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-ink/8 px-4 py-2 text-sm font-bold transition hover:bg-ink/15"
          >
            {l.label}
          </a>
        ))}
      </div>
    </Sheet>
  );
}

/** GO's Pokédex: the fact Pokémon first, then every wild one, filled in as you catch them. */
export function PokedexPanel({ onClose, onOpen }: { onClose: () => void; onOpen: (slug: string) => void }) {
  const { caught } = useSyncExternalStore(progressStore.subscribe, progressStore.get, progressStore.server);
  const total = spawns.length + wild.length;
  const have = [...spawns.map((s) => s.pokemon.dex), ...wild.map((w) => w.dex)].filter((d) => caught[d]).length;
  return (
    <Sheet title="Pokédex" onClose={onClose}>
      <p className="mb-4 text-sm text-ink-soft">
        You&apos;ve caught <span className="font-bold text-ink">{have}</span> of {total}.
      </p>
      <h3 className="mb-2 text-xs font-bold tracking-wider text-ink-soft uppercase">✦ Facts about me</h3>
      <p className="mb-3 text-sm text-ink-soft">The sparkly ones on the map. Tap any to read it, caught or not.</p>
      <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
        {spawns.map((s) => (
          <li key={s.slug}>
            <button
              type="button"
              onClick={() => onOpen(s.slug)}
              className="flex w-full flex-col items-center rounded-2xl bg-ink/5 px-2 pt-2 pb-2.5 transition hover:bg-ink/10"
            >
              <Sprite dex={s.pokemon.dex} caught={!!caught[s.pokemon.dex]} />
              <span className="text-[11px] font-semibold text-ink-soft tabular-nums">No. {String(s.pokemon.dex).padStart(4, "0")}</span>
              <span className="text-sm font-semibold">{s.pokemon.name}</span>
              <span className="text-xs text-ink-soft">{s.title}</span>
            </button>
          </li>
        ))}
      </ul>
      <h3 className="mt-6 mb-2 text-xs font-bold tracking-wider text-ink-soft uppercase">Wild</h3>
      <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {[...wild].sort((a, b) => a.dex - b.dex).map((w) => (
          <li key={w.dex} className="flex flex-col items-center rounded-2xl bg-ink/5 px-1 pt-1.5 pb-2">
            <Sprite dex={w.dex} caught={!!caught[w.dex]} small />
            <span className="text-[10px] font-semibold text-ink-soft tabular-nums">No. {String(w.dex).padStart(4, "0")}</span>
            <span className="text-xs font-semibold">{caught[w.dex] ? w.name : "???"}</span>
            {caught[w.dex] ? <span className="text-[10px] text-ink-soft">×{caught[w.dex]}</span> : null}
          </li>
        ))}
      </ul>
    </Sheet>
  );
}

/** A Pokédex picture: full color once caught, a dark silhouette until then. */
function Sprite({ dex, caught, small = false }: { dex: number; caught: boolean; small?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- tiny local sprite
    <img
      src={`/sprites/${dex}.webp`}
      alt=""
      width={64}
      height={64}
      className={`${small ? "size-12" : "size-16"} object-contain ${caught ? "" : "brightness-0 opacity-35"}`}
    />
  );
}

/** Teddy's buddy screen, like GO's: who he is and how much love he's gotten this visit. */
export function BuddyPanel({ onClose }: { onClose: () => void }) {
  const petted = useSyncExternalStore(buddyStore.subscribe, buddyStore.get, buddyStore.server);
  return (
    <Sheet title="Buddy" onClose={onClose}>
      <div className="flex items-center gap-4 rounded-3xl bg-linear-to-br from-[#f9a8d4] to-[#fbcfe8] p-4 text-mystic-900">
        <div className="grid size-20 shrink-0 place-items-center rounded-full bg-white" aria-hidden>
          <svg viewBox="0 0 40 40" width="60" height="60">
            <ellipse cx="9" cy="20" rx="6" ry="10" fill="#e6cfa9" />
            <ellipse cx="31" cy="20" rx="6" ry="10" fill="#e6cfa9" />
            <circle cx="20" cy="19" r="13" fill="#f5ebd8" />
            <circle cx="15" cy="17" r="2.3" fill="#1a1310" />
            <circle cx="25" cy="17" r="2.3" fill="#1a1310" />
            <ellipse cx="20" cy="24" rx="5" ry="3.5" fill="#fbf6ec" />
            <ellipse cx="20" cy="22.5" rx="2.2" ry="1.6" fill="#1a1310" />
            <ellipse cx="20" cy="27" rx="1.4" ry="1" fill="#ef8a8f" />
          </svg>
        </div>
        <div>
          <p className="font-display text-2xl font-semibold">{trainer.buddy.name}</p>
          <p className="text-sm font-semibold">{trainer.buddy.kind}, {trainer.name.split(" ")[0]}&apos;s buddy</p>
        </div>
      </div>
      <p className="mt-4 leading-relaxed">{trainer.buddy.blurb}</p>
      <p className="mt-4 flex items-center gap-2 font-display text-lg font-semibold">
        <span aria-hidden className="text-2xl text-[#ff5c8a]">♥</span>
        Petted {petted} {petted === 1 ? "time" : "times"} this visit
      </p>
      <p className="mt-1 text-sm text-ink-soft">Tap him on the map anytime. He follows you everywhere.</p>
    </Sheet>
  );
}

const KINDS = [
  ["language", "Languages"],
  ["framework", "Frameworks and libraries"],
  ["infra", "Infrastructure and tools"],
  ["api", "APIs"],
  ["hardware", "Hardware"],
] as const;

/** The bag: every skill, counted by how many jobs, projects, and hackathons use it. */
export function BagPanel({ onClose }: { onClose: () => void }) {
  const items = bag();
  return (
    <Sheet title="Bag" onClose={onClose}>
      <p className="mb-4 text-sm text-ink-soft">The number is how many things on the base use it.</p>
      {KINDS.map(([kind, label]) => {
        const group = items.filter((i) => i.kind === kind && (i.count > 0 || i.learning));
        if (!group.length) return null;
        return (
          <section key={kind} className="mb-5">
            <h3 className="mb-2 text-xs font-bold tracking-wider text-ink-soft uppercase">{label}</h3>
            <ul className="flex flex-wrap gap-2">
              {group.map((i) => (
                <li key={i.id} className="flex items-center gap-1.5 rounded-full bg-ink/6 py-1 pr-1.5 pl-3 text-sm font-semibold">
                  {i.name}
                  {i.learning ? (
                    <span className="rounded-full bg-teal/30 px-2 py-0.5 text-[11px] text-ink">learning</span>
                  ) : (
                    <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-ink-soft tabular-nums">×{i.count}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </Sheet>
  );
}

const TIER: Record<MedalTier, string> = {
  bronze: "bg-bronze",
  silver: "bg-silver",
  gold: "bg-gold",
  platinum: "bg-platinum",
};
const GROUPS = [
  ["go", "Pokémon GO"],
  ["award", "Awards"],
  ["honor", "Honors"],
] as const;

/** Medals: awards, honors, and GO feats, tinted by tier like the game's. */
export function MedalsPanel({ onClose }: { onClose: () => void }) {
  return (
    <Sheet title="Medals" onClose={onClose}>
      {GROUPS.map(([group, label]) => (
        <section key={group} className="mb-5">
          <h3 className="mb-2 text-xs font-bold tracking-wider text-ink-soft uppercase">{label}</h3>
          <ul className="space-y-2">
            {medals
              .filter((m) => m.group === group)
              .map((m) => (
                <li key={m.slug} className="flex items-center gap-3 rounded-2xl bg-ink/5 px-3 py-2.5">
                  <span aria-hidden className={`size-10 shrink-0 rounded-full ${TIER[m.tier]} shadow-inner ring-2 ring-ink/20`} />
                  <span className="min-w-0">
                    <span className="block font-semibold">{m.title}</span>
                    <span className="block text-sm text-ink-soft">
                      {m.detail}
                      {m.date ? `, ${m.date}` : ""}
                    </span>
                  </span>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </Sheet>
  );
}
