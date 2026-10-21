"use client";

import { type ReactNode, useState, useSyncExternalStore } from "react";
import { badgeTier, type Egg, type Gym, type MapObject, media, monthsAt, type Raid, type Role, skills, type SkillId, type Spawn, type Stop, tenure } from "@/content";
import { Shot } from "@/app/Shot";
import { GOLD_INK, LURE, MYSTIC, RAID_EGG } from "../colors";
import { Sheet } from "./Sheet";
import { BADGE, EggIcon, GymBadge, GymIcon, RaidIcon, StopIcon } from "./icons";
import { ShareLink } from "./Share";
import { SpinDisc } from "./SpinDisc";
import { progressStore } from "../progress";
import { premierBalls, type RaidBoss, RAID_BOSS } from "../raidBosses";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const month = (m: string) => {
  const [y, mm] = m.split("-").map(Number);
  return `${MONTHS[mm - 1]} ${y}`;
};
const span = (r: Role) => `${month(r.start)} - ${r.end ? month(r.end) : "present"}`;

/**
 * GO-style screens for everything on the map: a gym for a job, a PokéStop for
 * a project, a raid for a hackathon, a Pokédex entry for a fun fact, and an
 * egg for work in progress. They all share the one panel look.
 */
export function Card({
  object,
  onClose,
  onAbout,
  onBonus,
}: {
  object: MapObject;
  onClose: () => void;
  onAbout: () => void;
  onBonus: (slug: string) => void;
}) {
  const view = cardFor(object, onAbout, onBonus);
  return (
    <Sheet side title={view.title} onClose={onClose} art={view.art} kicker={view.kicker} accent={view.accent} subtitle={view.subtitle}>
      <div className="space-y-5">
        {view.body}
        {object.kind === "gym" || object.kind === "stop" || object.kind === "raid" ? <ShareLink slug={object.slug} title={view.title} /> : null}
      </div>
    </Sheet>
  );
}

type View = { accent: string; art: ReactNode; kicker: string; title: string; subtitle?: string; body: ReactNode };

function cardFor(o: MapObject, onAbout: () => void, onBonus: (slug: string) => void): View {
  switch (o.kind) {
    case "gym":
      return gymCard(o);
    case "stop":
      return stopCard(o);
    case "raid":
      return raidCard(o, onBonus);
    case "spawn":
      return spawnCard(o, onAbout);
    case "egg":
      return eggCard(o);
  }
}

function gymCard(g: Gym): View {
  return {
    accent: MYSTIC,
    art: <GymIcon size={40} />,
    kicker: "Team Mystic gym",
    title: g.org,
    subtitle: g.location,
    body: (
      <>
        {g.summary ? <p className="text-base leading-relaxed">{g.summary}</p> : null}
        <Stats stats={g.stats ?? []} />
        <Badge gym={g} />
        {g.roles.map((r) => (
          <div key={r.title + r.start}>
            <h3 className="font-display text-lg font-semibold">{r.title}</h3>
            <p className="text-sm text-ink-soft">
              {span(r)}
              {r.team ? `, ${r.team}` : ""}
            </p>
            <Bullets items={r.bullets} />
          </div>
        ))}
        <Stack ids={g.stack} />
      </>
    ),
  };
}

/** The gym's badge, like GO's badge screen: its tier is how long Tyler was there. */
function Badge({ gym }: { gym: Gym }) {
  const tier = badgeTier(gym);
  return (
    <div className="flex items-center gap-3.5 rounded-2xl bg-ink/5 px-3.5 py-2.5">
      <span className="item-pop shrink-0">
        <GymBadge tier={tier} size={34} />
      </span>
      <div>
        <p className="font-display text-base font-semibold">{BADGE[tier].name} Gym Badge</p>
        <p className="text-sm text-ink-soft">{tenure(monthsAt(gym))} here</p>
      </div>
    </div>
  );
}

function stopCard(s: Stop): View {
  return {
    accent: s.featured ? LURE : MYSTIC,
    art: (
      <span className="disc-spin">
        <StopIcon size={36} lured={s.featured} />
      </span>
    ),
    kicker: s.featured ? "PokéStop, lured" : "PokéStop",
    title: s.name,
    subtitle: `${s.period}, ${s.role}`,
    body: (
      <>
        {media[s.slug] ? <Shot m={media[s.slug]} className="rounded-2xl bg-ink/5" /> : null}
        <p className="text-base leading-relaxed">{s.tagline}</p>
        <Stats stats={s.stats} />
        <Bullets items={s.highlights} />
        <Stack ids={s.stack} />
        <Links links={s.links} />
        <SpinDisc slug={s.slug} lured={s.featured} photo={media[s.slug]?.disc} />
      </>
    ),
  };
}

function raidCard(r: Raid, onBonus: (slug: string) => void): View {
  const egg = RAID_EGG[r.stars];
  const boss = RAID_BOSS[r.slug];
  return {
    accent: egg === RAID_EGG[3] ? GOLD_INK : egg,
    art: boss ? (
      // eslint-disable-next-line @next/next/no-img-element -- tiny local portrait
      <img src={`/portraits/${boss.dex}.webp`} alt={boss.name} width={60} height={60} className="object-contain" />
    ) : (
      <RaidIcon stars={r.stars} size={38} />
    ),
    kicker: `${"★".repeat(r.stars)} Raid`,
    title: r.event,
    subtitle: `${r.dates}, ${r.venue}`,
    body: (
      <>
        {r.result ? (
          <p className="inline-flex items-center gap-2 rounded-full bg-gold/25 px-3.5 py-1.5 text-sm font-bold text-ink">
            <span aria-hidden className="size-2.5 rounded-full bg-gold ring-2 ring-gold/40" />
            {r.result}
          </p>
        ) : null}
        {media[r.slug] ? <Shot m={media[r.slug]} className="rounded-2xl bg-ink/5" /> : null}
        <div>
          <h3 className="font-display text-lg font-semibold">{r.project.name}</h3>
          <p className="mt-0.5 leading-relaxed">{r.project.tagline}</p>
        </div>
        <Bullets items={r.project.built} />
        {r.project.team.length ? (
          <p className="text-sm text-ink-soft">With {r.project.team.join(", ")}</p>
        ) : null}
        <Stack ids={r.project.stack} />
        <Links links={r.project.links} />
        {/* the game part last: the boss that hatched here, and GO's bonus round */}
        {boss ? (
          <p className="text-sm text-ink-soft">
            Raid boss: <span className="font-semibold text-ink">{boss.name}</span>, {boss.nod}
          </p>
        ) : null}
        {boss ? <BonusRound raid={r} boss={boss} onBonus={onBonus} /> : null}
      </>
    ),
  };
}

/** GO's bonus round after a raid: one try at the boss with Premier Balls, or how it went. */
function BonusRound({ raid, boss, onBonus }: { raid: Raid; boss: RaidBoss; onBonus: (slug: string) => void }) {
  const result = useSyncExternalStore(progressStore.subscribe, () => progressStore.get().bonus[raid.slug], () => undefined);
  if (result !== undefined)
    return (
      <p className="text-sm font-semibold text-ink-soft">
        {result ? `Caught ${boss.name} in the bonus round.` : `${boss.name} got away. GO only gives one bonus round per raid.`}
      </p>
    );
  return (
    <button
      type="button"
      onClick={() => onBonus(raid.slug)}
      className="go-pill inline-flex items-center gap-2.5 rounded-full px-5 py-2.5 transition active:scale-95"
    >
      <PremierBall />
      Catch {boss.name}
      <span className="text-sm font-semibold opacity-80">{premierBalls(raid)} Premier Balls</span>
    </button>
  );
}

function PremierBall() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <circle cx="12" cy="12" r="10.5" fill="#fff" stroke="#c9d1d9" strokeWidth="1.5" />
      <path d="M1.5 12h21" stroke="#e3350d" strokeWidth="2" />
      <circle cx="12" cy="12" r="3.4" fill="#fff" stroke="#e3350d" strokeWidth="2" />
    </svg>
  );
}

function spawnCard(s: Spawn, onAbout: () => void): View {
  return {
    accent: "#2e9e57",
    art: (
      // eslint-disable-next-line @next/next/no-img-element -- tiny local sprite
      <img src={`/portraits/${s.pokemon.dex}.webp`} alt={s.pokemon.name} width={60} height={60} className="object-contain" />
    ),
    kicker: `Wild ${s.pokemon.name}, No. ${String(s.pokemon.dex).padStart(4, "0")}`,
    title: s.title,
    body: (
      <>
        <p className="text-base leading-relaxed">{s.body}</p>
        {s.opensAbout ? (
          <button
            type="button"
            onClick={onAbout}
            className="go-pill rounded-full px-6 py-2.5 transition active:scale-95"
          >
            Wake it up
          </button>
        ) : null}
      </>
    ),
  };
}

function eggCard(e: Egg): View {
  return {
    accent: "#d9771f",
    art: <EggIcon km={e.km} size={34} />,
    kicker: `${e.km} km egg, still hatching`,
    title: e.title,
    body: (
      <>
        <p className="text-base leading-relaxed">{e.body}</p>
        <Stack ids={e.stack} />
      </>
    ),
  };
}

/** The first point, with the rest a tap away, so a card reads at a glance. */
/** The headline numbers, popping in like a stop's items. */
function Stats({ stats }: { stats: { value: string; label: string }[] }) {
  if (!stats.length) return null;
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Numbers">
      {stats.map((stat) => (
        <li key={stat.label} className="item-pop rounded-2xl bg-ink/5 px-3.5 py-2">
          <span className="block font-display text-xl font-semibold">{stat.value}</span>
          <span className="block text-xs font-semibold text-ink-soft">{stat.label}</span>
        </li>
      ))}
    </ul>
  );
}

/** The best bullet (two on a wider screen), and the rest a tap away. */
function Bullets({ items }: { items: string[] }) {
  const [all, setAll] = useState(false);
  if (!items.length) return null;
  const shown = all ? items : items.slice(0, 2);
  return (
    <div className="mt-2">
      <ul className="space-y-1.5">
        {shown.map((b, i) => (
          <li key={b} className={`gap-2 leading-relaxed ${!all && i === 1 ? "hidden sm:flex" : "flex"}`}>
            <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-mystic-400" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
      {items.length > 1 && !all ? (
        <button
          type="button"
          onClick={() => setAll(true)}
          className={`mt-1.5 pl-3.5 text-sm font-bold text-mystic-500 hover:underline ${items.length === 2 ? "sm:hidden" : ""}`}
        >
          <span className="sm:hidden">{items.length - 1} more</span>
          <span className="max-sm:hidden">{items.length - 2} more</span>
        </button>
      ) : null}
    </div>
  );
}

function Stack({ ids }: { ids: SkillId[] }) {
  if (!ids.length) return null;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Built with">
      {ids.map((id) => (
        <li key={id} className="rounded-full bg-ink/6 px-2.5 py-1 text-xs font-semibold text-ink-soft">
          {skills[id].name}
        </li>
      ))}
    </ul>
  );
}

function Links({ links }: { links: { label: string; href: string }[] }) {
  if (!links.length) return null;
  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {links.map((l) => (
        <a
          key={l.href}
          href={l.href}
          target="_blank"
          rel="noreferrer"
          className="go-pill rounded-full px-5 py-2 text-sm transition active:scale-95"
        >
          {l.label}
        </a>
      ))}
    </div>
  );
}
