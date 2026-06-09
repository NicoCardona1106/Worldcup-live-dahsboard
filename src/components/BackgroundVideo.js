"use client";

import { forwardRef, useEffect, useRef } from "react";

// A 16:9 navy poster so the slot is never a white/empty flash before the clip
// decodes — matches the page background.
const NAVY_POSTER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='9'%3E%3Crect width='16' height='9' fill='%23010828'/%3E%3C/svg%3E";

/**
 * Decorative looping background video that only plays while it's actually on
 * screen. The dashboard stacks several of these; letting them all autoplay/decode
 * at once is heavy on bandwidth and battery (especially on mobile), so we:
 *   - `preload="none"` and start playback lazily via IntersectionObserver,
 *   - pause as soon as the section scrolls out of view,
 *   - leave them on the navy poster frame when the visitor prefers reduced motion.
 *
 * Forwards its ref to the underlying <video> so callers (e.g. the hero parallax)
 * can still drive it directly.
 */
const BackgroundVideo = forwardRef(function BackgroundVideo({ src, className = "" }, externalRef) {
  const innerRef = useRef(null);

  const setRefs = (node) => {
    innerRef.current = node;
    if (typeof externalRef === "function") externalRef(node);
    else if (externalRef) externalRef.current = node;
  };

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !reduce) {
          el.play?.().catch(() => {});
        } else {
          el.pause?.();
        }
      },
      { threshold: 0.05 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <video ref={setRefs} muted loop playsInline preload="none" poster={NAVY_POSTER} className={`bg-bgnavy ${className}`}>
      <source src={src} type="video/mp4" />
    </video>
  );
});

export default BackgroundVideo;
