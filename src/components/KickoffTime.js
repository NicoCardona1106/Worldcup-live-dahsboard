"use client";

import { useTimeZonePref, localKickoff } from "@/hooks/usePrefs";

// Kickoff times arrive formatted in Colombia time (lib/espn.js pins
// America/Bogota). By default they're tagged "COL"; when the visitor flips
// the navbar timezone toggle, clock values are re-rendered from `iso` in
// their own timezone and tagged "LOCAL" instead. Non-clock states ("LIVE",
// "FINAL") pass through untouched.
export default function KickoffTime({ time, iso, className = "", labelClass = "text-[0.7em]" }) {
  const { isLocal } = useTimeZonePref();
  const isClock = typeof time === "string" && time.includes(":");
  const local = isLocal && isClock ? localKickoff(iso) : null;
  return (
    <span className={className}>
      {local ? local.time : time}
      {isClock && (
        <span className={`ml-1 align-baseline tracking-normal text-cream/35 ${labelClass}`}>
          {local ? "LOCAL" : "COL"}
        </span>
      )}
    </span>
  );
}
