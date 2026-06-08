"use client";

import { useEffect, useMemo, useRef } from "react";
import Reveal from "./Reveal";
import LiveTicker from "./LiveTicker";
import TeamBadge from "./TeamBadge";
import KickoffTime from "./KickoffTime";
import { useLiveMatches } from "@/hooks/useLiveData";
import { matches as placeholderMatches } from "@/lib/data";

const FALLBACK_STATS = [
  { label: "POSESIÓN", value: "58%", color: "bg-neon", barPct: 58 },
  { label: "REMATES", value: 14, color: "bg-blue", barPct: 70 },
  { label: "CÓRNERS", value: 7, color: "bg-gold", barPct: 45 },
  { label: "XG", value: 2.31, color: "bg-red", barPct: 63 },
];

// `match.stats` (placeholder data and ESPN's per-match `situation` endpoint)
// comes shaped as { possession: [a,b], shots: [a,b], corners: [a,b] } — turn
// it into the { label, value, color, barPct } bars the scoreboard renders.
function statsToBars(stats) {
  if (!stats) return null;
  const shotsTotal = stats.shots[0] + stats.shots[1];
  const cornersTotal = stats.corners[0] + stats.corners[1];
  return [
    { label: "POSESIÓN", value: `${stats.possession[0]}%`, color: "bg-neon", barPct: stats.possession[0] },
    { label: "REMATES", value: `${stats.shots[0]} - ${stats.shots[1]}`, color: "bg-blue", barPct: shotsTotal ? Math.round((stats.shots[0] / shotsTotal) * 100) : 50 },
    { label: "CÓRNERS", value: `${stats.corners[0]} - ${stats.corners[1]}`, color: "bg-gold", barPct: cornersTotal ? Math.round((stats.corners[0] / cornersTotal) * 100) : 50 },
  ];
}

export default function Hero() {
  const videoRef = useRef(null);
  const { data: matches, live } = useLiveMatches(placeholderMatches);

  // Pick the live match if there is one, otherwise the soonest scheduled fixture.
  const featured = useMemo(() => {
    return matches.find((m) => m.status === "LIVE") || matches[0] || null;
  }, [matches]);

  const featuredIsLive = featured?.status === "LIVE";
  // Real-time match stats (possession/shots/etc.) require ESPN's per-match
  // `situation` endpoint — see README for how to extend /api/scoreboard with it.
  const stats = statsToBars(featured?.stats) || (featuredIsLive ? FALLBACK_STATS : null);

  // Parallax on the background video — throttled to one update per animation
  // frame (and GPU-composited via translate3d) so scrolling stays smooth, and
  // skipped entirely when the visitor prefers reduced motion.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = null;
    const update = () => {
      raf = null;
      if (videoRef.current) {
        const offset = window.scrollY * 0.35;
        videoRef.current.style.transform = `translate3d(0, ${offset}px, 0) scale(1.1)`;
      }
    };
    const onScroll = () => {
      if (raf == null) raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf != null) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section id="hero" className="relative min-h-screen flex flex-col justify-center overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover will-change-transform"
      >
        <source src="https://cdn.coverr.co/videos/coverr-soccer-stadium-from-above-2632/1080p.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 gradient-overlay-dark" />

      {/* Floating decorative orbs */}
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-neon/10 blur-3xl float-slow pointer-events-none" />
      <div className="absolute bottom-10 -left-16 w-64 h-64 rounded-full bg-blue/10 blur-3xl float-slow pointer-events-none" style={{ animationDelay: "2s" }} />

      <div className="relative z-10 pt-24">
        <LiveTicker matches={matches} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 pt-10 w-full">
        <Reveal>
          <p className="font-condiment text-3xl sm:text-5xl text-neon/90 mb-2">live football</p>
          <h1 className="font-anton text-6xl sm:text-8xl lg:text-[9rem] leading-[0.95] tracking-tight">
            MUNDIAL <span className="shimmer-text">2026</span>
          </h1>
        </Reveal>

        {/* Main scoreboard — driven by the live (or next-up) featured match */}
        {featured && (
          <Reveal delay={120} className="mt-10 sm:mt-14 liquid-glass max-w-3xl px-6 sm:px-10 py-8 hover:scale-[1.01]">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {featuredIsLive ? (
                  <>
                    <span className="pulse-dot" />
                    <span className="font-anton text-xs sm:text-sm tracking-widest text-neon">EN VIVO</span>
                  </>
                ) : (
                  <span className="font-anton text-xs sm:text-sm tracking-widest text-cream/50">PRÓXIMO PARTIDO</span>
                )}
              </div>
              <div className="font-mono text-xs sm:text-sm text-cream/60 px-3 py-1 rounded-full border border-cream/20 truncate max-w-[55%] text-right">
                {featured.group}
                {featured.venue ? ` · ${featured.venue}` : ""}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 items-center text-center gap-2">
              <div>
                <div className="mb-2 transition-transform hover:scale-110 inline-block">
                  <TeamBadge flag={featured.homeFlag ?? featured.homeLogo} size="text-4xl sm:text-6xl" />
                </div>
                <p className="font-anton text-base sm:text-2xl tracking-wide">{featured.homeTeam.toUpperCase()}</p>
              </div>
              <div>
                <p className="font-anton text-5xl sm:text-7xl tracking-tighter tabular-nums">
                  {featuredIsLive || featured.status === "FINAL" ? (
                    <>
                      {featured.homeScore} <span className="text-cream/40">—</span> {featured.awayScore}
                    </>
                  ) : (
                    <KickoffTime time={featured.time} className="text-3xl sm:text-5xl text-cream/50" labelClass="text-[0.32em]" />
                  )}
                </p>
                <p className="font-anton text-base sm:text-2xl tracking-wide mt-2">VS</p>
              </div>
              <div>
                <div className="mb-2 transition-transform hover:scale-110 inline-block">
                  <TeamBadge flag={featured.awayFlag ?? featured.awayLogo} size="text-4xl sm:text-6xl" />
                </div>
                <p className="font-anton text-base sm:text-2xl tracking-wide">{featured.awayTeam.toUpperCase()}</p>
                {featuredIsLive && featured.minute != null && (
                  <div className="inline-flex flex-col items-center gap-1 mt-2">
                    <span className="font-anton text-xl sm:text-2xl text-neon neon-text tabular-nums">{featured.minute}&apos;</span>
                    <span className="font-mono text-[10px] sm:text-xs tracking-widest text-red flex items-center gap-1">
                      <span className="pulse-dot" style={{ width: 6, height: 6, background: "#FF4D4D" }} />
                      EN VIVO
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Animated stat bars (only meaningful for a live match) */}
            {stats && (
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-5">
                {stats.map((s) => (
                  <div key={s.label}>
                    <div className="flex justify-between font-mono text-[11px] text-cream/60 mb-1">
                      <span>{s.label}</span>
                      <span className="text-cream">{s.value}</span>
                    </div>
                    <div className="stat-bar">
                      <span className={s.color} data-bar={s.barPct} style={{ width: "0%" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!live && (
              <p className="mt-6 font-mono text-[10px] tracking-widest text-cream/30">
                MOSTRANDO DATOS DE MUESTRA — SE ACTUALIZARÁ SOLO CUANDO HAYA PARTIDOS DISPONIBLES EN LA API
              </p>
            )}
          </Reveal>
        )}
      </div>

      {/* Horizontal carousel */}
      <div className="relative z-10 mt-10 sm:mt-14 pb-10">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 mb-3 flex items-center justify-between">
          <p className="font-anton text-sm tracking-widest text-cream/60">{live ? "PRÓXIMOS PARTIDOS" : "PARTIDOS DE HOY"}</p>
          <p className="font-mono text-[11px] text-cream/40 animate-pulse">desliza →</p>
        </div>
        <div className="flex gap-4 overflow-x-auto scroll-hide px-6 sm:px-10 pb-2 snap-x snap-mandatory">
          {matches.map((m, i) => (
            // Outer wrapper owns the staggered entrance (transform animation);
            // inner card owns the hover lift — kept on separate elements so the
            // finished entrance animation never freezes the hover transform.
            <div key={m.id} className="rise-in flex-shrink-0 snap-start" style={{ animationDelay: `${i * 80}ms` }}>
              <div
                className={`liquid-glass min-w-[230px] sm:min-w-[260px] h-full px-5 py-5 hover:-translate-y-1.5 ${
                  m.status === "LIVE" ? "neon-border" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[10px] tracking-widest text-cream/50 truncate max-w-[70%]">{m.group}</span>
                  {m.status === "LIVE" ? (
                    <span className="font-anton text-[10px] tracking-widest text-red flex items-center gap-1 shrink-0">
                      <span className="pulse-dot" style={{ width: 6, height: 6, background: "#FF4D4D" }} />
                      LIVE
                    </span>
                  ) : (
                    <KickoffTime time={m.time} className="font-mono text-[10px] tracking-widest text-cream/50 shrink-0" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-center gap-1 w-1/3">
                    <TeamBadge flag={m.homeFlag ?? m.homeLogo} />
                    <span className="font-anton text-[11px] tracking-wide text-center">{m.homeTeam.toUpperCase()}</span>
                  </div>
                  <div className="font-anton text-2xl text-center w-1/3 tabular-nums">
                    {m.status === "LIVE" || m.status === "FINAL" ? (
                      `${m.homeScore} - ${m.awayScore}`
                    ) : (
                      <KickoffTime time={m.time} className="text-cream/40 text-base" />
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-1 w-1/3">
                    <TeamBadge flag={m.awayFlag ?? m.awayLogo} />
                    <span className="font-anton text-[11px] tracking-wide text-center">{m.awayTeam.toUpperCase()}</span>
                  </div>
                </div>
                {m.status === "LIVE" && m.minute != null && (
                  <p className="text-center font-anton text-xs text-neon neon-text mt-3 tabular-nums">{m.minute}&apos;</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
