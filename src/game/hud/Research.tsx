"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { gyms, spawns, stops, trainer } from "@/content";
import { monthsAt } from "@/content/badges";
import { BREAKTHROUGH_DEX, STAMPS, streakNow, type Streak } from "../daily";
import { type GoEvent, whenIs, withSpotlight } from "../events";
import { bostonDay, type FieldTask } from "../field";
import { DEFENDER } from "../objects";
import { addItems, claimBreakthrough, claimField, claimTimed, gainXp, progressStore } from "../progress";
import { timedNow } from "../timed";
import { nameOf } from "../spawnPoints";
import { ItemIcon } from "./icons";
import { claimStep, researchState, researchStore, STEPS } from "../research";
import { sfx } from "../sound";
import { Sheet } from "./Sheet";

/*
 * GO's Today View (notes/research/go-round-3.md 3 and 4), behind the
 * binoculars: TODAY has your Field Research, the Breakthrough stamps,
 * what's happening now and your daily streaks; EVENTS what's coming up and a
 * Collection Challenge; SPECIAL is Tyler's Special Research (research.ts), the
 * step you're on, his line, three tasks and a reward, ending on his trainer
 * card. The button turns orange when there's something to claim, like GO's.
 */

function useResearch() {
  const progress = useSyncExternalStore(progressStore.subscribe, progressStore.get, progressStore.server);
  const claimed = useSyncExternalStore(researchStore.subscribe, researchStore.get, researchStore.server);
  return researchState(progress, claimed);
}

/** GO's binoculars. */
function Binoculars({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <path d="M9 6h4l1 7h4l1-7h4l3 12" fill="none" stroke="#30555d" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx="9" cy="21" r="5.5" fill="#ffffff" stroke="#30555d" strokeWidth="2.6" />
      <circle cx="23" cy="21" r="5.5" fill="#ffffff" stroke="#30555d" strokeWidth="2.6" />
      <circle cx="9" cy="21" r="2.2" fill="#2fd3c6" />
      <circle cx="23" cy="21" r="2.2" fill="#2fd3c6" />
    </svg>
  );
}

/** The round research button: orange when there's a reward to claim anywhere in it, like GO's. */
export function ResearchButton({ onOpen }: { onOpen: () => void }) {
  const r = useResearch();
  const p = useSyncExternalStore(progressStore.subscribe, progressStore.get, progressStore.server);
  const ready = r.claimable || p.stamps.length >= STAMPS || p.field.some((t) => !t.claimed && t.have >= t.need);
  // finishing a task (not a whole step) is worth a little XP, like GO's field research
  const seen = useRef<string | null>(null);
  useEffect(() => {
    const key = `${r.step}:${r.tasks.map((t) => t.done >= t.need).join()}`;
    if (seen.current !== null && seen.current !== key && seen.current.startsWith(`${r.step}:`)) {
      const before = seen.current.split(":")[1].split(",");
      r.tasks.forEach((t, i) => {
        if (t.done >= t.need && before[i] !== "true") gainXp(100, `research: ${t.text.toLowerCase()}`);
      });
    }
    seen.current = key;
  }, [r]);
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={ready ? "Today: a reward is ready" : "Today"}
      className={`panel relative grid size-14 place-items-center rounded-full transition hover:scale-[1.04] active:scale-95 ${ready ? "bg-[#f89800]!" : ""}`}
    >
      <Binoculars />
    </button>
  );
}

/** GO's Today View tabs. */
type Tab = "today" | "events" | "special";

/** GO's small uppercase section heads. */
function Head({ children }: { children: string }) {
  return <h3 className="mt-6 mb-2 text-xs font-bold tracking-[0.16em] text-ink-soft uppercase first:mt-0">{children}</h3>;
}

/** One Field Research task, like GO's: what to do, a progress bar, the reward, and Claim once it's done. */
function FieldCard({ t, onEncounter }: { t: FieldTask; onEncounter: (dex: number, key: string) => void }) {
  const done = t.have >= t.need;
  const from = stops.find((s) => s.slug === t.stop)?.name ?? t.stop;
  const claim = () => {
    sfx.claim();
    const r = t.reward;
    // an encounter stays claimable until it's caught: run from it and it waits, like GO's
    if ("encounter" in r) return onEncounter(r.encounter, `${t.stop}|${t.day}`);
    claimField(t.stop, t.day);
    if ("xp" in r) gainXp(r.xp, "field research");
    else {
      addItems(r.items);
      gainXp(100, "field research");
    }
  };
  const r = t.reward;
  return (
    <li className={`rounded-2xl px-3.5 py-3 ${done ? "bg-[#e9f8ee]" : "bg-ink/5"}`}>
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold">{t.text}</p>
          <p className="truncate text-xs text-ink-soft">From {from}</p>
        </div>
        {/* the reward, like GO's: an encounter shows the Pokémon */}
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-surface" title={"encounter" in r ? `${nameOf(r.encounter)} encounter` : "Items"}>
          {"encounter" in r ? (
            // eslint-disable-next-line @next/next/no-img-element -- tiny local portrait
            <img src={`/portraits/${r.encounter}.webp`} alt={`${nameOf(r.encounter)} encounter`} width={36} height={36} className="size-9 object-contain" />
          ) : "items" in r && r.items.great ? (
            <ItemIcon id="great" size={26} />
          ) : (
            <ItemIcon id="ball" size={26} />
          )}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="h-2 flex-1 overflow-hidden rounded-full bg-ink/10">
          <span className="block h-full rounded-full bg-gradient-to-r from-[#f7b03e] to-[#f08a3c]" style={{ width: `${(Math.min(t.have, t.need) / t.need) * 100}%` }} />
        </span>
        <span className="text-xs font-bold tabular-nums text-ink-soft">
          {Math.min(t.have, t.need)}/{t.need}
        </span>
        {done ? (
          <button type="button" onClick={claim} className="go-pill rounded-full px-4 py-1 text-xs font-bold text-white">
            Claim
          </button>
        ) : null}
      </div>
    </li>
  );
}

/** One stamp: ours are a Poké Ball, Tyler's initials and Teddy's paw, in GO's red and blue ink. */
function Stamp({ kind }: { kind: number }) {
  return (
    <svg viewBox="0 0 32 32" className="size-full" aria-hidden>
      <circle cx="16" cy="16" r="14" fill="#fff8ec" stroke={kind === 1 ? "#2f6fd0" : "#d8463c"} strokeWidth="2" strokeDasharray="3 1.6" />
      {kind === 0 ? (
        <g fill="none" stroke="#d8463c" strokeWidth="2.2">
          <circle cx="16" cy="16" r="7.5" />
          <path d="M8.5 16h15" />
          <circle cx="16" cy="16" r="2.4" fill="#fff8ec" />
        </g>
      ) : kind === 1 ? (
        <text x="16" y="20.5" textAnchor="middle" fontSize="12" fontWeight="900" fill="#2f6fd0" fontFamily="sans-serif">
          TD
        </text>
      ) : (
        <g fill="#d8463c">
          <ellipse cx="16" cy="19.5" rx="4.6" ry="3.8" />
          <circle cx="10.6" cy="14.4" r="2" />
          <circle cx="14" cy="11.4" r="2" />
          <circle cx="18" cy="11.4" r="2" />
          <circle cx="21.4" cy="14.4" r="2" />
        </g>
      )}
    </svg>
  );
}

/** GO's Breakthrough box: a brown parcel tied with twine. */
function Parcel({ ready }: { ready: boolean }) {
  return (
    <svg viewBox="0 0 40 40" className={`size-full ${ready ? "" : "opacity-45 grayscale"}`} aria-hidden>
      <rect x="5" y="11" width="30" height="24" rx="3" fill="#c48a52" />
      <rect x="5" y="11" width="30" height="7" rx="3" fill="#d9a06a" />
      <path d="M20 11v24M5 22h30" stroke="#f3e2c2" strokeWidth="2.4" />
      <path d="M20 11c-3-6-10-6-8-1 1 2 5 2 8 1Zm0 0c3-6 10-6 8-1-1 2-5 2-8 1Z" fill="none" stroke="#f3e2c2" strokeWidth="2.2" />
      <circle cx="29" cy="29" r="3.2" fill="none" stroke="#d8463c" strokeWidth="1.4" />
    </svg>
  );
}

/** The stamp row: six stamps, the seventh opens the box. */
function Stamps({ onEncounter }: { onEncounter: (dex: number, key: string) => void }) {
  const { stamps } = useSyncExternalStore(progressStore.subscribe, progressStore.get, progressStore.server);
  const ready = stamps.length >= STAMPS;
  const left = STAMPS - stamps.length;
  const open = () => {
    if (!claimBreakthrough()) return;
    sfx.open();
    onEncounter(BREAKTHROUGH_DEX, `breakthrough|${bostonDay()}`);
  };
  return (
    <div className="mt-3 rounded-2xl bg-ink/5 px-3 pt-3 pb-2.5">
      <div className="flex items-center justify-between gap-1">
        {Array.from({ length: STAMPS - 1 }, (_, k) => (
          <span key={k} className={`grid size-9 place-items-center rounded-full ${k < stamps.length ? "" : "border-2 border-dashed border-ink/15"}`}>
            {k < stamps.length ? <Stamp kind={k % 3} /> : null}
          </span>
        ))}
        <button type="button" disabled={!ready} onClick={open} aria-label={ready ? "Open your Research Breakthrough" : "Research Breakthrough"} className={`size-12 ${ready ? "animate-bounce" : ""}`}>
          <Parcel ready={ready} />
        </button>
      </div>
      <p className="mt-1.5 text-center text-xs font-semibold text-ink-soft">
        {ready ? "Your Breakthrough is ready. Tap the box!" : `Next Breakthrough in ${left} more stamp${left === 1 ? "" : "s"}: one a day, for the first reward you claim.`}
      </p>
    </div>
  );
}

function FieldList({ onEncounter }: { onEncounter: (dex: number, key: string) => void }) {
  const { field } = useSyncExternalStore(progressStore.subscribe, progressStore.get, progressStore.server);
  const open = field.filter((t) => !t.claimed);
  return (
    <div>
      {open.length ? (
        <ul className="space-y-2.5">
          {open.map((t) => (
            <FieldCard key={`${t.stop}:${t.day}`} t={t} onEncounter={onEncounter} />
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl bg-ink/5 px-4 py-5 text-center text-sm text-ink-soft">Spin a PokéStop to get its Field Research task. You can hold three.</p>
      )}
      <Stamps onEncounter={onEncounter} />
    </div>
  );
}

/** An event, GO's news-card style. */
function EventCard({ e, live }: { e: GoEvent; live: boolean }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-surface shadow-[0_2px_10px_rgba(48,85,93,0.12)]">
      <div
        className={`px-3.5 py-2 text-white ${e.id.startsWith("halloween") ? "bg-gradient-to-r from-[#7a3fc0] to-[#f87010]" : e.id.startsWith("spotlight") ? "bg-gradient-to-r from-[#f2a03c] to-[#f6c94a]" : "bg-gradient-to-r from-[#24828b] to-[#2fd3c6]"}`}
      >
        <p className="font-display text-base font-black">{e.name}</p>
        <p className="text-xs font-semibold opacity-90">{live ? `Until ${whenIs(e.to)}` : `${whenIs(e.from)} to ${whenIs(e.to)}`}</p>
      </div>
      <p className="px-3.5 py-2.5 text-sm leading-snug">{e.blurb}</p>
    </div>
  );
}

/** A streak: seven circles, filled for the days done in a row, today's ringed, day 7 a little bigger. */
function StreakRow({ label, s, note }: { label: string; s: Streak; note: string }) {
  const { n, today } = streakNow(s);
  return (
    <div className="rounded-2xl bg-ink/5 px-3.5 py-3">
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-semibold">{label}</span>
        <span className="text-xs font-bold text-ink-soft">{n ? `Day ${n}` : "Not started"}</span>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        {Array.from({ length: 7 }, (_, k) => (
          <span
            key={k}
            className={`rounded-full ${k === 6 ? "size-5" : "size-4"} ${k < n ? "bg-[#2ccda9]" : "bg-ink/12"} ${today && k === n - 1 ? "ring-2 ring-[#24828b] ring-offset-1" : ""}`}
          />
        ))}
      </div>
      <p className="mt-1.5 text-xs text-ink-soft">{note}</p>
    </div>
  );
}

function TodayTab({ onEncounter, now }: { onEncounter: (dex: number, key: string) => void; now: number }) {
  const { streaks } = useSyncExternalStore(progressStore.subscribe, progressStore.get, progressStore.server);
  const calendar = withSpotlight(now, nameOf);
  const live = calendar.filter((e) => now >= e.from && now < e.to);
  const next = calendar.filter((e) => now < e.from).sort((a, b) => a.from - b.from)[0];
  return (
    <div>
      <Head>Field Research</Head>
      <FieldList onEncounter={onEncounter} />
      <Head>Happening now</Head>
      {live.length ? (
        <div className="space-y-2.5">
          {live.map((e) => (
            <EventCard key={e.id} e={e} live />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl bg-ink/5 px-4 py-4 text-sm text-ink-soft">Nothing&apos;s on right now.{next ? ` Next up: ${next.name}, from ${whenIs(next.from)}.` : ""}</p>
      )}
      <Head>Daily activities</Head>
      <div className="space-y-2.5">
        <StreakRow label="Catch streak" s={streaks.catch} note="First catch of the day: 1,500 XP, and 6,000 on day 7." />
        <StreakRow label="Spin streak" s={streaks.spin} note="First spin of the day: 500 XP and a few balls, and 2,000 on day 7." />
      </div>
      <Head>Pokémon in Gyms</Head>
      <ul className="grid grid-cols-2 gap-2">
        {gyms.map((g) => (
          <li key={g.slug} className="flex items-center gap-2 rounded-2xl bg-ink/5 px-2.5 py-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- tiny local portrait */}
            <img src={`/portraits/${DEFENDER[g.slug] ?? 25}.webp`} alt="" width={34} height={34} className="size-8.5 shrink-0 object-contain" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{g.org.replace(/ \(.*\)$/, "")}</span>
              <span className="block text-xs text-ink-soft">{monthsAt(g)} months held</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EventsTab({ now, onEncounter }: { now: number; onEncounter: (dex: number, key: string) => void }) {
  const { caught, timed } = useSyncExternalStore(progressStore.subscribe, progressStore.get, progressStore.server);
  const soon = withSpotlight(now, nameOf)
    .filter((e) => now < e.from)
    .sort((a, b) => a.from - b.from);
  const got = spawns.filter((s) => caught[s.pokemon.dex]).length;
  const running = timedNow(now);
  return (
    <div>
      {running.length ? <Head>Timed research</Head> : null}
      {running.map((t) => {
        const mine = timed[t.id] ?? { have: t.tasks.map(() => 0), claimed: false };
        const done = mine.have.every((n, i) => n >= t.tasks[i].need);
        return (
          <div key={t.id} className="mb-2 rounded-2xl bg-surface p-3.5 shadow-[0_2px_10px_rgba(48,85,93,0.12)]">
            <div className="flex items-center justify-between">
              <p className="font-display text-base font-black">{t.name}</p>
              <span className="text-xs font-semibold text-ink-soft">Until {whenIs(t.to)}</span>
            </div>
            <ul className="mt-2 space-y-2">
              {t.tasks.map((task, i) => (
                <li key={task.text}>
                  <div className="flex justify-between text-sm font-semibold">
                    <span>{task.text}</span>
                    <span className="text-xs text-ink-soft tabular-nums">
                      {Math.min(mine.have[i], task.need)}/{task.need}
                    </span>
                  </div>
                  <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-ink/10">
                    <span className="block h-full rounded-full bg-linear-to-r from-[#f7b03e] to-[#f08a3c]" style={{ width: `${(Math.min(mine.have[i], task.need) / task.need) * 100}%` }} />
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-xs text-ink-soft">
                {/* eslint-disable-next-line @next/next/no-img-element -- tiny local portrait */}
                <img src={`/portraits/${t.reward.encounter}.webp`} alt="" width={30} height={30} className="size-7.5 object-contain" />
                {nameOf(t.reward.encounter)} encounter and 3 Great Balls
              </span>
              {mine.claimed ? (
                <span className="text-xs font-bold text-ink-soft">Claimed</span>
              ) : (
                <button
                  type="button"
                  disabled={!done}
                  onClick={() => {
                    if (!claimTimed(t.id)) return;
                    sfx.claim();
                    onEncounter(t.reward.encounter, `timed|${t.id}`);
                  }}
                  className="go-pill rounded-full px-4 py-1.5 text-xs disabled:opacity-40"
                >
                  Claim
                </button>
              )}
            </div>
          </div>
        );
      })}
      <Head>Upcoming events</Head>
      {soon.length ? (
        <div className="space-y-2.5">
          {soon.map((e) => (
            <EventCard key={e.id} e={e} live={false} />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl bg-ink/5 px-4 py-4 text-sm text-ink-soft">Nothing new on the calendar yet.</p>
      )}
      <Head>Collection challenge</Head>
      <div className="rounded-2xl bg-ink/5 px-3.5 py-3">
        <div className="flex items-center justify-between">
          <span className="text-[15px] font-semibold">Facts about Tyler</span>
          <span className="text-xs font-bold text-ink-soft tabular-nums">
            {got}/{spawns.length}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-ink-soft">Catch every Pokémon that knows a fact about him.</p>
        <div className="mt-2.5 grid grid-cols-7 gap-1.5">
          {spawns.map((s) => (
            // eslint-disable-next-line @next/next/no-img-element -- tiny local portrait
            <img
              key={s.slug}
              src={`/portraits/${s.pokemon.dex}.webp`}
              alt={caught[s.pokemon.dex] ? s.pokemon.name : "Not caught yet"}
              width={36}
              height={36}
              className={`size-9 object-contain ${caught[s.pokemon.dex] ? "" : "brightness-0 opacity-30"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ResearchPanel({ onClose, onEncounter }: { onClose: () => void; onEncounter: (dex: number, key: string) => void }) {
  const r = useResearch();
  const step = STEPS[r.step];
  const [tab, setTab] = useState<Tab>("today");
  const [now] = useState(Date.now);
  const claim = () => {
    if (!step || !r.claimable) return;
    sfx.claim();
    gainXp(step.reward.xp, `special research: ${step.title.toLowerCase()}`);
    addItems(step.reward.items);
    claimStep();
  };
  return (
    <Sheet title="Today" onClose={onClose}>
      <div role="tablist" aria-label="Today View" className="mb-4 flex justify-center gap-1">
        {(
          [
            ["today", "Today"],
            ["events", "Events"],
            ["special", "Special"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`go-title border-b-2 px-4 py-1.5 text-xs transition ${tab === id ? "border-ink text-ink" : "border-transparent text-ink-soft hover:text-ink"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "today" ? <TodayTab onEncounter={onEncounter} now={now} /> : null}
      {tab === "events" ? <EventsTab now={now} onEncounter={onEncounter} /> : null}
      {tab === "special" ? (
      <div className="rounded-3xl bg-surface p-4 shadow-[0_2px_10px_rgba(48,85,93,0.12)]">
        <p className="text-xs font-bold tracking-[0.14em] text-[#e8913a] uppercase">Tyler&apos;s Journey</p>
        <p className="mt-0.5 text-sm font-semibold text-ink-soft">
          {r.done ? "Complete" : `Step ${r.step + 1} of ${STEPS.length}`}
        </p>
        <div className="mt-2 flex gap-1.5">
          {STEPS.map((s, i) => (
            <span key={s.title} className={`h-1.5 flex-1 rounded-full ${i < r.step ? "bg-[#e8913a]" : i === r.step ? "bg-[#e8913a]/45" : "bg-ink/10"}`} />
          ))}
        </div>
        {step ? (
          <>
            <h3 className="mt-4 font-display text-xl font-black">{step.title}</h3>
            <p className="mt-1 text-[15px] leading-snug">{step.story}</p>
            <ul className="mt-4 space-y-2.5">
              {r.tasks.map((t) => {
                const done = t.done >= t.need;
                return (
                  <li key={t.text} className={`rounded-2xl px-3.5 py-3 ${done ? "bg-[#e9f8ee]" : "bg-ink/5"}`}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[15px] font-semibold">{t.text}</span>
                      {done ? (
                        <span aria-label="done" className="grid size-6 shrink-0 place-items-center rounded-full bg-[#2ccda9] text-sm font-black text-white">
                          ✓
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-ink/10">
                        <span className="block h-full rounded-full bg-gradient-to-r from-[#f7b03e] to-[#f08a3c]" style={{ width: `${(t.done / t.need) * 100}%` }} />
                      </span>
                      <span className="text-xs font-bold tabular-nums text-ink-soft">
                        {t.done}/{t.need}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-ink/10 px-3.5 py-3">
              <span className="text-sm">
                <span className="block text-xs font-bold tracking-wider text-ink-soft uppercase">Reward</span>
                {step.reward.label}
              </span>
              <button type="button" disabled={!r.claimable} onClick={claim} className="go-pill shrink-0 rounded-full px-5 py-2 font-bold text-white disabled:opacity-40">
                Claim
              </button>
            </div>
          </>
        ) : (
          <TrainerCard />
        )}
      </div>
      ) : null}
      {tab === "special" && step ? (
        <p className="mt-4 text-sm text-ink-soft">
          Want it all at once? The <a href="/text" className="font-semibold text-[#24828b] underline">plain version</a> has everything on one page.
        </p>
      ) : null}
    </Sheet>
  );
}

/** The end of the research: Tyler's trainer card, and how to reach him. */
function TrainerCard() {
  const links = trainer.links.filter((l) => ["GitHub", "LinkedIn", "Devpost"].includes(l.label));
  return (
    <div className="mt-4">
      <div className="rounded-3xl bg-gradient-to-br from-[#0474f4] to-[#2fd3c6] p-5 text-white">
        <p className="text-xs font-bold tracking-[0.16em] uppercase opacity-85">Trainer card</p>
        <p className="mt-1 font-display text-3xl font-black">{trainer.name}</p>
        <p className="mt-1 text-sm opacity-90">{trainer.school.degree}, {trainer.school.name}, {trainer.school.graduation}</p>
        <p className="mt-3 text-[15px] leading-snug">You&apos;ve met me: my jobs, my projects, my hackathons and the rest. Thanks for playing. Let&apos;s talk!</p>
      </div>
      <div className="mt-4 grid gap-2">
        <a href={`mailto:${trainer.email}`} className="go-pill rounded-full px-5 py-3 text-center font-bold text-white">
          Email {trainer.email}
        </a>
        <div className="grid grid-cols-3 gap-2">
          {links.map((l) => (
            <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className="rounded-full bg-ink/6 px-3 py-2.5 text-center text-sm font-bold">
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
