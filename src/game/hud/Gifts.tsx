"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { media } from "@/content";
import { BOOK_MAX, bundles, GIFT_HOLD, giftLink, placeOf, type Postcard as Card, SEND_XP, stopName } from "../gifts";
import { addItems, type ItemId, openGift, pinPostcard, progressStore, sendGift, toast } from "../progress";
import { sfx } from "../sound";
import { ItemIcon, StopIcon } from "./icons";
import { Sheet } from "./Sheet";

const NAMES: Record<ItemId, string> = { ball: "Poké Ball", great: "Great Ball", razz: "Razz Berry", incense: "Incense" };

/** GO's gift box: a purple-magenta box with a pink ribbon and a bow. */
export function GiftBox({ size = 40 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
      <rect x="6" y="16" width="28" height="20" rx="3" fill="#b3399d" />
      <rect x="4" y="11" width="32" height="7" rx="2.5" fill="#cf4fb7" />
      <rect x="17.5" y="11" width="5" height="25" fill="#ffb3dc" />
      <path d="M20 11c-4-7-12-6-10-1 1 2 6 2 10 1Zm0 0c4-7 12-6 10-1-1 2-6 2-10 1Z" fill="#ffb3dc" stroke="#e98cc4" strokeWidth="1" />
      <rect x="6" y="18" width="28" height="2" fill="#8f2b7e" opacity="0.5" />
    </svg>
  );
}

/** A postcard like GO's: the stop's picture in a white border, its name under it, where it's from, and who sent it. */
export function Postcard({ slug, from, at, big = false }: { slug: string; from?: string; at?: number; big?: boolean }) {
  const pic = media[slug];
  return (
    <figure className={`overflow-hidden rounded-2xl bg-white p-1.5 shadow-[0_2px_10px_rgba(48,85,93,0.18)] ${big ? "" : "text-left"}`}>
      <div className="aspect-[16/10] overflow-hidden rounded-xl bg-[#24828b]">
        {pic ? (
          // eslint-disable-next-line @next/next/no-img-element -- small local webp
          <img src={pic.still ?? pic.src} alt={pic.alt} width={pic.width} height={pic.height} loading="lazy" className="size-full object-cover" />
        ) : (
          <span className="grid size-full place-items-center">
            <StopIcon size={big ? 56 : 34} />
          </span>
        )}
      </div>
      <figcaption className="px-1.5 pt-1.5 pb-1">
        <span className={`block truncate font-display font-black ${big ? "text-lg" : "text-sm"}`}>{stopName(slug)}</span>
        <span className="block truncate text-xs text-ink-soft">
          {placeOf(slug)}
          {from ? ` · from ${from}` : ""}
          {big && at ? ` · ${new Date(at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}
        </span>
      </figcaption>
    </figure>
  );
}

/** Your gifts, GO's way: you can't open your own, so pin the postcard to keep it, and send the gift to a friend. */
export function GiftsPanel({ onClose }: { onClose: () => void }) {
  const { gifts, postcards } = useSyncExternalStore(progressStore.subscribe, progressStore.get, progressStore.server);
  const send = async (slug: string, k: number) => {
    const url = giftLink(slug);
    const canShare = "share" in navigator;
    try {
      if (canShare) await navigator.share({ title: `A gift from ${stopName(slug)}`, text: "I sent you a gift in Tyler's developer town!", url });
      else await navigator.clipboard.writeText(url);
    } catch {
      // closed the share sheet: the gift stays
      return;
    }
    sfx.open();
    sendGift(k);
    toast(canShare ? "Gift sent!" : "Gift link copied. Send it to a friend!");
  };
  return (
    <Sheet title="Gifts" subtitle={`${gifts.length}/${GIFT_HOLD}`} onClose={onClose}>
      {gifts.length ? (
        <ul className="grid grid-cols-2 gap-3">
          {gifts.map((slug, k) => {
            const pinned = postcards.some((p) => p.slug === slug);
            return (
              <li key={`${slug}-${k}`}>
                <Postcard slug={slug} />
                <div className="mt-2 flex gap-1.5">
                  <button
                    type="button"
                    disabled={pinned}
                    onClick={() => {
                      sfx.tap();
                      pinPostcard(slug, "you");
                    }}
                    className="flex-1 rounded-full bg-ink/8 py-1.5 text-xs font-bold disabled:opacity-50"
                  >
                    {pinned ? "Pinned" : "Pin"}
                  </button>
                  <button type="button" onClick={() => void send(slug, k)} className="go-pill flex-1 rounded-full py-1.5 text-xs">
                    Send
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-2xl bg-ink/5 px-4 py-6 text-center text-sm text-ink-soft">Spin Tyler&apos;s PokéStops: sometimes one drops a gift with its postcard.</p>
      )}
      <p className="mt-4 text-xs leading-relaxed text-ink-soft">
        Like GO, you can&apos;t open your own gifts. Pin a postcard to keep it in your Postcard Book, then send the gift to a friend ({SEND_XP} XP each). They open it here.
      </p>
    </Sheet>
  );
}

/** GO's Postcard Book: your pinned postcards, newest first or by sender, and a tap for the full card. */
export function PostcardBook({ onClose, onGo }: { onClose: () => void; onGo: (slug: string) => void }) {
  const { postcards } = useSyncExternalStore(progressStore.subscribe, progressStore.get, progressStore.server);
  const [by, setBy] = useState<"date" | "sender">("date");
  const [open, setOpen] = useState<Card | null>(null);
  const list = [...postcards].sort((a, b) => (by === "date" ? b.at - a.at : a.from.localeCompare(b.from) || b.at - a.at));
  if (open)
    return (
      <Sheet title="Postcard" onClose={() => setOpen(null)}>
        <Postcard slug={open.slug} from={open.from} at={open.at} big />
        <button type="button" onClick={() => onGo(open.slug)} className="go-pill mt-4 w-full rounded-full py-3 text-sm">
          Go to this PokéStop
        </button>
      </Sheet>
    );
  return (
    <Sheet title="Postcard Book" subtitle={`${postcards.length} / ${BOOK_MAX}`} onClose={onClose}>
      {list.length ? (
        <>
          <ul className="grid grid-cols-2 gap-3">
            {list.map((p) => (
              <li key={`${p.slug}-${p.at}`}>
                <button type="button" onClick={() => setOpen(p)} className="block w-full transition hover:-translate-y-0.5">
                  <Postcard slug={p.slug} from={p.from} />
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-end">
            <button type="button" onClick={() => setBy(by === "date" ? "sender" : "date")} className="rounded-full bg-ink/8 px-4 py-1.5 text-xs font-bold">
              Sort: {by === "date" ? "Date" : "Sender"}
            </button>
          </div>
        </>
      ) : (
        <p className="rounded-2xl bg-ink/5 px-4 py-6 text-center text-sm text-ink-soft">Pin a gift&apos;s postcard and it lands here: a picture of each of Tyler&apos;s projects.</p>
      )}
    </Sheet>
  );
}

type Opened = Partial<Record<ItemId, number>>;

/** A gift a friend sent you (a gift link): its postcard first, then OPEN, the box wobbles and the items pop out. */
export function GiftOpen({ slug, onDone }: { slug: string; onDone: () => void }) {
  const { postcards } = useSyncExternalStore(progressStore.subscribe, progressStore.get, progressStore.server);
  const [step, setStep] = useState<"card" | "wobble" | "done">("card");
  const [got, setGot] = useState<Opened | null>(null);
  const pinned = postcards.some((p) => p.slug === slug && p.from === "a friend");
  useEffect(() => {
    if (step !== "wobble") return;
    const t = window.setTimeout(() => {
      const items: Opened = {};
      for (const b of bundles()) for (const [id, n] of Object.entries(b) as [ItemId, number][]) items[id] = (items[id] ?? 0) + n;
      if (openGift(slug)) addItems(items);
      sfx.catch();
      setGot(items);
      setStep("done");
    }, 1300);
    return () => window.clearTimeout(t);
  }, [step, slug]);
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="gift-title" className="fixed inset-0 z-[75] flex items-center justify-center p-4">
      <div className="scrim-in absolute inset-0 bg-[#0a2a4a]/55 backdrop-blur-[2px]" aria-hidden />
      <div className="go-sheet sheet-in relative w-full max-w-sm rounded-[2rem] p-5 text-center">
        <h2 id="gift-title" className="go-title text-lg">
          {step === "done" ? "You got" : "A gift from a friend!"}
        </h2>
        {step === "card" ? (
          <>
            <div className="mt-4">
              <Postcard slug={slug} from="a friend" big />
            </div>
            <div className="mt-4 flex justify-center gap-3">
              <button
                type="button"
                disabled={pinned}
                onClick={() => {
                  sfx.tap();
                  pinPostcard(slug, "a friend");
                }}
                className="rounded-full bg-ink/8 px-5 py-2.5 text-sm font-bold disabled:opacity-50"
              >
                {pinned ? "Pinned" : "Pin postcard"}
              </button>
              <button
                type="button"
                onClick={() => {
                  sfx.open();
                  setStep("wobble");
                }}
                className="go-pill rounded-full px-8 py-2.5 text-sm"
              >
                Open
              </button>
            </div>
          </>
        ) : step === "wobble" ? (
          <div className="grid h-48 place-items-center">
            <span className="gift-wobble">
              <GiftBox size={120} />
            </span>
          </div>
        ) : (
          <>
            <ul className="mt-5 flex justify-center gap-5">
              {(Object.entries(got ?? {}) as [ItemId, number][]).map(([id, n], k) => (
                <li key={id} className="item-pop flex flex-col items-center" style={{ animationDelay: `${k * 90}ms` }}>
                  <span className="grid size-16 place-items-center rounded-full bg-white shadow">
                    <ItemIcon id={id} size={40} />
                  </span>
                  <span className="mt-1.5 text-sm font-bold">×{n}</span>
                  <span className="text-[11px] text-ink-soft">{NAMES[id]}</span>
                </li>
              ))}
            </ul>
            <button type="button" onClick={onDone} className="go-pill mt-6 rounded-full px-12 py-3 text-sm">
              OK
            </button>
          </>
        )}
      </div>
    </div>
  );
}
