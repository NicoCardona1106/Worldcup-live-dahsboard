"use client";

import { useState } from "react";
import BarFill from "./BarFill";
import Reveal from "./Reveal";
import Counter from "./Counter";
import TeamBadge from "./TeamBadge";
import { useLiveStandings, useLiveTournamentStats, useLiveTopScorers } from "@/hooks/useLiveData";
import { groups as placeholderGroups, tournamentStats, topScorers, isColombia } from "@/lib/data";

function GroupTable({ name, teams, delay = 0 }) {
  return (
    <Reveal delay={delay} className="liquid-glass px-6 sm:px-8 py-7 hover:-translate-y-1">
      <h3 className="font-anton text-2xl tracking-wide mb-5">{name}</h3>
      <table className="w-full font-mono text-xs sm:text-sm">
        <thead>
          <tr className="text-cream/40 tracking-widest text-[10px] sm:text-[11px] border-b border-cream/10">
            <th className="text-left font-normal pb-3">EQUIPO</th>
            <th className="font-normal pb-3">PJ</th>
            <th className="font-normal pb-3">G</th>
            <th className="font-normal pb-3">E</th>
            <th className="font-normal pb-3">P</th>
            <th className="font-normal pb-3">DIF</th>
            <th className="font-normal pb-3">PTS</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((t) => {
            const col = isColombia(t.team);
            return (
              <tr
                key={t.team}
                className={`border-b border-cream/5 transition-colors hover:bg-cream/5 ${
                  col ? "bg-gold/10 text-gold" : t.top ? "text-neon" : "text-cream/80"
                }`}
              >
                <td className="py-2.5">
                  <span className="inline-flex items-center gap-2">
                    {col && <span className="text-gold">★</span>}
                    <TeamBadge flag={t.flag} size="text-base" />
                    <span className="font-anton text-[11px] sm:text-xs tracking-wide">{t.team.toUpperCase()}</span>
                  </span>
                </td>
                <td className="text-center py-2.5">{t.pj}</td>
                <td className="text-center py-2.5">{t.g}</td>
                <td className="text-center py-2.5">{t.e}</td>
                <td className="text-center py-2.5">{t.p}</td>
                <td className="text-center py-2.5 tabular-nums">{t.dif ?? "—"}</td>
                <td className={`text-center py-2.5 font-anton ${col ? "text-gold" : t.top ? "text-neon" : "text-cream"}`}>{t.pts}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Reveal>
  );
}

function TopScorers() {
  const { data: liveScorers, live } = useLiveTopScorers();
  const scorers = live ? liveScorers : topScorers;
  const max = Math.max(...scorers.map((s) => s.goals));
  return (
    <Reveal className="liquid-glass px-6 sm:px-8 py-7">
      <div className="flex items-center justify-between gap-3 mb-5">
        <h3 className="font-anton text-2xl tracking-wide">GOLEADORES</h3>
        <span className={`font-mono text-[10px] tracking-widest px-3 py-1.5 rounded-full border ${live ? "border-neon/40 text-neon" : "border-cream/15 text-cream/40"}`}>
          {live ? "● EN VIVO — ESPN" : "○ DATOS DE MUESTRA"}
        </span>
      </div>
      <ul className="space-y-4">
        {scorers.map((s, i) => (
          <li key={s.name} className="flex items-center gap-4">
            <span className="font-anton text-cream/40 w-5 text-right">{i + 1}</span>
            <TeamBadge flag={s.flag} size="text-xl" />
            <span className="font-mono text-sm flex-1 truncate">{s.name}</span>
            <div className="w-24 sm:w-32 stat-bar">
              <BarFill pct={(s.goals / max) * 100} className="bg-gold" />
            </div>
            <span className="font-anton text-neon w-6 text-right">{s.goals}</span>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}

export default function StandingsSection() {
  const [tab, setTab] = useState("clasificacion");
  const { data: groups, live } = useLiveStandings(placeholderGroups);
  const groupNames = Object.keys(groups);
  const { data: liveStats, live: statsLive } = useLiveTournamentStats();
  const stats = statsLive ? liveStats : tournamentStats;

  return (
    <section id="grupos" className="relative py-28 sm:py-36 bg-bgnavy">
      <div className="max-w-7xl mx-auto px-6 sm:px-10">
        <Reveal className="mb-10 flex flex-col items-center text-center gap-5">
          <div className="flex flex-col items-center gap-3">
            <p className="font-condiment text-2xl sm:text-4xl text-neon/90">group standings</p>
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <h2 className="font-anton text-5xl sm:text-7xl tracking-tight">CLASIFICACIÓN</h2>
              <span className={`font-mono text-[10px] tracking-widest px-3 py-1.5 rounded-full border ${live ? "border-neon/40 text-neon" : "border-cream/15 text-cream/40"}`}>
                {live ? "● EN VIVO — ESPN" : "○ DATOS DE MUESTRA"}
              </span>
            </div>
          </div>

          {/* Tab switch */}
          <div className="liquid-glass !rounded-full p-1 inline-flex">
            {[
              { id: "clasificacion", label: "GRUPOS" },
              { id: "goleadores", label: "GOLEADORES" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`font-anton text-xs tracking-widest px-5 py-2.5 rounded-full transition-all ${
                  tab === t.id ? "bg-neon text-bgnavy shadow-[0_0_18px_rgba(111,255,0,0.45)]" : "text-cream/60 hover:text-cream"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </Reveal>

        {tab === "clasificacion" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-20">
            {groupNames.map((name, i) => (
              <GroupTable key={name} name={name} teams={groups[name]} delay={i * 90} />
            ))}
          </div>
        ) : (
          <div className="max-w-2xl mb-20">
            <TopScorers />
          </div>
        )}

        {/* Tournament statistics */}
        <div className="mb-5 flex items-center justify-center gap-3">
          <h3 className="font-anton text-xl tracking-wide text-cream/70">NÚMEROS DEL TORNEO</h3>
          <span className={`font-mono text-[10px] tracking-widest px-3 py-1.5 rounded-full border ${statsLive ? "border-neon/40 text-neon" : "border-cream/15 text-cream/40"}`}>
            {statsLive ? "● EN VIVO — ESPN" : "○ DATOS DE MUESTRA"}
          </span>
        </div>
        <div id="estadisticas" className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 80} className="liquid-glass text-center px-6 py-10 hover:-translate-y-1.5 hover:shadow-[0_0_28px_rgba(111,255,0,0.18)]">
              <p className={`font-anton text-5xl sm:text-7xl ${s.color} tabular-nums`}>
                <Counter target={s.value} />
              </p>
              <p className="font-mono text-xs tracking-widest text-cream/60 mt-2">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
