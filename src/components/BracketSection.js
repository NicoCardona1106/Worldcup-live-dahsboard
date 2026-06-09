"use client";

import Reveal from "./Reveal";
import TeamBadge from "./TeamBadge";
import BackgroundVideo from "./BackgroundVideo";
import { useLiveBracket } from "@/hooks/useLiveData";

// Placeholder bracket shape — empty slots (no invented teams/scores). The
// knockout cross-ups can't be known until the group stage finishes, so this is
// just the visual scaffold that gets replaced by `useLiveBracket` once ESPN
// publishes real rounds.
const PLACEHOLDER_ROUNDS = [
  { slug: "round-of-16", title: "OCTAVOS", offset: "", slotCount: 4 },
  { slug: "quarterfinals", title: "CUARTOS", offset: "mt-12", slotCount: 2 },
  { slug: "semifinals", title: "SEMIFINALES", offset: "mt-32", slotCount: 1 },
];

function EmptySlot() {
  return (
    <div className="liquid-glass px-4 py-3 mb-2 flex items-center justify-between border-l-2 border-transparent text-cream/30 transition-transform hover:translate-x-1">
      <span className="tracking-widest text-[11px]">POR DEFINIR</span>
      <span className="font-anton">–</span>
    </div>
  );
}

function MatchSlot({ m }) {
  const decided = m.status === "FINAL";
  return (
    <div
      className={`liquid-glass px-4 py-3 mb-2 space-y-1.5 border-l-2 transition-transform hover:translate-x-1 ${
        decided ? "border-neon/40" : "border-transparent"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`flex items-center gap-2 truncate ${decided && m.homeScore > m.awayScore ? "text-neon" : "text-cream/70"}`}>
          <TeamBadge flag={m.homeLogo} size="text-sm" />
          <span className="truncate">{m.homeTeam}</span>
        </span>
        <span className="font-anton tabular-nums shrink-0">{m.homeScore ?? "–"}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className={`flex items-center gap-2 truncate ${decided && m.awayScore > m.homeScore ? "text-neon" : "text-cream/70"}`}>
          <TeamBadge flag={m.awayLogo} size="text-sm" />
          <span className="truncate">{m.awayTeam}</span>
        </span>
        <span className="font-anton tabular-nums shrink-0">{m.awayScore ?? "–"}</span>
      </div>
    </div>
  );
}

export default function BracketSection() {
  const { data: rounds, live } = useLiveBracket();
  const finalRound = live ? rounds.find((r) => r.slug === "final") : null;
  const finalMatch = finalRound?.matches?.[0] || null;

  return (
    <section className="relative py-28 sm:py-36 overflow-hidden">
      <BackgroundVideo
        src="https://cdn.coverr.co/videos/coverr-confetti-falling-on-a-stadium-crowd-2208/1080p.mp4"
        className="absolute inset-0 w-full h-full object-cover opacity-25"
      />
      <div className="absolute inset-0 gradient-overlay-dark" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10">
        <Reveal className="mb-16 flex flex-col items-center text-center gap-3">
          <p className="font-condiment text-2xl sm:text-4xl text-neon/90">knockout stage</p>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <h2 className="font-anton text-5xl sm:text-7xl tracking-tight">CAMINO A LA FINAL</h2>
            <span className={`font-mono text-[10px] tracking-widest px-3 py-1.5 rounded-full border ${live ? "border-neon/40 text-neon" : "border-cream/15 text-cream/40"}`}>
              {live ? "● DEFINIDO — ESPN" : "○ POR DEFINIR"}
            </span>
          </div>
          <p className="font-mono text-xs text-cream/40 max-w-xl">
            {live
              ? "Estos son los cruces reales de la fase eliminatoria, actualizados directamente desde ESPN."
              : "El cuadro de eliminación todavía no existe — se arma con los clasificados de cada grupo. Esta sección se va a completar sola, ronda por ronda, en cuanto ESPN publique los cruces reales."}
          </p>
        </Reveal>

        {live ? (
          <Reveal className="overflow-x-auto scroll-hide pb-6">
            <div className="min-w-[920px] grid gap-6 font-mono text-sm" style={{ gridTemplateColumns: `repeat(${rounds.length}, minmax(200px, 1fr))` }}>
              {rounds.map((round, idx) => (
                <div key={round.slug} className={idx > 0 ? "mt-12" : ""}>
                  <p className="font-anton text-xs tracking-widest text-cream/50 mb-2">{round.title}</p>
                  {round.matches.map((m) => (
                    <MatchSlot key={m.id} m={m} />
                  ))}
                </div>
              ))}
            </div>
          </Reveal>
        ) : (
          <Reveal className="overflow-x-auto scroll-hide pb-6">
            <div className="min-w-[920px] grid grid-cols-4 gap-6 font-mono text-sm">
              {PLACEHOLDER_ROUNDS.map((round) => (
                <div key={round.slug} className={`space-y-6 ${round.offset}`}>
                  <p className="font-anton text-xs tracking-widest text-cream/50 mb-2">{round.title}</p>
                  {Array.from({ length: round.slotCount }).map((_, i) => (
                    <div key={i} className={i > 0 && round.title === "SEMIFINALES" ? "pt-4" : ""}>
                      <EmptySlot />
                    </div>
                  ))}
                </div>
              ))}

              <div className="space-y-6 mt-44">
                <p className="font-anton text-xs tracking-widest text-cream/50 mb-2">FINAL</p>
                <div className="liquid-glass px-5 py-5 text-center border border-cream/10">
                  <p className="font-anton text-lg text-cream/40">POR DEFINIR</p>
                  <p className="font-mono text-xs text-cream/40 mt-1">19 JUL 2026</p>
                </div>
              </div>
            </div>
          </Reveal>
        )}

        {/* Featured final — date & venue are the real scheduled fixture; the
            teams populate automatically once ESPN confirms the finalists. */}
        <Reveal delay={120} className={`liquid-glass mt-16 max-w-3xl mx-auto px-8 sm:px-14 py-12 text-center ${finalMatch ? "neon-border" : "border border-cream/10"}`}>
          <p className={`font-anton text-xs sm:text-sm tracking-[0.3em] mb-4 ${finalMatch ? "text-neon" : "text-cream/50"}`}>FINAL DEL MUNDIAL 2026</p>
          {finalMatch ? (
            <div className="grid grid-cols-3 items-center gap-4">
              <div className="text-right flex flex-col items-end gap-2">
                <TeamBadge flag={finalMatch.homeLogo} size="text-4xl" />
                <p className="font-anton text-xl sm:text-3xl">{finalMatch.homeTeam.toUpperCase()}</p>
              </div>
              <p className="font-anton text-5xl sm:text-6xl text-cream/90 tabular-nums">
                {finalMatch.status === "SCHEDULED" ? "VS" : `${finalMatch.homeScore} — ${finalMatch.awayScore}`}
              </p>
              <div className="text-left flex flex-col items-start gap-2">
                <TeamBadge flag={finalMatch.awayLogo} size="text-4xl" />
                <p className="font-anton text-xl sm:text-3xl">{finalMatch.awayTeam.toUpperCase()}</p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 items-center gap-4">
                <div className="text-right">
                  <p className="font-anton text-xl sm:text-3xl text-cream/40">POR DEFINIR</p>
                </div>
                <p className="font-anton text-3xl sm:text-4xl text-cream/30 tracking-widest">VS</p>
                <div className="text-left">
                  <p className="font-anton text-xl sm:text-3xl text-cream/40">POR DEFINIR</p>
                </div>
              </div>
              <p className="font-mono text-[11px] text-cream/30 mt-4 max-w-md mx-auto leading-relaxed">
                Los finalistas se conocen recién al terminar las semifinales — esta tarjeta se va a actualizar
                sola con los equipos reales cuando estén definidos.
              </p>
            </>
          )}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 font-mono text-xs sm:text-sm text-cream/60 tracking-widest">
            <span className="px-4 py-1.5 rounded-full border border-cream/20">📅 19 JUL 2026</span>
            <span className="px-4 py-1.5 rounded-full border border-cream/20">📍 METLIFE STADIUM</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
