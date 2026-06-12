"use client";

import { useEffect, useRef, useState } from "react";

// Fires a short-lived `true` whenever a live match's total score increases —
// the polling already brings the new score, this just notices the jump.
// Tracks the match id so switching featured matches (or the placeholder→live
// swap) never reads as a goal.
export default function useGoalCelebration(match, durationMs = 5000) {
  const [celebrating, setCelebrating] = useState(false);
  const prev = useRef(null);

  const id = match?.id;
  const total = match ? (match.homeScore ?? 0) + (match.awayScore ?? 0) : null;
  const live = match?.status === "LIVE";

  useEffect(() => {
    const before = prev.current;
    prev.current = { id, total };
    if (!live || total == null || !before || before.id !== id || before.total == null) return;
    if (total > before.total) {
      // A goal just landed in the data. ¡GOOOL!
      setCelebrating(true);
      const t = setTimeout(() => setCelebrating(false), durationMs);
      return () => clearTimeout(t);
    }
  }, [id, total, live, durationMs]);

  return celebrating;
}
