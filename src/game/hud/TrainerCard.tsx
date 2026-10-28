"use client";

import { useState } from "react";
import { trainer } from "@/content";
import { levelFor, type Progress, xpForLevel } from "../progress";
import { TEAMS } from "../teams";
import { earned } from "../visitorMedals";
import { LINKEDIN_QR } from "./qr";

const W = 1080;
const H = 1350;
const n = (v: number) => v.toLocaleString("en-US");

function round(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
}

/** A portrait, or nothing if it won't load. */
async function portrait(dex: number) {
  const img = new Image();
  img.src = `/portraits/${dex}.webp`;
  try {
    await img.decode();
    return img;
  } catch {
    return null;
  }
}

/**
 * The visitor's trainer card as a picture to share: level and team like GO's
 * profile, their numbers, their last few catches and the site, drawn on a
 * canvas in the site's own fonts.
 */
async function drawCard(p: Progress) {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");
  if (!g) return null;
  await document.fonts?.ready;
  const css = getComputedStyle(document.body);
  const display = css.getPropertyValue("--font-fredoka").trim() || "sans-serif";
  const body = css.getPropertyValue("--font-lato").trim() || "sans-serif";
  const team = p.team ? TEAMS[p.team] : null;
  const accent = team?.color ?? "#2bb5a8";
  const level = levelFor(p.xp);

  // the sky, then the card
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#8fd8f0");
  sky.addColorStop(1, "#d8f3e4");
  g.fillStyle = sky;
  g.fillRect(0, 0, W, H);
  g.save();
  g.shadowColor = "rgba(10, 42, 74, 0.25)";
  g.shadowBlur = 40;
  g.shadowOffsetY = 12;
  round(g, 70, 70, W - 140, H - 140, 56);
  g.fillStyle = "#ffffff";
  g.fill();
  g.restore();

  // the header in the team's color, the level in a big ring like GO's
  g.save();
  round(g, 70, 70, W - 140, H - 140, 56);
  g.clip();
  g.fillStyle = accent;
  g.fillRect(70, 70, W - 140, 330);
  g.restore();
  g.fillStyle = "#ffffff";
  g.textAlign = "center";
  g.font = `800 34px ${body}`;
  g.fillText((team?.name ?? "Trainer").toUpperCase(), W / 2, 150);
  g.beginPath();
  g.arc(W / 2, 300, 120, 0, Math.PI * 2);
  g.fillStyle = "#ffffff";
  g.fill();
  g.lineWidth = 14;
  g.strokeStyle = accent;
  const from = xpForLevel(level);
  const to = xpForLevel(level + 1);
  g.beginPath();
  g.arc(W / 2, 300, 104, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, (p.xp - from) / Math.max(1, to - from)));
  g.stroke();
  g.fillStyle = "#14303f";
  g.font = `600 112px ${display}`;
  g.fillText(String(level), W / 2, 340);
  g.font = `800 30px ${body}`;
  g.fillStyle = "#5d7480";
  g.fillText(`LEVEL · ${n(p.xp)} XP`, W / 2, 470);

  // the numbers, in tiles
  const catches = Object.values(p.caught).reduce((a, b) => a + b, 0);
  const tiles: [string, string][] = [
    ["Caught", n(catches)],
    ["Species", n(Object.keys(p.caught).length)],
    ["Stops spun", n(p.spun.length)],
    ["Cards read", n(p.visited.length)],
    ["Medals", n(earned(p).length)],
    ["Teddy", `${p.bond.hearts} ♥`],
  ];
  tiles.forEach(([label, value], i) => {
    const x = 130 + (i % 3) * 280;
    const y = 520 + Math.floor(i / 3) * 190;
    round(g, x, y, 260, 170, 32);
    g.fillStyle = "#eef4f6";
    g.fill();
    g.fillStyle = "#14303f";
    g.font = `600 64px ${display}`;
    g.fillText(value, x + 130, y + 90);
    g.fillStyle = "#5d7480";
    g.font = `800 26px ${body}`;
    g.fillText(label.toUpperCase(), x + 130, y + 136);
  });

  // the last few kinds it caught
  const recent = [...new Set(p.history.map((h) => h.dex))].slice(0, 5);
  g.fillStyle = "#5d7480";
  g.font = `800 26px ${body}`;
  g.fillText(recent.length ? "LATEST CATCHES" : "NO CATCHES YET", W / 2, 950);
  const imgs = await Promise.all(recent.map(portrait));
  imgs.forEach((img, i) => {
    if (!img) return;
    const s = 150;
    const x = W / 2 - (recent.length * (s + 16) - 16) / 2 + i * (s + 16);
    g.drawImage(img, x, 975, s, s);
  });

  // where it's from
  g.fillStyle = "#14303f";
  g.font = `700 34px ${body}`;
  g.fillText(`Explored ${trainer.name}'s town`, W / 2, 1185);
  g.fillStyle = accent;
  g.font = `800 32px ${body}`;
  g.fillText(window.location.host, W / 2, 1232);
  return new Promise<Blob | null>((done) => c.toBlob(done, "image/png"));
}

/** Share the card: the phone's share sheet where it takes pictures, otherwise a download. */
export function ShareCardButton({ progress }: { progress: Progress }) {
  const [busy, setBusy] = useState(false);
  const share = async () => {
    setBusy(true);
    try {
      const blob = await drawCard(progress);
      if (!blob) return;
      const file = new File([blob], "trainer-card.png", { type: "image/png" });
      // phones get the share sheet; on a computer a download is what you want
      if (window.matchMedia("(pointer: coarse)").matches && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "My trainer card", text: `Level ${levelFor(progress.xp)} in ${trainer.name}'s town`, url: window.location.origin });
        return;
      }
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "trainer-card.png";
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    } catch {
      // the share sheet was closed: nothing to do
    } finally {
      setBusy(false);
    }
  };
  return (
    <button type="button" onClick={share} disabled={busy} className="go-pill mt-5 w-full rounded-full px-5 py-2.5 text-sm transition active:scale-95 disabled:opacity-60">
      {busy ? "Drawing your card…" : "Share your trainer card"}
    </button>
  );
}

/** GO's Add Friend: a QR to Tyler's LinkedIn, the real-world friend request, and the same as a button. */
export function AddTyler() {
  const linkedin = trainer.links.find((l) => l.label === "LinkedIn");
  if (!linkedin) return null;
  const { size, path } = LINKEDIN_QR;
  return (
    <div className="mt-5 flex items-center gap-4 rounded-2xl bg-ink/5 p-3.5">
      <svg viewBox={`-2 -2 ${size + 4} ${size + 4}`} className="size-24 shrink-0 rounded-xl bg-white" role="img" aria-label="QR code to Tyler's LinkedIn">
        <path d={path} fill="#0b3a5a" />
      </svg>
      <div className="min-w-0">
        <p className="text-xs font-black tracking-wider text-ink-soft uppercase">Add Tyler as a friend</p>
        <p className="mt-1 text-sm leading-snug">Scan it with your phone to connect on LinkedIn, or tap below.</p>
        <a href={linkedin.href} target="_blank" rel="noreferrer" className="go-pill mt-2 inline-block rounded-full px-4 py-1.5 text-sm transition active:scale-95">
          Connect
        </a>
      </div>
    </div>
  );
}
