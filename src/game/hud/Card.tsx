"use client";

import type { ReactNode } from "react";
import { type Egg, type Gym, type MapObject, type Raid, type Role, skills, type SkillId, type Spawn, type Stop } from "@/content";
import { LURE, MYSTIC, RAID_EGG } from "../colors";
import { Sheet } from "./Sheet";
import { EggIcon, GymIcon, RaidIcon, StopIcon } from "./icons";
import { SpinDisc } from "./SpinDisc";

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
export function Card({ object, onClose, onAbout }: { object: MapObject; onClose: () => void; onAbout: () => void }) {
  const view = cardFor(object, onAbout);
  return (
    <Sheet title={view.title} onClose={onClose} art={view.art} kicker={view.kicker} accent={view.accent} subtitle={view.subtitle}>
      <div className="space-y-5">{view.body}</div>
    </Sheet>
  );
}

type View = { accent: string; art: ReactNode; kicker: string; title: string; subtitle?: string; body: ReactNode };

function cardFor(o: MapObject, onAbout: () => void): View {
  switch (o.kind) {
    case "gym":
      return gymCard(o);
    case "stop":
      return stopCard(o);
    case "raid":
      return raidCard(o);
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
        <SpinDisc slug={s.slug} lured={s.featured} />
        <p className="text-base leading-relaxed">{s.tagline}</p>
        {s.stats.length ? (
          <ul className="flex flex-wrap gap-2.5" aria-label="Numbers">
            {s.stats.map((stat) => (
              <li key={stat.label} className="item-pop rounded-2xl bg-mystic-50 px-3.5 py-2 text-center text-mystic-900">
                <span className="block font-display text-xl font-semibold">{stat.value}</span>
                <span className="block text-xs font-semibold opacity-75">{stat.label}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <Bullets items={s.highlights} />
        <Stack ids={s.stack} />
        <Links links={s.links} />
      </>
    ),
  };
}

function raidCard(r: Raid): View {
  const egg = RAID_EGG[r.stars];
  return {
    accent: egg === RAID_EGG[3] ? "#c48a12" : egg,
    art: <RaidIcon stars={r.stars} size={38} />,
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
        <div>
          <h3 className="font-display text-lg font-semibold">{r.project.name}</h3>
          <p className="leading-relaxed">{r.project.tagline}</p>
        </div>
        <div>
          <h4 className="text-xs font-bold tracking-wider text-ink-soft uppercase">What I built</h4>
          <Bullets items={r.project.built} />
        </div>
        {r.project.team.length ? (
          <p className="text-sm text-ink-soft">With {r.project.team.join(", ")}</p>
        ) : null}
        <Stack ids={r.project.stack} />
        <Links links={r.project.links} />
      </>
    ),
  };
}

function spawnCard(s: Spawn, onAbout: () => void): View {
  return {
    accent: "#2e9e57",
    art: (
      // eslint-disable-next-line @next/next/no-img-element -- tiny local sprite
      <img src={`/sprites/${s.pokemon.dex}.webp`} alt={s.pokemon.name} width={60} height={60} className="object-contain" />
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
            className="rounded-full bg-teal px-5 py-2.5 font-display font-semibold text-mystic-900 transition hover:brightness-105 active:scale-95"
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

function Bullets({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ul className="mt-2 space-y-1.5">
      {items.map((b) => (
        <li key={b} className="flex gap-2 leading-relaxed">
          <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-mystic-400" />
          <span>{b}</span>
        </li>
      ))}
    </ul>
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
          className="rounded-full bg-teal px-4 py-2 text-sm font-bold text-mystic-900 transition hover:brightness-105 active:scale-95"
        >
          {l.label}
        </a>
      ))}
    </div>
  );
}
