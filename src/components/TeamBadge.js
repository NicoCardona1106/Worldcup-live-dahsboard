// Live data (ESPN) gives us team-crest image URLs; placeholder data uses emoji
// flags. Render whichever we have so swapping data sources needs no UI changes.
export default function TeamBadge({ flag, size = "text-2xl" }) {
  if (!flag) return null;
  if (typeof flag === "string" && flag.startsWith("http")) {
    return <img src={flag} alt="" className="w-7 h-7 sm:w-8 sm:h-8 object-contain inline-block" loading="lazy" />;
  }
  return <span className={size}>{flag}</span>;
}
