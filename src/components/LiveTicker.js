"use client";

function tickerLabel(m) {
  if (m.status === "LIVE") {
    const minute = m.minute != null ? `${m.minute}' · ` : "";
    return `🔴 EN VIVO ${minute}${m.homeTeam} ${m.homeScore}-${m.awayScore} ${m.awayTeam}`;
  }
  if (m.status === "FINAL") return `${m.homeTeam} ${m.homeScore}-${m.awayScore} ${m.awayTeam} · FINAL`;
  return `${m.homeTeam} vs ${m.awayTeam} · ${m.time}`;
}

export default function LiveTicker({ matches = [] }) {
  if (matches.length === 0) return null;
  const items = [...matches, ...matches];

  return (
    <div className="relative z-40 overflow-hidden border-b border-cream/10 bg-bgnavy/80 backdrop-blur-sm py-2">
      <div className="flex gap-10 whitespace-nowrap animate-[ticker_32s_linear_infinite] hover:[animation-play-state:paused]">
        {items.map((m, i) => (
          <span key={`${m.id}-${i}`} className="font-mono text-[11px] tracking-wide text-cream/60 flex items-center gap-2 shrink-0">
            <span className={m.status === "LIVE" ? "text-neon font-anton tracking-widest" : "text-cream/30"}>
              {m.group}
            </span>
            {tickerLabel(m)}
          </span>
        ))}
      </div>
      <style jsx>{`
        @keyframes ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
