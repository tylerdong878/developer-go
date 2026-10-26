"use client";

import { useSyncExternalStore } from "react";
import { type Catch, progressStore, statsOf } from "../progress";
import { sfx } from "../sound";
import { TEAMS, type TeamId } from "../teams";
import { TeamMark } from "./TeamPick";

/*
 * GO's appraisal (notes/research/go-round-5.md 3): your team leader looks a
 * Pokémon over and says how it measures up, with its three IV bars (Attack,
 * Defense, HP, 0 to 15 each, full ones in red) and a stamp of 0 to 3 stars by
 * the total (a perfect one gets the 3 stars on a red stamp). The leaders'
 * lines are our own, in their spirit.
 */

/** GO's star tiers by IV total out of 45. */
export const starsFor = (total: number) => (total >= 37 ? 3 : total >= 30 ? 2 : total >= 23 ? 1 : 0);

const SAY: Record<TeamId, [string, string, string, string]> = {
  mystic: [
    "It may struggle in battle, but there's more to a Pokémon than that.",
    "Better than most. A sound choice.",
    "This one has my attention. Strong, by any measure.",
    "Extraordinary. I could study this one for weeks.",
  ],
  valor: ["Not much of a battler, but I like it anyway!", "Solid. It's got some fight in it.", "Strong! You should be proud of this one.", "Wow. This one could take on anything!"],
  instinct: ["Room to grow. Everybody starts somewhere!", "Pretty decent, I'd say.", "It's really strong, trust me.", "This one's up there with the very best. Nice!"],
};

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-left text-[11px] font-bold tracking-[0.12em] text-ink-soft uppercase">{label}</p>
      <div className="mt-1 flex gap-0.5">
        {[0, 1, 2].map((k) => {
          const fill = Math.max(0, Math.min(5, value - k * 5)) / 5;
          return (
            <span key={k} className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink/10">
              <span className={`block h-full rounded-full ${value >= 15 ? "bg-[#ef6a7a]" : "bg-[#f3a13a]"}`} style={{ width: `${fill * 100}%` }} />
            </span>
          );
        })}
      </div>
    </div>
  );
}

/** The star stamp: white with gold stars, red for a perfect one. */
function Stamp({ stars, perfect }: { stars: number; perfect: boolean }) {
  return (
    <span className={`grid size-16 shrink-0 place-items-center rounded-full ring-4 ${perfect ? "bg-[#ef6a7a] ring-[#f6b3bc]" : "bg-white ring-[#f3d58a]"}`}>
      <span className="flex gap-0.5 text-lg leading-none" aria-label={`${stars} stars`}>
        {[0, 1, 2].map((k) => (
          <span key={k} className={k < stars ? (perfect ? "text-white" : "text-[#f2b51c]") : "text-ink/15"}>
            ★
          </span>
        ))}
      </span>
    </span>
  );
}

export function Appraisal({ c, onDone }: { c: Catch; onDone: () => void }) {
  const { team } = useSyncExternalStore(progressStore.subscribe, progressStore.get, progressStore.server);
  const { iv } = statsOf(c);
  const total = iv[0] + iv[1] + iv[2];
  const stars = starsFor(total);
  const perfect = total === 45;
  const close = () => {
    sfx.tap();
    onDone();
  };
  return (
    <div role="dialog" aria-modal="true" aria-label="Appraisal" className="fixed inset-0 z-[70] flex items-end justify-center p-4 sm:items-center">
      <button type="button" aria-label="Close appraisal" tabIndex={-1} className="scrim-in absolute inset-0 bg-[#0a2a4a]/45" onClick={close} />
      <div className="sheet-in relative w-full max-w-sm">
        {team ? (
          <>
            <div className="go-sheet rounded-3xl p-4">
              <div className="flex items-center gap-4">
                <Stamp stars={stars} perfect={perfect} />
                <div className="flex-1 space-y-2">
                  <Bar label="Attack" value={iv[0]} />
                  <Bar label="Defense" value={iv[1]} />
                  <Bar label="HP" value={iv[2]} />
                </div>
              </div>
            </div>
            <div className="dialog-box mt-3 flex items-start gap-3 rounded-2xl px-4 py-3 text-left">
              <TeamMark team={team} size={40} />
              <p className="text-[15px] leading-snug">
                <span className="block text-xs font-bold tracking-wide uppercase" style={{ color: team === "instinct" ? "#a88600" : TEAMS[team].color }}>
                  {TEAMS[team].leader}
                </span>
                {perfect ? "Flawless. I don't say that often. " : ""}
                {SAY[team][stars]}
              </p>
            </div>
          </>
        ) : (
          <div className="dialog-box rounded-2xl px-4 py-4 text-left text-[15px] leading-snug">Pick a team at level 5 (tap any gym), and your team leader will appraise your Pokémon for you.</div>
        )}
        <div className="mt-3 flex justify-center">
          <button type="button" onClick={close} className="go-pill rounded-full px-12 py-2.5 text-sm">
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
