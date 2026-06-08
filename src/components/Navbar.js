"use client";

import { useEffect, useState } from "react";

const links = [
  { href: "#hero", label: "INICIO" },
  { href: "#en-vivo", label: "EN VIVO" },
  { href: "#partidos", label: "PARTIDOS" },
  { href: "#grupos", label: "GRUPOS" },
  { href: "#estadisticas", label: "ESTADÍSTICAS" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed top-0 inset-x-0 z-50 px-4 sm:px-8 py-3">
      <nav
        className={`liquid-glass max-w-7xl mx-auto flex items-center justify-between px-5 sm:px-8 py-3 transition-all duration-300 ${
          scrolled ? "shadow-[0_8px_40px_rgba(1,8,40,0.6)]" : ""
        }`}
      >
        <a href="#hero" className="font-anton text-lg sm:text-2xl tracking-wide">
          WORLD <span className="text-neon neon-text">CUP</span> LIVE
        </a>

        <ul className="hidden md:flex items-center gap-8 font-anton text-sm tracking-wider text-cream/80">
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="hover:text-neon transition-colors">
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 liquid-glass !rounded-full px-4 py-1.5">
            <span className="pulse-dot" />
            <span className="font-anton text-xs sm:text-sm tracking-widest text-neon">EN VIVO</span>
          </div>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Abrir menú"
            className="md:hidden liquid-glass !rounded-full w-10 h-10 flex items-center justify-center"
          >
            <span className="font-anton text-lg">{open ? "✕" : "☰"}</span>
          </button>
        </div>
      </nav>

      {open && (
        <div className="md:hidden liquid-glass max-w-7xl mx-auto mt-2 px-6 py-5">
          <ul className="flex flex-col gap-4 font-anton text-base tracking-wider text-cream/80">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} onClick={() => setOpen(false)} className="hover:text-neon transition-colors">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
