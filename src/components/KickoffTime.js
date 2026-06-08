// Kickoff times are normalised to Colombia time upstream (lib/espn.js pins
// America/Bogota). This tags clock values with a muted "COL" so visitors always
// know which timezone they're reading — and leaves non-clock states ("LIVE",
// "FINAL") untouched.
export default function KickoffTime({ time, className = "", labelClass = "text-[0.7em]" }) {
  const isClock = typeof time === "string" && time.includes(":");
  return (
    <span className={className}>
      {time}
      {isClock && <span className={`ml-1 align-baseline tracking-normal text-cream/35 ${labelClass}`}>COL</span>}
    </span>
  );
}
