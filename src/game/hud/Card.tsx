"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { type Egg, type Gym, type MapObject, type Raid, type Role, skills, type SkillId, type Spawn, type Stop } from "@/content";
import { EGG_SPOTS, RAID_EGG } from "../colors";
import { EggIcon, GymIcon, RaidIcon, StopIcon } from "./icons";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const month = (m: string) => {
  const [y, mm] = m.split("-").map(Number);
  return `${MONTHS[mm - 1]} ${y}`;
};
const span = (r: Role) => `${month(r.start)} - ${r.end ? month(r.end) : "present"}`;

/**
 * GO-style screens for everything on the map: a gym for a job, a PokéStop for
 * a project, a raid for a hackathon, a Pokédex entry for a fun fact, and an
 * egg for work in progress. A sheet on phones, a card on bigger screens.
 */
export function Card({ object, onClose }: { object: MapObject; onClose: () => void }) {
  const close = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    close.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const view = cardFor(object);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button type="button" aria-label="Close" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-mystic-900/35 backdrop-blur-[2px]" />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-title"
        className="card-in relative flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-surface text-ink shadow-2xl sm:max-w-lg sm:rounded-3xl"
      >
        <header className="relative px-6 pt-6 pb-5 text-white" style={{ background: view.band }}>
          <button
            ref={close}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 grid size-10 place-items-center rounded-full bg-white/25 text-2xl leading-none transition hover:bg-white/40"
          >
            ×
          </button>
          <div className="flex items-center gap-4 pr-10">
            <div className="grid size-20 shrink-0 place-items-center rounded-full bg-white/90 shadow-inner">{view.art}</div>
            <div className="min-w-0">
              <p className="text-xs font-bold tracking-wider uppercase opacity-90">{view.kicker}</p>
              <h2 id="card-title" className="font-display text-2xl leading-tight font-semibold">
                {view.title}
              </h2>
              {view.subtitle ? <p className="mt-0.5 text-sm opacity-95">{view.subtitle}</p> : null}
            </div>
          </div>
        </header>
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">{view.body}</div>
      </section>
    </div>
  );
}

type View = { band: string; art: ReactNode; kicker: string; title: string; subtitle?: string; body: ReactNode };

function cardFor(o: MapObject): View {
  switch (o.kind) {
    case "gym":
      return gymCard(o);
    case "stop":
      return stopCard(o);
    case "raid":
      return raidCard(o);
    case "spawn":
      return spawnCard(o);
    case "egg":
      return eggCard(o);
  }
}

function gymCard(g: Gym): View {
  return {
    band: "linear-gradient(135deg, #0b84d6, #1ab6e8)",
    art: <GymIcon size={48} />,
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
    band: s.featured ? "linear-gradient(135deg, #1ab6e8, #f472b6)" : "linear-gradient(135deg, #1ab6e8, #5fd0f2)",
    art: (
      <span className="disc-spin">
        <StopIcon size={40} lured={s.featured} />
      </span>
    ),
    kicker: s.featured ? "PokéStop, lured" : "PokéStop",
    title: s.name,
    subtitle: `${s.period}, ${s.role}`,
    body: (
      <>
        <p className="text-base leading-relaxed">{s.tagline}</p>
        {s.stats.length ? (
          <ul className="flex flex-wrap gap-2.5" aria-label="Numbers">
            {s.stats.map((stat) => (
              <li key={stat.label} className="item-pop rounded-2xl bg-mystic-50 px-3.5 py-2 text-center text-mystic-900 shadow-sm">
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
    band: `linear-gradient(135deg, ${egg}, #0a5a98)`,
    art: <RaidIcon stars={r.stars} size={44} />,
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

function spawnCard(s: Spawn): View {
  return {
    band: "linear-gradient(135deg, #5fb85a, #2fd3c6)",
    art: (
      // eslint-disable-next-line @next/next/no-img-element -- tiny local sprite
      <img src={`/sprites/${s.pokemon.dex}.webp`} alt={s.pokemon.name} width={72} height={72} className="object-contain" />
    ),
    kicker: `Wild ${s.pokemon.name}, No. ${String(s.pokemon.dex).padStart(4, "0")}`,
    title: s.title,
    body: <p className="text-base leading-relaxed">{s.body}</p>,
  };
}

function eggCard(e: Egg): View {
  return {
    band: `linear-gradient(135deg, #f28a2e, ${EGG_SPOTS[e.km]})`,
    art: <EggIcon km={e.km} size={40} />,
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
          className="rounded-full bg-teal px-4 py-2 text-sm font-bold text-mystic-900 shadow transition hover:brightness-105 active:scale-95"
        >
          {l.label}
        </a>
      ))}
    </div>
  );
}
