import type { Metadata } from "next";
import Link from "next/link";
import { gyms, raids, type Role, skills, type SkillId, type SkillKind, stops, trainer } from "@/content";
import { PrintButton } from "./PrintButton";

export const metadata: Metadata = {
  title: "Tyler Dong, resume",
  description: "Tyler Dong's resume: CS + Computer Engineering at Northeastern, SDE intern at AWS. Experience, projects, hackathons, and skills.",
  alternates: { canonical: "/resume" },
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const month = (m: string) => {
  const [y, mm] = m.split("-").map(Number);
  return `${MONTHS[mm - 1]} ${y}`;
};
const span = (r: Role) => `${month(r.start)} - ${r.end ? month(r.end) : "present"}`;
const host = (href: string) => href.replace(/^https?:\/\/(www\.)?/, "");

/** One page: how many bullets each job keeps (its best ones come first in the content). */
const BULLETS: Record<string, number> = { aws: 3, philips: 2, tetracorp: 2, outamation: 1, quartzy: 1, khoury: 1, homegoods: 0 };
/** Bluffs is the Tetracorp job, already under Experience. */
const SKIP_PROJECTS = new Set(["bluffs"]);

/** Skills by kind, in the order a resume lists them: the ones used most across jobs and projects, up to a line each. */
const KINDS: [SkillKind, string, number][] = [
  ["language", "Languages", 10],
  ["framework", "Frameworks", 12],
  ["infra", "Infra and tools", 10],
];
function skillLines() {
  const uses = new Map<SkillId, number>();
  for (const id of [...gyms.flatMap((g) => g.stack), ...stops.flatMap((s) => s.stack), ...raids.flatMap((r) => r.project.stack)]) uses.set(id, (uses.get(id) ?? 0) + 1);
  return KINDS.map(
    ([kind, label, most]) =>
      [
        label,
        [...uses.entries()]
          .filter(([id]) => skills[id].kind === kind)
          .sort((a, b) => b[1] - a[1])
          .slice(0, most)
          .map(([id]) => skills[id].name),
      ] as const,
  ).filter(([, names]) => names.length);
}

function Heading({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-2.5 border-b border-ink/25 pb-0.5 text-[0.8rem] font-bold tracking-[0.14em] uppercase">{children}</h2>;
}

/**
 * Tyler's resume as one printable page, made from the same content as the
 * game (src/content), so it never drifts from the site. No phone number, on
 * purpose. "Save as PDF" prints it; the PDF in public/ is this page printed.
 */
export default function Resume() {
  const wins = raids.filter((r) => r.result);
  return (
    <main className="resume min-h-dvh bg-white text-[0.78rem] leading-snug text-[#14202b] print:text-[0.74rem]">
      <div className="mx-auto w-full max-w-[8.5in] px-6 py-8 print:max-w-none print:px-0 print:py-0">
      <p className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm print:hidden">
        <Link href="/" className="font-semibold text-mystic-500 underline underline-offset-2">
          Back to the game
        </Link>
        <a href={trainer.resume} className="font-semibold text-mystic-500 underline underline-offset-2" download>
          Download PDF
        </a>
        <PrintButton />
      </p>

      <header className="text-center">
        <h1 className="text-2xl font-bold tracking-wide">{trainer.name}</h1>
        <p className="mt-0.5">
          <a href={`mailto:${trainer.email}`}>{trainer.email}</a>
          {trainer.links
            .filter((l) => l.label === "GitHub" || l.label === "LinkedIn")
            .map((l) => (
              <span key={l.href}>
                {" · "}
                <a href={l.href}>{host(l.href)}</a>
              </span>
            ))}
          {" · "}
          <a href="https://developer-go.vercel.app">developer-go.vercel.app</a>
        </p>
      </header>

      <Heading>Education</Heading>
      <div className="mt-1 flex justify-between gap-4">
        <p>
          <span className="font-bold">{trainer.school.name}</span>, {trainer.school.degree}. GPA {trainer.school.gpa}
        </p>
        <p className="shrink-0">{trainer.school.graduation}</p>
      </div>

      <Heading>Experience</Heading>
      {gyms.map((g) => {
        // more than one role at the same place (the two TA jobs) share a line, newest first
        const [latest] = g.roles;
        const earliest = g.roles[g.roles.length - 1];
        const title = g.roles.map((r) => r.title).join("; ");
        const when = g.roles.length > 1 ? `${month(earliest.start)} - ${latest.end ? month(latest.end) : "present"}` : span(latest);
        return (
          <section key={g.slug} className="mt-1.5 break-inside-avoid">
            <div className="flex justify-between gap-4">
              <p>
                <span className="font-bold">{g.org}</span>, {title}
                {latest.team ? ` (${latest.team})` : ""}
              </p>
              <p className="shrink-0">{when}</p>
            </div>
            {BULLETS[g.slug] === 0 ? null : (
              <ul className="mt-0.5 list-disc space-y-0.5 pl-4">
                {latest.bullets.slice(0, BULLETS[g.slug] ?? 2).map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )}
          </section>
        );
      })}

      <Heading>Projects</Heading>
      {stops
        .filter((s) => s.featured && !SKIP_PROJECTS.has(s.slug))
        .map((s) => (
          <section key={s.slug} className="mt-1.5 break-inside-avoid">
            <div className="flex justify-between gap-4">
              <p>
                <span className="font-bold">{s.name}</span>. {s.tagline}
              </p>
              <p className="shrink-0">{s.period}</p>
            </div>
          </section>
        ))}

      <Heading>Hackathons</Heading>
      <p className="mt-1">
        {wins.map((r, i) => (
          <span key={r.slug}>
            {i ? "; " : ""}
            <span className="font-bold">{r.event}</span>, {r.result} ({r.project.name})
          </span>
        ))}
      </p>

      <Heading>Skills</Heading>
      <div className="mt-1 space-y-0.5">
        {skillLines().map(([label, names]) => (
          <p key={label}>
            <span className="font-bold">{label}:</span> {names.join(", ")}
          </p>
        ))}
      </div>
      </div>
    </main>
  );
}
