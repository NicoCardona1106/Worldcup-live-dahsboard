"use client";

import { useState } from "react";
import Reveal from "./Reveal";
import TeamBadge from "./TeamBadge";
import KickoffTime from "./KickoffTime";
import BackgroundVideo from "./BackgroundVideo";
import MatchActions from "./MatchActions";
import { useLiveMatches } from "@/hooks/useLiveData";
import { matches as placeholderMatches, matchEvents, isColombia } from "@/lib/data";

const eventIcon = { goal: "⚽", yellow: "🟨", red: "🟥", sub: "🔁" };

function StatBar({ label, left, right, color, pct }) {
  return (
    <div>
      <div className="flex justify-between font-mono text-[10px] text-cream/50 mb-1">
        <span>{label}</span>
        <span>
          {left} - {right}
        </span>
      </div>
      <div className="stat-bar">
        <span className={color} data-bar={pct} style={{ width: "0%" }} />
      </div>
    </div>
  );
}

// Share-of-total bar % for a [home, away] stat pair (50/50 when nothing yet).
function pairPct(pair) {
  const total = pair[0] + pair[1];
  return total ? Math.round((pair[0] / total) * 100) : 50;
}

function MatchCard({ m, usingSample, expanded, onToggle, delay = 0 }) {
  const live = m.status === "LIVE";
  const finished = m.status === "FINAL";
  const colombia = isColombia(m.homeTeam) || isColombia(m.awayTeam);
  // Each stat pair can be null independently (provider may omit some), so the
  // rows render one by one instead of assuming the whole object is complete.
  const stats = (live || finished) && m.stats ? m.stats : null;
  const events = m.events?.length ? m.events : null;

  return (
    <Reveal
      delay={delay}
      className={`liquid-glass px-6 py-7 flex flex-col ${
        live ? "neon-border" : colombia ? "!border-gold/40 shadow-[0_0_22px_rgba(255,215,0,0.15)]" : "hover:shadow-[0_0_24px_rgba(239,244,255,0.08)]"
      }`}
    >
      {colombia && (
        <span className="self-start mb-3 inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 font-mono text-[9px] tracking-widest text-gold">
          🇨🇴 TU SELECCIÓN
        </span>
      )}
      <div className="flex items-center justify-between mb-5 gap-2">
        <span className="font-anton text-[11px] tracking-[0.2em] text-cream/50 truncate">{m.group}</span>
        {live ? (
          <span className="font-anton text-[11px] tracking-widest text-red flex items-center gap-1.5 shrink-0">
            <span className="pulse-dot" style={{ width: 7, height: 7, background: "#FF4D4D" }} />
            EN VIVO
          </span>
        ) : (
          <div className="flex flex-col items-end gap-0.5 shrink-0">
            {!finished && m.dateShort && (
              <span className="font-mono text-[9px] tracking-widest text-cream/40">{m.dateShort}</span>
            )}
            <KickoffTime time={finished ? "FINAL" : m.time} className="font-mono text-[11px] tracking-widest text-cream/50" />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <TeamBadge flag={m.homeFlag ?? m.homeLogo} size="text-xl" />
          <span className="font-anton text-sm tracking-wide truncate">{m.homeTeam.toUpperCase()}</span>
        </div>
        <span className="font-anton text-xl tabular-nums shrink-0">{live || finished ? m.homeScore : "–"}</span>
      </div>
      <p className="font-mono text-[10px] text-center text-cream/30 my-1">VS</p>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 min-w-0">
          <TeamBadge flag={m.awayFlag ?? m.awayLogo} size="text-xl" />
          <span className="font-anton text-sm tracking-wide truncate">{m.awayTeam.toUpperCase()}</span>
        </div>
        <span className="font-anton text-xl tabular-nums shrink-0">{live || finished ? m.awayScore : "–"}</span>
      </div>

      {live && m.minute != null && <p className="font-anton text-xs text-neon neon-text mb-5">MINUTO {m.minute}&apos;</p>}
      {!live && !finished && m.venue && <p className="font-mono text-[11px] text-cream/40 mb-5 truncate">📍 {m.venue}</p>}

      {stats && (
        <div className="space-y-3 mb-6">
          {stats.possession && <StatBar label="POSESIÓN" left={`${stats.possession[0]}%`} right={`${stats.possession[1]}%`} color="bg-neon" pct={stats.possession[0]} />}
          {stats.shots && <StatBar label="REMATES" left={stats.shots[0]} right={stats.shots[1]} color="bg-blue" pct={pairPct(stats.shots)} />}
          {stats.shotsOnTarget && <StatBar label="TIROS AL ARCO" left={stats.shotsOnTarget[0]} right={stats.shotsOnTarget[1]} color="bg-red" pct={pairPct(stats.shotsOnTarget)} />}
          {stats.corners && <StatBar label="CÓRNERS" left={stats.corners[0]} right={stats.corners[1]} color="bg-gold" pct={pairPct(stats.corners)} />}
        </div>
      )}

      <div className="mt-auto flex flex-col gap-4 items-start">
        {!live && !finished && <MatchActions match={m} />}
        <button
          onClick={() => onToggle(m.id)}
          className="self-start font-anton text-xs tracking-widest text-bgnavy bg-neon px-6 py-3 rounded-full shadow-[0_0_18px_rgba(111,255,0,0.45)] hover:shadow-[0_0_30px_rgba(111,255,0,0.7)] hover:scale-105 transition-all"
        >
          {expanded ? "OCULTAR DETALLES ✕" : "VER PARTIDO →"}
        </button>
      </div>

      {expanded && (
        <div className="mt-6 pt-6 border-t border-cream/10 animate-[fadeIn_0.4s_ease]">
          <p className="font-anton text-[11px] tracking-[0.2em] text-cream/50 mb-4">CRONOLOGÍA DEL PARTIDO</p>
          {events ? (
            // Real timeline from the provider — goals, cards and subs with
            // minute and team, for live (auto-refreshing) and finished matches.
            <ul className="space-y-3">
              {events.map((ev, i) => (
                <li key={i} className="flex items-start gap-3 font-mono text-xs text-cream/70">
                  <span className="font-anton text-neon w-11 shrink-0 tabular-nums">{ev.minute}</span>
                  <span className="shrink-0">{eventIcon[ev.type] || "•"}</span>
                  <span>{ev.text}</span>
                </li>
              ))}
            </ul>
          ) : usingSample && m.stats ? (
            // Demo timeline — only ever shown alongside the sample fixtures.
            <ul className="space-y-3">
              {matchEvents.map((ev, i) => (
                <li key={i} className="flex items-start gap-3 font-mono text-xs text-cream/70">
                  <span className="font-anton text-neon w-9 shrink-0 tabular-nums">{ev.minute}&apos;</span>
                  <span className="shrink-0">{eventIcon[ev.type]}</span>
                  <span>
                    <span className="text-cream/40">[{ev.team}]</span> {ev.text}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="font-mono text-xs text-cream/50 leading-relaxed">
              {live || finished
                ? "Aún no hay incidencias registradas para este partido."
                : m.statusDetail || "La cronología minuto a minuto estará disponible cuando el partido esté en vivo."}
            </p>
          )}
        </div>
      )}
    </Reveal>
  );
}

export default function MatchesSection() {
  const [expandedId, setExpandedId] = useState(null);
  const { data: matches, live } = useLiveMatches(placeholderMatches);

  return (
    <section id="en-vivo" className="relative py-28 sm:py-36 overflow-hidden">
      <BackgroundVideo
        src="https://cdn.coverr.co/videos/coverr-a-soccer-player-kicks-the-ball-9537/1080p.mp4"
        className="absolute inset-0 w-full h-full object-cover opacity-30"
      />
      <div className="absolute inset-0 gradient-overlay-dark" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10">
        <Reveal className="mb-14 flex flex-col items-center text-center gap-3">
          <p className="font-condiment text-2xl sm:text-4xl text-neon/90">today&apos;s fixtures</p>
          <h2 className="font-anton text-5xl sm:text-7xl tracking-tight">PARTIDOS DEL DÍA</h2>
          <span className={`font-mono text-[10px] tracking-widest px-3 py-1.5 rounded-full border ${live ? "border-neon/40 text-neon" : "border-cream/15 text-cream/40"}`}>
            {live ? "● DATOS EN VIVO — ESPN" : "○ DATOS DE MUESTRA"}
          </span>
        </Reveal>

        <div id="partidos" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {matches.map((m, i) => (
            <MatchCard key={m.id} m={m} usingSample={!live} delay={i * 90} expanded={expandedId === m.id} onToggle={(id) => setExpandedId((cur) => (cur === id ? null : id))} />
          ))}
        </div>
      </div>
    </section>
  );
}
