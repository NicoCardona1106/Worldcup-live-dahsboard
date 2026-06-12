"use client";

import { useEffect, useState } from "react";

// "↻ hace Xs" — quiet proof that the live data is flowing, so nobody feels
// the urge to reload. Renders nothing until the first successful fetch.
export default function FreshnessBadge({ updatedAt, className = "" }) {
  const [secs, setSecs] = useState(null);

  useEffect(() => {
    if (!updatedAt) return;
    const tick = () => setSecs(Math.max(0, Math.round((Date.now() - updatedAt) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [updatedAt]);

  if (!updatedAt || secs == null) return null;

  return (
    <span className={`font-mono text-[10px] tracking-widest text-cream/40 tabular-nums ${className}`}>
      ↻ hace {secs} s
    </span>
  );
}
