"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { stops, trainer } from "@/content";
import type { FieldTask } from "../field";
import { addItems, claimField, gainXp, progressStore } from "../progress";
import { nameOf } from "../spawnPoints";
import { ItemIcon } from "./icons";
import { claimStep, researchState, researchStore, STEPS } from "../research";
import { sfx } from "../sound";
import { Sheet } from "./Sheet";

/*
 * GO's research screen, for Tyler's Special Research (src/game/research.ts):
 * the step you're on, Tyler's line, three tasks with orange progress bars,
 * and the step's reward, claimable once all three are done. The last step
 * ends on his trainer card. A binoculars button sits over Nearby, with a red
 * dot when there's a reward to claim, and finishing a task pops a little XP.
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

/** The round research button, with a red dot when a step's reward is waiting. */
export function ResearchButton({ onOpen }: { onOpen: () => void }) {
  const r = useResearch();
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
      aria-label={r.claimable ? "Research: a reward is ready" : "Research"}
      className="panel relative grid size-14 place-items-center rounded-full transition hover:scale-[1.04] active:scale-95"
    >
      <Binoculars />
      {r.claimable ? <span className="absolute top-1 right-1 size-3.5 rounded-full bg-[#f2342a] ring-2 ring-white" /> : null}
    </button>
  );
}

/** GO's research tabs. */
type Tab = "field" | "special";

/** One Field Research task, like GO's: what to do, a progress bar, the reward, and Claim once it's done. */
function FieldCard({ t, onEncounter }: { t: FieldTask; onEncounter: (dex: number, key: string) => void }) {
  const done = t.have >= t.need;
  const from = stops.find((s) => s.slug === t.stop)?.name ?? t.stop;
  const claim = () => {
    sfx.open();
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

function FieldTab({ onEncounter }: { onEncounter: (dex: number, key: string) => void }) {
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
        <p className="rounded-2xl bg-ink/5 px-4 py-6 text-center text-sm text-ink-soft">Spin a PokéStop to get its Field Research task. You can hold three.</p>
      )}
      <p className="mt-3 text-xs text-ink-soft">Like GO: each stop gives one task a day, the same one for everyone. Some rewards are encounters with Pokémon you can&apos;t find in the wild.</p>
    </div>
  );
}

export function ResearchPanel({ onClose, onEncounter }: { onClose: () => void; onEncounter: (dex: number, key: string) => void }) {
  const r = useResearch();
  const step = STEPS[r.step];
  const [tab, setTab] = useState<Tab>("field");
  const claim = () => {
    if (!step || !r.claimable) return;
    sfx.open();
    gainXp(step.reward.xp, `special research: ${step.title.toLowerCase()}`);
    addItems(step.reward.items);
    claimStep();
  };
  return (
    <Sheet title="Research" onClose={onClose}>
      <div role="tablist" aria-label="Research" className="mb-4 flex justify-center gap-1">
        {(
          [
            ["field", "Field"],
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
      {tab === "field" ? <FieldTab onEncounter={onEncounter} /> : null}
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
