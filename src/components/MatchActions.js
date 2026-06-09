"use client";

import { useState } from "react";
import { googleCalendarUrl, icsDataUri, buildShareText } from "@/lib/calendar";

const chip =
  "inline-flex items-center gap-1.5 rounded-full border border-cream/15 px-3 py-1.5 font-mono text-[10px] tracking-widest text-cream/60 hover:border-neon/50 hover:text-neon transition-colors";

// Calendar + share actions for a single match. Inline (no dropdown) so it never
// gets clipped by the cards' `overflow: hidden`. Share uses the Web Share API
// when available and falls back to copying the link to the clipboard.
export default function MatchActions({ match, className = "" }) {
  const [copied, setCopied] = useState(false);
  const gcal = googleCalendarUrl(match);
  const ics = icsDataUri(match);

  if (!gcal && !ics) return null;

  async function share() {
    const text = buildShareText(match);
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "WORLD CUP LIVE", text, url });
        return;
      }
    } catch {
      return; // user dismissed the share sheet
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — nothing else we can do silently.
    }
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {gcal && (
        <a href={gcal} target="_blank" rel="noopener noreferrer" className={chip}>
          📅 Google
        </a>
      )}
      {ics && (
        <a href={ics} download="partido-mundial-2026.ics" className={chip}>
          ⬇ .ics
        </a>
      )}
      <button type="button" onClick={share} className={chip}>
        {copied ? "✓ Copiado" : "↗ Compartir"}
      </button>
    </div>
  );
}
