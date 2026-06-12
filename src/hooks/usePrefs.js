"use client";

import { useEffect, useState } from "react";

// Tiny localStorage-backed prefs shared across components. Components start
// from the default (matching the server-rendered HTML, so no hydration
// mismatch), hydrate from storage right after mount, and stay in sync with
// each other through a custom window event — no context provider needed.
const PREF_EVENT = "wcl-pref-change";

function readPref(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function useLocalPref(key, fallback) {
  const [value, setValue] = useState(fallback);

  useEffect(() => {
    // Hydrating a client-only preference after mount — there's no SSR-safe
    // render-time equivalent, so this single sync setState is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(readPref(key, fallback));
    const onChange = (e) => {
      if (e.detail?.key === key) setValue(e.detail.value);
    };
    window.addEventListener(PREF_EVENT, onChange);
    return () => window.removeEventListener(PREF_EVENT, onChange);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (next) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Storage unavailable (private mode) — the in-memory value still works.
    }
    window.dispatchEvent(new CustomEvent(PREF_EVENT, { detail: { key, value: next } }));
  };

  return [value, update];
}

// "colombia" (default, matches the server-formatted times) or "local"
// (reformat kickoffISO in the visitor's own timezone).
export function useTimeZonePref() {
  const [zone, setZone] = useLocalPref("wcl-timezone", "colombia");
  const isLocal = zone === "local";
  const toggle = () => setZone(isLocal ? "colombia" : "local");
  return { isLocal, toggle };
}

// Teams the visitor follows — their matches get pinned first and accented
// gold, like Colombia's. Stored by team display name.
export function useFavoriteTeams() {
  const [favorites, setFavorites] = useLocalPref("wcl-favorites", []);
  const isFavorite = (team) => favorites.includes(team);
  const toggleFavorite = (team) =>
    setFavorites(isFavorite(team) ? favorites.filter((t) => t !== team) : [...favorites, team]);
  return { favorites, isFavorite, toggleFavorite };
}

// Local-timezone rendering of a kickoff, shaped like the server's
// Colombia-time fields so components can swap one for the other.
export function localKickoff(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return {
    time: d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }),
    dateShort: d
      .toLocaleDateString("es", { weekday: "short", day: "2-digit", month: "short" })
      .replace(/[.,]/g, "")
      .toUpperCase(),
  };
}
