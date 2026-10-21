import type { Metadata } from "next";
import Link from "next/link";
import { eggs, gyms, medals, raids, spawns, stops, trainer } from "@/content";
import { GymArticle, RaidArticle, Stack, StopArticle } from "../plain";

export const metadata: Metadata = {
  title: "Tyler Dong, text version",
  description: "Everything from my Pokémon GO style portfolio on one plain page: jobs, projects, hackathons, awards, and facts.",
  alternates: { canonical: "/text" },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      <div className="mt-4 space-y-6">{children}</div>
    </section>
  );
}

/**
 * The whole portfolio as one plain page: for recruiters in a hurry, search
 * engines, screen readers, and anything that can't run the 3D game.
 */
export default function TextVersion() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 text-ink">
      <p className="text-sm">
        <Link href="/" className="font-semibold text-mystic-500 underline underline-offset-2">
          Back to the game
        </Link>
      </p>
      <h1 className="mt-4 font-display text-4xl font-semibold">{trainer.name}</h1>
      <p className="mt-1 text-ink-soft">
        {trainer.school.degree}, {trainer.school.name}, {trainer.school.graduation}. GPA {trainer.school.gpa}.
      </p>
      <div className="mt-4 space-y-3 leading-relaxed">
        {trainer.about.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
      <p className="mt-4 flex flex-wrap gap-x-3 text-sm">
        <a href={`mailto:${trainer.email}`} className="font-semibold text-mystic-500 underline underline-offset-2">
          {trainer.email}
        </a>
        <Link href="/resume" className="font-semibold text-mystic-500 underline underline-offset-2">
          Resume
        </Link>
        {trainer.links.map((l) => (
          <a key={l.href} href={l.href} className="font-semibold text-mystic-500 underline underline-offset-2">
            {l.label}
          </a>
        ))}
      </p>

      <Section title="Experience">
        {gyms.map((g) => (
          <GymArticle key={g.slug} g={g} own />
        ))}
      </Section>

      <Section title="Projects">
        {stops.map((s) => (
          <StopArticle key={s.slug} s={s} own />
        ))}
      </Section>

      <Section title="Hackathons">
        {raids.map((r) => (
          <RaidArticle key={r.slug} r={r} own />
        ))}
      </Section>

      <Section title="Working on now">
        {eggs.map((e) => (
          <article key={e.slug}>
            <h3 className="text-lg font-semibold">{e.title}</h3>
            <p className="mt-1 leading-relaxed">{e.body}</p>
            <Stack ids={e.stack} />
          </article>
        ))}
      </Section>

      <Section title="Awards and honors">
        <ul className="list-disc space-y-1 pl-5">
          {medals.map((m) => (
            <li key={m.slug}>
              <span className="font-semibold">{m.title}</span>: {m.detail}
              {m.date ? `, ${m.date}` : ""}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Fun facts">
        <ul className="list-disc space-y-1 pl-5">
          {spawns.map((s) => (
            <li key={s.slug}>
              <span className="font-semibold">{s.title}</span>: {s.body}
            </li>
          ))}
        </ul>
      </Section>

      <p className="mt-12 text-xs text-ink-soft">
        Pokémon and all respective names are trademark and © of Nintendo, Creatures Inc., and GAME FREAK inc. This is a
        fan-made portfolio, not affiliated with The Pokémon Company, Nintendo, Niantic, or Scopely.
      </p>
    </main>
  );
}
