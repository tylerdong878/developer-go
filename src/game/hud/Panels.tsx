"use client";

import { type ReactNode, useState, useSyncExternalStore } from "react";
import { bag, eventWild, gyms, type MapObject, medals, type MedalTier, raids, spawns, stops, trainer, wild } from "@/content";
import { describe } from "../objects";
import { bondLevel, canFeed, feed, LEVELS } from "../bond";
import { buddyStore } from "../buddy";
import { MYSTIC } from "../colors";
import { levelFor, lightIncense, progressStore, xpForLevel } from "../progress";
import { sfx } from "../sound";
import { TEAM_LEVEL, TEAMS } from "../teams";
import { RAID_BOSS } from "../raidBosses";
import { visitorMedals } from "../visitorMedals";
import { ItemIcon, ObjectIcon, StardustIcon } from "./icons";
import { GiftBox } from "./Gifts";
import { BOOK_MAX, GIFT_HOLD } from "../gifts";
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

/** GO's profile tabs: Tyler's trainer card, and yours. */
export function ProfileTabs({ current, onPick }: { current: "tyler" | "you"; onPick: (tab: "tyler" | "you") => void }) {
  return (
    <div role="tablist" aria-label="Whose profile" className="mb-5 flex justify-center gap-1">
      {(
        [
          ["tyler", trainer.name.split(" ")[0]],
          ["you", "You"],
        ] as const
      ).map(([id, label]) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={current === id}
          onClick={() => onPick(id)}
          className={`go-title border-b-2 px-4 py-1.5 text-xs transition ${current === id ? "border-ink text-ink" : "border-transparent text-ink-soft hover:text-ink"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

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
export function TrainerPanel({ onClose, onTab }: { onClose: () => void; onTab?: (tab: "tyler" | "you") => void }) {
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
      {onTab ? <ProfileTabs current="tyler" onPick={onTab} /> : null}
      <div className="space-y-3 leading-relaxed">
        {trainer.about.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <a
          href={`mailto:${trainer.email}`}
          className="go-pill rounded-full px-5 py-2 text-sm transition active:scale-95"
        >
          Email me
        </a>
        <a href="/resume" className="go-pill rounded-full px-5 py-2 text-sm transition active:scale-95">
          Resume
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

/** GO's Pokédex: the fact Pokémon first, then every wild one, then the raid bosses, filled in as you catch them. */
export function PokedexPanel({ onClose, onOpen }: { onClose: () => void; onOpen: (slug: string) => void }) {
  const { caught, bonus, hatched, history } = useSyncExternalStore(progressStore.subscribe, progressStore.get, progressStore.server);
  // species caught shiny at least once, marked like GO's Pokédex
  const shiny = new Set(history.filter((c) => c.shiny).map((c) => c.dex));
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
            <span className="text-xs font-semibold">
              {caught[w.dex] ? w.name : "???"}
              {shiny.has(w.dex) ? <span className="ml-0.5 text-[#2bb5a8]" title="Caught shiny">✧</span> : null}
            </span>
            {caught[w.dex] ? <span className="text-[10px] text-ink-soft">×{caught[w.dex]}</span> : null}
          </li>
        ))}
      </ul>
      <Label>Events</Label>
      <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {eventWild.map((w) => (
          <li key={w.dex} className="flex flex-col items-center rounded-2xl bg-ink/5 px-1 pt-1.5 pb-2">
            <Sprite dex={w.dex} caught={!!caught[w.dex]} small />
            <span className="text-xs font-semibold">
              {caught[w.dex] ? w.name : "???"}
              {shiny.has(w.dex) ? <span className="ml-0.5 text-[#2bb5a8]" title="Caught shiny">✧</span> : null}
            </span>
            <span className="text-[10px] text-ink-soft">{caught[w.dex] ? `×${caught[w.dex]}` : "Halloween"}</span>
          </li>
        ))}
      </ul>
      <Label>Raid bosses</Label>
      <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {raids.map((r) => {
          const boss = RAID_BOSS[r.slug];
          if (!boss) return null;
          const got = bonus[r.slug] === true;
          return (
            <li key={r.slug}>
              {/* a raid opens once you've walked up and hatched it */}
              <button
                type="button"
                disabled={!hatched.includes(r.slug)}
                onClick={() => onOpen(r.slug)}
                className="flex w-full flex-col items-center rounded-2xl bg-ink/5 px-1 pt-1.5 pb-2 transition enabled:hover:bg-ink/10"
              >
                <Sprite dex={boss.dex} caught={got} small />
                <span className="text-xs font-semibold">{got ? boss.name : "???"}</span>
                <span className="text-[10px] text-ink-soft">{"★".repeat(r.stars)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}

/** A Pokédex picture: full color once caught, a dark silhouette until then. */
function Sprite({ dex, caught, small = false }: { dex: number; caught: boolean; small?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- tiny local sprite
    <img
      src={`/portraits/${dex}.webp`}
      alt=""
      width={64}
      height={64}
      className={`${small ? "size-12" : "size-16"} object-contain ${caught ? "" : "brightness-0 opacity-35"}`}
    />
  );
}

export function TeddyFace({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
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
  const { bond, items } = useSyncExternalStore(progressStore.subscribe, progressStore.get, progressStore.server);
  const { level, next, index } = bondLevel(bond.hearts);
  const from = level?.hearts ?? 0;
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

      <Label>{level ? level.name : "Your buddy"}</Label>
      {/* GO's buddy hearts: a row of the four levels, and how far to the next */}
      <div className="flex items-center gap-1.5" aria-label={`${bond.hearts} hearts`}>
        {LEVELS.map((l, i) => (
          <span key={l.name} title={l.name} className={`text-2xl ${i <= index ? "text-heart" : "text-ink/15"}`} aria-hidden>
            ♥
          </span>
        ))}
        <span className="ml-2 text-sm font-semibold text-ink-soft tabular-nums">{bond.hearts} hearts</span>
      </div>
      {next ? (
        <>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink/8">
            <div className="h-full rounded-full bg-heart" style={{ width: `${((bond.hearts - from) / (next.hearts - from)) * 100}%` }} />
          </div>
          <p className="mt-1.5 text-sm text-ink-soft">
            {next.hearts - bond.hearts} more to {next.name}
            {index < 1 ? ". Great Buddies find items as you walk." : ""}
          </p>
        </>
      ) : (
        <p className="mt-1.5 text-sm text-ink-soft">Best Buddies. It doesn&apos;t get better than this.</p>
      )}
      <Tiles
        rows={[
          ["Walked together", `${bond.km.toFixed(1)} km`],
          ["Played today", bond.played === new Date().toISOString().slice(0, 10) ? "Yes" : "Not yet"],
        ]}
      />
      <button
        type="button"
        disabled={!canFeed(bond) || items.razz <= 0}
        onClick={() => feed()}
        className="go-pill mt-4 rounded-full px-5 py-2 text-sm transition active:scale-95"
      >
        Give a Razz Berry ({items.razz})
      </button>
      <p className="mt-2 text-xs text-ink-soft">
        Hearts like GO: walk 2 km together, play once a day, up to 3 treats a day. Distances are GO km: the map is scaled so your pink ring is GO&apos;s 80 m.
      </p>
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
export function BagPanel({ onClose, onOpen }: { onClose: () => void; onOpen?: (screen: "gifts" | "postcards") => void }) {
  const { items, gifts, postcards, stardust, incenseUntil } = useSyncExternalStore(progressStore.subscribe, progressStore.get, progressStore.server);
  const [now] = useState(Date.now);
  const burning = (incenseUntil ?? 0) > now;
  const ids = Object.keys(ITEM_INFO) as (keyof typeof ITEM_INFO)[];
  const total = ids.reduce((sum, id) => sum + items[id], 0);
  return (
    <Sheet title="Items" subtitle={`${total}/${BAG_MAX}`} onClose={onClose}>
      <p className="mb-3 flex items-center justify-center gap-2 font-display text-lg font-semibold tabular-nums">
        <StardustIcon size={26} />
        {stardust.toLocaleString("en-US")} <span className="text-xs font-bold tracking-[0.14em] text-ink-soft uppercase">Stardust</span>
      </p>
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
              {id === "incense" ? (
                <button
                  type="button"
                  disabled={burning || !items.incense}
                  onClick={() => {
                    if (lightIncense()) {
                      sfx.open();
                      onClose();
                    }
                  }}
                  className="go-pill mt-2 rounded-full px-5 py-1.5 text-xs"
                >
                  {burning ? "Burning" : "Use"}
                </button>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-ink-soft">Spin PokéStops for more. Each one refills a few minutes after you spin it.</p>
      {onOpen ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => onOpen("gifts")} className="flex items-center gap-3 rounded-2xl bg-ink/5 px-3 py-3 text-left transition hover:bg-ink/10">
            <GiftBox size={36} />
            <span>
              <span className="block font-display font-semibold">Gifts</span>
              <span className="block text-xs text-ink-soft">
                {gifts.length}/{GIFT_HOLD}
              </span>
            </span>
          </button>
          <button type="button" onClick={() => onOpen("postcards")} className="flex items-center gap-3 rounded-2xl bg-ink/5 px-3 py-3 text-left transition hover:bg-ink/10">
            <PostcardIcon />
            <span>
              <span className="block font-display font-semibold">Postcard Book</span>
              <span className="block text-xs text-ink-soft">
                {postcards.length}/{BOOK_MAX}
              </span>
            </span>
          </button>
        </div>
      ) : null}
      <Label>Key items</Label>
      {/* like GO's key items: you always have it, and it never runs out */}
      <a href="/resume" className="flex items-center gap-4 rounded-2xl bg-ink/5 px-4 py-3 transition hover:bg-ink/10">
        <span className="grid size-14 shrink-0 place-items-center rounded-full bg-surface">
          <ResumeIcon />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-lg font-semibold">Tyler&apos;s Resume</span>
          <span className="block text-sm leading-snug text-ink-soft">Everything on one page, to read, print, or save as a PDF.</span>
        </span>
      </a>
    </Sheet>
  );
}

/** The best of it in one list, for anyone short on time: each one dashes you there and opens it. */
export function HighlightsPanel({ onClose, onGo }: { onClose: () => void; onGo: (slug: string) => void }) {
  const jobs = gyms.filter((g) => ["aws", "philips", "tetracorp"].includes(g.slug));
  const projects = stops.filter((s) => s.featured && s.slug !== "bluffs");
  const wins = raids.filter((r) => r.result);
  const row = (o: MapObject) => {
    const { name, subtitle } = describe(o);
    return (
      <li key={o.slug}>
        <button
          type="button"
          onClick={() => onGo(o.slug)}
          className="flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition hover:bg-ink/6 focus-visible:bg-ink/6"
        >
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-sky">
            <ObjectIcon object={o} size={36} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">{name}</span>
            <span className="block truncate text-sm text-ink-soft">{subtitle}</span>
          </span>
          <span aria-hidden className="text-lg text-ink-soft">›</span>
        </button>
      </li>
    );
  };
  return (
    <Sheet title="Highlights" kicker={trainer.name} accent={MYSTIC} subtitle={trainer.headline.join(". ")} onClose={onClose}>
      <div className="flex flex-wrap gap-2">
        <a href="/resume" className="go-pill rounded-full px-5 py-2 text-sm transition active:scale-95">
          Resume
        </a>
        <a href={`mailto:${trainer.email}`} className="go-pill rounded-full px-5 py-2 text-sm transition active:scale-95">
          Email me
        </a>
        {trainer.links
          .filter((l) => l.label === "GitHub" || l.label === "LinkedIn")
          .map((l) => (
            <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="rounded-full bg-ink/6 px-4 py-2 text-sm font-bold transition hover:bg-ink/12">
              {l.label}
            </a>
          ))}
      </div>
      <Label>Jobs</Label>
      <ul>{jobs.map(row)}</ul>
      <Label>Projects</Label>
      <ul>{projects.map(row)}</ul>
      <Label>Hackathon wins</Label>
      <ul>{wins.map(row)}</ul>
    </Sheet>
  );
}

/** A rolled-up page with a Poké Ball seal, for the resume key item. */
/** GO's Postcard Book: a little stack of cards. */
function PostcardIcon() {
  return (
    <svg viewBox="0 0 40 40" width={36} height={36} aria-hidden>
      <rect x="9" y="7" width="24" height="18" rx="2.5" fill="#cfe9ec" transform="rotate(-8 21 16)" />
      <rect x="6" y="13" width="26" height="19" rx="2.5" fill="#ffffff" stroke="#24828b" strokeWidth="1.6" />
      <rect x="8.5" y="15.5" width="21" height="10" rx="1.5" fill="#2fd3c6" />
      <path d="M8.5 25.5 15 19l4 4 3-3 7.5 5.5Z" fill="#24828b" />
      <rect x="8.5" y="27.5" width="12" height="2" rx="1" fill="#30555d" />
    </svg>
  );
}

function ResumeIcon() {
  return (
    <svg viewBox="0 0 40 40" width="38" height="38" aria-hidden>
      <path d="M10 5h15l6 6v24H10Z" fill="#fff" stroke="#3a5560" strokeWidth="2" strokeLinejoin="round" />
      <path d="M25 5v6h6" fill="none" stroke="#3a5560" strokeWidth="2" strokeLinejoin="round" />
      <path d="M14 16h12M14 20h12M14 24h8" stroke="#9fb3bd" strokeWidth="2" strokeLinecap="round" />
      <circle cx="26" cy="29" r="5" fill="#ff2a18" stroke="#151c24" strokeWidth="1.5" />
      <path d="M21 29h10" stroke="#151c24" strokeWidth="1.5" />
      <circle cx="26" cy="29" r="1.6" fill="#fff" stroke="#151c24" strokeWidth="1" />
    </svg>
  );
}

/** Your trainer profile: your level, what you've done on the base, and your medals. */
export function ProfilePanel({ onClose, onTab }: { onClose: () => void; onTab?: (tab: "tyler" | "you") => void }) {
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
    <Sheet title={`Level ${level}`} kicker={progress.team ? TEAMS[progress.team].name : "You"} accent={progress.team ? TEAMS[progress.team].color : MYSTIC} onClose={onClose}>
      {onTab ? <ProfileTabs current="you" onPick={onTab} /> : null}
      {progress.team ? null : (
        <p className="mb-4 rounded-2xl bg-ink/5 px-4 py-3 text-sm text-ink-soft">{level >= TEAM_LEVEL ? "Tap any gym to pick a team." : `At level ${TEAM_LEVEL} you can pick a team, like GO.`}</p>
      )}
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
