import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { gyms, media, raids, stops, trainer } from "@/content";
import { GymArticle, RaidArticle, StopArticle } from "../../plain";

/*
 * One job, project or hackathon on a page of its own: something to share or
 * link to, that search engines can read, with the map one tap away
 * (/#<slug> opens its card in the game).
 */

type Found = { kind: "Job" | "Project" | "Hackathon"; title: string; description: string; body: React.ReactNode };

function find(slug: string): Found | null {
  const g = gyms.find((x) => x.slug === slug);
  if (g) {
    const r = g.roles[0];
    return { kind: "Job", title: `${r.title} at ${g.org}`, description: g.summary ?? r.bullets[0], body: <GymArticle g={g} /> };
  }
  const s = stops.find((x) => x.slug === slug);
  if (s) return { kind: "Project", title: s.name, description: s.tagline, body: <StopArticle s={s} /> };
  const r = raids.find((x) => x.slug === slug);
  if (r)
    return {
      kind: "Hackathon",
      title: `${r.project.name}, ${r.event}`,
      description: `${r.result ? `${r.result}. ` : ""}${r.project.tagline}`,
      body: <RaidArticle r={r} />,
    };
  return null;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return [...gyms, ...stops, ...raids].map((o) => ({ slug: o.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const f = find(slug);
  if (!f) return {};
  const title = `${f.title} | ${trainer.name}`;
  return {
    title,
    description: f.description,
    alternates: { canonical: `/w/${slug}` },
    openGraph: { title, description: f.description, type: "article", ...(media[slug] ? { images: [{ url: media[slug].still ?? media[slug].src, alt: media[slug].alt }] } : {}) },
    twitter: { title, description: f.description, ...(media[slug] ? { images: [media[slug].still ?? media[slug].src] } : {}) },
  };
}

export default async function Thing({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const f = find(slug);
  if (!f) notFound();
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 text-ink">
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <Link href={`/#${slug}`} className="font-semibold text-mystic-500 underline underline-offset-2">
          See it on the map
        </Link>
        <Link href="/text" className="font-semibold text-mystic-500 underline underline-offset-2">
          Everything as text
        </Link>
        <Link href="/resume" className="font-semibold text-mystic-500 underline underline-offset-2">
          Resume
        </Link>
      </p>
      <p className="mt-6 text-xs font-bold tracking-[0.14em] text-ink-soft uppercase">
        {f.kind}, {trainer.name}
      </p>
      <h1 className="sr-only">{f.title}</h1>
      <div className="mt-2 [&_h3]:font-display [&_h3]:text-3xl">{f.body}</div>
      <p className="mt-10 text-sm text-ink-soft">
        {trainer.headline.join(". ")}.{" "}
        <a href={`mailto:${trainer.email}`} className="font-semibold text-mystic-500 underline underline-offset-2">
          {trainer.email}
        </a>
      </p>
    </main>
  );
}
