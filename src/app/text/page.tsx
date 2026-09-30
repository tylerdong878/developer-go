import type { Metadata } from "next";
import Link from "next/link";
import { eggs, gyms, type Link as ContentLink, medals, raids, type Role, skills, type SkillId, spawns, stops, trainer } from "@/content";

export const metadata: Metadata = {
  title: "Tyler Dong, text version",
  description: "Everything from my Pokémon GO style portfolio on one plain page: jobs, projects, hackathons, awards, and facts.",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const month = (m: string) => {
  const [y, mm] = m.split("-").map(Number);
  return `${MONTHS[mm - 1]} ${y}`;
};
const span = (r: Role) => `${month(r.start)} - ${r.end ? month(r.end) : "present"}`;

function Stack({ ids }: { ids: SkillId[] }) {
  if (!ids.length) return null;
  return <p className="mt-1 text-sm text-ink-soft">{ids.map((id) => skills[id].name).join(", ")}</p>;
}

function Links({ links }: { links: ContentLink[] }) {
  if (!links.length) return null;
  return (
    <p className="mt-1 flex flex-wrap gap-x-3 text-sm">
      {links.map((l) => (
        <a key={l.href} href={l.href} className="font-semibold text-mystic-500 underline underline-offset-2">
          {l.label}
        </a>
      ))}
    </p>
  );
}

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
        {trainer.links.map((l) => (
          <a key={l.href} href={l.href} className="font-semibold text-mystic-500 underline underline-offset-2">
            {l.label}
          </a>
        ))}
      </p>

      <Section title="Experience">
        {gyms.map((g) => (
          <article key={g.slug}>
            <h3 className="text-lg font-semibold">
              {g.org}
              <span className="font-normal text-ink-soft">, {g.location}</span>
            </h3>
            {g.roles.map((r) => (
              <div key={r.title + r.start} className="mt-2">
                <p className="font-semibold">{r.title}</p>
                <p className="text-sm text-ink-soft">{span(r)}</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 leading-relaxed">
                  {r.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
            <Stack ids={g.stack} />
          </article>
        ))}
      </Section>

      <Section title="Projects">
        {stops.map((s) => (
          <article key={s.slug}>
            <h3 className="text-lg font-semibold">{s.name}</h3>
            <p className="text-sm text-ink-soft">
              {s.period}, {s.role}
            </p>
            <p className="mt-1 leading-relaxed">{s.tagline}</p>
            {s.stats.length ? (
              <p className="mt-1 text-sm">{s.stats.map((st) => `${st.value} ${st.label}`).join(" · ")}</p>
            ) : null}
            <ul className="mt-1 list-disc space-y-1 pl-5 leading-relaxed">
              {s.highlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
            <Stack ids={s.stack} />
            <Links links={s.links} />
          </article>
        ))}
      </Section>

      <Section title="Hackathons">
        {raids.map((r) => (
          <article key={r.slug}>
            <h3 className="text-lg font-semibold">
              {r.event}: {r.project.name}
            </h3>
            <p className="text-sm text-ink-soft">
              {r.dates}, {r.venue}
              {r.result ? `. ${r.result}` : ""}
            </p>
            <p className="mt-1 leading-relaxed">{r.project.tagline}</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 leading-relaxed">
              {r.project.built.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            {r.project.team.length ? <p className="mt-1 text-sm text-ink-soft">With {r.project.team.join(", ")}</p> : null}
            <Stack ids={r.project.stack} />
            <Links links={r.project.links} />
          </article>
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
