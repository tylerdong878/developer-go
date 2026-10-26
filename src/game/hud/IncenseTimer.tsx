"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { progressStore } from "../progress";
import { ItemIcon } from "./icons";

/** The lit Incense on the map's corner, counting down like GO's active item. */
export function IncenseTimer() {
  const { incenseUntil } = useSyncExternalStore(progressStore.subscribe, progressStore.get, progressStore.server);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!incenseUntil) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [incenseUntil]);
  const left = (incenseUntil ?? 0) - now;
  if (left <= 0) return null;
  const m = Math.floor(left / 60000);
  const s = Math.floor(left / 1000) % 60;
  return (
    <div role="status" aria-label={`Incense, ${m} minutes left`} className="panel flex items-center gap-1 rounded-full py-1 pr-2.5 pl-1.5 text-xs font-bold tabular-nums">
      <ItemIcon id="incense" size={22} />
      {m}:{String(s).padStart(2, "0")}
    </div>
  );
}
