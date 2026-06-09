"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// Animates a numeric value upward when it scrolls into view. Supports decimals
// (e.g. "5.3") and suffixes (e.g. "89%") by parsing the numeric portion of `target`.
export default function Counter({ target, className = "" }) {
  // Parse the target once. A `null` result means it isn't numeric, so we render
  // it verbatim and skip the animation entirely (no effect, no state churn).
  const parsed = useMemo(() => {
    const match = String(target).match(/^([\d.]+)(.*)$/);
    if (!match) return null;
    const [, numStr, suffix] = match;
    return {
      end: parseFloat(numStr),
      suffix,
      decimals: numStr.includes(".") ? numStr.split(".")[1].length : 0,
    };
  }, [target]);

  const ref = useRef(null);
  const [display, setDisplay] = useState(null);

  useEffect(() => {
    if (!parsed) return;
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
          // setState lives in the rAF callback (an external-system callback),
          // not synchronously in the effect body.
          setDisplay((parsed.end * eased).toFixed(parsed.decimals) + parsed.suffix);
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [parsed]);

  // Non-numeric → render as-is. Numeric → animated value, starting from a
  // zero that already carries the right decimals/suffix (e.g. "0%", "0.0").
  const content = parsed ? display ?? (0).toFixed(parsed.decimals) + parsed.suffix : target;

  return (
    <span ref={ref} className={className}>
      {content}
    </span>
  );
}
