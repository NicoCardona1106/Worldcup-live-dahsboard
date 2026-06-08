// Thin client + transformers for ESPN's public (unauthenticated) soccer API,
// scoped to the FIFA World Cup ("fifa.world"). These endpoints are not an
// official/documented product — they can change shape without notice, so every
// transformer defends against missing fields and the API routes that call these
// always fall back to the placeholder data in `lib/data.js` on any failure.

const SCOREBOARD_URL = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";
const STANDINGS_URL = "https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings";

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
      return { status: "LIVE", minute: (displayClock || "").replace("'", "").trim() || null };
    case "post":
      return { status: "FINAL", minute: null };
    default:
      return { status: "SCHEDULED", minute: null };
  }
}

function kickoffTime(dateIso) {
  try {
    return new Date(dateIso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function kickoffDate(dateIso) {
  try {
    return new Date(dateIso).toLocaleDateString("es-AR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return "";
  }
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
    kickoffISO: event.date || null,
    group: stageLabel(event?.season?.slug),
    venue: competition?.venue?.fullName || null,
    statusDetail: statusType?.shortDetail || statusType?.detail || null,
    // ESPN's site/v2 scoreboard doesn't expose live possession/shots/corners —
    // that lives behind the `situation` endpoint per-match (see README for how
    // to extend this). We return nulls so the UI can hide those rows gracefully.
    stats: null,
  };
}

/** Fetches & transforms today's (or the nearest matchday's) World Cup fixtures. */
export async function fetchScoreboard() {
  const res = await fetch(SCOREBOARD_URL, { next: { revalidate: 30 } });
  if (!res.ok) throw new Error(`ESPN scoreboard ${res.status}`);
  const data = await res.json();
  const matches = (data?.events || []).map(transformMatch).filter(Boolean);
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
    pts: stat("points"),
    top: rank > 0 && rank <= 2,
  };
}

/** Fetches & transforms the World Cup group standings, keyed by group name. */
export async function fetchStandings() {
  const res = await fetch(STANDINGS_URL, { next: { revalidate: 300 } });
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
