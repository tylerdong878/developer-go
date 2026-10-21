import Link from "next/link";
import type { Gym, Link as ContentLink, Raid, Role, SkillId, Stop } from "@/content";
import { media, skills } from "@/content";
import { Shot } from "./Shot";

/*
 * The plain-page versions of a job, a project and a hackathon, shared by the
 * one-page text version (/text) and each thing's own page (/w/<slug>).
 */

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

/** Its own page, from a list (a small link after the title). */
function Own({ slug }: { slug: string }) {
  return (
    <Link href={`/w/${slug}`} className="ml-2 text-sm font-normal text-mystic-500 underline underline-offset-2">
      link
    </Link>
  );
}

export function GymArticle({ g, own = false }: { g: Gym; own?: boolean }) {
  return (
    <article>
      <h3 className="text-lg font-semibold">
        {g.org}
        <span className="font-normal text-ink-soft">, {g.location}</span>
        {own ? <Own slug={g.slug} /> : null}
      </h3>
      {g.summary ? <p className="mt-1 leading-relaxed">{g.summary}</p> : null}
      {g.stats?.length ? <p className="mt-1 text-sm">{g.stats.map((st) => `${st.value} ${st.label}`).join(" · ")}</p> : null}
      {g.roles.map((r) => (
        <div key={r.title + r.start} className="mt-2">
          <p className="font-semibold">{r.title}</p>
          <p className="text-sm text-ink-soft">
            {span(r)}
            {r.team ? `, ${r.team}` : ""}
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-5 leading-relaxed">
            {r.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      ))}
      <Stack ids={g.stack} />
    </article>
  );
}

export function StopArticle({ s, own = false }: { s: Stop; own?: boolean }) {
  return (
    <article>
      <h3 className="text-lg font-semibold">
        {s.name}
        {own ? <Own slug={s.slug} /> : null}
      </h3>
      <p className="text-sm text-ink-soft">
        {s.period}, {s.role}
      </p>
      {media[s.slug] ? <Shot m={media[s.slug]} className="mt-3 max-w-xl rounded-xl" /> : null}
      <p className="mt-1 leading-relaxed">{s.tagline}</p>
      {s.stats.length ? <p className="mt-1 text-sm">{s.stats.map((st) => `${st.value} ${st.label}`).join(" · ")}</p> : null}
      <ul className="mt-1 list-disc space-y-1 pl-5 leading-relaxed">
        {s.highlights.map((h) => (
          <li key={h}>{h}</li>
        ))}
      </ul>
      <Stack ids={s.stack} />
      <Links links={s.links} />
    </article>
  );
}

export function RaidArticle({ r, own = false }: { r: Raid; own?: boolean }) {
  return (
    <article>
      <h3 className="text-lg font-semibold">
        {r.event}: {r.project.name}
        {own ? <Own slug={r.slug} /> : null}
      </h3>
      <p className="text-sm text-ink-soft">
        {r.dates}, {r.venue}
        {r.result ? `. ${r.result}` : ""}
      </p>
      {media[r.slug] ? <Shot m={media[r.slug]} className="mt-3 max-w-xl rounded-xl" /> : null}
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
  );
}

export { Stack };
