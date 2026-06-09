"use client";

import { useEffect, useMemo, useRef } from "react";
import Reveal from "./Reveal";
import LiveTicker from "./LiveTicker";
import TeamBadge from "./TeamBadge";
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

      <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 pt-10 pb-16 w-full text-center">
        <Reveal>
          <p className="font-condiment text-3xl sm:text-5xl text-neon/90 mb-2">live football</p>
          <h1 className="font-anton text-6xl sm:text-8xl lg:text-[9rem] leading-[0.95] tracking-tight">
            MUNDIAL <span className="shimmer-text">2026</span>
          </h1>
        </Reveal>

        {/* Main scoreboard — driven by the live (or next-up) featured match */}
        {featured && (
          <Reveal delay={120} className="mt-12 sm:mt-16 liquid-glass max-w-3xl mx-auto px-6 sm:px-12 py-10 hover:scale-[1.01]">
            {/* Status + group/venue, centered */}
            <div className="flex flex-col items-center gap-3">
              {featuredIsLive ? (
                <span className="inline-flex items-center gap-2">
                  <span className="pulse-dot" />
                  <span className="font-anton text-xs sm:text-sm tracking-[0.3em] text-neon">EN VIVO</span>
                </span>
              ) : (
                <span className="font-anton text-xs sm:text-sm tracking-[0.3em] text-cream/50">PRÓXIMO PARTIDO</span>
              )}
              <span className="font-mono text-[11px] sm:text-xs text-cream/60 px-4 py-1.5 rounded-full border border-cream/15">
                {featured.group}
                {featured.venue ? ` · ${featured.venue}` : ""}
              </span>
            </div>

            {/* Teams */}
            <div className="mt-9 grid grid-cols-3 items-center gap-3 sm:gap-6">
              <div className="flex flex-col items-center gap-2.5">
                <div className="transition-transform hover:scale-110">
                  <TeamBadge flag={featured.homeFlag ?? featured.homeLogo} size="text-5xl sm:text-7xl" />
                </div>
                <p className="font-anton text-sm sm:text-2xl tracking-wide">{featured.homeTeam.toUpperCase()}</p>
              </div>

              <div className="flex flex-col items-center justify-center gap-2">
                {featuredIsLive || featured.status === "FINAL" ? (
                  <>
                    <p className="font-anton text-5xl sm:text-7xl tracking-tight tabular-nums">
                      {featured.homeScore} <span className="text-cream/30">—</span> {featured.awayScore}
                    </p>
                    {featuredIsLive && featured.minute != null && (
                      <span className="inline-flex items-center gap-1.5 font-mono text-[10px] sm:text-xs tracking-widest text-red">
                        <span className="pulse-dot" style={{ width: 6, height: 6, background: "#FF4D4D" }} />
                        {featured.minute}&apos; EN VIVO
                      </span>
                    )}
                  </>
                ) : (
                  <p className="font-anton text-4xl sm:text-6xl tracking-[0.15em] text-cream/30">VS</p>
                )}
              </div>

              <div className="flex flex-col items-center gap-2.5">
                <div className="transition-transform hover:scale-110">
                  <TeamBadge flag={featured.awayFlag ?? featured.awayLogo} size="text-5xl sm:text-7xl" />
                </div>
                <p className="font-anton text-sm sm:text-2xl tracking-wide">{featured.awayTeam.toUpperCase()}</p>
              </div>
            </div>

            {/* Kickoff time — its own roomy, clearly-labelled block (scheduled only) */}
            {!featuredIsLive && featured.status !== "FINAL" && featured.time && (
              <div className="mt-9 flex justify-center">
                <div className="inline-flex items-center gap-4 rounded-full border border-cream/15 bg-cream/5 px-7 py-3.5">
                  <span className="text-lg sm:text-xl">🕐</span>
                  <span className="font-anton text-2xl sm:text-3xl tracking-wide tabular-nums">{featured.time}</span>
                  <span className="w-px h-6 bg-cream/20" />
                  <span className="font-mono text-[10px] sm:text-xs tracking-[0.25em] text-cream/50">HORA COLOMBIA</span>
                </div>
              </div>
            )}

            {/* Animated stat bars (only meaningful for a live match) */}
            {stats && (
              <div className="mt-9 grid grid-cols-2 sm:grid-cols-4 gap-5 text-left">
                {stats.map((s) => (
                  <div key={s.label}>
                    <div className="flex justify-between font-mono text-[11px] text-cream/60 mb-1.5">
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
              <p className="mt-8 font-mono text-[10px] tracking-[0.2em] text-cream/30 leading-relaxed">
                MOSTRANDO DATOS DE MUESTRA — SE ACTUALIZARÁ CUANDO HAYA PARTIDOS DISPONIBLES EN LA API
              </p>
            )}
          </Reveal>
        )}
      </div>
    </section>
  );
}
