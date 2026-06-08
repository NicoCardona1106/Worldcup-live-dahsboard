export default function Footer() {
  return (
    <footer className="relative border-t border-cream/10 py-14 px-6 sm:px-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-start justify-between gap-10">
        <div className="text-center md:text-left">
          <p className="font-anton text-2xl tracking-wide">
            WORLD <span className="text-neon">CUP</span> LIVE
          </p>
          <p className="font-mono text-xs text-cream/50 mt-2 tracking-wider">2026 FIFA WORLD CUP DASHBOARD</p>
        </div>

        <ul className="flex gap-6 font-anton text-xs tracking-widest text-cream/70">
          <li><a href="#hero" className="hover:text-neon transition-colors">INICIO</a></li>
          <li><a href="#partidos" className="hover:text-neon transition-colors">PARTIDOS</a></li>
          <li><a href="#grupos" className="hover:text-neon transition-colors">GRUPOS</a></li>
          <li><a href="#estadisticas" className="hover:text-neon transition-colors">ESTADÍSTICAS</a></li>
        </ul>

        <div className="flex gap-4">
          <a href="#" aria-label="X" className="liquid-glass !rounded-full w-10 h-10 flex items-center justify-center hover:text-neon hover:scale-110 transition-all text-sm font-anton">X</a>
          <a href="#" aria-label="Instagram" className="liquid-glass !rounded-full w-10 h-10 flex items-center justify-center hover:text-neon hover:scale-110 transition-all text-sm">IG</a>
          <a href="#" aria-label="YouTube" className="liquid-glass !rounded-full w-10 h-10 flex items-center justify-center hover:text-neon hover:scale-110 transition-all text-sm">YT</a>
        </div>
      </div>
      <p className="text-center font-mono text-[11px] text-cream/30 mt-12">
        © 2026 WORLD CUP LIVE — Datos de muestra. Listo para integración con API en tiempo real.
      </p>
    </footer>
  );
}
