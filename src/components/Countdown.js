"use client";

import { useEffect, useState } from "react";

function diffParts(target) {
  const ms = target - Date.now();
  if (ms <= 0) return null;
  const totalSec = Math.floor(ms / 1000);
  return {
    days: Math.floor(totalSec / 86400),
    hours: Math.floor((totalSec % 86400) / 3600),
    mins: Math.floor((totalSec % 3600) / 60),
    secs: totalSec % 60,
  };
}

// Live ticking countdown to an ISO kickoff. Starts as `undefined` (so server
// and the first client paint match — no hydration mismatch) and fills in on
// the next frame, then ticks every second. Once the target passes (`null`) it
// shows a "starting" state instead of vanishing, covering the gap until the
// data provider actually flips the match to live.
export default function Countdown({ iso, className = "" }) {
  const target = iso ? new Date(iso).getTime() : NaN;
  const [parts, setParts] = useState(undefined);

  useEffect(() => {
    if (Number.isNaN(target)) return;
    const raf = requestAnimationFrame(() => setParts(diffParts(target)));
    const id = setInterval(() => setParts(diffParts(target)), 1000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
    };
  }, [target]);

  if (Number.isNaN(target) || parts === undefined) return null;

  if (parts === null) {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`}>
        <span className="pulse-dot" style={{ width: 8, height: 8 }} />
        <span className="font-anton text-lg sm:text-xl tracking-[0.2em] text-neon">¡POR COMENZAR!</span>
      </span>
    );
  }

  const seg = (val, label) => (
    <div className="flex flex-col items-center">
      <span className="font-anton text-2xl sm:text-3xl tabular-nums leading-none">{String(val).padStart(2, "0")}</span>
      <span className="font-mono text-[9px] tracking-widest text-cream/40 mt-1">{label}</span>
    </div>
  );

  const sep = <span className="font-anton text-xl sm:text-2xl text-cream/20 leading-none -mt-2">:</span>;

  return (
    <div className={`inline-flex items-center gap-3 sm:gap-4 ${className}`}>
      {parts.days > 0 && (
        <>
          {seg(parts.days, "DÍAS")}
          {sep}
        </>
      )}
      {seg(parts.hours, "HRS")}
      {sep}
      {seg(parts.mins, "MIN")}
      {sep}
      {seg(parts.secs, "SEG")}
    </div>
  );
}
