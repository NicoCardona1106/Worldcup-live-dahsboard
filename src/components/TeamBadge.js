// Live data (ESPN) gives us team-crest image URLs; placeholder data uses emoji
// flags. Render whichever we have so swapping data sources needs no UI changes.
export default function TeamBadge({ flag, size = "text-2xl" }) {
  if (!flag) return null;
  if (typeof flag === "string" && flag.startsWith("http")) {
    // Tiny third-party crest icons (~8px) from ESPN's CDN — next/image's remote
    // optimization isn't worth the loader round-trip (or its cost) at this size,
    // so a plain <img> is intentional here.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={flag} alt="" decoding="async" loading="lazy" className="w-7 h-7 sm:w-8 sm:h-8 object-contain inline-block" />;
  }
  return <span className={size}>{flag}</span>;
}
