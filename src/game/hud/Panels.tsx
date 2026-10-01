"use client";

import { type ReactNode, useSyncExternalStore } from "react";
import { bag, medals, type MedalTier, spawns, trainer, wild } from "@/content";
import { buddyStore } from "../buddy";
import { MYSTIC } from "../colors";
import { levelFor, progressStore, xpForLevel } from "../progress";
import { visitorMedals } from "../visitorMedals";
import { ItemIcon } from "./icons";
import { ITEM_INFO } from "./SpinDisc";
import { Sheet } from "./Sheet";

const n = (v: number) => v.toLocaleString("en-US");
const since = new Date(`${trainer.go.since}T12:00:00`).toLocaleDateString("en-US", {
  month: "short",
  year: "numeric",
});

const TIER: Record<MedalTier, string> = {
  bronze: "bg-bronze",
  silver: "bg-silver",
  gold: "bg-gold",
  platinum: "bg-platinum",
};
const GROUPS = [
  ["award", "Awards"],
  ["honor", "Honors"],
  ["go", "In Pokémon GO"],
] as const;

/** A small uppercase section label, the same everywhere. */
function Label({ children }: { children: ReactNode }) {
  return <h3 className="mt-7 mb-2.5 text-xs font-bold tracking-wider text-ink-soft uppercase">{children}</h3>;
}

/** Number tiles, the same everywhere. */
function Tiles({ rows, tint = "bg-ink/5" }: { rows: readonly (readonly [string, string])[]; tint?: string }) {
  return (
    <dl className="grid grid-cols-3 gap-2">
      {rows.map(([label, value]) => (
        <div key={label} className={`rounded-2xl ${tint} px-3 py-2.5`}>
          <dt className="text-xs font-semibold text-ink-soft">{label}</dt>
          <dd className="font-display text-lg font-semibold tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** One medal row: a tinted disc, the title, and a line under it. */
function MedalRow({ tint, title, detail, children }: { tint: string; title: string; detail: string; children?: ReactNode }) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <span aria-hidden className={`size-9 shrink-0 rounded-full ring-2 ring-ink/10 ${tint}`} />
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-ink-soft">{detail}</span>
        {children}
      </span>
    </li>
  );
}

/** Everything about Tyler: who he is, how to reach him, what he's won, what he uses, and his real GO account. */
export function TrainerPanel({ onClose }: { onClose: () => void }) {
  const stats = [
    ["Level", String(trainer.go.level)],
    ["Total XP", n(trainer.go.xp)],
    ["Walked", `${n(trainer.go.km)} km`],
    ["Caught", n(trainer.go.caught)],
    ["Pokédex", n(trainer.go.dex)],
    ["Since", since],
  ] as const;
  return (
    <Sheet
      title={trainer.name}
      kicker="About"
      accent={MYSTIC}
      subtitle={`${trainer.school.name}, ${trainer.school.degree}, ${trainer.school.graduation}`}
      onClose={onClose}
    >
      <div className="space-y-3 leading-relaxed">
        {trainer.about.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <a
          href={`mailto:${trainer.email}`}
          className="rounded-full bg-mystic-500 px-4 py-2 text-sm font-bold text-white transition hover:brightness-110"
        >
          Email me
        </a>
        {trainer.links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-ink/6 px-4 py-2 text-sm font-bold transition hover:bg-ink/12"
          >
            {l.label}
          </a>
        ))}
      </div>

      {GROUPS.map(([group, label]) => (
        <section key={group}>
          <Label>{label}</Label>
          <ul className="divide-y divide-ink/6">
            {medals
              .filter((m) => m.group === group)
              .map((m) => (
                <MedalRow key={m.slug} tint={TIER[m.tier]} title={m.title} detail={`${m.detail}${m.date ? `, ${m.date}` : ""}`} />
              ))}
          </ul>
        </section>
      ))}

      <Label>Skills</Label>
      <Skills />

      <Label>My real Pokémon GO account</Label>
      <Tiles rows={stats} />
      <p className="mt-2 text-sm text-ink-soft">
        Team Mystic. Favorite: {trainer.go.favorite}. GPA {trainer.school.gpa}.
      </p>
    </Sheet>
  );
}

/** GO's Pokédex: the fact Pokémon first, then every wild one, filled in as you catch them. */
export function PokedexPanel({ onClose, onOpen }: { onClose: () => void; onOpen: (slug: string) => void }) {
  const { caught } = useSyncExternalStore(progressStore.subscribe, progressStore.get, progressStore.server);
  const total = spawns.length + wild.length;
  const have = [...spawns.map((s) => s.pokemon.dex), ...wild.map((w) => w.dex)].filter((d) => caught[d]).length;
  return (
    <Sheet title="Pokédex" subtitle={`${have} of ${total} caught`} onClose={onClose}>
      <h3 className="mb-2.5 text-xs font-bold tracking-wider text-ink-soft uppercase">Facts about Tyler</h3>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {spawns.map((s) => (
          <li key={s.slug}>
            <button
              type="button"
              onClick={() => onOpen(s.slug)}
              className="flex w-full flex-col items-center rounded-2xl bg-ink/5 px-2 pt-2 pb-2.5 transition hover:bg-ink/10"
            >
              <Sprite dex={s.pokemon.dex} caught={!!caught[s.pokemon.dex]} />
              <span className="text-sm font-semibold">{s.pokemon.name}</span>
              <span className="text-xs text-ink-soft">{s.title}</span>
            </button>
          </li>
        ))}
      </ul>
      <Label>Wild</Label>
      <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {[...wild].sort((a, b) => a.dex - b.dex).map((w) => (
          <li key={w.dex} className="flex flex-col items-center rounded-2xl bg-ink/5 px-1 pt-1.5 pb-2">
            <Sprite dex={w.dex} caught={!!caught[w.dex]} small />
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

function TeddyFace() {
  return (
    <svg viewBox="0 0 40 40" width="48" height="48" aria-hidden>
      <ellipse cx="9" cy="20" rx="6" ry="10" fill="#e6cfa9" />
      <ellipse cx="31" cy="20" rx="6" ry="10" fill="#e6cfa9" />
      <circle cx="20" cy="19" r="13" fill="#f5ebd8" />
      <circle cx="15" cy="17" r="2.3" fill="#1a1310" />
      <circle cx="25" cy="17" r="2.3" fill="#1a1310" />
      <ellipse cx="20" cy="24" rx="5" ry="3.5" fill="#fbf6ec" />
      <ellipse cx="20" cy="22.5" rx="2.2" ry="1.6" fill="#1a1310" />
      <ellipse cx="20" cy="27" rx="1.4" ry="1" fill="#ef8a8f" />
    </svg>
  );
}

/** Teddy's buddy screen, like GO's: who he is and how much love he's gotten this visit. */
export function BuddyPanel({ onClose }: { onClose: () => void }) {
  const petted = useSyncExternalStore(buddyStore.subscribe, buddyStore.get, buddyStore.server);
  return (
    <Sheet
      title={trainer.buddy.name}
      kicker="Buddy"
      accent="#d6457a"
      subtitle={`${trainer.buddy.kind}, ${trainer.name.split(" ")[0]}'s buddy`}
      art={<TeddyFace />}
      onClose={onClose}
    >
      <p className="leading-relaxed">{trainer.buddy.blurb}</p>
      <p className="mt-4 flex items-center gap-2 font-display text-lg font-semibold">
        <span aria-hidden className="text-2xl text-heart">♥</span>
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

/** Tyler's skills by kind, most used first. */
function Skills() {
  const items = bag();
  return (
    <div className="space-y-3">
      {KINDS.map(([kind, label]) => {
        const group = items.filter((i) => i.kind === kind && (i.count > 0 || i.learning));
        if (!group.length) return null;
        return (
          <section key={kind}>
            <h4 className="mb-1.5 text-xs font-semibold text-ink-soft">{label}</h4>
            <ul className="flex flex-wrap gap-1.5">
              {group.map((i) => (
                <li key={i.id} className="rounded-full bg-ink/6 px-3 py-1 text-sm font-semibold">
                  {i.name}
                  {i.learning ? <span className="ml-1.5 text-xs text-ink-soft">learning</span> : null}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

/** GO's bag holds 350 items. */
const BAG_MAX = 350;

/** Your items, like GO's: each one with its picture, how many you have, and what it does. */
export function BagPanel({ onClose }: { onClose: () => void }) {
  const { items } = useSyncExternalStore(progressStore.subscribe, progressStore.get, progressStore.server);
  const ids = Object.keys(ITEM_INFO) as (keyof typeof ITEM_INFO)[];
  const total = ids.reduce((sum, id) => sum + items[id], 0);
  return (
    <Sheet title="Items" subtitle={`${total}/${BAG_MAX}`} onClose={onClose}>
      <ul className="space-y-2">
        {ids.map((id) => (
          <li key={id} className={`flex items-center gap-4 rounded-2xl bg-ink/5 px-4 py-3 ${items[id] ? "" : "opacity-55"}`}>
            <span className="grid size-14 shrink-0 place-items-center rounded-full bg-surface">
              <ItemIcon id={id} size={40} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-2">
                <span className="font-display text-lg font-semibold">{ITEM_INFO[id].name}</span>
                <span className="font-display text-lg font-semibold tabular-nums">×{items[id]}</span>
              </span>
              <span className="block text-sm leading-snug text-ink-soft">{ITEM_INFO[id].about}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-ink-soft">Spin PokéStops for more. Each one refills a few minutes after you spin it.</p>
    </Sheet>
  );
}

/** Your trainer profile: your level, what you've done on the base, and your medals. */
export function ProfilePanel({ onClose }: { onClose: () => void }) {
  const progress = useSyncExternalStore(progressStore.subscribe, progressStore.get, progressStore.server);
  const level = levelFor(progress.xp);
  const from = xpForLevel(level);
  const to = xpForLevel(level + 1);
  const catches = Object.values(progress.caught).reduce((a, b) => a + b, 0);
  const yours = visitorMedals(progress);
  const stats = [
    ["Caught", n(catches)],
    ["Species", n(Object.keys(progress.caught).length)],
    ["Visited", n(progress.visited.length)],
  ] as const;
  return (
    <Sheet title={`Level ${level}`} kicker="You" accent={MYSTIC} onClose={onClose}>
      <div className="h-2 overflow-hidden rounded-full bg-ink/8">
        <div className="h-full rounded-full bg-teal" style={{ width: `${Math.min(100, ((progress.xp - from) / (to - from)) * 100)}%` }} />
      </div>
      <p className="mt-1.5 mb-5 text-sm text-ink-soft tabular-nums">
        {n(progress.xp)} / {n(to)} XP, saved in this browser
      </p>
      <Tiles rows={stats} />

      <Label>Your medals</Label>
      <ul className="divide-y divide-ink/6">
        {yours.map((m) => {
          const done = m.have >= m.need;
          return (
            <MedalRow key={m.id} tint={done ? "bg-gold" : "bg-ink/8"} title={m.title} detail={done ? m.detail : `${m.detail}, ${m.have}/${m.need}`}>
              {done ? null : (
                <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-ink/8">
                  <span className="block h-full rounded-full bg-teal" style={{ width: `${(m.have / m.need) * 100}%` }} />
                </span>
              )}
            </MedalRow>
          );
        })}
      </ul>
    </Sheet>
  );
}
