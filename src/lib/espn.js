// Thin client + transformers for ESPN's public (unauthenticated) soccer API,
// scoped to the FIFA World Cup ("fifa.world"). These endpoints are not an
// official/documented product — they can change shape without notice, so every
// transformer defends against missing fields and the API routes that call these
// always fall back to the placeholder data in `lib/data.js` on any failure.

const SCOREBOARD_URL = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";
const STANDINGS_URL = "https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings";
const SUMMARY_URL = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary";

const STAGE_LABELS = {
  "group-stage": "FASE DE GRUPOS",
  "round-of-32": "DIECISEISAVOS",
  "round-of-16": "OCTAVOS DE FINAL",
  "quarterfinals": "CUARTOS DE FINAL",
  "semifinals": "SEMIFINALES",
  "third-place": "TERCER PUESTO",
  final: "FINAL",
};

function stageLabel(slug) {
  return STAGE_LABELS[slug] || (slug ? slug.toUpperCase().replace(/-/g, " ") : "MUNDIAL 2026");
}

function statusFromState(statusType, displayClock) {
  switch (statusType?.state) {
    case "in":
      // Clocks like "45'+3'" carry several apostrophes — strip them all, the UI
      // re-appends a single trailing one.
      return { status: "LIVE", minute: (displayClock || "").replace(/'/g, "").trim() || null };
    case "post":
      return { status: "FINAL", minute: null };
    default:
      return { status: "SCHEDULED", minute: null };
  }
}

// Always rendered in Colombia time (America/Bogota), regardless of the
// timezone of the machine running this code (e.g. Vercel's servers run in UTC).
function kickoffTime(dateIso) {
  try {
    return new Date(dateIso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", timeZone: "America/Bogota" });
  } catch {
    return "";
  }
}

function kickoffDate(dateIso) {
  try {
    return new Date(dateIso).toLocaleDateString("es-CO", { weekday: "long", day: "2-digit", month: "long", year: "numeric", timeZone: "America/Bogota" });
  } catch {
    return "";
  }
}

// Compact Colombia-time day label for cards, e.g. "SÁB 14 JUN".
function kickoffDayShort(dateIso) {
  try {
    return new Date(dateIso)
      .toLocaleDateString("es-CO", { weekday: "short", day: "2-digit", month: "short", timeZone: "America/Bogota" })
      .replace(/[.,]/g, "")
      .toUpperCase();
  } catch {
    return "";
  }
}

// One numeric stat from a competitor's `statistics` array, or null if ESPN
// didn't send it (or sent something non-numeric).
function statNumber(competitor, name) {
  const raw = competitor?.statistics?.find((s) => s.name === name)?.displayValue;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : null;
}

// The scoreboard *does* ship per-team live stats (possession, shots, shots on
// target, corners) inside `competitors[].statistics`. Each pair is keyed off
// the competitor's `homeAway` flag — never array position — so home/away can't
// get swapped. A pair is dropped (null) unless both sides report a number.
function extractStats(home, away) {
  const pair = (name, round) => {
    const h = statNumber(home, name);
    const a = statNumber(away, name);
    if (h == null || a == null) return null;
    return round ? [Math.round(h), Math.round(a)] : [h, a];
  };
  const stats = {
    possession: pair("possessionPct", true),
    shots: pair("totalShots"),
    shotsOnTarget: pair("shotsOnTarget"),
    corners: pair("wonCorners"),
  };
  return Object.values(stats).some(Boolean) ? stats : null;
}

/** Maps one ESPN scoreboard `event` into the shape our UI expects. */
export function transformMatch(event) {
  const competition = event?.competitions?.[0];
  const competitors = competition?.competitors || [];
  const home = competitors.find((c) => c.homeAway === "home");
  const away = competitors.find((c) => c.homeAway === "away");
  if (!home || !away) return null;

  const statusType = competition?.status?.type;
  const { status, minute } = statusFromState(statusType, competition?.status?.displayClock);
  const live = status === "LIVE";

  return {
    id: event.id,
    homeTeam: home.team?.shortDisplayName || home.team?.displayName || "—",
    homeLogo: home.team?.logo || null,
    awayTeam: away.team?.shortDisplayName || away.team?.displayName || "—",
    awayLogo: away.team?.logo || null,
    homeScore: home.score != null ? Number(home.score) : null,
    awayScore: away.score != null ? Number(away.score) : null,
    minute,
    status,
    time: live ? "LIVE" : status === "FINAL" ? "FINAL" : kickoffTime(event.date),
    // Full calendar date of kickoff — the scoreboard can return fixtures from
    // several different days, so anything consuming `time` (which is just the
    // clock) needs this to know *which* day a match is actually on.
    date: kickoffDate(event.date),
    dateShort: kickoffDayShort(event.date),
    kickoffISO: event.date || null,
    group: stageLabel(event?.season?.slug),
    venue: competition?.venue?.fullName || null,
    statusDetail: statusType?.shortDetail || statusType?.detail || null,
    // Real per-team stats straight from the scoreboard — only meaningful once
    // the ball is rolling, so scheduled fixtures stay null (pre-match ESPN
    // sends all-zero rows which would render as misleading 0–0 bars).
    stats: live || status === "FINAL" ? extractStats(home, away) : null,
    events: [],
  };
}

// ===== Match timeline (goals, cards, subs) — from the per-match summary =====

// keyEvents type ids we surface in the timeline. Everything else (kickoff,
// halftime, drinks breaks, VAR delays…) is noise for a viewer.
const EVENT_KIND = {
  70: "goal", // Goal
  97: "goal", // Penalty - Scored
  98: "goal", // Penalty - Scored (alt)
  110: "goal", // Own Goal
  137: "goal", // Goal - Header
  138: "goal", // Goal - Free kick
  93: "red", // Red Card
  94: "yellow", // Yellow Card
  76: "sub", // Substitution
};

function eventName(participant) {
  return participant?.athlete?.shortName || participant?.athlete?.displayName || null;
}

// Turns one ESPN keyEvent into { minute, type, team, text } in Spanish.
function transformKeyEvent(ev) {
  const typeText = ev?.type?.text || "";
  const kind = EVENT_KIND[Number(ev?.type?.id)] || (ev?.scoringPlay ? "goal" : null);
  if (!kind) return null;

  const minute = ev?.clock?.displayValue || "";
  const team = ev?.team?.displayName || "";
  const p1 = eventName(ev?.participants?.[0]);
  const p2 = eventName(ev?.participants?.[1]);

  let text;
  if (kind === "goal") {
    const ownGoal = /own goal/i.test(typeText) || /own goal/i.test(ev?.text || "");
    const penalty = /penalty/i.test(typeText);
    const header = /header/i.test(typeText);
    text = `¡Gol de ${team}!${p1 ? ` ${p1}` : ""}${penalty ? " (de penal)" : header ? " (de cabeza)" : ""}${ownGoal ? " (en contra)" : ""}${p2 && !ownGoal && !penalty ? ` — asiste ${p2}` : ""}`;
  } else if (kind === "yellow") {
    text = `Amarilla para ${p1 || "—"} (${team})`;
  } else if (kind === "red") {
    text = `Roja para ${p1 || "—"} (${team})`;
  } else {
    text = p1 && p2 ? `Cambio en ${team}: entra ${p1} por ${p2}` : `Cambio en ${team}`;
  }

  return {
    minute,
    sort: (ev?.period?.number || 0) * 100000 + (ev?.clock?.value || 0),
    type: kind,
    team,
    text,
  };
}

/**
 * Fetches the goal/card/substitution timeline of one match from ESPN's
 * `summary` endpoint (`keyEvents`). Live matches revalidate fast so new goals
 * show up within ~30s; finished ones are effectively immutable so they cache
 * longer. Any failure degrades to an empty timeline, never an error.
 */
export async function fetchMatchEvents(eventId, { live = false } = {}) {
  try {
    const res = await fetch(`${SUMMARY_URL}?event=${eventId}`, { next: { revalidate: live ? 15 : 600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.keyEvents || [])
      .map(transformKeyEvent)
      .filter(Boolean)
      .sort((a, b) => a.sort - b.sort)
      .map(({ sort, ...ev }) => ev);
  } catch {
    return [];
  }
}

const DAY_MS = 86_400_000;

function dateParam(ms) {
  return new Date(ms).toISOString().slice(0, 10).replace(/-/g, "");
}

/**
 * Fetches the current World Cup picture: live matches, recently finished ones
 * (last 24h) and the next matchday's fixtures. Asking ESPN for a date *window*
 * (yesterday → +7 days) instead of "today" is what lets the hero countdown
 * roll over to the next scheduled match the moment a matchday ends, without
 * waiting for ESPN's day boundary or a manual page reload. Live and finished
 * matches also get their real event timeline attached.
 */
export async function fetchScoreboard() {
  const now = Date.now();
  // 10s server-side cache: short enough that, paired with the client's 12s
  // live polling, a goal reaches the screen in ~20s worst case — long enough
  // that many concurrent visitors still share one upstream request.
  const res = await fetch(`${SCOREBOARD_URL}?dates=${dateParam(now - DAY_MS)}-${dateParam(now + 7 * DAY_MS)}&limit=100`, {
    next: { revalidate: 10 },
  });
  if (!res.ok) throw new Error(`ESPN scoreboard ${res.status}`);
  const data = await res.json();

  const all = (data?.events || [])
    .map(transformMatch)
    .filter(Boolean)
    .sort((a, b) => new Date(a.kickoffISO || 0) - new Date(b.kickoffISO || 0));

  const live = all.filter((m) => m.status === "LIVE");
  const recentFinals = all.filter(
    (m) => m.status === "FINAL" && m.kickoffISO && now - new Date(m.kickoffISO).getTime() < DAY_MS
  );
  const upcoming = all.filter((m) => m.status === "SCHEDULED" && m.kickoffISO && new Date(m.kickoffISO).getTime() > now);
  // Only the next matchday's fixtures (not the whole week) so the cards grid
  // stays focused; `dateShort` is already pinned to Colombia time.
  const nextDay = upcoming[0]?.dateShort;
  const nextUp = upcoming.filter((m) => m.dateShort === nextDay).slice(0, 6);

  const matches = [...recentFinals, ...live, ...nextUp].sort(
    (a, b) => new Date(a.kickoffISO || 0) - new Date(b.kickoffISO || 0)
  );

  // Real timeline for everything already played / in play (bounded for cost).
  await Promise.allSettled(
    matches
      .filter((m) => m.status !== "SCHEDULED")
      .slice(0, 8)
      .map(async (m) => {
        m.events = await fetchMatchEvents(m.id, { live: m.status === "LIVE" });
      })
  );

  return { matches, day: data?.day?.date || null };
}

// World Cup 2026 runs June 11 – July 19. Knockout fixtures only start
// appearing on ESPN once the group stage wraps up (~late June), and even then
// they may show "TBD" placeholders until the bracket fills in round by round.
const TOURNAMENT_WINDOW = "20260611-20260720";
const KNOCKOUT_ORDER = ["round-of-32", "round-of-16", "quarterfinals", "semifinals", "third-place", "final"];

// ESPN creates the knockout fixture slots (with venue/kickoff) well before the
// teams are known, labelling each side with a slot code instead of a team name
// — e.g. "2A" (runner-up of Group A), "3RD A/B/C/D/F" (a best-third-place spot),
// or "RD32 W1"/"QF W2" (winner of an earlier round's match #N). None of that is
// meaningful to a viewer, so we treat any of those as "not decided yet".
const SLOT_CODE_RE = /^(\d[a-z]\b|3rd\b|(rd\d+|r16|r32|qf|sf)\s*w\d+|tbd\b|bye\b|winner\b|loser\b)/i;

function isSlotCode(name) {
  return !name || SLOT_CODE_RE.test(name.trim());
}

/**
 * Fetches every World Cup fixture in the tournament window and groups the
 * knockout-stage ones (everything past the group stage) by round, in bracket
 * order — but only once at least one side of a cross-up is a real, confirmed
 * team (not a "2A"/"RD32 W1"-style slot code). Returns `[]` while every
 * knockout fixture is still all slot codes, so the bracket section keeps
 * showing its "to be defined" placeholder and switches to real cross-ups on
 * its own, round by round, exactly as each one gets decided.
 */
export async function fetchBracket() {
  const res = await fetch(`${SCOREBOARD_URL}?dates=${TOURNAMENT_WINDOW}&limit=200`, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`ESPN bracket ${res.status}`);
  const data = await res.json();
  const events = data?.events || [];

  const byStage = {};
  for (const event of events) {
    const slug = event?.season?.slug;
    if (!slug || slug === "group-stage" || !KNOCKOUT_ORDER.includes(slug)) continue;
    const match = transformMatch(event);
    if (!match) continue;

    const homeKnown = !isSlotCode(match.homeTeam);
    const awayKnown = !isSlotCode(match.awayTeam);
    if (!homeKnown && !awayKnown) continue; // both sides still TBD — wait for at least one

    match.homeTeam = homeKnown ? match.homeTeam : "POR DEFINIR";
    match.awayTeam = awayKnown ? match.awayTeam : "POR DEFINIR";
    if (!homeKnown) match.homeLogo = null;
    if (!awayKnown) match.awayLogo = null;
    (byStage[slug] ||= []).push(match);
  }

  return KNOCKOUT_ORDER.filter((slug) => byStage[slug]?.length).map((slug) => ({
    slug,
    title: stageLabel(slug),
    matches: byStage[slug],
  }));
}

function formatAttendance(total) {
  if (total >= 1_000_000) return `${(total / 1_000_000).toFixed(1)}M`;
  if (total >= 1_000) return `${Math.round(total / 1000)}K`;
  return String(total);
}

/**
 * Fetches every fixture in the tournament window and rolls them up into the
 * four headline numbers shown above the standings — all derived from real,
 * already-played matches (ESPN's scoreboard doesn't expose stadium capacity,
 * so "estadios llenos" isn't something we can compute honestly; total
 * attendance is, and tells the same "how big is this thing" story).
 * Also returns the ids of finished/in-progress matches so `fetchTopScorers`
 * can pull goal scorers only from games that have actually been played.
 */
export async function fetchTournamentOverview() {
  const res = await fetch(`${SCOREBOARD_URL}?dates=${TOURNAMENT_WINDOW}&limit=200`, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`ESPN tournament ${res.status}`);
  const data = await res.json();
  const events = data?.events || [];

  let played = 0;
  let goals = 0;
  let attendance = 0;
  const playedOrLiveIds = [];

  for (const event of events) {
    const comp = event?.competitions?.[0];
    const state = comp?.status?.type?.state;
    if (state !== "post" && state !== "in") continue;
    playedOrLiveIds.push(event.id);
    if (state !== "post") continue;
    played += 1;
    for (const c of comp?.competitors || []) goals += Number(c?.score) || 0;
    attendance += Number(comp?.attendance) || 0;
  }

  const stats = [
    { value: `${played}/${events.length}`, label: "PARTIDOS JUGADOS", color: "text-neon" },
    { value: String(goals), label: "GOLES", color: "text-gold" },
    { value: played ? (goals / played).toFixed(1) : "0.0", label: "PROMEDIO POR PARTIDO", color: "text-blue" },
    { value: attendance ? formatAttendance(attendance) : "0", label: "ASISTENCIA TOTAL", color: "text-red" },
  ];

  return { stats, playedOrLiveIds, hasPlayedMatches: played > 0 };
}

/**
 * ESPN's site API doesn't publish a tournament-wide "top scorers" leaderboard
 * for the World Cup, so we build one ourselves from each played/live match's
 * summary (`competitions[0].details`, where `scoringPlay: true` entries carry
 * the scorer as `participants[0].athlete`). Own goals are excluded — they
 * count for the table but never for an individual's tally. Capped to a
 * handful of the most recent matches so this stays cheap even mid-tournament.
 */
export async function fetchTopScorers(eventIds) {
  const ids = eventIds.slice(-20);
  if (ids.length === 0) return [];

  const settled = await Promise.allSettled(
    ids.map((id) =>
      fetch(`${SUMMARY_URL}?event=${id}`, { next: { revalidate: 600 } }).then((r) => (r.ok ? r.json() : null))
    )
  );

  const tally = new Map();
  for (const result of settled) {
    if (result.status !== "fulfilled" || !result.value) continue;
    const competition = result.value?.header?.competitions?.[0];
    const details = competition?.details || [];
    if (!details.length) continue;

    const logoByTeamId = {};
    for (const c of competition?.competitors || []) {
      if (c?.team?.id) logoByTeamId[c.team.id] = c.team.logo || c.team.logos?.[0]?.href || null;
    }

    for (const play of details) {
      if (!play?.scoringPlay || play?.ownGoal) continue;
      const athlete = play?.participants?.[0]?.athlete;
      const name = athlete?.shortName || athlete?.displayName;
      if (!name) continue;
      const entry = tally.get(name) || { name, flag: logoByTeamId[play?.team?.id] || null, goals: 0 };
      entry.goals += 1;
      tally.set(name, entry);
    }
  }

  return [...tally.values()].sort((a, b) => b.goals - a.goals).slice(0, 5);
}

/** Maps one ESPN standings `entry` into the shape our group tables expect. */
function transformStandingsEntry(entry) {
  const stat = (name) => entry.stats?.find((s) => s.name === name)?.value ?? 0;
  const rank = entry.note?.rank ?? stat("rank");
  return {
    team: entry.team?.shortDisplayName || entry.team?.displayName || "—",
    flag: entry.team?.logo || entry.team?.logos?.[0]?.href || null,
    pj: stat("gamesPlayed"),
    g: stat("wins"),
    e: stat("ties"),
    p: stat("losses"),
    // Goal difference, signed as ESPN displays it ("+2", "-1", "0").
    dif: entry.stats?.find((s) => s.name === "pointDifferential")?.displayValue ?? null,
    pts: stat("points"),
    top: rank > 0 && rank <= 2,
  };
}

/**
 * Whether any World Cup match is in play right now. Hits the *exact same*
 * scoreboard URL (and revalidate) as `fetchScoreboard`, so Next's fetch cache
 * serves it from the entry that request already keeps warm — zero extra
 * upstream traffic. Used to tighten the standings poll while games run.
 */
export async function hasLiveMatches() {
  try {
    const now = Date.now();
    const res = await fetch(`${SCOREBOARD_URL}?dates=${dateParam(now - DAY_MS)}-${dateParam(now + 7 * DAY_MS)}&limit=100`, {
      next: { revalidate: 10 },
    });
    if (!res.ok) return false;
    const data = await res.json();
    return (data?.events || []).some((e) => e?.competitions?.[0]?.status?.type?.state === "in");
  } catch {
    return false;
  }
}

/** Fetches & transforms the World Cup group standings, keyed by group name. */
export async function fetchStandings() {
  // 30s: points/played/goal-difference move every time a match ends (and ESPN
  // refreshes some columns mid-match), so the table follows close behind.
  const res = await fetch(STANDINGS_URL, { next: { revalidate: 30 } });
  if (!res.ok) throw new Error(`ESPN standings ${res.status}`);
  const data = await res.json();
  const groups = {};
  for (const child of data?.children || []) {
    const entries = child?.standings?.entries || [];
    if (!entries.length) continue;
    const label = (child.name || "").toUpperCase().replace("GROUP", "GRUPO");
    groups[label] = entries.map(transformStandingsEntry);
  }
  return groups;
}
