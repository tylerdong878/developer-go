/**
 * Checks every outside link in the content still works, so a dead demo (like
 * a lapsed Vercel deploy) gets caught instead of found by a recruiter. Runs
 * weekly in CI (.github/workflows/links.yml); run it yourself with
 * `npm run links`. Sites that block bots (LinkedIn, X, Instagram) answer 999
 * or 403 to scripts, so those only count as dead on a 404 or 410.
 */
import { raids, stops, trainer } from "../src/content";

type Found = { href: string; where: string };

const links: Found[] = [
  ...trainer.links.map((l) => ({ href: l.href, where: `trainer: ${l.label}` })),
  ...stops.flatMap((s) => s.links.map((l) => ({ href: l.href, where: `${s.slug}: ${l.label}` }))),
  ...raids.flatMap((r) => r.project.links.map((l) => ({ href: l.href, where: `${r.slug}: ${l.label}` }))),
].filter((l) => /^https?:/.test(l.href));

const GUARDED = /linkedin\.com|x\.com|twitter\.com|instagram\.com/;

async function status(href: string) {
  const ask = async (method: string) => {
    const res = await fetch(href, {
      method,
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
      headers: { "user-agent": "Mozilla/5.0 (compatible; developer-go link check)" },
    });
    const body = method === "GET" ? await res.text() : "";
    return { code: res.status, gone: /DEPLOYMENT_NOT_FOUND|DEPLOYMENT_DISABLED/.test(body) };
  };
  try {
    const head = await ask("HEAD");
    // some servers don't do HEAD; a Vercel deploy that's gone still answers, so read the page
    if (head.code >= 400 || /vercel\.app/.test(href)) return await ask("GET");
    return head;
  } catch (e) {
    return { code: 0, gone: false, error: String(e) };
  }
}

async function main() {
  const dead: string[] = [];
  const unique = [...new Map(links.map((l) => [l.href, l])).values()];
  await Promise.all(
    unique.map(async (l) => {
      const r = await status(l.href);
      const bad = r.gone || r.code === 404 || r.code === 410 || (!GUARDED.test(l.href) && (r.code === 0 || r.code >= 500));
      console.log(`${bad ? "DEAD" : "ok  "} ${r.code} ${l.href} (${l.where})`);
      if (bad) dead.push(`${l.href} (${l.where})`);
    }),
  );
  console.log(`\n${unique.length} links, ${dead.length} dead`);
  if (dead.length) {
    console.log(dead.map((d) => `- ${d}`).join("\n"));
    process.exit(1);
  }
}

void main();
