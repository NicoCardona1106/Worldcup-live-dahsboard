"use client";

import { useEffect, useRef, useState } from "react";

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
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState("#hero");

  // Shadow + scroll-progress bar, both driven by a single scroll handler.
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      setScrolled(doc.scrollTop > 40);
      setProgress(max > 0 ? (doc.scrollTop / max) * 100 : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll-spy driven by scroll position (not a narrow IntersectionObserver
  // band). It always resolves to exactly one active link — the last section
  // whose top has passed under the navbar — so the green indicator never
  // disappears in gaps and never flickers between nested sections
  // (#partidos lives inside #en-vivo, #estadisticas inside #grupos).
  const lockUntil = useRef(0);
  useEffect(() => {
    const ids = links.map((l) => l.href.slice(1));
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (els.length === 0) return;

    const NAV_OFFSET = 110; // navbar height + breathing room
    const sync = () => {
      if (Date.now() < lockUntil.current) return; // hold selection after a click
      const y = window.scrollY + NAV_OFFSET;
      let current = els[0].id;
      for (const el of els) {
        const top = el.getBoundingClientRect().top + window.scrollY;
        if (top <= y) current = el.id;
      }
      // At the very bottom, force the last link active — short trailing
      // sections whose top never reaches the offset would otherwise stay unlit.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        current = els[els.length - 1].id;
      }
      setActive("#" + current);
    };

    sync();
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      window.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  // Light the indicator immediately on click and lock out the scroll handler
  // briefly so the smooth-scroll animation can't flicker the selection.
  const handleNavClick = (href) => {
    setActive(href);
    lockUntil.current = Date.now() + 800;
  };

  return (
    <>
      {/* Scroll-progress bar pinned to the very top edge */}
      <div className="fixed top-0 inset-x-0 z-[55] h-0.5 bg-transparent pointer-events-none">
        <div
          className="h-full bg-neon shadow-[0_0_10px_rgba(111,255,0,0.7)] transition-[width] duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

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
            {links.map((l) => {
              const isActive = active === l.href;
              return (
                <li key={l.href}>
                  <a
                    href={l.href}
                    onClick={() => handleNavClick(l.href)}
                    className={`relative transition-colors ${isActive ? "text-neon" : "hover:text-neon"}`}
                  >
                    {l.label}
                    <span
                      className={`absolute -bottom-1.5 left-0 h-0.5 rounded-full bg-neon shadow-[0_0_8px_rgba(111,255,0,0.7)] transition-all duration-300 ${
                        isActive ? "w-full opacity-100" : "w-0 opacity-0"
                      }`}
                    />
                  </a>
                </li>
              );
            })}
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
                  <a
                    href={l.href}
                    onClick={() => {
                      handleNavClick(l.href);
                      setOpen(false);
                    }}
                    className={`transition-colors ${active === l.href ? "text-neon" : "hover:text-neon"}`}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </header>
    </>
  );
}
