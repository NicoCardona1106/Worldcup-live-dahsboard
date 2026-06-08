"use client";

import { useEffect, useRef, useState } from "react";

// Animates a numeric value upward when it scrolls into view. Supports decimals
// (e.g. "5.3") and suffixes (e.g. "89%") by parsing the numeric portion of `target`.
export default function Counter({ target, className = "" }) {
  const ref = useRef(null);
  const [display, setDisplay] = useState(null);

  useEffect(() => {
    const match = String(target).match(/^([\d.]+)(.*)$/);
    if (!match) {
      setDisplay(target);
      return;
    }
    const [, numStr, suffix] = match;
    const end = parseFloat(numStr);
    const decimals = numStr.includes(".") ? numStr.split(".")[1].length : 0;
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.unobserve(el);
        const duration = 1400;
        const start = performance.now();
        const tick = (now) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const value = end * eased;
          setDisplay(value.toFixed(decimals) + suffix);
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [target]);

  return (
    <span ref={ref} className={className}>
      {display ?? "0"}
    </span>
  );
}
