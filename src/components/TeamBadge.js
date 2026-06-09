"use client";

import { useState } from "react";

// Live data (ESPN) gives us team-crest image URLs; placeholder data uses emoji
// flags. Render whichever we have so swapping data sources needs no UI changes.
export default function TeamBadge({ flag, size = "text-2xl" }) {
  const [loaded, setLoaded] = useState(false);

  if (!flag) return null;

  if (typeof flag === "string" && flag.startsWith("http")) {
    // Tiny third-party crest icons (~8px) from ESPN's CDN. next/image's remote
    // optimization isn't worth the loader round-trip (or its cost) at this size,
    // so a plain <img> is intentional. A pulsing placeholder fills the slot
    // until the crest decodes so it fades in instead of popping.
    return (
      <span className="relative inline-block w-7 h-7 sm:w-8 sm:h-8 align-middle">
        {!loaded && <span className="absolute inset-0 rounded-full bg-cream/10 animate-pulse" />}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={flag}
          alt=""
          decoding="async"
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className={`relative w-7 h-7 sm:w-8 sm:h-8 object-contain transition-opacity duration-500 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      </span>
    );
  }

  return <span className={size}>{flag}</span>;
}
