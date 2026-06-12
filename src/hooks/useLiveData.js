"use client";

import { useEffect, useState } from "react";

/**
 * Polls a same-origin JSON endpoint and exposes its data, falling back to
 * `placeholder` until the first successful response (and again if every
 * request fails) so the UI always has something sensible to render — useful
 * here since ESPN may return an empty fixture list outside matchdays.
 *
 * `pick` extracts the relevant slice from the JSON body and should return
 * `null`/`undefined`/an empty array|object when there's nothing usable yet.
 *
 * Liveness:
 * - `fastWhen(picked)` + `fastMs`: when the predicate matches (e.g. a match
 *   is in play), polling tightens from `intervalMs` to `fastMs`, so live
 *   scores update in seconds instead of high tens of seconds.
 * - The page refetches immediately when the tab becomes visible again —
 *   browsers throttle/suspend timers in background tabs, which otherwise
 *   leaves a stale score on screen exactly when someone switches back to
 *   check it (the "I had to reload to see the goal" effect).
 */
function useLiveData(url, pick, placeholder, intervalMs, { fastMs, fastWhen } = {}) {
  const [data, setData] = useState(placeholder);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let stopped = false;
    let timer = null;
    let delay = intervalMs;
    // Generation counter: visibility-triggered restarts bump it so any older
    // in-flight cycle exits instead of double-scheduling a second loop.
    let gen = 0;

    async function load() {
      try {
        const res = await fetch(url, { cache: "no-store" });
        const body = await res.json();
        const picked = pick(body);
        const hasData = Array.isArray(picked) ? picked.length > 0 : picked && Object.keys(picked).length > 0;
        if (stopped) return;
        if (hasData) {
          setData(picked);
          setLive(true);
          delay = fastMs && fastWhen?.(picked) ? fastMs : intervalMs;
        }
      } catch {
        // Network hiccup — keep showing whatever we already had (live or placeholder).
      }
    }

    async function cycle(myGen) {
      await load();
      if (stopped || myGen !== gen) return;
      timer = setTimeout(() => cycle(myGen), delay);
    }

    cycle(gen);

    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible" || stopped) return;
      gen += 1;
      clearTimeout(timer);
      cycle(gen);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [url, intervalMs]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, live };
}

// Matches poll fast (12s) while anything is in play, easing back to 45s when
// nothing is live — combined with the 10s server-side revalidate, a goal
// shows up on screen within ~20s without anyone touching the page.
export function useLiveMatches(placeholder, { pollMs = 45_000, livePollMs = 12_000 } = {}) {
  return useLiveData("/api/scoreboard", (body) => body?.matches, placeholder, pollMs, {
    fastMs: livePollMs,
    fastWhen: (matches) => matches.some((m) => m.status === "LIVE"),
  });
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
