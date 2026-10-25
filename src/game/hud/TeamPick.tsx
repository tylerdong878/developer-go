"use client";

import { useState } from "react";
import { chooseTeam } from "../progress";
import { sfx } from "../sound";
import { TEAM_ORDER, type TeamId, TEAMS } from "../teams";

/** Our own team marks (not GO's logos): a snowflake for Mystic, a flame for Valor, a bolt for Instinct. */
export function TeamMark({ team, size = 56 }: { team: TeamId; size?: number }) {
  const t = TEAMS[team];
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden>
      <circle cx="24" cy="24" r="22" fill={t.color} />
      <circle cx="24" cy="24" r="18.5" fill="none" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1.5" />
      {team === "mystic" ? (
        <g stroke="#ffffff" strokeWidth="3" strokeLinecap="round" fill="none">
          {[0, 60, 120].map((a) => (
            <path key={a} d="M24 12v24" transform={`rotate(${a} 24 24)`} />
          ))}
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <path key={a} d="M20.5 15.5 24 19l3.5-3.5" transform={`rotate(${a} 24 24)`} />
          ))}
        </g>
      ) : team === "valor" ? (
        <path d="M24 10c2 6 9 9 9 17a9 9 0 0 1-18 0c0-4 2-6 4-8 0 3 1 5 3 5-1-6 1-10 2-14Z" fill="#ffffff" />
      ) : (
        <path d="M27 9 15 27h8l-3 12 13-19h-8l2-11Z" fill={t.ink} />
      )}
    </svg>
  );
}

type Step = { at: "pick" } | { at: "meet"; team: TeamId } | { at: "welcome"; team: TeamId };

/**
 * GO's team choice: the three teams side by side, a word from the leader you
 * tap, then join (or go back), and a welcome. Tyler's gyms are Mystic's, so
 * the welcome says whether they're friendly or rival for you.
 */
export function TeamPick({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<Step>({ at: "pick" });
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="team-title" className="fixed inset-0 z-[75] flex items-center justify-center p-4">
      <div className="scrim-in absolute inset-0 bg-[#0a2a4a]/60 backdrop-blur-[2px]" aria-hidden />
      <div className="go-sheet sheet-in relative w-full max-w-lg rounded-[2rem] p-5 text-center">
        {step.at === "pick" ? (
          <>
            <h2 id="team-title" className="go-title text-xl">
              Choose a team
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">Three teams look after the gyms. Tap one to hear from its leader.</p>
            <div className="mt-5 grid grid-cols-3 gap-2.5">
              {TEAM_ORDER.map((id) => {
                const t = TEAMS[id];
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      sfx.tap();
                      setStep({ at: "meet", team: id });
                    }}
                    className="menu-pop flex flex-col items-center rounded-3xl bg-surface px-2 pt-4 pb-3 shadow-[0_2px_10px_rgba(48,85,93,0.14)] transition hover:-translate-y-0.5"
                  >
                    <TeamMark team={id} size={60} />
                    <span className="mt-2 font-display text-[15px] leading-tight font-black" style={{ color: t.color === TEAMS.instinct.color ? "#a88600" : t.color }}>
                      {t.name}
                    </span>
                    <span className="mt-0.5 text-xs text-ink-soft">{t.leader}</span>
                  </button>
                );
              })}
            </div>
            <button type="button" onClick={onDone} className="mt-5 text-sm font-semibold text-ink-soft underline">
              Not now
            </button>
          </>
        ) : step.at === "meet" ? (
          <>
            <div className="flex justify-center">
              <TeamMark team={step.team} size={72} />
            </div>
            <h2 id="team-title" className="go-title mt-3 text-xl">
              {TEAMS[step.team].leader}, {TEAMS[step.team].name}
            </h2>
            <div className="dialog-box mt-4 space-y-1.5 rounded-2xl px-4 py-3 text-left">
              {TEAMS[step.team].lines.map((l) => (
                <p key={l} className="text-[15px] leading-snug">
                  {l}
                </p>
              ))}
            </div>
            <p className="mt-5 font-semibold">Join {TEAMS[step.team].name}?</p>
            <div className="mt-3 flex justify-center gap-3">
              <button type="button" onClick={() => setStep({ at: "pick" })} className="rounded-full bg-ink/8 px-6 py-2.5 text-sm font-bold">
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  sfx.catch();
                  chooseTeam(step.team);
                  setStep({ at: "welcome", team: step.team });
                }}
                className="go-pill rounded-full px-8 py-2.5 text-sm"
              >
                Join
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="item-pop flex justify-center">
              <TeamMark team={step.team} size={88} />
            </div>
            <h2 id="team-title" className="go-title mt-3 text-xl">
              {TEAMS[step.team].name}
            </h2>
            <p className="mt-3 text-[15px] leading-snug">{TEAMS[step.team].welcome}</p>
            <p className="mt-2 text-sm text-ink-soft">
              {step.team === "mystic" ? "Tyler's on Team Mystic too, so his gyms are friendly gyms for you." : "Tyler's on Team Mystic, so his gyms are rival gyms for you. Go take a look anyway."}
            </p>
            <button type="button" onClick={onDone} className="go-pill mt-5 rounded-full px-12 py-3 text-sm">
              OK
            </button>
          </>
        )}
      </div>
    </div>
  );
}
