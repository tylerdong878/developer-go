"use client";

import { useState } from "react";

/**
 * Share a card: the phone's share sheet where there is one, otherwise the
 * link is copied. It shares the thing's own page (/w/<slug>), which anyone
 * can read without the game and which opens it on the map.
 */
export function ShareLink({ slug, title }: { slug: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = `${window.location.origin}/w/${slug}`;
    try {
      if (navigator.share) return await navigator.share({ title, url });
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // dismissed the share sheet, or the clipboard's blocked: nothing to do
    }
  };
  return (
    <div className="flex items-center gap-3 text-sm">
      <button type="button" onClick={share} className="font-bold text-mystic-500 hover:underline">
        {copied ? "Link copied" : "Share"}
      </button>
      <a href={`/w/${slug}`} className="font-bold text-mystic-500 hover:underline">
        Read as text
      </a>
    </div>
  );
}
