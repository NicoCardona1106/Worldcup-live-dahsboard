"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Polls a same-origin JSON endpoint and exposes its data, falling back to
 * `placeholder` until the first successful response (and again if every
 * request fails) so the UI always has something sensible to render — useful
 * here since the 2026 World Cup hasn't kicked off yet and ESPN may return an
 * empty fixture list outside matchdays.
 *
 * `pick` extracts the relevant slice from the JSON body and should return
 * `null`/`undefined`/an empty array|object when there's nothing usable yet.
 */
function useLiveData(url, pick, placeholder, intervalMs) {
  const [data, setData] = useState(placeholder);
  const [live, setLive] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    async function load() {
      try {
        const res = await fetch(url, { cache: "no-store" });
        const body = await res.json();
        const picked = pick(body);
        const hasData = Array.isArray(picked) ? picked.length > 0 : picked && Object.keys(picked).length > 0;
        if (!mounted.current) return;
        if (hasData) {
          setData(picked);
          setLive(true);
        }
      } catch {
        // Network hiccup — keep showing whatever we already had (live or placeholder).
      }
    }

    load();
    const id = setInterval(load, intervalMs);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [url, intervalMs]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, live };
}

export function useLiveMatches(placeholder, { pollMs = 45_000 } = {}) {
  return useLiveData("/api/scoreboard", (body) => body?.matches, placeholder, pollMs);
}

export function useLiveStandings(placeholder, { pollMs = 5 * 60_000 } = {}) {
  return useLiveData("/api/standings", (body) => body?.groups, placeholder, pollMs);
}

// Knockout bracket — stays empty (`live: false`) until ESPN actually publishes
// the rounds (i.e. once the group stage finishes), so the section can show a
// "to be defined" placeholder until then and switch to real cross-ups by itself.
export function useLiveBracket({ pollMs = 5 * 60_000 } = {}) {
  return useLiveData("/api/bracket", (body) => body?.rounds, [], pollMs);
}

// Headline tournament numbers (matches played, goals, average, attendance) —
// computed from real played fixtures, so they read "0" until the first match
// has actually been played rather than showing invented totals.
export function useLiveTournamentStats({ pollMs = 5 * 60_000 } = {}) {
  return useLiveData("/api/stats", (body) => body?.stats, [], pollMs);
}

// Top scorers — built from goal events in played/live matches, so it stays
// empty (and the UI shows clearly-labelled sample names) until somebody has
// actually scored a World Cup goal.
export function useLiveTopScorers({ pollMs = 5 * 60_000 } = {}) {
  return useLiveData("/api/stats", (body) => body?.topScorers, [], pollMs);
}
