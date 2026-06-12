// Builds "add to calendar" links and share text straight from a match's
// kickoff time — no external service involved. Times are absolute (UTC), so the
// calendar app shows them in the user's own timezone correctly.

const MATCH_MINUTES = 120;

function pad(n) {
  return String(n).padStart(2, "0");
}

// Calendar formats want UTC stamps as YYYYMMDDTHHMMSSZ.
function toICSDate(d) {
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

// Escape the characters iCalendar treats as special.
function escapeICS(s) {
  return String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function matchTitle(match) {
  return `${match.homeTeam} vs ${match.awayTeam} · Mundial 2026`;
}

function matchDetails(match) {
  return [match.group, match.venue].filter(Boolean).join(" · ") + " — WORLD CUP LIVE";
}

export function getMatchTimes(match) {
  if (!match?.kickoffISO) return null;
  const start = new Date(match.kickoffISO);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start.getTime() + MATCH_MINUTES * 60000);
  return { start, end };
}

export function googleCalendarUrl(match) {
  const t = getMatchTimes(match);
  if (!t) return null;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: matchTitle(match),
    dates: `${toICSDate(t.start)}/${toICSDate(t.end)}`,
    details: matchDetails(match),
    location: match.venue || "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function icsDataUri(match) {
  const t = getMatchTimes(match);
  if (!t) return null;
  const uid = `wcl-${match.id ?? Math.random().toString(36).slice(2)}@worldcuplive`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//WORLD CUP LIVE//Mundial 2026//ES",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    // Deterministic stamp (kickoff, not "now"): this URI is computed during
    // render, and a wall-clock DTSTAMP made the server and client HTML differ
    // → React hydration mismatch on every match card.
    `DTSTAMP:${toICSDate(t.start)}`,
    `DTSTART:${toICSDate(t.start)}`,
    `DTEND:${toICSDate(t.end)}`,
    `SUMMARY:${escapeICS(matchTitle(match))}`,
    `DESCRIPTION:${escapeICS(matchDetails(match))}`,
    match.venue ? `LOCATION:${escapeICS(match.venue)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines.join("\r\n"))}`;
}

export function buildShareText(match) {
  const when = [match.dateShort, match.time].filter(Boolean).join(" ");
  return `${match.homeTeam} vs ${match.awayTeam}${when ? ` — ${when} (hora Colombia)` : ""} · Mundial 2026`;
}
