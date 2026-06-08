"use client";

import Reveal from "./Reveal";

export default function CTASection() {
  return (
    <section className="relative py-32 sm:py-44 overflow-hidden">
      <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
        <source src="https://cdn.coverr.co/videos/coverr-fans-cheering-at-a-football-match-7659/1080p.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 gradient-overlay-dark" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-10 text-center">
        <Reveal>
          <p className="font-condiment text-3xl sm:text-5xl text-neon/90 mb-2">world cup passion</p>
          <h2 className="font-anton text-4xl sm:text-6xl lg:text-7xl leading-tight tracking-tight">
            NO TE PIERDAS
            <br />
            NINGÚN PARTIDO
          </h2>
        </Reveal>

        <Reveal delay={120}>
          <p className="font-mono text-sm sm:text-base text-cream/70 mt-8 max-w-2xl mx-auto leading-relaxed">
            SIGUE LOS RESULTADOS EN VIVO, ESTADÍSTICAS, CLASIFICACIONES Y CADA MOMENTO DEL MUNDIAL DESDE UN SOLO LUGAR.
          </p>
        </Reveal>

        <Reveal delay={240} className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#en-vivo"
            className="font-anton tracking-widest text-sm px-9 py-4 rounded-full bg-neon text-bgnavy shadow-[0_0_28px_rgba(111,255,0,0.55)] hover:shadow-[0_0_44px_rgba(111,255,0,0.8)] hover:scale-105 transition-all"
          >
            VER PARTIDOS EN VIVO
          </a>
          <a
            href="#grupos"
            className="font-anton tracking-widest text-sm px-9 py-4 rounded-full liquid-glass hover:border-neon/60 hover:scale-105 transition-all"
          >
            VER CLASIFICACIÓN
          </a>
        </Reveal>
      </div>
    </section>
  );
}
