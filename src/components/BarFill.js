"use client";

import { useEffect, useState } from "react";

// Animated fill for a `.stat-bar` track. Owns its width reactively: mounts at
// 0% and transitions to `pct` on the next frame (entrance animation), then
// keeps transitioning whenever `pct` changes — so bars rendered or updated
// *after* the card's reveal (live-poll data) still fill correctly. This
// replaces the old one-shot `data-bar` pass in Reveal, which only ran at
// scroll-into-view and left late-mounting bars stuck at 0% forever.
export default function BarFill({ pct, className = "" }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setWidth(pct));
    return () => cancelAnimationFrame(raf);
  }, [pct]);

  return <span className={className} style={{ width: `${width}%` }} />;
}
